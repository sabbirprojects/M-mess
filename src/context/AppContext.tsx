import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testConnection } from '../firebase';
import {
  AppStateData,
  AuditLog,
  BazaarExpense,
  Deposit,
  MealAuditRecord,
  MealEntry,
  MealRateMode,
  Member,
  MonthRecord,
  MonthStatus,
  MonthSummary,
  UniversalExpense,
  User,
} from '../types';
import { calculateMonthSummary } from '../utils/calculations';
import { hashPassword, sha256Sync } from '../utils/crypto';
import { getInitialSeedData, INITIAL_STORAGE_KEY } from '../utils/initialData';

// Helper to recursively strip any undefined values so Firestore never rejects payloads with invalid-argument
export function cleanForFirestore<T>(val: T): T {
  if (val === undefined) {
    return null as any;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(cleanForFirestore) as any;
  }
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(val as Record<string, any>)) {
    if (v !== undefined) {
      result[k] = cleanForFirestore(v);
    }
  }
  return result as T;
}

interface AppContextType {
  state: AppStateData;
  currentUser: User | null;
  currentUserMember: Member | null;
  activeMonth: MonthRecord | null;
  monthSummary: MonthSummary;
  allMonths: MonthRecord[];
  isLockedOrArchived: boolean;
  
  // Real-Time Cloud Sync
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt: string | null;
  forceSyncCloud: () => Promise<void>;

