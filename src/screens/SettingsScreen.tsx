import React, { useRef, useState, useEffect } from 'react';
import {
  Calendar,
  Lock,
  Unlock,
  Archive,
  Plus,
  UserPlus,
  Users,
  ShieldCheck,
  History,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileJson,
  Search,
  KeyRound,
  Trash2,
  UserCheck,
  UserX,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/Modal';
import { User } from '../types';

export const SettingsScreen: React.FC = () => {
  const {
    activeMonth,
    allMonths,
    setActiveMonthId,
    createMonth,
    lockMonth,
    archiveMonth,
    updateMealRateSettings,
    state,
    createUser,
    deleteUser,
    currentUser,
    exportBackupJSON,
    importBackupJSON,
    resetDemoData,
    updateManagerProfile,
    syncStatus,
    lastSyncedAt,
    forceSyncCloud,
  } = useApp();

  // Create Month State
  const [newMonthName, setNewMonthName] = useState('');
  const [newMonthYear, setNewMonthYear] = useState<number>(new Date().getFullYear());
  const [monthSuccessMsg, setMonthSuccessMsg] = useState<string | null>(null);

  // Meal Rate Settings
  const [rateMode, setRateMode] = useState<'auto' | 'fixed'>(
    activeMonth?.mealRateMode || 'auto'
  );
  const [fixedRateValue, setFixedRateValue] = useState<string>(
    activeMonth?.fixedMealRate?.toString() || '65'
  );
  const [rateSaveSuccess, setRateSaveSuccess] = useState(false);

  // Account & Credentials Management State
  const [accountUsername, setAccountUsername] = useState(currentUser?.username || 'sabbirprogrammer');
  const [accountFullName, setAccountFullName] = useState(currentUser?.fullName || 'Sabbir Programmer');
  const [accountNewPass, setAccountNewPass] = useState('');
  const [accountConfirmPass, setAccountConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setAccountUsername(currentUser.username);
      setAccountFullName(currentUser.fullName || '');
    }
  }, [currentUser]);

  // User Management State (Master Key authority)
  const [createRole, setCreateRole] = useState<'member' | 'manager'>('member');
  const [createMemberId, setCreateMemberId] = useState<string>('');
  const [createUsername, setCreateUsername] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createConfirmPassword, setCreateConfirmPassword] = useState('');
  const [userMsg, setUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [deletingUserModal, setDeletingUserModal] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const activeMonthMembers = activeMonth
    ? state.members.filter(m => m.monthId === activeMonth.id)
    : [];

  const handleMemberSelect = (memberId: string) => {
    setCreateMemberId(memberId);
    if (!memberId) return;
    const selected = activeMonthMembers.find(m => m.id === memberId);
    if (selected) {
      if (!createFullName || activeMonthMembers.some(m => m.name === createFullName)) {
        setCreateFullName(selected.name);
      }
      if (!createUsername) {
        const suggested = selected.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 15);
        if (suggested && !state.users.some(u => u.username === suggested)) {
          setCreateUsername(suggested);
        }
      }
    }
  };

  const handleCreateNormalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg(null);
    const cleanUser = createUsername.trim().toLowerCase();
    if (!cleanUser) {
      setUserMsg({ type: 'error', text: 'Username cannot be empty.' });
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
      setUserMsg({ type: 'error', text: 'Username can only contain letters, numbers, hyphens, and underscores.' });
      return;
    }
    if (!createPassword) {
      setUserMsg({ type: 'error', text: 'Password cannot be empty.' });
      return;
    }
    if (createPassword.length < 4) {
      setUserMsg({ type: 'error', text: 'Password must be at least 4 characters long.' });
      return;
    }
    if (createPassword !== createConfirmPassword) {
      setUserMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsCreatingUser(true);
    const res = await createUser(
      cleanUser,
      createPassword,
      createFullName.trim() || undefined,
      createRole,
      createRole === 'member' ? (createMemberId || undefined) : undefined
    );
    setIsCreatingUser(false);

    if (res.success) {
      const roleLabel = createRole === 'manager' ? 'Manager' : 'Member';
      setUserMsg({
        type: 'success',
        text: `${roleLabel} account @${cleanUser} created successfully! They can now log in with ${
          createRole === 'manager' ? 'management' : 'member self-service'
        } access.`,
      });
      setCreateUsername('');
      setCreateFullName('');
      setCreatePassword('');
      setCreateConfirmPassword('');
      setCreateMemberId('');
      setCreateRole('member');
      setTimeout(() => setUserMsg(null), 5000);
    } else {
      setUserMsg({ type: 'error', text: res.error || 'Failed to create user.' });
    }
  };

  // Audit Search
  const [auditSearch, setAuditSearch] = useState('');

  // Backup file ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupMsg, setBackupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleCreateMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthName) return;

    createMonth(newMonthName, newMonthYear);
    setMonthSuccessMsg(`Created and switched to ${newMonthName} ${newMonthYear}!`);
    setNewMonthName('');
    setTimeout(() => setMonthSuccessMsg(null), 3500);
  };

  const handleSaveMealRateConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMonth) return;
    const rate = parseFloat(fixedRateValue) || 0;
    updateMealRateSettings(activeMonth.id, rateMode, rate);
    setRateSaveSuccess(true);
    setTimeout(() => setRateSaveSuccess(false), 3000);
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    const cleanUser = accountUsername.trim();
    if (!cleanUser) {
      setPassMsg({ type: 'error', text: 'Username cannot be empty.' });
      return;
    }

    if (accountNewPass) {
      if (accountNewPass.length < 4) {
        setPassMsg({ type: 'error', text: 'New password must be at least 4 characters.' });
        return;
      }
      if (accountConfirmPass && accountNewPass !== accountConfirmPass) {
        setPassMsg({ type: 'error', text: 'Password confirmation does not match.' });
        return;
      }
    }

    const res = await updateManagerProfile(
      cleanUser,
      accountNewPass ? accountNewPass : undefined,
      accountFullName.trim()
    );

    if (res.success) {
      setPassMsg({
        type: 'success',
        text: accountNewPass
          ? 'Account username and password updated successfully!'
          : 'Account profile updated successfully!',
      });
      setAccountNewPass('');
      setAccountConfirmPass('');
      setTimeout(() => setPassMsg(null), 4000);
    } else {
      setPassMsg({ type: 'error', text: res.error || 'Failed to update account.' });
    }
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MealMess_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupMsg({ type: 'success', text: 'Backup downloaded successfully!' });
    setTimeout(() => setBackupMsg(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const res = importBackupJSON(content);
      if (res.success) {
        setBackupMsg({ type: 'success', text: res.message || 'Backup restored successfully!' });
      } else {
        setBackupMsg({ type: 'error', text: res.error || 'Invalid backup file.' });
      }
    };
    reader.onerror = () => {
      setBackupMsg({ type: 'error', text: 'Failed to read the selected file.' });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredAudits = state.auditLogs.filter(log => {
    if (!auditSearch.trim()) return true;
    const term = auditSearch.toLowerCase();
    return (
      log.user.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.target.toLowerCase().includes(term) ||
      (log.details && log.details.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8 pb-20">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1A332C]">
          System Settings & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
          Manage workspace months, user accounts, audit histories, and workspace backups.
        </p>
      </div>

      {/* Grid of Settings Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Module 1: Month Management & Lock / Archive */}
        <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#456C63]">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A332C]">
                Month Management
              </h2>
              <p className="text-xs text-gray-600">
                Create new months or lock/archive existing ones
              </p>
            </div>
          </div>

          {monthSuccessMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              {monthSuccessMsg}
            </div>
          )}

          {/* Create Month Form */}
          <form onSubmit={handleCreateMonth} className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Create New Month
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="settings-new-month-name"
                  className="block text-[11px] font-semibold text-gray-600 mb-1"
                >
                  Month Name *
                </label>
                <select
                  id="settings-new-month-name"
                  value={newMonthName}
                  onChange={e => setNewMonthName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-[#1A332C] focus:border-[#456C63] focus:outline-none"
                >
                  <option value="">Select month</option>
                  {monthsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="settings-new-month-year"
                  className="block text-[11px] font-semibold text-gray-600 mb-1"
                >
                  Year *
                </label>
                <input
                  id="settings-new-month-year"
                  type="number"
                  value={newMonthYear}
                  onChange={e => setNewMonthYear(parseInt(e.target.value) || 2026)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-[#1A332C] focus:border-[#456C63] focus:outline-none"
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-600">
              Tip: Creating a new month automatically carries forward the previous month's final balances!
            </p>

            <button
              id="settings-create-month-btn"
              type="submit"
              disabled={!newMonthName}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#456C63] px-4 py-2 text-xs font-bold text-white hover:bg-[#38564f] disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Month</span>
            </button>
          </form>

          {/* Active Month Lock / Restriction Mode Status Card */}
          {activeMonth && (
            <div
              className={`rounded-2xl border p-4 space-y-2.5 transition-all ${
                activeMonth.status === 'locked'
                  ? 'border-amber-300 bg-amber-50/70'
                  : 'border-[#B1D3B9]/80 bg-[#E6F2DD]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  {activeMonth.status === 'locked' ? (
                    <Lock className="h-4 w-4 text-amber-700" />
                  ) : (
                    <Unlock className="h-4 w-4 text-[#456C63]" />
                  )}
                  Month Restriction Mode
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                    activeMonth.status === 'locked'
                      ? 'bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {activeMonth.status === 'locked' ? 'Locked (Read-Only)' : 'Active (Editable)'}
                </span>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                {activeMonth.status === 'locked' ? (
                  <>
                    <strong className="text-amber-950 font-bold">Restriction active: </strong>
                    All records for <strong className="text-amber-950 font-bold">{activeMonth.name} {activeMonth.year}</strong> are currently in Read-Only mode. Adding, editing, or deleting entries is strictly prohibited across the entire mess workspace until unlocked.
                  </>
                ) : (
                  <>
                    <strong className="text-[#1A332C] font-bold">Editing permitted: </strong>
                    Normal users and managers can record daily meals, add bazaar/universal bills, and manage deposits for <strong className="text-[#1A332C] font-bold">{activeMonth.name} {activeMonth.year}</strong>. Lock this month once finalized to prevent any alterations.
                  </>
                )}
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  id="settings-toggle-active-month-lock-btn"
                  type="button"
                  onClick={() => lockMonth(activeMonth.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                    activeMonth.status === 'locked'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-[#456C63] hover:bg-[#38564f] text-white'
                  }`}
                >
                  {activeMonth.status === 'locked' ? (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Unlock Month (Allow Editing)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Lock Month (Set Read-Only)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Month Status & Controls for All Months */}
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              All Workspace Months & Lock Status
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allMonths.map(m => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between rounded-xl border p-3 text-xs transition-colors ${
                    m.id === activeMonth?.id
                      ? 'border-[#659287] bg-[#E6F2DD]/30'
                      : 'border-gray-200 bg-gray-50/50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-[#1A332C] flex items-center gap-2">
                      <span>{m.name} {m.year}</span>
                      {m.id === activeMonth?.id && (
                        <span className="rounded-md bg-[#456C63] text-white px-1.5 py-0.2 text-[10px]">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 capitalize">
                      Status: {m.status} | {m.daysInMonth} days
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {m.id !== activeMonth?.id && (
                      <button
                        onClick={() => setActiveMonthId(m.id)}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
                      >
                        Switch
                      </button>
                    )}

                    <button
                      id={`lock-month-btn-${m.id}`}
                      onClick={() => lockMonth(m.id)}
                      title={m.status === 'locked' ? 'Unlock Month' : 'Lock Month'}
                      className={`rounded-lg p-1.5 transition-colors ${
                        m.status === 'locked'
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {m.status === 'locked' ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    </button>

                    {m.status !== 'archived' && (
                      <button
                        id={`archive-month-btn-${m.id}`}
                        onClick={() => archiveMonth(m.id)}
                        title="Archive Month"
                        className="rounded-lg bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Module 2: Meal Rate Calculation Mode */}
        <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#456C63]">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A332C]">
                Meal Rate Rules
              </h2>
              <p className="text-xs text-gray-600">
                Configure Auto Mode vs Fixed Meal Rate
              </p>
            </div>
          </div>

          {rateSaveSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              Meal rate configuration updated!
            </div>
          )}

          <form onSubmit={handleSaveMealRateConfig} className="space-y-4">
            <div className="space-y-2">
              <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Calculation Mode
              </span>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex flex-col rounded-2xl border p-3.5 cursor-pointer transition-colors ${
                    rateMode === 'auto'
                      ? 'border-[#659287] bg-[#E6F2DD]/40'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#1A332C]">Auto Mode</span>
                    <input
                      type="radio"
                      name="rateMode"
                      checked={rateMode === 'auto'}
                      onChange={() => setRateMode('auto')}
                      className="text-[#456C63]"
                    />
                  </div>
                  <span className="text-[11px] text-gray-600">
                    Total Bazaar Cost ÷ Total Meals
                  </span>
                </label>

                <label
                  className={`flex flex-col rounded-2xl border p-3.5 cursor-pointer transition-colors ${
                    rateMode === 'fixed'
                      ? 'border-[#659287] bg-[#E6F2DD]/40'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#1A332C]">Fixed Mode</span>
                    <input
                      type="radio"
                      name="rateMode"
                      checked={rateMode === 'fixed'}
                      onChange={() => setRateMode('fixed')}
                      className="text-[#456C63]"
                    />
                  </div>
                  <span className="text-[11px] text-gray-600">
                    Manually set rate per meal
                  </span>
                </label>
              </div>
            </div>

            {rateMode === 'fixed' && (
              <div className="animate-in fade-in">
                <label
                  htmlFor="settings-fixed-meal-rate-input"
                  className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
                >
                  Fixed Rate Amount (৳ per meal) *
                </label>
                <input
                  id="settings-fixed-meal-rate-input"
                  type="number"
                  step="any"
                  value={fixedRateValue}
                  onChange={e => setFixedRateValue(e.target.value)}
                  placeholder="e.g. 65"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono tabular-nums focus:border-[#456C63] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                />
              </div>
            )}

            <button
              id="settings-save-rate-config-btn"
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#456C63] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#38564f] shadow-xs transition-colors"
            >
              <span>Save Meal Rate Rule</span>
            </button>
          </form>
        </div>

        {/* Module 3: User Management (Master Key Only) */}
        <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-6 shadow-xs space-y-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#456C63]">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1A332C] flex items-center gap-2">
                  <span>User Management</span>
                  <span className="rounded-md bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                    Master Key Authority
                  </span>
                </h2>
                <p className="text-xs text-gray-600">
                  Create Normal Users with custom login credentials or delete existing accounts from the system
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold text-gray-600">
              Total Users: <span className="font-bold text-[#1A332C]">{(state.users || []).length}</span>
            </div>
          </div>

          {userMsg && (
            <div
              className={`rounded-xl border p-3.5 text-xs font-semibold flex items-center gap-2 ${
                userMsg.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {userMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-[#B91C1C] shrink-0" />
              )}
              <span>{userMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Create User Form */}
            <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200/70">
                <UserPlus className="h-4 w-4 text-[#456C63]" />
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Create User Account
                </h3>
              </div>
              <p className="text-[11px] text-gray-600">
                Master Key authority: provision login credentials for mess members (self-service) or managers.
              </p>

              <form onSubmit={handleCreateNormalUser} className="space-y-3">
                {/* Account Type Selector */}
                <div>
                  <span className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Account Type *
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateRole('member')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        createRole === 'member'
                          ? 'bg-[#456C63] text-white shadow-xs'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Mess Member</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateRole('manager');
                        setCreateMemberId('');
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        createRole === 'manager'
                          ? 'bg-[#456C63] text-white shadow-xs'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Manager</span>
                    </button>
                  </div>
                </div>

                {/* Optional Member Link for Member accounts */}
                {createRole === 'member' && (
                  <div>
                    <label
                      htmlFor="create-user-member-select"
                      className="block text-[11px] font-semibold text-gray-600 mb-1"
                    >
                      Link to Mess Member <span className="text-gray-600 font-normal">({activeMonth?.name})</span>
                    </label>
                    <select
                      id="create-user-member-select"
                      value={createMemberId}
                      onChange={e => handleMemberSelect(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-[#1A332C] focus:border-[#456C63] focus:outline-none focus:ring-1 focus:ring-[#88BDA4]"
                    >
                      <option value="">-- Select Member to Link --</option>
                      {activeMonthMembers.map(m => {
                        const hasAccount = state.users.some(u => u.memberId === m.id);
                        return (
                          <option key={m.id} value={m.id}>
                            {m.name} {hasAccount ? '(Already Linked)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <span className="text-[10px] text-gray-600">
                      Connects login so member can log their own meals & edit their personal profile
                    </span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="create-user-username-input"
                    className="block text-[11px] font-semibold text-gray-600 mb-1"
                  >
                    Username *
                  </label>
                  <input
                    id="create-user-username-input"
                    type="text"
                    required
                    value={createUsername}
                    onChange={e => setCreateUsername(e.target.value)}
                    placeholder="e.g. tanvir, manager2"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-[#1A332C] focus:border-[#456C63] focus:outline-none focus:ring-1 focus:ring-[#88BDA4]"
                  />
                  <span className="text-[10px] text-gray-600">Letters, numbers, underscores, or hyphens</span>
                </div>

                <div>
                  <label
                    htmlFor="create-user-fullname-input"
                    className="block text-[11px] font-semibold text-gray-600 mb-1"
                  >
                    Display Name / Full Name <span className="text-gray-600 font-normal">(optional)</span>
                  </label>
                  <input
                    id="create-user-fullname-input"
                    type="text"
                    value={createFullName}
                    onChange={e => setCreateFullName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-[#1A332C] focus:border-[#456C63] focus:outline-none focus:ring-1 focus:ring-[#88BDA4]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="create-user-password-input"
                      className="block text-[11px] font-semibold text-gray-600 mb-1"
                    >
                      Password *
                    </label>
                    <input
                      id="create-user-password-input"
                      type="password"
                      required
                      value={createPassword}
                      onChange={e => setCreatePassword(e.target.value)}
                      placeholder="Min 4 chars"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-[#1A332C] focus:border-[#456C63] focus:outline-none focus:ring-1 focus:ring-[#88BDA4]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="create-user-confirm-password-input"
                      className="block text-[11px] font-semibold text-gray-600 mb-1"
                    >
                      Confirm Password *
                    </label>
                    <input
                      id="create-user-confirm-password-input"
                      type="password"
                      required
                      value={createConfirmPassword}
                      onChange={e => setCreateConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-[#1A332C] focus:border-[#456C63] focus:outline-none focus:ring-1 focus:ring-[#88BDA4]"
                    />
                  </div>
                </div>

                <button
                  id="create-normal-user-btn"
                  type="submit"
                  disabled={isCreatingUser || !createUsername.trim() || !createPassword}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#456C63] hover:bg-[#38564f] text-white py-2.5 px-4 text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>
                    {isCreatingUser
                      ? 'Creating Account...'
                      : createRole === 'manager'
                      ? 'Create Manager Account'
                      : 'Create Member Account'}
                  </span>
                </button>
              </form>
            </div>

            {/* Right Column: Existing System Users Table */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  System Accounts ({(state.users || []).length})
                </h3>
                <span className="text-[11px] text-gray-600">
                  Master Key is permanently protected
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-2xs">
                <table className="w-full min-w-[640px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#E6F2DD]/30 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                      <th className="px-3.5 py-2.5">User Identity</th>
                      <th className="px-3.5 py-2.5">Role & Access</th>
                      <th className="px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {(state.users || []).map(u => {
                      const isMasterAccount = u.isMaster || u.username.toLowerCase() === 'sabbirprogrammer';
                      const isMgr = u.role === 'manager' && !isMasterAccount;
                      const linkedMember = u.memberId ? state.members.find(m => m.id === u.memberId) : null;

                      return (
                        <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs text-white shrink-0 ${
                                  isMasterAccount
                                    ? 'bg-amber-600'
                                    : isMgr
                                    ? 'bg-[#456C63]'
                                    : 'bg-[#456c63]'
                                }`}
                              >
                                {(u.fullName || u.username).substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#1A332C] truncate">
                                  {u.fullName || u.username}
                                </div>
                                <div className="font-mono tabular-nums text-[11px] text-gray-600 truncate">
                                  @{u.username}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-3.5 py-3 whitespace-nowrap">
                            {isMasterAccount ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                                <ShieldCheck className="h-3 w-3 text-amber-600" />
                                🔑 Master Key
                              </span>
                            ) : isMgr ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                🛡️ Manager
                              </span>
                            ) : (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F2DD] px-2.5 py-0.5 text-[10px] font-bold text-[#456c63] border border-[#B1D3B9] w-fit">
                                  <UserCheck className="h-3 w-3 text-[#456C63]" />
                                  👤 Member
                                </span>
                                {linkedMember && (
                                  <span className="text-[10px] text-gray-600 mt-0.5 font-medium">
                                    Linked: {linkedMember.name}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="px-3.5 py-3 text-right whitespace-nowrap">
                            {isMasterAccount ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 select-none">
                                <Lock className="h-3 w-3" />
                                Protected
                              </span>
                            ) : (
                              <button
                                id={`delete-user-btn-${u.id}`}
                                onClick={() => setDeletingUserModal(u)}
                                title={`Delete user ${u.username}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-[#B91C1C] shrink-0" />
                                <span>Delete User</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Module 4: Master Account Credentials & Security */}
        <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#456C63]">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A332C]">
                Master Key Credentials
              </h2>
              <p className="text-xs text-gray-600">
                Update login username, full name, and password for Sabbir Programmer
              </p>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="rounded-2xl border border-gray-200 bg-[#E6F2DD]/30 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Active Account:</span>
              <span className="font-bold text-[#1A332C]">
                {currentUser?.fullName || 'Sabbir Programmer'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Current Username:</span>
              <span className="font-mono tabular-nums text-xs font-extrabold bg-white px-2 py-0.5 rounded-md border border-gray-200 text-[#1A332C]">
                {currentUser?.username || 'sabbirprogrammer'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Access Level:</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                <ShieldCheck className="h-3 w-3" />
                Master Key (Full Control)
              </span>
            </div>
          </div>

          {passMsg && (
            <div
              className={`rounded-xl border p-3 text-xs font-semibold flex items-center gap-2 ${
                passMsg.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {passMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-[#B91C1C] shrink-0" />
              )}
              {passMsg.text}
            </div>
          )}

          {/* Update Account & Password Form */}
          <form onSubmit={handleUpdateAccount} className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="settings-username-input"
                  className="block text-[11px] font-semibold text-gray-600 mb-1"
                >
                  Login Username *
                </label>
                <input
                  id="settings-username-input"
                  type="text"
                  required
                  value={accountUsername}
                  onChange={e => setAccountUsername(e.target.value)}
                  placeholder="e.g. sabbirprogrammer"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-[#456C63] focus:outline-none bg-gray-50/50 hover:bg-white focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="settings-fullname-input"
                  className="block text-[11px] font-semibold text-gray-600 mb-1"
                >
                  Manager Full Name
                </label>
                <input
                  id="settings-fullname-input"
                  type="text"
                  value={accountFullName}
                  onChange={e => setAccountFullName(e.target.value)}
                  placeholder="e.g. Sabbir Programmer"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-[#456C63] focus:outline-none bg-gray-50/50 hover:bg-white focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label
                  htmlFor="settings-new-password-input"
                  className="block text-[11px] font-semibold text-gray-600 mb-1"
                >
                  New Password <span className="font-normal text-gray-600">(optional)</span>
                </label>
                <input
                  id="settings-new-password-input"
                  type="password"
                  value={accountNewPass}
                  onChange={e => setAccountNewPass(e.target.value)}
                  placeholder="Leave empty to keep current"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-[#456C63] focus:outline-none bg-gray-50/50 hover:bg-white focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="settings-confirm-password-input"
                  className="block text-[11px] font-semibold text-gray-600 mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  id="settings-confirm-password-input"
                  type="password"
                  value={accountConfirmPass}
                  onChange={e => setAccountConfirmPass(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-[#456C63] focus:outline-none bg-gray-50/50 hover:bg-white focus:bg-white"
                />
              </div>
            </div>

            <button
              id="settings-update-account-btn"
              type="submit"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#456C63] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#38564f] transition-colors shadow-xs cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Save Account & Password</span>
            </button>
          </form>

          <p className="text-[11px] text-gray-600">
            Updated credentials take effect immediately and are saved across all sessions.
          </p>
        </div>

        {/* Module 4: Backup & Restore */}
        <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#456C63]">
              <FileJson className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A332C]">
                Backup & Restore
              </h2>
              <p className="text-xs text-gray-600">
                Export and import complete workspace as JSON
              </p>
            </div>
          </div>

          {backupMsg && (
            <div
              className={`rounded-xl border p-3 text-xs font-semibold flex items-center gap-2 ${
                backupMsg.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {backupMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-[#B91C1C] shrink-0" />
              )}
              {backupMsg.text}
            </div>
          )}

          <p className="text-xs text-gray-600">
            Export all months, members, daily meals, bazaar & universal expenses, deposits, and audit logs into a portable JSON backup.
          </p>

          {/* Current Workspace Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1">
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-2 text-center">
              <span className="block text-xs font-bold text-gray-800">{(state.months || []).length}</span>
              <span className="text-[10px] text-gray-600">Months</span>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-2 text-center">
              <span className="block text-xs font-bold text-gray-800">{(state.members || []).length}</span>
              <span className="text-[10px] text-gray-600">Members</span>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-2 text-center">
              <span className="block text-xs font-bold text-gray-800">{(state.meals || []).length}</span>
              <span className="text-[10px] text-gray-600">Meal Entries</span>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-2 text-center">
              <span className="block text-xs font-bold text-gray-800">{(state.bazaarExpenses || []).length + (state.universalExpenses || []).length}</span>
              <span className="text-[10px] text-gray-600">Expenses</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              id="settings-export-backup-btn"
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#456C63] bg-white px-4 py-3 text-xs font-bold text-[#456C63] hover:bg-[#E6F2DD] transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export Backup JSON</span>
            </button>

            <button
              id="settings-import-backup-btn"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#456C63] px-4 py-3 text-xs font-bold text-white hover:bg-[#38564f] transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Import Backup JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-700">Reset Mess Workspace</div>
              <p className="text-[10px] text-gray-600">Clear all members, meals, deposits, and expenses</p>
            </div>
            <button
              id="settings-reset-demo-btn"
              onClick={() => setShowResetConfirmModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-[#B91C1C] hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset All Data</span>
            </button>
          </div>
        </div>

        {/* Module 5: Real-Time Cloud Database & Cross-Device Sync */}
        <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-6 shadow-xs space-y-5 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#456C63]">
                <Cloud className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1A332C]">
                  Real-Time Cloud Persistence & Cross-Device Sync
                </h2>
                <p className="text-xs text-gray-600">
                  Google Cloud Firestore real-time synchronization across phones, tablets, and computers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : syncStatus === 'syncing'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse'
                    : syncStatus === 'offline'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {syncStatus === 'synced' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                {syncStatus === 'syncing' && <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />}
                {syncStatus === 'offline' && <CloudOff className="h-3.5 w-3.5 text-amber-600" />}
                {syncStatus === 'error' && <AlertCircle className="h-3.5 w-3.5 text-[#B91C1C]" />}
                {syncStatus === 'synced'
                  ? 'Connected & Synced'
                  : syncStatus === 'syncing'
                  ? 'Synchronizing...'
                  : syncStatus === 'offline'
                  ? 'Offline (Cached Locally)'
                  : 'Sync Error'}
              </span>

              <button
                id="settings-force-sync-btn"
                onClick={() => forceSyncCloud()}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 hover:border-[#659287] bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-[#1A332C] transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#456C63]" />
                <span>Sync Now</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1">
              <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Cloud Engine</div>
              <div className="text-xs font-semibold text-[#1A332C] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Google Cloud Firestore
              </div>
              <div className="text-[10px] text-gray-600 font-mono tabular-nums truncate">ID: elaborate-box-72ts5</div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1">
              <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Last Sync Time</div>
              <div className="text-xs font-semibold text-[#1A332C]">
                {lastSyncedAt ? `${lastSyncedAt}` : 'Just now'}
              </div>
              <div className="text-[10px] text-gray-600">Automatic real-time stream active</div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1">
              <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Multi-Device Coverage</div>
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Real-Time Synchronized
              </div>
              <div className="text-[10px] text-gray-600">Zero data loss on cache clear or device change</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#B1D3B9]/80 bg-[#E6F2DD]/30 p-3.5 text-xs text-gray-700 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[#456C63] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[#1A332C]">Cross-Device Guarantee: </span>
              <span>
                Any record you add or edit (such as members, daily meal entries, deposits, bazaar expenses, or utility bills) is automatically saved to Cloud Firestore and instantly broadcast to all open devices and browsers in real time.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Reset Confirmation In-UI Modal */}
      <Modal
        isOpen={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        title="Clear All Mess Records?"
        size="sm"
        icon={
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-[#B91C1C]">
            <RotateCcw className="h-6 w-6" aria-hidden="true" />
          </div>
        }
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShowResetConfirmModal(false)}
              className="min-h-11 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                setShowResetConfirmModal(false);
                setBackupMsg({ type: 'success', text: 'All mess records have been cleared successfully!' });
                setTimeout(() => setBackupMsg(null), 3500);
              }}
              className="min-h-11 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm cursor-pointer"
            >
              Yes, Reset All Data
            </button>
          </div>
        }
      >
        <p className="text-xs text-gray-600">
          This will permanently delete all members, daily meals, bazaar expenses, universal bills, and deposit records for a clean slate. Your manager credentials will remain safe.
        </p>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingUserModal)}
        onClose={() => setDeletingUserModal(null)}
        title="Delete User Account?"
        size="sm"
        icon={
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-[#B91C1C]">
            <UserX className="h-6 w-6" aria-hidden="true" />
          </div>
        }
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isDeletingUser}
              onClick={() => setDeletingUserModal(null)}
              className="min-h-11 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-delete-user-btn"
              disabled={isDeletingUser}
              onClick={async () => {
                if (!deletingUserModal) return;
                setIsDeletingUser(true);
                const res = await deleteUser(deletingUserModal.id);
                setIsDeletingUser(false);
                if (res.success) {
                  setUserMsg({
                    type: 'success',
                    text: `User @${deletingUserModal.username} was deleted successfully from the workspace.`,
                  });
                  setTimeout(() => setUserMsg(null), 4500);
                } else {
                  setUserMsg({
                    type: 'error',
                    text: res.error || 'Failed to delete user.',
                  });
                }
                setDeletingUserModal(null);
              }}
              className="min-h-11 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isDeletingUser ? 'Deleting...' : 'Yes, Delete User'}
            </button>
          </div>
        }
      >
        <p className="text-xs text-gray-600">
          Are you sure you want to permanently delete user{' '}
          <span className="font-bold text-[#1A332C]">
            {deletingUserModal?.fullName || deletingUserModal?.username}
          </span>{' '}
          (<code className="font-mono tabular-nums bg-gray-100 px-1 py-0.5 rounded text-[#B91C1C]">@{deletingUserModal?.username}</code>)?
        </p>
        <p className="mt-2 text-[11px] text-[#B91C1C] font-medium">
          This user will immediately be removed and will no longer be able to log in.
        </p>
      </Modal>

      {/* Audit History Log Module (Full Width) */}
      <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#456C63]">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A332C]">
                Audit History
              </h2>
              <p className="text-xs text-gray-600">
                Immutable activity log recording who created or updated records
              </p>
            </div>
          </div>

          {/* Filter Input */}
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="audit-search-input"
              type="text"
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              placeholder="Search user, action, target..."
              aria-label="Search audit history"
              className="w-full rounded-xl border border-gray-200 pl-8 pr-3 py-1.5 text-xs focus:border-[#456C63] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full min-w-[720px] text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#E6F2DD]/30 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredAudits.slice(0, 50).map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-[#1A332C]">
                      {log.user}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-[#E6F2DD] px-2 py-0.5 text-[11px] font-bold text-[#456c63]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {log.target}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-600 whitespace-nowrap">
                      {log.date} {log.time}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
