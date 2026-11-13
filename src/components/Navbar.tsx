import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Receipt,
  Layers,
  FileText,
  Settings,
  LogOut,
  Calendar,
  Lock,
  Unlock,
  Archive,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CloudOff,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MyProfileModal } from './MyProfileModal';

export type ScreenType =
  | 'dashboard'
  | 'members'
  | 'meals'
  | 'bazaar'
  | 'universal'
  | 'expenses'
  | 'reports'
  | 'settings';

interface NavbarProps {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, onSelectScreen }) => {
  const {
    currentUser,
    isMasterKey,
    isManager,
    logout,
    activeMonth,
    allMonths,
    setActiveMonthId,
    isLockedOrArchived,
    lockMonth,
    syncStatus,
    lastSyncedAt,
    forceSyncCloud,
  } = useApp();

  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isExpensesDropdownOpen, setIsExpensesDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const expensesDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns automatically when switching screens
  useEffect(() => {
    setIsMonthDropdownOpen(false);
    setIsExpensesDropdownOpen(false);
  }, [currentScreen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
      if (expensesDropdownRef.current && !expensesDropdownRef.current.contains(event.target as Node)) {
        setIsExpensesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isExpensesActive =
    currentScreen === 'bazaar' ||
    currentScreen === 'universal' ||
    currentScreen === 'expenses';

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        );
      case 'locked':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
            <Lock className="h-3 w-3" />
            Locked
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-300">
            <Archive className="h-3 w-3" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-[#88BDA4]/30 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] items-center justify-between px-2 sm:px-4 lg:px-4 xl:px-6 2xl:px-8 h-15 sm:h-16 gap-1.5 sm:gap-2">
        
        {/* Brand & Month Indicator */}
        <div className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2.5">
          {currentScreen !== 'dashboard' && (
            <button
              id="navbar-back-btn"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  onSelectScreen('dashboard');
                }
              }}
              title="Back to previous view"
              aria-label="Back"
              className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-[#E6F2DD] text-[#456C63] transition-all shadow-2xs cursor-pointer shrink-0 select-none active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[2.2]" />
            </button>
          )}

          <button
            type="button"
            id="navbar-brand-btn"
            onClick={() => onSelectScreen('dashboard')}
            aria-label="Go to dashboard"
            aria-current={currentScreen === 'dashboard' ? 'page' : undefined}
            className="flex min-w-0 items-center gap-1.5 sm:gap-2 cursor-pointer group shrink rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#456C63] focus-visible:ring-offset-2"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[#456C63] text-white shadow-md shadow-[#456C63]/20 group-hover:scale-105 transition-transform shrink-0">
              <UtensilsCrossed className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <div className="flex min-w-0 items-center gap-1">
              <span className="text-xs sm:text-base font-extrabold tracking-tight text-[#1A332C] leading-none truncate">
                MealMess
              </span>
            </div>
          </button>

          {/* Month Selector Dropdown */}
          {activeMonth && (
            <div ref={monthDropdownRef} className="relative shrink-0">
              <button
                id="month-selector-dropdown-btn"
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                aria-label={`Active month: ${activeMonth.name} ${activeMonth.year}, status ${activeMonth.status}. Select month`}
                aria-expanded={isMonthDropdownOpen}
                className="flex h-11 w-11 md:h-auto md:w-auto items-center justify-center md:justify-start gap-1 sm:gap-1.5 rounded-xl border border-[#B1D3B9] bg-[#E6F2DD]/50 px-0 md:px-2 py-1 text-xs sm:text-sm font-semibold text-[#1A332C] hover:bg-[#E6F2DD] transition-colors focus:outline-none focus:ring-2 focus:ring-[#88BDA4] cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-[#456C63] shrink-0" />
                <span className="hidden 2xl:inline whitespace-nowrap">{activeMonth.name} {activeMonth.year}</span>
                <span className="hidden md:inline 2xl:hidden whitespace-nowrap text-xs font-semibold">
                  {activeMonth.name.substring(0, 3)} '{activeMonth.year.toString().slice(-2)}
                </span>
                <span className="hidden 2xl:inline-flex">{getStatusBadge(activeMonth.status)}</span>
                <span
                  className={`hidden md:block 2xl:hidden h-2 w-2 rounded-full shrink-0 ${
                    activeMonth.status === 'active'
                      ? 'bg-emerald-500 ring-2 ring-emerald-200'
                      : activeMonth.status === 'locked'
                      ? 'bg-amber-500 ring-2 ring-amber-200'
                      : 'bg-slate-400'
                  }`}
                  title={`Status: ${activeMonth.status}`}
                />
                <ChevronDown className={`hidden md:block h-3 w-3 text-gray-500 shrink-0 transition-transform duration-200 ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMonthDropdownOpen && (
                <div className="absolute left-1/2 mt-2 z-50 w-56 max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl animate-in fade-in sm:left-0 sm:translate-x-0">
                  <div className="px-3 py-1 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    Select Month
                  </div>
                  {allMonths.map(m => (
                    <button
                      key={m.id}
                      id={`select-month-${m.id}`}
                      onClick={() => {
                        setActiveMonthId(m.id);
                        setIsMonthDropdownOpen(false);
                      }}
                      className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2.5 sm:py-2 text-xs font-medium transition-colors ${
                        m.id === activeMonth.id
                          ? 'bg-[#E6F2DD] text-[#1A332C] font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{m.name} {m.year}</span>
                      {getStatusBadge(m.status)}
                    </button>
                  ))}
                  {isMasterKey && (
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        id="nav-to-settings-create-month"
                        onClick={() => {
                          setIsMonthDropdownOpen(false);
                          onSelectScreen('settings');
                        }}
                        className="w-full text-left rounded-lg px-3 py-2.5 sm:py-1.5 text-xs font-semibold text-[#456C63] hover:bg-[#E6F2DD]/50 transition-colors"
                      >
                        + Create or manage months
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 2xl:gap-2 shrink-0">
          <button
            id="nav-link-dashboard"
            onClick={() => onSelectScreen('dashboard')}
            aria-current={currentScreen === 'dashboard' ? 'page' : undefined}
            className={`flex items-center gap-1.5 rounded-xl px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              currentScreen === 'dashboard'
                ? 'bg-[#456C63] text-white shadow-xs'
                : 'text-gray-600 hover:bg-[#E6F2DD]/70 hover:text-[#1A332C]'
            }`}
          >
            <LayoutDashboard className={`h-3.5 w-3.5 shrink-0 ${currentScreen === 'dashboard' ? 'text-white' : 'text-[#456C63]'}`} />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-link-meals"
            onClick={() => onSelectScreen('meals')}
            aria-current={currentScreen === 'meals' ? 'page' : undefined}
            className={`flex items-center gap-1.5 rounded-xl px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              currentScreen === 'meals'
                ? 'bg-[#456C63] text-white shadow-xs'
                : 'text-gray-600 hover:bg-[#E6F2DD]/70 hover:text-[#1A332C]'
            }`}
          >
            <UtensilsCrossed className={`h-3.5 w-3.5 shrink-0 ${currentScreen === 'meals' ? 'text-white' : 'text-[#456C63]'}`} />
            <span><span className="hidden 2xl:inline">Daily </span>Meals</span>
          </button>

          <button
            id="nav-link-members"
            onClick={() => onSelectScreen('members')}
            aria-current={currentScreen === 'members' ? 'page' : undefined}
            className={`flex items-center gap-1.5 rounded-xl px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              currentScreen === 'members'
                ? 'bg-[#456C63] text-white shadow-xs'
                : 'text-gray-600 hover:bg-[#E6F2DD]/70 hover:text-[#1A332C]'
            }`}
          >
            <Users className={`h-3.5 w-3.5 shrink-0 ${currentScreen === 'members' ? 'text-white' : 'text-[#456C63]'}`} />
            <span>Members</span>
          </button>

          {/* Unified Expenses with dropdown */}
          <div
            ref={expensesDropdownRef}
            className="relative"
            onMouseEnter={() => setIsExpensesDropdownOpen(true)}
            onMouseLeave={() => setIsExpensesDropdownOpen(false)}
          >
            <button
              id="nav-link-expenses"
              onClick={() => {
                if (isExpensesActive) {
                  setIsExpensesDropdownOpen(!isExpensesDropdownOpen);
                } else {
                  onSelectScreen('bazaar');
                }
              }}
              aria-current={isExpensesActive ? 'page' : undefined}
              aria-expanded={isExpensesDropdownOpen}
              title={isExpensesActive ? 'Toggle expense sections' : 'Open expenses'}
              className={`flex items-center gap-1 rounded-xl px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isExpensesActive
                  ? 'bg-[#456C63] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-[#E6F2DD]/70 hover:text-[#1A332C]'
              }`}
            >
              <Receipt className={`h-3.5 w-3.5 shrink-0 ${isExpensesActive ? 'text-white' : 'text-[#456C63]'}`} />
              <span>
                {currentScreen === 'universal' ? 'Universal' : currentScreen === 'bazaar' ? 'Bazaar' : 'Expenses'}
              </span>
              <ChevronDown
                className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
                  isExpensesDropdownOpen ? 'rotate-180' : ''
                } ${isExpensesActive ? 'text-white' : 'text-gray-500'}`}
              />
            </button>