  // Auth & User Management
  isMasterKey: boolean;
  isManager: boolean;
  isMemberOnly: boolean;
  verifyMasterKey: (key: string) => boolean;
  unlockMasterAccess: (key: string) => boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  createUser: (
    username: string,
    password: string,
    fullName?: string,
    role?: 'manager' | 'member',
    memberId?: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateManagerPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateManagerProfile: (newUsername: string, newPassword?: string, newFullName?: string) => Promise<{ success: boolean; error?: string }>;
  updateMyProfile: (data: {
    fullName: string;
    phone?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  // Month actions
  setActiveMonthId: (id: string) => void;
  createMonth: (name: string, year: number, daysInMonth?: number) => void;
  lockMonth: (monthId: string) => void;
  archiveMonth: (monthId: string) => void;
  updateMealRateSettings: (monthId: string, mode: MealRateMode, fixedRate: number) => void;

  // Member actions
  addMember: (name: string, initialDeposit: number, previousBalance: number, email?: string, phone?: string) => void;
  editMember: (id: string, name: string, initialDeposit: number, previousBalance: number, email?: string, phone?: string) => void;
  deleteMember: (id: string) => void;

  // Deposits
  addDeposit: (memberId: string, amount: number, date: string, note?: string) => void;
  deleteDeposit: (id: string) => void;

  // Meals
  updateMeal: (memberId: string, day: number, quantity: number) => void;

  // Bazaar
  addBazaarExpense: (date: string, description: string, amount: number, paidById: string) => void;
  editBazaarExpense: (id: string, date: string, description: string, amount: number, paidById: string) => void;
  deleteBazaarExpense: (id: string) => void;

  // Universal
  addUniversalExpense: (date: string, description: string, amount: number, paidById: string, applicableMemberIds: string[]) => void;
  editUniversalExpense: (id: string, date: string, description: string, amount: number, paidById: string, applicableMemberIds: string[]) => void;
  deleteUniversalExpense: (id: string) => void;

  // Backup & Reset
  exportBackupJSON: () => string;
  importBackupJSON: (jsonString: string) => { success: boolean; error?: string; message?: string };
  resetDemoData: () => void;

  // Global Calculator
  isCalculatorOpen: boolean;
  setIsCalculatorOpen: (open: boolean) => void;
  calculatorMemory: string;
  setCalculatorMemory: (val: string) => void;
}

export function sanitizeUsers(rawUsers: any[]): User[] {
  const seed = getInitialSeedData();
  const sabbirSeed = seed.users.find(u => u.username.toLowerCase() === 'sabbirprogrammer')!;
  const managerSeed = seed.users.find(u => u.username.toLowerCase() === 'manager')!;

  const userList = Array.isArray(rawUsers) ? rawUsers : [];
  const existingSabbir = userList.find((u: any) => u && (u.username?.toLowerCase() === 'sabbirprogrammer' || u.id === 'usr-sabbirprogrammer'));

  // Permanent Master Key Account: Sabbir Programmer
  const sabbirUser: User = {
    id: 'usr-sabbirprogrammer',
    username: 'sabbirprogrammer',
    fullName: existingSabbir?.fullName && existingSabbir.fullName !== 'sabbirprogrammer' ? existingSabbir.fullName : 'Sabbir Programmer',
    role: 'manager',
    isMaster: true,
    memberId: existingSabbir?.memberId,
    phone: existingSabbir?.phone,
    email: existingSabbir?.email,
    passwordHash: existingSabbir?.passwordHash || sabbirSeed.passwordHash,
    createdAt: existingSabbir?.createdAt || '2026-09-01T08:00:00.000Z',
  };

  // Normal Users: Preserve all valid normal user accounts created in the workspace
  const seenUsernames = new Set<string>(['sabbirprogrammer']);
  const normalUsers: User[] = [];

  for (const u of userList) {
    if (!u || typeof u.username !== 'string') continue;
    const cleanUName = u.username.trim().toLowerCase();
    if (seenUsernames.has(cleanUName)) continue;
    seenUsernames.add(cleanUName);

    normalUsers.push({
      id: u.id || `usr-${cleanUName}`,
      username: cleanUName,
      fullName: typeof u.fullName === 'string' && u.fullName.trim() ? u.fullName.trim() : cleanUName,
      role: u.role === 'manager' ? 'manager' : 'member',
      isMaster: false,
      memberId: u.memberId ? String(u.memberId) : undefined,
      phone: u.phone ? String(u.phone) : undefined,
      email: u.email ? String(u.email) : undefined,
      passwordHash: u.passwordHash || managerSeed.passwordHash,
      createdAt: u.createdAt || new Date().toISOString(),
    });
  }

  // Ensure default Manager exists if no other normal users are present
  if (normalUsers.length === 0) {
    normalUsers.push({
      id: 'usr-manager',
      username: 'manager',
      fullName: 'Manager',
      role: 'manager',
      isMaster: false,
      passwordHash: managerSeed.passwordHash,
      createdAt: '2026-09-01T08:00:00.000Z',
    });
  }

  return [sabbirUser, ...normalUsers];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppStateData>(() => {
    const seed = getInitialSeedData();
    try {
      const cached = localStorage.getItem(INITIAL_STORAGE_KEY) || sessionStorage.getItem(INITIAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          // Normalize and strictly enforce: Master Key = Sabbir Programmer, Normal User = Manager, all others deleted
          const loadedUsers: User[] = sanitizeUsers(parsed.users);

          const explicitlyLoggedOut = localStorage.getItem('smart_meal_explicitly_logged_out') === 'true';
          const savedSessionUserId = localStorage.getItem('smart_meal_logged_in_user_id');
          let currentUserId: string | null = null;

          // Strictly require valid active session in storage - never auto-login visitors or fall back to defaults
          if (!explicitlyLoggedOut && savedSessionUserId && loadedUsers.some(u => u.id === savedSessionUserId)) {
            currentUserId = savedSessionUserId;
          } else {
            currentUserId = null;
          }

          // Check if parsed data contains legacy demo records (e.g. mem-1 with sarwar@mess.com, mem-spec, or mock month-aug-2026)
          const hasOldDemoData =
            Array.isArray(parsed.members) &&
            parsed.members.some(
              (m: any) =>
                m.id === 'mem-1' ||
                m.id === 'mem-spec' ||
                m.email === 'sarwar@mess.com' ||
                m.email === 'tanvir@mess.com' ||
                m.email === 'spec@mess.com'
            );

          if (hasOldDemoData) {
            // Immediate purge of all legacy demo seed data
            const cleanSeed = {
              ...seed,
              users: loadedUsers,
              currentUserId,
              members: [],
              deposits: [],
              meals: [],
              mealAudits: [],
              bazaarExpenses: [],
              universalExpenses: [],
              auditLogs: [],
            };
            try {
              localStorage.setItem(INITIAL_STORAGE_KEY, JSON.stringify({ ...cleanSeed, currentUserId: null }));
              sessionStorage.setItem(INITIAL_STORAGE_KEY, JSON.stringify({ ...cleanSeed, currentUserId: null }));
            } catch (err) {
              console.warn('Could not sync purged demo state:', err);
            }
            return cleanSeed;
          }

          // Ensure months exist
          const months = Array.isArray(parsed.months) && parsed.months.length > 0 ? parsed.months : seed.months;
          let savedMonthPref: string | null = null;
          try {
            savedMonthPref = localStorage.getItem('smart_meal_active_month_id') || sessionStorage.getItem('smart_meal_active_month_id');
          } catch {}
          const activeMonthId = (savedMonthPref && months.some((m: any) => m.id === savedMonthPref))
            ? savedMonthPref
            : (parsed.activeMonthId && months.some((m: any) => m.id === parsed.activeMonthId))
              ? parsed.activeMonthId
              : months[0].id;

          const cleanAuditLogs = (Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [])
            .slice(0, 100)
            .map((l: any) => ({
              ...l,
              details: typeof l.details === 'string' ? l.details : '',
              monthId: typeof l.monthId === 'string' ? l.monthId : activeMonthId,
            }));

          return {
            users: loadedUsers,
            currentUserId,
            months,
            activeMonthId,
            members: Array.isArray(parsed.members) ? parsed.members : [],
            deposits: Array.isArray(parsed.deposits) ? parsed.deposits : [],
            meals: Array.isArray(parsed.meals) ? parsed.meals : [],
            mealAudits: Array.isArray(parsed.mealAudits) ? parsed.mealAudits.slice(0, 150) : [],
            bazaarExpenses: Array.isArray(parsed.bazaarExpenses) ? parsed.bazaarExpenses : [],
            universalExpenses: Array.isArray(parsed.universalExpenses) ? parsed.universalExpenses : [],
            auditLogs: cleanAuditLogs,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load cached state, falling back to seed data', e);
    }
    return { ...seed, currentUserId: null };
  });

  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [calculatorMemory, setCalculatorMemory] = useState<string>(() => {
    try {
      return localStorage.getItem('smart_meal_calc_memory_v1') || '0';
    } catch {
      return '0';
    }
  });

  // Real-Time Cloud Persistence State
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const isRemoteUpdateRef = useRef<boolean>(false);
  const isInitialCloudSyncDoneRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<any>(null);

  // Helper for immediate, guaranteed cloud persistence of critical transactions
  const persistToCloud = useCallback(async (targetState: AppStateData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Immediate local persistence
    try {
      const trimmedState: AppStateData = {
        ...targetState,
        currentUserId: null,
        auditLogs: (targetState.auditLogs || []).slice(0, 100),
        mealAudits: (targetState.mealAudits || []).slice(0, 150),
      };
      localStorage.setItem(INITIAL_STORAGE_KEY, JSON.stringify(trimmedState));
      sessionStorage.setItem(INITIAL_STORAGE_KEY, JSON.stringify(trimmedState));
    } catch (e) {
      console.warn('Local storage write warning in persistToCloud:', e);
    }

    setSyncStatus('syncing');
    try {
      const rawPayload = {
        months: targetState.months,
        activeMonthId: targetState.activeMonthId,
        members: targetState.members,
        deposits: targetState.deposits,
        meals: targetState.meals,
        mealAudits: (targetState.mealAudits || []).slice(0, 150),
        bazaarExpenses: targetState.bazaarExpenses,
        universalExpenses: targetState.universalExpenses,
        auditLogs: (targetState.auditLogs || []).slice(0, 100),
        users: targetState.users,
        updatedAt: new Date().toISOString(),
      };
      const cleanPayload = cleanForFirestore(rawPayload);
      await setDoc(doc(db, 'workspaces', 'default'), cleanPayload, { merge: true });
      isInitialCloudSyncDoneRef.current = true;
      setSyncStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      const errCode = err?.code;
      if (errCode === 'unavailable' || err?.message?.includes('offline')) {
        setSyncStatus('offline');
      } else {
        handleFirestoreError(err, OperationType.WRITE, 'workspaces/default');
        setSyncStatus('error');
      }
    }
  }, []);

  // 1. Real-Time Cloud Firestore Sync Listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initCloudSync = async () => {
      try {
        // Test connection in background without delaying real-time snapshot subscription
        testConnection().catch(() => {});
        const docRef = doc(db, 'workspaces', 'default');

        unsubscribe = onSnapshot(
          docRef,
          snapshot => {
            if (snapshot.exists()) {
              const cloudData = snapshot.data();

              // If snapshot originated from local pending write, mark syncing and let pending complete
              if (snapshot.metadata.hasPendingWrites) {
                setSyncStatus('syncing');
                return;
              }

              // Update received from another device/browser or cloud repository
              isRemoteUpdateRef.current = true;
              setState(prev => {
                const mergedUsers = sanitizeUsers(cloudData.users || prev.users);

                const mergedMonths =
                  Array.isArray(cloudData.months) && cloudData.months.length > 0
                    ? cloudData.months
                    : prev.months;

                // PRESERVE the active device's selected view month.
                // Switching views (e.g., Nov to Oct) on one user's screen must NEVER forcefully
                // redirect other active users away from the month they are viewing.
                let savedLocalMonth: string | null = null;
                try {
                  savedLocalMonth = localStorage.getItem('smart_meal_active_month_id') || sessionStorage.getItem('smart_meal_active_month_id');
                } catch {}

                const activeMonthId =
                  (prev.activeMonthId && mergedMonths.some((m: any) => m.id === prev.activeMonthId))
                    ? prev.activeMonthId
                    : (savedLocalMonth && mergedMonths.some((m: any) => m.id === savedLocalMonth))
                      ? savedLocalMonth
                      : (cloudData.activeMonthId && mergedMonths.some((m: any) => m.id === cloudData.activeMonthId))
                        ? cloudData.activeMonthId
                        : mergedMonths[0]?.id || '';

                const cleanAuditLogs = (Array.isArray(cloudData.auditLogs) ? cloudData.auditLogs : prev.auditLogs)
                  .slice(0, 100)
                  .map((l: any) => ({
                    ...l,
                    details: typeof l.details === 'string' ? l.details : '',
                    monthId: typeof l.monthId === 'string' ? l.monthId : activeMonthId,
                  }));

                const cleanBazaarExpenses = (Array.isArray(cloudData.bazaarExpenses)
                  ? cloudData.bazaarExpenses
                  : prev.bazaarExpenses
                ).map((b: any) => ({
                  ...b,
                  amount: Number(b.amount) || 0,
                  paidById: b.paidById || 'shared_fund',
                  paidByName: b.paidByName || 'Shared Fund',
                  description: b.description || 'Bazaar Expense',
                })).sort((a: any, b: any) => (a.date || '').localeCompare(b.date || '') || (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()));

                const cleanMembers = (Array.isArray(cloudData.members) ? cloudData.members : prev.members).map(
                  (m: any) => ({
                    ...m,
                    email: m.email || '',
                    phone: m.phone || '',
                  })
                );

                const rawUniversal = Array.isArray(cloudData.universalExpenses)
                  ? cloudData.universalExpenses
                  : prev.universalExpenses;
                const cleanUniversalExpenses = [...rawUniversal].sort((a: any, b: any) => (a.date || '').localeCompare(b.date || '') || (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()));

                return {
                  users: mergedUsers,
                  currentUserId: prev.currentUserId, // Preserve active device's session
                  months: mergedMonths,
                  activeMonthId,
                  members: cleanMembers,
                  deposits: Array.isArray(cloudData.deposits) ? cloudData.deposits : prev.deposits,
                  meals: Array.isArray(cloudData.meals) ? cloudData.meals : prev.meals,
                  mealAudits: Array.isArray(cloudData.mealAudits) ? cloudData.mealAudits : prev.mealAudits,
                  bazaarExpenses: cleanBazaarExpenses,
                  universalExpenses: cleanUniversalExpenses,
                  auditLogs: cleanAuditLogs,
                };
              });

              isInitialCloudSyncDoneRef.current = true;
              setSyncStatus('synced');
              setLastSyncedAt(new Date().toLocaleTimeString());
            } else {
              // Initial cloud setup: upload clean current state to cloud workspace
              const initialPayload = cleanForFirestore({
                months: state.months,
                activeMonthId: state.activeMonthId,
                members: state.members,
                deposits: state.deposits,
                meals: state.meals,
                mealAudits: (state.mealAudits || []).slice(0, 150),
                bazaarExpenses: state.bazaarExpenses,
                universalExpenses: state.universalExpenses,
                auditLogs: (state.auditLogs || []).slice(0, 100),
                users: state.users,
                updatedAt: new Date().toISOString(),
              });

              setDoc(docRef, initialPayload, { merge: true })
                .then(() => {
                  isInitialCloudSyncDoneRef.current = true;
                  setSyncStatus('synced');
                  setLastSyncedAt(new Date().toLocaleTimeString());
                })
                .catch(err => {
                  const errCode = (err as any)?.code;
                  if (errCode === 'unavailable' || err?.message?.includes('offline')) {
                    setSyncStatus('offline');
                  } else {
                    handleFirestoreError(err, OperationType.WRITE, 'workspaces/default');
                    setSyncStatus('error');
                  }
                });
            }
          },
          error => {
            const errCode = (error as any)?.code;
            if (errCode === 'unavailable' || error.message?.includes('offline')) {
              console.warn('Firestore temporarily offline; continuing with local cache.');
              setSyncStatus('offline');
            } else {
              handleFirestoreError(error, OperationType.GET, 'workspaces/default');
              setSyncStatus('error');
            }
          }
        );
      } catch (err: any) {
        if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
          setSyncStatus('offline');
        } else {
          handleFirestoreError(err, OperationType.GET, 'workspaces/default');
          setSyncStatus('offline');
        }
      }
    };

    initCloudSync();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Flush any pending write if the user reloads or navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        try {
          const payload = cleanForFirestore({
            months: state.months,
            activeMonthId: state.activeMonthId,
            members: state.members,
            deposits: state.deposits,
            meals: state.meals,
            mealAudits: (state.mealAudits || []).slice(0, 150),
            bazaarExpenses: state.bazaarExpenses,
            universalExpenses: state.universalExpenses,
            auditLogs: (state.auditLogs || []).slice(0, 100),
            users: state.users,
            updatedAt: new Date().toISOString(),
          });
          setDoc(doc(db, 'workspaces', 'default'), payload, { merge: true });
        } catch {
          // ignore synchronous unload errors
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state]);

  // 2. Save to localStorage and Push Local Mutations to Cloud Firestore
  useEffect(() => {
    // Immediate local persistence
    try {
      const trimmedState: AppStateData = {
        ...state,
        currentUserId: null, // Keep authentication session state separate from public data cache
        auditLogs: (state.auditLogs || []).slice(0, 100),
        mealAudits: (state.mealAudits || []).slice(0, 150),
      };
      localStorage.setItem(INITIAL_STORAGE_KEY, JSON.stringify(trimmedState));
    } catch (e) {
      console.warn('Failed to persist to localStorage, falling back to sessionStorage', e);
      try {
        const trimmedState: AppStateData = {
          ...state,
          currentUserId: null,
          auditLogs: (state.auditLogs || []).slice(0, 100),
          mealAudits: (state.mealAudits || []).slice(0, 150),
        };
        sessionStorage.setItem(INITIAL_STORAGE_KEY, JSON.stringify(trimmedState));
      } catch (err) {
        console.error('Failed to persist to sessionStorage as well', err);
      }
    }

    // Prevent echoing remote updates back to Firestore
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    // Wait until initial snapshot was processed before sending background writes
    if (!isInitialCloudSyncDoneRef.current) {
      return;
    }

    // Debounce cloud write to aggregate rapid inputs
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSyncStatus('syncing');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const rawPayload = {
          months: state.months,
          activeMonthId: state.activeMonthId,
          members: state.members,
          deposits: state.deposits,
          meals: state.meals,
          mealAudits: (state.mealAudits || []).slice(0, 150),
          bazaarExpenses: state.bazaarExpenses,
          universalExpenses: state.universalExpenses,
          auditLogs: (state.auditLogs || []).slice(0, 100),
          users: state.users,
          updatedAt: new Date().toISOString(),
        };
        const payload = cleanForFirestore(rawPayload);
        await setDoc(doc(db, 'workspaces', 'default'), payload, { merge: true });
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString());
      } catch (err: any) {
        const errCode = err?.code;
        if (errCode === 'unavailable' || err?.message?.includes('offline')) {
          setSyncStatus('offline');
        } else {
          handleFirestoreError(err, OperationType.WRITE, 'workspaces/default');
          setSyncStatus('error');
        }
      }
    }, 400);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state]);

  // Manual Force Sync with Cloud
  const forceSyncCloud = async () => {
    setSyncStatus('syncing');
    try {
      const docRef = doc(db, 'workspaces', 'default');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        isRemoteUpdateRef.current = true;
        setState(prev => {
          const mergedMonths = Array.isArray(cloudData.months) && cloudData.months.length > 0 ? cloudData.months : prev.months;
          let savedLocalMonth: string | null = null;
          try {
            savedLocalMonth = localStorage.getItem('smart_meal_active_month_id') || sessionStorage.getItem('smart_meal_active_month_id');
          } catch {}

          const activeMonthId =
            (prev.activeMonthId && mergedMonths.some((m: any) => m.id === prev.activeMonthId))
              ? prev.activeMonthId
              : (savedLocalMonth && mergedMonths.some((m: any) => m.id === savedLocalMonth))
                ? savedLocalMonth
                : (cloudData.activeMonthId && mergedMonths.some((m: any) => m.id === cloudData.activeMonthId))
                  ? cloudData.activeMonthId
                  : mergedMonths[0]?.id || '';

          return {
            ...prev,
            months: mergedMonths,
            activeMonthId,
            members: Array.isArray(cloudData.members) ? cloudData.members : prev.members,
            deposits: Array.isArray(cloudData.deposits) ? cloudData.deposits : prev.deposits,
            meals: Array.isArray(cloudData.meals) ? cloudData.meals : prev.meals,
            mealAudits: Array.isArray(cloudData.mealAudits) ? cloudData.mealAudits : prev.mealAudits,
            bazaarExpenses: Array.isArray(cloudData.bazaarExpenses) ? cloudData.bazaarExpenses : prev.bazaarExpenses,
            universalExpenses: Array.isArray(cloudData.universalExpenses) ? cloudData.universalExpenses : prev.universalExpenses,
            auditLogs: Array.isArray(cloudData.auditLogs) ? cloudData.auditLogs : prev.auditLogs,
            users: sanitizeUsers(cloudData.users || prev.users),
          };
        });
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString());
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'workspaces/default');
      setSyncStatus('error');
    }
  };

  const currentUser = useMemo(() => {
    if (!state.currentUserId) return null;
    return state.users.find(u => u.id === state.currentUserId) || null;
  }, [state.currentUserId, state.users]);

  const [masterUnlockedSession, setMasterUnlockedSession] = useState<boolean>(false);

  const verifyMasterKey = (key: string): boolean => {
    const clean = key.trim();
    if (!clean) return false;
    // Master Key role is held by Sabbir Programmer
    if (clean === 'ASmin1234') {
      return true;
    }
    const hash = sha256Sync(clean);
    const sabbir = (state.users || []).find(
      u => u.username.toLowerCase() === 'sabbirprogrammer' || (u.isMaster && u.role === 'manager')
    );
    if (sabbir && sabbir.passwordHash === hash) {
      return true;
    }
    return false;
  };

  const unlockMasterAccess = (key: string): boolean => {
    if (verifyMasterKey(key)) {
      setMasterUnlockedSession(true);
      return true;
    }
    return false;
  };

  const isMasterKey = useMemo(() => {
    if (masterUnlockedSession) return true;
    if (!currentUser) return false;
    // Master Key role is strictly Sabbir Programmer
    if (currentUser.isMaster === true && currentUser.username.toLowerCase() === 'sabbirprogrammer') return true;
    const clean = currentUser.username.trim().toLowerCase();
    if (clean === 'sabbirprogrammer') {
      return true;
    }
    return false;
  }, [currentUser, masterUnlockedSession]);

  const isManager = useMemo(() => {
    if (!currentUser) return false;
    if (isMasterKey) return true;
    return currentUser.role === 'manager';
  }, [currentUser, isMasterKey]);

  const isMemberOnly = useMemo(() => {
    if (!currentUser) return false;
    if (isMasterKey) return false;
    return currentUser.role === 'member';
  }, [currentUser, isMasterKey]);

  const currentUserMember = useMemo(() => {
    if (!currentUser) return null;
    const currentMonthMembers = state.members.filter(m => m.monthId === state.activeMonthId);
    if (currentUser.memberId) {
      const byId = currentMonthMembers.find(m => m.id === currentUser.memberId || m.userId === currentUser.id);
      if (byId) return byId;
      const byAnyMonth = state.members.find(m => m.id === currentUser.memberId);
      if (byAnyMonth) {
        const matchByName = currentMonthMembers.find(
          m => m.name.toLowerCase() === byAnyMonth.name.toLowerCase()
        );
        if (matchByName) return matchByName;
        return byAnyMonth;
      }
    }
    const byUserId = currentMonthMembers.find(m => m.userId === currentUser.id);
    if (byUserId) return byUserId;

    if (currentUser.fullName) {
      const byName = currentMonthMembers.find(
        m => m.name.toLowerCase() === currentUser.fullName.toLowerCase()
      );
      if (byName) return byName;
    }
    return null;
  }, [currentUser, state.members, state.activeMonthId]);

  const activeMonth = useMemo(() => {
    return (
      state.months.find(m => m.id === state.activeMonthId) ||
      state.months[0] ||
      null
    );
  }, [state.activeMonthId, state.months]);

  const isLockedOrArchived = useMemo(() => {
    if (!activeMonth) return false;
    return activeMonth.status === 'locked' || activeMonth.status === 'archived';
  }, [activeMonth]);

  const monthSummary = useMemo(() => {
    if (!activeMonth) {
      return {
        totalMembers: 0,
        totalMeals: 0,
        totalBazaarCost: 0,
        totalUniversalExpenses: 0,
        totalDeposits: 0,
        mealRate: 0,
        isFixedRate: false,
        memberCalculations: [],
      };
    }
    return calculateMonthSummary(
      activeMonth,
      state.members,
      state.deposits,
      state.meals,
      state.bazaarExpenses,
      state.universalExpenses
    );
  }, [
    activeMonth,
    state.members,
    state.deposits,
    state.meals,
    state.bazaarExpenses,
    state.universalExpenses,
  ]);

  const currentUserName = currentUser ? currentUser.fullName || currentUser.username : 'System';

  const addAuditLog = (action: string, target: string, details?: string, targetMonthId?: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      monthId: targetMonthId || activeMonth?.id || '',
      user: currentUserName || 'System',
      action,
      target,
      date: dateStr,
      time: timeStr,
      details: details || '',
    };
    return log;
  };

  // Auth actions - Master Key (Sabbir Programmer) & Normal User (Manager)
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      return {
        success: false,
        error: 'Please enter both username and password.',
      };
    }

    const sabbirAccount = (state.users || []).find(u => u.username.toLowerCase() === 'sabbirprogrammer');
    const managerAccount = (state.users || []).find(u => u.username.toLowerCase() === 'manager');
    const hash = await hashPassword(cleanPass);

    // 1. Master Key Role: 'Sabbir Programmer'
    if (cleanUser === 'sabbirprogrammer') {
      const isSabbirValid =
        cleanPass === 'ASmin1234' || (sabbirAccount && sabbirAccount.passwordHash === hash);

      if (isSabbirValid) {
        const sabbirUser: User = sabbirAccount || {
          id: 'usr-sabbirprogrammer',
          username: 'sabbirprogrammer',
          fullName: 'Sabbir Programmer',
          role: 'manager',
          isMaster: true,
          passwordHash: await hashPassword('ASmin1234'),
          createdAt: '2026-09-01T08:00:00.000Z',
        };
        setState(prev => ({
          ...prev,
          currentUserId: sabbirUser.id,
        }));
        try {
          localStorage.setItem('smart_meal_logged_in_user_id', sabbirUser.id);
          localStorage.removeItem('smart_meal_explicitly_logged_out');
          localStorage.setItem('smart_meal_remembered_username', 'sabbirprogrammer');
        } catch {}
        return { success: true };
      }
      return { success: false, error: 'Invalid password for Master Key account.' };
    }

    // 2. Normal Users: Default Manager or any Master-Key created Normal User
    const matchingNormalUser = (state.users || []).find(
      u => u.username.toLowerCase() === cleanUser && !u.isMaster
    );

    if (matchingNormalUser) {
      const isPasswordValid =
        (cleanUser === 'manager' && cleanPass === 'manager123') ||
        matchingNormalUser.passwordHash === hash;

      if (isPasswordValid) {
        setMasterUnlockedSession(false);
        setState(prev => ({
          ...prev,
          currentUserId: matchingNormalUser.id,
        }));
        try {
          localStorage.setItem('smart_meal_logged_in_user_id', matchingNormalUser.id);
          localStorage.removeItem('smart_meal_explicitly_logged_out');
          localStorage.setItem('smart_meal_remembered_username', matchingNormalUser.username);
        } catch {}
        return { success: true };
      }
      return { success: false, error: 'Invalid password.' };
    }

    return {
      success: false,
      error: 'Invalid username or password. Access is restricted to registered system accounts.',
    };
  };

  const updateManagerProfile = async (
    newUsername: string,
    newPassword?: string,
    newFullName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanUser = newUsername.trim();
    if (!cleanUser) {
      return { success: false, error: 'Username cannot be empty.' };
    }

    if (newPassword && newPassword.trim().length > 0 && newPassword.trim().length < 4) {
      return { success: false, error: 'New password must be at least 4 characters.' };
    }

    let newHash: string | undefined;
    if (newPassword && newPassword.trim().length >= 4) {
      newHash = await hashPassword(newPassword.trim());
    }

    setState(prev => {
      const activeId = prev.currentUserId || (prev.users[0]?.id) || 'usr-manager';
      let found = false;
      const updatedUsers = (prev.users || []).map(u => {
        if (u.id === activeId || (!found && u.role === 'manager')) {
          found = true;
          return {
            ...u,
            username: cleanUser,
            fullName: newFullName !== undefined && newFullName.trim() ? newFullName.trim() : u.fullName,
            passwordHash: newHash || u.passwordHash,
          };
        }
        return u;
      });

      const audit = addAuditLog(
        'Updated Credentials',
        cleanUser,
        `Account updated to username "${cleanUser}"${newHash ? ' with new password' : ''}`
      );

      return {
        ...prev,
        users: updatedUsers,
        auditLogs: [audit, ...(prev.auditLogs || [])].slice(0, 100),
      };
    });

    return { success: true };
  };

  const updateManagerPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const activeUsername = currentUser?.username || 'manager';
    return updateManagerProfile(activeUsername, newPassword);
  };

  const signup = async (username: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    return login(username || 'manager', password || 'manager123');
  };

  const createUser = async (
    newUsername: string,
    newPassword: string,
    fullName?: string,
    role: 'manager' | 'member' = 'member',
    memberId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isMasterKey) {
      return { success: false, error: 'Only the Master Key holder has authority to create users.' };
    }

    const cleanUser = newUsername.trim().toLowerCase();
    const cleanPass = newPassword.trim();
    let cleanName = (fullName || newUsername).trim();

    if (cleanUser.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
      return { success: false, error: 'Username can only contain letters, numbers, hyphens, and underscores.' };
    }

    if (cleanPass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    const existingUser = (state.users || []).find(u => u.username.toLowerCase() === cleanUser);
    if (existingUser) {
      return { success: false, error: `Username "${cleanUser}" is already taken.` };
    }

    // If memberId is linked, find member details to inherit
    const linkedMember = memberId ? state.members.find(m => m.id === memberId) : null;
    if (linkedMember && (!fullName || !fullName.trim())) {
      cleanName = linkedMember.name;
    }

    const passHash = await hashPassword(cleanPass);
    const newUserId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newUser: User = {
      id: newUserId,
      username: cleanUser,
      fullName: cleanName,
      role: role === 'manager' ? 'manager' : 'member',
      isMaster: false,
      memberId: memberId || undefined,
      phone: linkedMember?.phone || undefined,
      email: linkedMember?.email || undefined,
      passwordHash: passHash,
      createdAt: new Date().toISOString(),
    };

    // If linked to a member, update that member's userId as well
    const updatedMembers = memberId
      ? state.members.map(m => (m.id === memberId ? { ...m, userId: newUserId } : m))
      : state.members;

    const log = addAuditLog(
      'User Created',
      `${newUser.fullName} (@${newUser.username}) [${role.toUpperCase()}]`,
      memberId ? `Linked to mess member "${linkedMember?.name || memberId}"` : 'Created by Master Key holder'
    );

    const nextState: AppStateData = {
      ...state,
      users: [...(state.users || []), newUser],
      members: updatedMembers,
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };

    setState(nextState);
    persistToCloud(nextState);

    return { success: true };
  };

  const updateMyProfile = async (data: {
    fullName: string;
    phone?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'You must be logged in to update your profile.' };
    }

    const cleanName = data.fullName.trim();
    if (!cleanName) {
      return { success: false, error: 'Display name cannot be empty.' };
    }

    let newHash: string | undefined;
    if (data.newPassword && data.newPassword.trim().length > 0) {
      if (!data.currentPassword) {
        return { success: false, error: 'Please enter your current password to set a new password.' };
      }
      const currentHash = await hashPassword(data.currentPassword.trim());
      const isCurrentValid =
        currentUser.passwordHash === currentHash ||
        (currentUser.username === 'sabbirprogrammer' && data.currentPassword.trim() === 'ASmin1234') ||
        (currentUser.username === 'manager' && data.currentPassword.trim() === 'manager123');

      if (!isCurrentValid) {
        return { success: false, error: 'Current password is incorrect.' };
      }

      if (data.newPassword.trim().length < 4) {
        return { success: false, error: 'New password must be at least 4 characters long.' };
      }
      newHash = await hashPassword(data.newPassword.trim());
    }

    const cleanPhone = data.phone ? data.phone.trim() : '';
    const cleanEmail = data.email ? data.email.trim() : '';

    // Update currentUser in state.users
    const updatedUsers = (state.users || []).map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          fullName: cleanName,
          phone: cleanPhone || undefined,
          email: cleanEmail || undefined,
          passwordHash: newHash || u.passwordHash,
        };
      }
      return u;
    });

    // Update linked member records in state.members
    const targetMemberId = currentUser.memberId || currentUserMember?.id;
    const targetMemberName = currentUserMember?.name || currentUser.fullName;
    const updatedMembers = state.members.map(m => {
      const isTarget =
        (targetMemberId && m.id === targetMemberId) ||
        m.userId === currentUser.id ||
        (targetMemberName && m.name.toLowerCase() === targetMemberName.toLowerCase());

      if (isTarget) {
        return {
          ...m,
          name: cleanName,
          phone: cleanPhone || undefined,
          email: cleanEmail || undefined,
          userId: currentUser.id,
          updatedAt: new Date().toISOString(),
          updatedBy: cleanName,
        };
      }
      return m;
    });

    const audit = addAuditLog(
      'Profile Updated',
      `${cleanName} (@${currentUser.username})`,
      `Updated personal information${newHash ? ' and password' : ''}`
    );

    const nextState: AppStateData = {
      ...state,
      users: updatedUsers,
      members: updatedMembers,
      auditLogs: [audit, ...(state.auditLogs || [])].slice(0, 100),
    };

    setState(nextState);
    persistToCloud(nextState);

    return { success: true };
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isMasterKey) {
      return { success: false, error: 'Only the Master Key holder has authority to delete users.' };
    }

    const targetUser = (state.users || []).find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'User not found in system.' };
    }

    if (targetUser.isMaster || targetUser.username.toLowerCase() === 'sabbirprogrammer') {
      return { success: false, error: 'The Master Key holder account cannot be deleted.' };
    }

    const log = addAuditLog(
      'User Deleted',
      `${targetUser.fullName} (@${targetUser.username})`,
      'Normal User account removed by Master Key holder'
    );

    const nextUsers = (state.users || []).filter(u => u.id !== userId);
    const nextState: AppStateData = {
      ...state,
      users: nextUsers,
      currentUserId: state.currentUserId === userId ? null : state.currentUserId,
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };

    setState(nextState);
    persistToCloud(nextState);

    return { success: true };
  };

  const logout = () => {
    try {
      localStorage.removeItem('smart_meal_logged_in_user_id');
      localStorage.setItem('smart_meal_explicitly_logged_out', 'true');
    } catch {}
    setMasterUnlockedSession(false);
    setState(prev => ({ ...prev, currentUserId: null }));
  };

  // Month actions (Device-local view preference)
  const setActiveMonthId = (id: string) => {
    try {
      localStorage.setItem('smart_meal_active_month_id', id);
      sessionStorage.setItem('smart_meal_active_month_id', id);
    } catch (e) {
      console.warn('Failed to save active month preference to local storage:', e);
    }
    // Mark as local view update so debounced auto-save does not broadcast view change to other users
    isRemoteUpdateRef.current = true;
    setState(prev => ({ ...prev, activeMonthId: id }));
  };

  const createMonth = (name: string, year: number, days?: number) => {
    const defaultDays = days || new Date(year, new Date(`${name} 1, ${year}`).getMonth() + 1, 0).getDate() || 30;
    const newMonthId = `month-${name.toLowerCase().replace(/\s+/g, '-')}-${year}-${Date.now().toString(36)}`;
    const newMonth: MonthRecord = {
      id: newMonthId,
      name,
      year,
      daysInMonth: defaultDays,
      status: 'active',
      mealRateMode: 'auto',
      fixedMealRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUserName,
      updatedBy: currentUserName,
    };

    // Auto-carry forward members if there was a previous active month
    let carriedMembers: Member[] = [];
    if (activeMonth) {
      const prevCalcs = monthSummary.memberCalculations;
      carriedMembers = state.members
        .filter(m => m.monthId === activeMonth.id)
        .map(m => {
          const calc = prevCalcs.find(c => c.memberId === m.id);
          // carry forward previous final balance as new previousBalance
          const carriedBalance = calc ? Math.round(calc.finalBalance * 100) / 100 : 0;
          return {
            id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            monthId: newMonthId,
            name: m.name,
            email: m.email || '',
            phone: m.phone || '',
            initialDeposit: 0,
            previousBalance: carriedBalance,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: currentUserName,
            updatedBy: currentUserName,
          };
        });
    }

    const log = addAuditLog('Month Created', `${name} ${year}`, `Created with ${carriedMembers.length} carried members`, newMonthId);
    const nextState: AppStateData = {
      ...state,
      months: [newMonth, ...state.months],
      activeMonthId: newMonthId,
      members: [...state.members, ...carriedMembers],
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    try {
      localStorage.setItem('smart_meal_active_month_id', newMonthId);
      sessionStorage.setItem('smart_meal_active_month_id', newMonthId);
    } catch {}
    setState(nextState);
    persistToCloud(nextState);
  };

  const lockMonth = (monthId: string) => {
    if (!isMasterKey) {
      console.warn('Only the Master Key holder has authority to lock or unlock months.');
      return;
    }
    const month = state.months.find(m => m.id === monthId);
    if (!month) return;
    const newStatus: MonthStatus = month.status === 'locked' ? 'active' : 'locked';
    const log = addAuditLog(
      newStatus === 'locked' ? 'Month Locked' : 'Month Unlocked',
      `${month.name} ${month.year}`,
      `Status changed to ${newStatus}. All records for this month are now ${newStatus === 'locked' ? 'read-only' : 'editable'}.`
    );
    const nextState: AppStateData = {
      ...state,
      months: state.months.map(m =>
        m.id === monthId
          ? { ...m, status: newStatus, updatedAt: new Date().toISOString(), updatedBy: currentUserName }
          : m
      ),
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  const archiveMonth = (monthId: string) => {
    if (!isMasterKey) {
      console.warn('Only the Master Key holder has authority to archive months.');
      return;
    }
    const month = state.months.find(m => m.id === monthId);
    const log = addAuditLog('Month Archived', `${month?.name} ${month?.year}`, 'Archived month record');
    const nextState: AppStateData = {
      ...state,
      months: state.months.map(m =>
        m.id === monthId
          ? { ...m, status: 'archived', updatedAt: new Date().toISOString(), updatedBy: currentUserName }
          : m
      ),
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  const updateMealRateSettings = (monthId: string, mode: MealRateMode, fixedRate: number) => {
    if (isLockedOrArchived) {
      console.warn('Cannot update meal rate settings: month is locked or archived.');
      return;
    }
    const log = addAuditLog('Meal Rate Settings Updated', `Mode: ${mode}${mode === 'fixed' ? ` Rate: ৳${fixedRate}` : ''}`, `Settings updated for month`);
    const nextState: AppStateData = {
      ...state,
      months: state.months.map(m =>
        m.id === monthId
          ? {
              ...m,
              mealRateMode: mode,
              fixedMealRate: fixedRate,
              updatedAt: new Date().toISOString(),
              updatedBy: currentUserName,
            }
          : m
      ),
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  // Member actions
  const addMember = (name: string, initialDeposit: number, previousBalance: number, email?: string, phone?: string) => {
    if (isMemberOnly) {
      console.warn('Unauthorized: Members cannot add other members.');
      return;
    }
    if (!activeMonth || isLockedOrArchived) {
      console.warn('Cannot add member: month is locked or unavailable.');
      return;
    }
    const newMember: Member = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      monthId: activeMonth.id,
      name: name.trim(),
      email: email?.trim() || '',
      phone: phone?.trim() || '',
      initialDeposit: Number(initialDeposit) || 0,
      previousBalance: Number(previousBalance) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUserName,
      updatedBy: currentUserName,
    };
    const log = addAuditLog('Member Added', newMember.name, `Initial Deposit: ৳${newMember.initialDeposit}`);
    const nextState: AppStateData = {
      ...state,
      members: [...state.members, newMember],
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  const editMember = (id: string, name: string, initialDeposit: number, previousBalance: number, email?: string, phone?: string) => {
    if (isLockedOrArchived) {
      console.warn('Cannot edit member: month is locked.');
      return;
    }
    // Member privacy guard: members can only update their own record and cannot alter initial deposits/balances
    let resolvedInitialDeposit = Number(initialDeposit) || 0;
    let resolvedPreviousBalance = Number(previousBalance) || 0;
    if (isMemberOnly) {
      const myMemberId = currentUser?.memberId || currentUserMember?.id;
      if (!myMemberId || myMemberId !== id) {
        console.warn('Unauthorized: Members can only edit their own info.');
        return;
      }
      const existing = state.members.find(m => m.id === id);
      resolvedInitialDeposit = existing ? existing.initialDeposit : 0;
      resolvedPreviousBalance = existing ? existing.previousBalance : 0;
    }

    const log = addAuditLog('Member Updated', name.trim(), 'Updated profile details');
    const nextState: AppStateData = {
      ...state,
      members: state.members.map(m =>
        m.id === id
          ? {
              ...m,
              name: name.trim(),
              initialDeposit: resolvedInitialDeposit,
              previousBalance: resolvedPreviousBalance,
              email: email?.trim() || '',
              phone: phone?.trim() || '',
              updatedAt: new Date().toISOString(),
              updatedBy: currentUserName,
            }
          : m
      ),
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  const deleteMember = (id: string) => {
    if (isMemberOnly) {
      console.warn('Unauthorized: Members cannot delete members.');
      return;
    }
    if (isLockedOrArchived) {
      console.warn('Cannot delete member: month is locked.');
      return;
    }
    const member = state.members.find(m => m.id === id);
    const log = addAuditLog('Member Deleted', member?.name || 'Unknown Member', 'Removed member from workspace');
    const nextState: AppStateData = {
      ...state,
      members: state.members.filter(m => m.id !== id),
      meals: state.meals.filter(m => m.memberId !== id),
      deposits: state.deposits.filter(d => d.memberId !== id),
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  // Deposits
  const addDeposit = (memberId: string, amount: number, date: string, note?: string) => {
    if (isMemberOnly) {
      console.warn('Unauthorized: Only Manager and Master Key can record deposits.');
      return;
    }
    if (!activeMonth || isLockedOrArchived) {
      if (isLockedOrArchived) console.warn('Cannot add deposit: month is locked.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    const member = state.members.find(m => m.id === memberId);
    const newDeposit: Deposit = {
      id: `dep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      monthId: activeMonth.id,
      memberId,
      amount: numAmount,
      date,
      note: note?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUserName,
      updatedBy: currentUserName,
    };
    const log = addAuditLog('Deposit Added', `${member?.name || 'Member'} (৳${numAmount})`, note?.trim() || 'Direct Deposit');
    const nextState: AppStateData = {
      ...state,
      deposits: [...state.deposits, newDeposit],
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  const deleteDeposit = (id: string) => {
    if (isMemberOnly) {
      console.warn('Unauthorized: Only Manager and Master Key can delete deposits.');
      return;
    }
    if (isLockedOrArchived) {
      console.warn('Cannot delete deposit: month is locked.');
      return;
    }
    const dep = state.deposits.find(d => d.id === id);
    const member = state.members.find(m => m.id === dep?.memberId);
    const log = addAuditLog('Deposit Deleted', `${member?.name || 'Member'} (৳${dep?.amount || 0})`, 'Removed deposit record');
    const nextState: AppStateData = {
      ...state,
      deposits: state.deposits.filter(d => d.id !== id),
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  // Meal Update
  const updateMeal = (memberId: string, day: number, quantity: number) => {
    if (!activeMonth || isLockedOrArchived) {
      if (isLockedOrArchived) console.warn('Cannot update meal: month is locked.');
      return;
    }

    // Member meal isolation guard: Members can log and edit ONLY their own daily meals!
    if (isMemberOnly) {
      const myMemberId = currentUser?.memberId || currentUserMember?.id;
      if (!myMemberId || myMemberId !== memberId) {
        console.warn('Unauthorized: Members can only log and edit their own meals.');
        return;
      }
    }

    const member = state.members.find(m => m.id === memberId);
    const existingMeal = state.meals.find(
      m => m.monthId === activeMonth.id && m.memberId === memberId && m.day === day
    );

    const prevValue = existingMeal ? existingMeal.quantity : 0;
    if (prevValue === quantity) return;

    const auditRecord: MealAuditRecord = {
      id: `ma-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      monthId: activeMonth.id,
      memberId,
      memberName: member?.name || 'Member',
      day,
      previousValue: prevValue,
      newValue: quantity,
      user: currentUserName,
      timestamp: new Date().toISOString(),
    };

    const auditLog = addAuditLog(
      'Meal Updated',
      `${member?.name} (Day ${day}: ${prevValue} → ${quantity})`,
      `Quantity set to ${quantity}`
    );

    let updatedMeals: MealEntry[];
    if (existingMeal) {
      updatedMeals = state.meals.map(m =>
        m.id === existingMeal.id
          ? { ...m, quantity, updatedAt: new Date().toISOString(), updatedBy: currentUserName }
          : m
      );
    } else {
      const newMeal: MealEntry = {
        id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        monthId: activeMonth.id,
        memberId,
        day,
        quantity,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUserName,
      };
      updatedMeals = [...state.meals, newMeal];
    }

    setState(prev => ({
      ...prev,
      meals: updatedMeals,
      mealAudits: [auditRecord, ...prev.mealAudits],
      auditLogs: [auditLog, ...prev.auditLogs],
    }));
  };

  // Helper to ensure expenses are sorted sequentially by date
  const sortExpensesByDate = <T extends { date: string; createdAt?: any }>(list: T[]): T[] => {
    return [...list].sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      const tA = new Date(a.createdAt || 0).getTime() || 0;
      const tB = new Date(b.createdAt || 0).getTime() || 0;
      return tA - tB;
    });
  };

  // Bazaar
  const addBazaarExpense = (date: string, description: string, amount: number, paidById: string) => {
    if (!activeMonth || isLockedOrArchived) {
      if (isLockedOrArchived) console.warn('Cannot add bazaar expense: month is locked.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    let targetPaidById = paidById;
    if (isMemberOnly) {
      const myMemberId = currentUserMember?.id || currentUser?.memberId;
      if (!myMemberId) {
        console.warn('Unauthorized: Member profile not linked.');
        return;
      }
      targetPaidById = myMemberId;
    }

    const member = state.members.find(m => m.id === targetPaidById);
    const paidByName = member?.name || (targetPaidById === 'shared_fund' ? 'Shared Fund' : (currentUser?.fullName || 'Mess Member'));
    const newExpense: BazaarExpense = {
      id: `baz-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      monthId: activeMonth.id,
      date,
      description: description.trim(),
      amount: numAmount,
      paidById: targetPaidById,
      paidByName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUserName,
      updatedBy: currentUserName,
    };
    const log = addAuditLog('Bazaar Expense Added', `${description} (৳${numAmount})`, `Paid By ${paidByName}`);
    const nextState: AppStateData = {
      ...state,
      bazaarExpenses: sortExpensesByDate([...state.bazaarExpenses, newExpense]),
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  const editBazaarExpense = (id: string, date: string, description: string, amount: number, paidById: string) => {
    if (isLockedOrArchived) {
      console.warn('Cannot edit bazaar expense: month is locked.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const existingExp = state.bazaarExpenses.find(b => b.id === id);
    if (!existingExp) return;

    let targetPaidById = paidById;
    if (isMemberOnly) {
      const myMemberId = currentUserMember?.id || currentUser?.memberId;
      if (existingExp.paidById !== myMemberId && existingExp.createdBy !== currentUserName) {
        console.warn('Unauthorized: Members can only edit their own expense entries.');
        return;
      }
      targetPaidById = myMemberId || existingExp.paidById;
    }

    const member = state.members.find(m => m.id === targetPaidById);
    const paidByName = member?.name || (targetPaidById === 'shared_fund' ? 'Shared Fund' : 'Mess Member');
    const log = addAuditLog('Bazaar Expense Updated', `${description} (৳${numAmount})`, `Paid By ${paidByName}`);
    const nextState: AppStateData = {
      ...state,
      bazaarExpenses: sortExpensesByDate(
        state.bazaarExpenses.map(b =>
          b.id === id
            ? {
                ...b,
                date,
                description: description.trim(),
                amount: numAmount,
                paidById: targetPaidById,
                paidByName,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUserName,
              }
            : b
        )
      ),
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  const deleteBazaarExpense = (id: string) => {
    if (isLockedOrArchived) {
      console.warn('Cannot delete bazaar expense: month is locked.');
      return;
    }
    const expense = state.bazaarExpenses.find(b => b.id === id);
    if (!expense) return;

    if (isMemberOnly) {
      const myMemberId = currentUserMember?.id || currentUser?.memberId;
      if (expense.paidById !== myMemberId && expense.createdBy !== currentUserName) {
        console.warn('Unauthorized: Members can only delete their own expense entries.');
        return;
      }
    }

    const log = addAuditLog(
      'Bazaar Expense Deleted',
      `${expense.description || 'Expense'} (৳${expense.amount || 0})`,
      `Payer: ${expense.paidByName || 'Unknown'}`
    );
    const nextState: AppStateData = {
      ...state,
      bazaarExpenses: state.bazaarExpenses.filter(b => b.id !== id),
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  // Universal
  const addUniversalExpense = (
    date: string,
    description: string,
    amount: number,
    paidById: string,
    applicableMemberIds: string[]
  ) => {
    if (!activeMonth || isLockedOrArchived) {
      if (isLockedOrArchived) console.warn('Cannot add universal expense: month is locked.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    let targetPaidById = paidById;
    if (isMemberOnly) {
      const myMemberId = currentUserMember?.id || currentUser?.memberId;
      if (!myMemberId) {
        console.warn('Unauthorized: Member profile not linked.');
        return;
      }
      targetPaidById = myMemberId;
    }

    const member = state.members.find(m => m.id === targetPaidById);
    const paidByName = member?.name || (targetPaidById === 'shared_fund' ? 'Shared Fund' : (currentUser?.fullName || 'Mess Member'));
    const monthMemberIds = state.members.filter(m => m.monthId === activeMonth.id).map(m => m.id);
    const resolvedApplicable = (applicableMemberIds && applicableMemberIds.length > 0) ? applicableMemberIds : monthMemberIds;

    const newExpense: UniversalExpense = {
      id: `uni-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      monthId: activeMonth.id,
      date,
      description: description.trim(),
      amount: numAmount,
      paidById: targetPaidById,
      paidByName,
      applicableMemberIds: resolvedApplicable,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUserName,
      updatedBy: currentUserName,
    };
    const log = addAuditLog(
      'Universal Expense Added',
      `${description} (৳${numAmount})`,
      `Paid by ${paidByName} (+৳${numAmount} credited). Deducted equally across ${resolvedApplicable.length} members.`
    );
    const nextState: AppStateData = {
      ...state,
      universalExpenses: sortExpensesByDate([...state.universalExpenses, newExpense]),
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  const editUniversalExpense = (
    id: string,
    date: string,
    description: string,
    amount: number,
    paidById: string,
    applicableMemberIds: string[]
  ) => {
    if (isLockedOrArchived) {
      console.warn('Cannot edit universal expense: month is locked.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const existingExp = state.universalExpenses.find(u => u.id === id);
    if (!existingExp) return;

    let targetPaidById = paidById;
    if (isMemberOnly) {
      const myMemberId = currentUserMember?.id || currentUser?.memberId;
      if (existingExp.paidById !== myMemberId && existingExp.createdBy !== currentUserName) {
        console.warn('Unauthorized: Members can only edit their own universal expenses.');
        return;
      }
      targetPaidById = myMemberId || existingExp.paidById;
    }

    const member = state.members.find(m => m.id === targetPaidById);
    const paidByName = member?.name || (targetPaidById === 'shared_fund' ? 'Shared Fund' : 'Mess Member');
    const monthMemberIds = activeMonth ? state.members.filter(m => m.monthId === activeMonth.id).map(m => m.id) : [];
    const resolvedApplicable = (applicableMemberIds && applicableMemberIds.length > 0) ? applicableMemberIds : monthMemberIds;

    const log = addAuditLog('Universal Expense Updated', `${description} (৳${numAmount})`, `Paid by ${paidByName}`);
    const nextState: AppStateData = {
      ...state,
      universalExpenses: sortExpensesByDate(
        state.universalExpenses.map(u =>
          u.id === id
            ? {
                ...u,
                date,
                description: description.trim(),
                amount: numAmount,
                paidById: targetPaidById,
                paidByName,
                applicableMemberIds: resolvedApplicable,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUserName,
              }
            : u
        )
      ),
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  const deleteUniversalExpense = (id: string) => {
    if (isLockedOrArchived) {
      console.warn('Cannot delete universal expense: month is locked.');
      return;
    }
    const expense = state.universalExpenses.find(u => u.id === id);
    if (!expense) return;

    if (isMemberOnly) {
      const myMemberId = currentUserMember?.id || currentUser?.memberId;
      if (expense.paidById !== myMemberId && expense.createdBy !== currentUserName) {
        console.warn('Unauthorized: Members can only delete their own universal expenses.');
        return;
      }
    }

    const log = addAuditLog(
      'Universal Expense Deleted',
      `${expense.description || 'Expense'} (৳${expense.amount || 0})`,
      `Payer: ${expense.paidByName || 'Unknown'}`
    );
    const nextState: AppStateData = {
      ...state,
      universalExpenses: state.universalExpenses.filter(u => u.id !== id),
      auditLogs: [log, ...state.auditLogs].slice(0, 100),
    };
    setState(nextState);
    persistToCloud(nextState);
  };

  // Backup & Restore
  const exportBackupJSON = (): string => {
    const backupData = {
      appName: 'MealMess',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      summary: {
        totalMonths: (state.months || []).length,
        totalMembers: (state.members || []).length,
        totalMeals: (state.meals || []).length,
        totalBazaarExpenses: (state.bazaarExpenses || []).length,
        totalUniversalExpenses: (state.universalExpenses || []).length,
        totalDeposits: (state.deposits || []).length,
      },
      ...state,
    };
    return JSON.stringify(backupData, null, 2);
  };

  const importBackupJSON = (jsonString: string): { success: boolean; error?: string; message?: string } => {
    try {
      if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
        return { success: false, error: 'Uploaded file is empty.' };
      }

      let parsed: any;
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseErr: any) {
        return { success: false, error: `Invalid JSON syntax: ${parseErr.message || 'Parse error'}` };
      }

      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid backup file structure: expected a JSON object.' };
      }

      // Support wrapped structures: { state: ... }, { data: ... }, or direct AppStateData
      const source: any = parsed.state || parsed.data || parsed;
      if (!source || typeof source !== 'object') {
        return { success: false, error: 'Could not find state data inside the backup file.' };
      }

      // Check required minimum collections: months or members
      const rawMonths = Array.isArray(source.months) ? source.months : [];
      const rawMembers = Array.isArray(source.members) ? source.members : [];

      if (rawMonths.length === 0 && rawMembers.length === 0) {
        return { success: false, error: 'Backup does not contain any months or member records.' };
      }

      // Sanitize Months
      const months: MonthRecord[] = (rawMonths.length > 0 ? rawMonths : state.months).map((m: any, idx: number) => ({
        id: String(m.id || `month-imported-${idx}-${Date.now()}`),
        name: String(m.name || 'Imported Month'),
        year: Number(m.year) || 2026,
        daysInMonth: Number(m.daysInMonth) || 30,
        status: m.status === 'locked' ? 'locked' : m.status === 'archived' ? 'archived' : 'active',
        mealRateMode: m.mealRateMode === 'fixed' ? 'fixed' : 'auto',
        fixedMealRate: Number(m.fixedMealRate) || 0,
        createdAt: m.createdAt || new Date().toISOString(),
        updatedAt: m.updatedAt || new Date().toISOString(),
        createdBy: m.createdBy || 'manager',
        updatedBy: m.updatedBy || 'manager',
      }));

      // Fallback if no valid months were parsed
      if (months.length === 0) {
        months.push(...state.months);
      }

      // Sanitize Members
      const members: Member[] = rawMembers.map((mem: any, idx: number) => ({
        id: String(mem.id || `mem-imp-${idx}-${Date.now()}`),
        monthId: String(mem.monthId || months[0].id),
        name: String(mem.name || `Member ${idx + 1}`),
        email: mem.email ? String(mem.email) : undefined,
        phone: mem.phone ? String(mem.phone) : undefined,
        roomNumber: mem.roomNumber ? String(mem.roomNumber) : undefined,
        initialDeposit: Number(mem.initialDeposit) || 0,
        previousBalance: Number(mem.previousBalance) || 0,
        createdAt: mem.createdAt || new Date().toISOString(),
      }));

      // Sanitize Deposits
      const rawDeposits = Array.isArray(source.deposits) ? source.deposits : [];
      const deposits: Deposit[] = rawDeposits.map((dep: any, idx: number) => ({
        id: String(dep.id || `dep-imp-${idx}-${Date.now()}`),
        monthId: String(dep.monthId || months[0].id),
        memberId: String(dep.memberId || ''),
        amount: Number(dep.amount) || 0,
        date: String(dep.date || new Date().toISOString().split('T')[0]),
        note: dep.note ? String(dep.note) : undefined,
        createdAt: dep.createdAt || new Date().toISOString(),
        createdBy: dep.createdBy || 'manager',
      }));

      // Sanitize Meals
      const rawMeals = Array.isArray(source.meals) ? source.meals : [];
      const meals: MealEntry[] = rawMeals.map((meal: any, idx: number) => {
        const rawQty = meal.quantity !== undefined
          ? Number(meal.quantity)
          : ((Number(meal.breakfast) || 0) + (Number(meal.lunch) || 0) + (Number(meal.dinner) || 0));
        const cleanQuantity = isNaN(rawQty) ? 0 : Math.max(0, rawQty);

        return {
          id: String(meal.id || `meal-imp-${idx}-${Date.now()}`),
          monthId: String(meal.monthId || months[0].id),
          memberId: String(meal.memberId || ''),
          day: Number(meal.day) || 1,
          quantity: cleanQuantity,
          updatedAt: meal.updatedAt || new Date().toISOString(),
          updatedBy: meal.updatedBy || 'manager',
        };
      });

      // Sanitize Bazaar Expenses
      const rawBazaar = Array.isArray(source.bazaarExpenses) ? source.bazaarExpenses : [];
      const bazaarExpenses: BazaarExpense[] = rawBazaar.map((b: any, idx: number) => ({
        id: String(b.id || `baz-imp-${idx}-${Date.now()}`),
        monthId: String(b.monthId || months[0].id),
        date: String(b.date || new Date().toISOString().split('T')[0]),
        description: String(b.description || 'Bazaar Expense'),
        amount: Number(b.amount) || 0,
        paidById: String(b.paidById || 'shared_fund'),
        paidByName: String(b.paidByName || 'Shared Mess Fund'),
        createdAt: b.createdAt || new Date().toISOString(),
        updatedAt: b.updatedAt || new Date().toISOString(),
        createdBy: b.createdBy || 'manager',
        updatedBy: b.updatedBy || 'manager',
      }));

      // Sanitize Universal Expenses
      const rawUniversal = Array.isArray(source.universalExpenses) ? source.universalExpenses : [];
      const universalExpenses: UniversalExpense[] = rawUniversal.map((u: any, idx: number) => ({
        id: String(u.id || `uni-imp-${idx}-${Date.now()}`),
        monthId: String(u.monthId || months[0].id),
        date: String(u.date || new Date().toISOString().split('T')[0]),
        description: String(u.description || 'Universal Expense'),
        amount: Number(u.amount) || 0,
        paidById: String(u.paidById || 'shared_fund'),
        paidByName: String(u.paidByName || 'Shared Mess Fund'),
        applicableMemberIds: Array.isArray(u.applicableMemberIds) ? u.applicableMemberIds.map(String) : [],
        createdAt: u.createdAt || new Date().toISOString(),
        updatedAt: u.updatedAt || new Date().toISOString(),
        createdBy: u.createdBy || 'manager',
        updatedBy: u.updatedBy || 'manager',
      }));

      // Meal audits & Audit logs
      const mealAudits: MealAuditRecord[] = Array.isArray(source.mealAudits) ? source.mealAudits.slice(0, 150) : [];
      const rawLogs = Array.isArray(source.auditLogs) ? source.auditLogs : [];
      const auditLogs: AuditLog[] = rawLogs.slice(0, 100);

      // Users: strictly enforce only Sabbir Programmer (Master Key) and Manager (Normal User)
      const mergedUsers: User[] = sanitizeUsers(source.users || state.users);

      // Determine activeMonthId: ensure it actually exists in months
      let activeMonthId = source.activeMonthId;
      if (!activeMonthId || !months.some(m => m.id === activeMonthId)) {
        const activeM = months.find(m => m.status === 'active');
        activeMonthId = activeM ? activeM.id : months[0].id;
      }

      // Preserve currently logged-in user so the session is NOT kicked out to login screen!
      const activeUserId = state.currentUserId && mergedUsers.some(u => u.id === state.currentUserId)
        ? state.currentUserId
        : (mergedUsers[0]?.id || 'usr-manager');

      const restoredAudit: AuditLog = {
        id: `audit-restore-${Date.now()}`,
        user: currentUser?.username || 'manager',
        action: 'Backup Restored',
        target: `${months.length} months, ${members.length} members, ${meals.length} meals, ${bazaarExpenses.length + universalExpenses.length} expenses`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        details: `Successfully restored backup from JSON file`,
      };

      const reconciledState: AppStateData = {
        users: mergedUsers,
        currentUserId: activeUserId,
        months,
        activeMonthId,
        members,
        deposits,
        meals,
        mealAudits,
        bazaarExpenses,
        universalExpenses,
        auditLogs: [restoredAudit, ...auditLogs].slice(0, 100),
      };

      // Set state and persist synchronously
      setState(reconciledState);
      persistToCloud(reconciledState);
      try {
        localStorage.setItem(INITIAL_STORAGE_KEY, JSON.stringify(reconciledState));
        sessionStorage.setItem(INITIAL_STORAGE_KEY, JSON.stringify(reconciledState));
        localStorage.setItem('smart_meal_logged_in_user_id', activeUserId);
        localStorage.removeItem('smart_meal_explicitly_logged_out');
      } catch (err) {
        console.warn('Direct persistence error on restore:', err);
      }

      const summaryText = `Restored ${months.length} months, ${members.length} members, ${meals.length} daily meal records, ${bazaarExpenses.length + universalExpenses.length} expenses, and ${deposits.length} deposits!`;
      return { success: true, message: summaryText };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to parse JSON backup.' };
    }
  };

  const resetDemoData = () => {
    const seed = getInitialSeedData();
    const cleanMonth = seed.months[0];

    // Strictly enforce only Sabbir Programmer (Master Key) and Manager (Normal User)
    const preservedUsers = sanitizeUsers(state.users);
    const activeUserId = state.currentUserId && preservedUsers.some(u => u.id === state.currentUserId)
      ? state.currentUserId
      : null;

    const resetState: AppStateData = {
      users: preservedUsers,
      currentUserId: activeUserId,
      months: [cleanMonth],
      activeMonthId: cleanMonth.id,
      members: [],
      deposits: [],
      meals: [],
      mealAudits: [],
      bazaarExpenses: [],
      universalExpenses: [],
      auditLogs: [
        {
          id: `audit-reset-${Date.now()}`,
          monthId: cleanMonth.id,
          user: currentUser?.username || 'manager',
          action: 'Workspace Reset',
          target: 'All records cleared',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          details: 'All members, meals, expenses, and deposits were reset by manager',
        },
      ],
    };

    setState(resetState);
    persistToCloud(resetState);

    try {
      const trimmedState: AppStateData = {
        ...resetState,
        currentUserId: null,
      };
      localStorage.setItem(INITIAL_STORAGE_KEY, JSON.stringify(trimmedState));
      sessionStorage.setItem(INITIAL_STORAGE_KEY, JSON.stringify(trimmedState));
      if (activeUserId) {
        localStorage.setItem('smart_meal_logged_in_user_id', activeUserId);
        localStorage.removeItem('smart_meal_explicitly_logged_out');
      }
    } catch (err) {
      console.error('Failed to persist reset state to storage:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        state,
        currentUser,
        currentUserMember,
        isMasterKey,
        isManager,
        isMemberOnly,
        verifyMasterKey,
        unlockMasterAccess,
        activeMonth,
        monthSummary,
        allMonths: state.months,
        isLockedOrArchived,
        syncStatus,
        lastSyncedAt,
        forceSyncCloud,
        login,
        signup,
        logout,
        createUser,
        deleteUser,
        updateManagerPassword,
        updateManagerProfile,
        updateMyProfile,
        setActiveMonthId,
        createMonth,
        lockMonth,
        archiveMonth,
        updateMealRateSettings,
        addMember,
        editMember,
        deleteMember,
        addDeposit,
        deleteDeposit,
        updateMeal,
        addBazaarExpense,
        editBazaarExpense,
        deleteBazaarExpense,
        addUniversalExpense,
        editUniversalExpense,
        deleteUniversalExpense,
        exportBackupJSON,
        importBackupJSON,
        resetDemoData,
        isCalculatorOpen,
        setIsCalculatorOpen,
        calculatorMemory,
        setCalculatorMemory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