            {isExpensesDropdownOpen && (
              <div className="absolute left-0 mt-1 z-50 w-56 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl animate-in fade-in">
                <button
                  id="nav-link-bazaar"
                  onClick={() => {
                    onSelectScreen('bazaar');
                    setIsExpensesDropdownOpen(false);
                  }}
                  className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 sm:py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    currentScreen === 'bazaar'
                      ? 'bg-[#E6F2DD] text-[#1A332C]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Receipt className="h-4 w-4 text-[#456C63] shrink-0" />
                  <div className="text-left">
                    <div className="font-bold">Bazaar Expenses</div>
                    <div className="text-[10px] font-normal text-gray-600">Daily market & grocery costs</div>
                  </div>
                </button>

                <button
                  id="nav-link-universal"
                  onClick={() => {
                    onSelectScreen('universal');
                    setIsExpensesDropdownOpen(false);
                  }}
                  className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 sm:py-2 text-xs font-semibold transition-colors mt-0.5 cursor-pointer ${
                    currentScreen === 'universal'
                      ? 'bg-[#E6F2DD] text-[#1A332C]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Layers className="h-4 w-4 text-[#456C63] shrink-0" />
                  <div className="text-left">
                    <div className="font-bold">Universal Expenses</div>
                    <div className="text-[10px] font-normal text-gray-600">Rent, bills, gas & Wi-Fi</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            id="nav-link-reports"
            onClick={() => onSelectScreen('reports')}
            aria-current={currentScreen === 'reports' ? 'page' : undefined}
            className={`flex items-center gap-1.5 rounded-xl px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              currentScreen === 'reports'
                ? 'bg-[#456C63] text-white shadow-xs'
                : 'text-gray-600 hover:bg-[#E6F2DD]/70 hover:text-[#1A332C]'
            }`}
          >
            <FileText className={`h-3.5 w-3.5 shrink-0 ${currentScreen === 'reports' ? 'text-white' : 'text-[#456C63]'}`} />
            <span>Reports</span>
          </button>

          {isMasterKey && (
            <button
              id="nav-link-settings"
              onClick={() => onSelectScreen('settings')}
              aria-current={currentScreen === 'settings' ? 'page' : undefined}
              className={`flex items-center gap-1.5 rounded-xl px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                currentScreen === 'settings'
                  ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-400'
                  : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100 hover:text-amber-900 border border-amber-200/80'
              }`}
            >
              <Settings className={`h-3.5 w-3.5 shrink-0 ${currentScreen === 'settings' ? 'text-white' : 'text-amber-700'}`} />
              <span>Settings</span>
            </button>
          )}
        </nav>

        {/* User profile & Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Cloud Sync Status Indicator */}
          <button
            id="nav-cloud-sync-btn"
            onClick={() => forceSyncCloud()}
            title={`Cloud Sync Status: ${syncStatus.toUpperCase()}${lastSyncedAt ? ` (Last synced: ${lastSyncedAt})` : ''}. Click to refresh.`}
            aria-label={`Cloud sync status: ${syncStatus}. Refresh sync`}
            className={`hidden sm:flex h-11 w-11 sm:h-9 sm:w-9 2xl:h-auto 2xl:w-auto items-center justify-center gap-1.5 rounded-xl border p-1.5 2xl:px-2.5 2xl:py-1 text-xs font-semibold transition-all cursor-pointer select-none ${
              syncStatus === 'synced'
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100'
                : syncStatus === 'syncing'
                ? 'border-blue-200 bg-blue-50/80 text-blue-800 animate-pulse'
                : syncStatus === 'offline'
                ? 'border-amber-200 bg-amber-50/80 text-amber-800'
                : 'border-red-200 bg-red-50/80 text-red-800'
            }`}
          >
            {syncStatus === 'synced' ? (
              <Cloud className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : syncStatus === 'syncing' ? (
              <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin shrink-0" />
            ) : syncStatus === 'offline' ? (
              <CloudOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            ) : (
              <CloudOff className="h-3.5 w-3.5 text-red-600 shrink-0" />
            )}
            <span className="hidden 2xl:inline text-[11px] font-bold">
              {syncStatus === 'synced'
                ? 'Cloud Synced'
                : syncStatus === 'syncing'
                ? 'Syncing...'
                : syncStatus === 'offline'
                ? 'Offline Cache'
                : 'Sync Error'}
            </span>
          </button>

          {currentUser && (
            <button
              id="navbar-profile-btn"
              onClick={() => setIsProfileOpen(true)}
              title={`Logged in as ${currentUser.fullName || currentUser.username} (${isMasterKey ? 'Master Key' : isManager ? 'Manager' : 'Member'}). Click to edit your profile.`}
              className={`flex h-11 w-11 sm:h-9 sm:w-9 2xl:h-auto 2xl:w-auto items-center justify-center 2xl:justify-start gap-1.5 rounded-xl border px-0 2xl:px-2.5 py-1 shrink-0 hover:shadow-xs transition-all cursor-pointer ${
                isMasterKey
                  ? 'border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100'
                  : isManager
                  ? 'border-[#B1D3B9]/60 bg-[#E6F2DD]/30 text-[#1A332C] hover:bg-[#E6F2DD]/60'
                  : 'border-[#88BDA4]/60 bg-white text-[#1A332C] hover:bg-[#E6F2DD]/40'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-[10px] font-bold shrink-0 ${
                  isMasterKey ? 'bg-amber-600' : isManager ? 'bg-[#456C63]' : 'bg-[#456c63]'
                }`}
              >
                {(currentUser.fullName || currentUser.username).substring(0, 2).toUpperCase()}
              </div>

              {/* Full identity shown on wide 2xl screens */}
              <div className="hidden 2xl:block text-left">
                <p className="text-xs font-bold leading-none text-[#1A332C] max-w-[120px] truncate">
                  {currentUser.fullName || currentUser.username}
                </p>
                <span
                  className={`text-[10px] font-semibold capitalize ${
                    isMasterKey
                      ? 'text-amber-700 font-bold'
                      : isManager
                      ? 'text-[#456C63]'
                      : 'text-[#456c63]'
                  }`}
                >
                  {isMasterKey ? '🔑 Master Key' : isManager ? '🛡️ Manager' : '👤 Member'}
                </span>
              </div>

              {/* Compact badge on standard desktop/laptop screens */}
              <span className="text-[11px] font-bold 2xl:hidden select-none">
                {isMasterKey ? '🔑' : isManager ? '🛡️' : '👤'}
              </span>
            </button>
          )}

          {/* Logout Button: ALWAYS VISIBLE, NEVER CUT OFF */}
          <button
            id="nav-logout-btn"
            onClick={logout}
            title="Sign out of current mess account"
            aria-label="Log out"
            className="flex h-11 w-11 sm:h-9 sm:w-auto items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-0 sm:px-2.5 text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 select-none"
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 shrink-0" />
            <span className="hidden sm:inline text-[11px] sm:text-xs">Logout</span>
          </button>
        </div>
      </div>

      {/* Lock banner if current month is locked or archived */}
      {isLockedOrArchived && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 sm:px-4 py-2 text-center text-xs font-medium text-amber-900 flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <Lock className="h-3.5 w-3.5 text-amber-700 shrink-0" />
            <span className="font-bold">
              {activeMonth?.name} {activeMonth?.year} is {activeMonth?.status === 'locked' ? 'Locked (Read-Only)' : 'Archived'}:
            </span>
          </div>
          <span className="text-amber-800">
            All records are read-only. Adding, editing, or deleting entries is prohibited.
          </span>
          {isMasterKey ? (
            <div className="flex items-center gap-2 ml-1 shrink-0">
              {activeMonth?.status === 'locked' && (
                <button
                  id="navbar-unlock-month-btn"
                  onClick={() => activeMonth && lockMonth(activeMonth.id)}
                  title="Instantly unlock this month to allow editing"
                  className="inline-flex min-h-11 sm:min-h-0 items-center justify-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <Unlock className="h-3 w-3" />
                  <span>Unlock Month</span>
                </button>
              )}
              <button
                onClick={() => onSelectScreen('settings')}
                className="inline-flex min-h-11 sm:min-h-0 items-center underline font-bold text-amber-900 hover:text-amber-950 text-[11px] px-1"
              >
                Settings
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-amber-700 font-semibold shrink-0">
              (Viewing only — contact Master Key to unlock)
            </span>
          )}
        </div>
      )}

      {/* Self-Service My Profile Modal */}
      <MyProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </header>
  );
};
