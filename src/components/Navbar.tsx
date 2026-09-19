import React, { useState } from 'react';
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
  Archive,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

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
    logout,
    activeMonth,
    allMonths,
    setActiveMonthId,
    isLockedOrArchived,
    syncStatus,
    lastSyncedAt,
    forceSyncCloud,
  } = useApp();

  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isExpensesDropdownOpen, setIsExpensesDropdownOpen] = useState(false);

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
      <div className="mx-auto flex w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] items-center justify-between px-2.5 sm:px-4 lg:px-6 2xl:px-8 h-15 sm:h-16 gap-1.5 sm:gap-3">
        
        {/* Brand & Month Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0 min-w-0">
          <div
            onClick={() => onSelectScreen('dashboard')}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group shrink-0"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[#659287] text-white shadow-md shadow-[#659287]/20 group-hover:scale-105 transition-transform shrink-0">
              <UtensilsCrossed className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs sm:text-base xl:text-lg font-extrabold tracking-tight text-[#1A332C] leading-none whitespace-nowrap">
                Smart Meal
              </span>
              <span className="hidden xl:inline-block rounded-md bg-[#88BDA4]/25 px-1.5 py-0.5 text-[11px] font-bold text-[#456c63]">
                Manager
              </span>
            </div>
          </div>

          {/* Month Selector Dropdown */}
          {activeMonth && (
            <div className="relative shrink-0">
              <button
                id="month-selector-dropdown-btn"
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-[#B1D3B9] bg-[#E6F2DD]/50 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-[#1A332C] hover:bg-[#E6F2DD] transition-colors focus:outline-none focus:ring-2 focus:ring-[#88BDA4] cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-[#659287] shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{activeMonth.name} {activeMonth.year}</span>
                <span className="inline sm:hidden whitespace-nowrap text-[11px]">
                  {activeMonth.name.substring(0, 3)} '{activeMonth.year.toString().slice(-2)}
                </span>
                <span className="hidden 2xl:inline-flex">{getStatusBadge(activeMonth.status)}</span>
                <span
                  className={`2xl:hidden h-2 w-2 rounded-full shrink-0 ${
                    activeMonth.status === 'active'
                      ? 'bg-emerald-500 ring-2 ring-emerald-200'
                      : activeMonth.status === 'locked'
                      ? 'bg-amber-500 ring-2 ring-amber-200'
                      : 'bg-slate-400'
                  }`}
                  title={`Status: ${activeMonth.status}`}
                />
                <ChevronDown className="h-3 w-3 text-gray-500 shrink-0" />
              </button>

              {isMonthDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMonthDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 z-50 w-56 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl animate-in fade-in">
                    <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
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
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
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
                          className="w-full text-left rounded-lg px-3 py-1.5 text-xs font-semibold text-[#659287] hover:bg-[#E6F2DD]/50 transition-colors"
                        >
                          + Create or manage months
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 shrink min-w-0">
          <button
            id="nav-link-dashboard"
            onClick={() => onSelectScreen('dashboard')}
            className={`flex items-center gap-1.5 rounded-xl px-2 xl:px-3 py-1.5 xl:py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              currentScreen === 'dashboard'
                ? 'bg-[#659287] text-white shadow-xs'
                : 'text-gray-600 hover:bg-[#E6F2DD]/70 hover:text-[#1A332C]'
            }`}
          >
            <LayoutDashboard className={`h-4 w-4 shrink-0 ${currentScreen === 'dashboard' ? 'text-white' : 'text-[#659287]'}`} />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-link-meals"
            onClick={() => onSelectScreen('meals')}
            className={`flex items-center gap-1.5 rounded-xl px-2 xl:px-3 py-1.5 xl:py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              currentScreen === 'meals'
                ? 'bg-[#659287] text-white shadow-xs'
                : 'text-gray-600 hover:bg-[#E6F2DD]/70 hover:text-[#1A332C]'
            }`}
          >
            <UtensilsCrossed className={`h-4 w-4 shrink-0 ${currentScreen === 'meals' ? 'text-white' : 'text-[#659287]'}`} />
            <span><span className="hidden xl:inline">Daily </span>Meals</span>
          </button>

          <button
            id="nav-link-members"
            onClick={() => onSelectScreen('members')}
            className={`flex items-center gap-1.5 rounded-xl px-2 xl:px-3 py-1.5 xl:py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              currentScreen === 'members'
                ? 'bg-[#659287] text-white shadow-xs'
                : 'text-gray-600 hover:bg-[#E6F2DD]/70 hover:text-[#1A332C]'
            }`}
          >
            <Users className={`h-4 w-4 shrink-0 ${currentScreen === 'members' ? 'text-white' : 'text-[#659287]'}`} />
            <span>Members</span>
          </button>

          {/* Expenses with dropdown */}
          <div className="relative">
            <div
              className={`flex items-center rounded-xl transition-all ${
                isExpensesActive
                  ? 'bg-[#659287] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-[#E6F2DD]/70 hover:text-[#1A332C]'
              }`}
            >
              <button
                id="nav-link-expenses"
                onClick={() => onSelectScreen('bazaar')}
                className="flex items-center gap-1 pl-2 xl:pl-3 pr-0.5 py-1.5 xl:py-2 text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                <Receipt className={`h-4 w-4 shrink-0 ${isExpensesActive ? 'text-white' : 'text-[#659287]'}`} />
                <span>Expenses</span>
              </button>
              <button
                id="nav-expenses-dropdown-toggle"
                onClick={() => setIsExpensesDropdownOpen(!isExpensesDropdownOpen)}
                className="pr-1.5 pl-0.5 py-1.5 xl:py-2 hover:opacity-80 cursor-pointer"
                title="Expense categories"
              >
                <ChevronDown className={`h-3 w-3 ${isExpensesActive ? 'text-white' : 'text-gray-500'}`} />
              </button>
            </div>

            {isExpensesDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsExpensesDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 z-50 w-52 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl animate-in fade-in">
                  <button
                    id="nav-link-bazaar"
                    onClick={() => {
                      onSelectScreen('bazaar');
                      setIsExpensesDropdownOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      currentScreen === 'bazaar'
                        ? 'bg-[#E6F2DD] text-[#1A332C]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Receipt className="h-3.5 w-3.5 text-[#659287]" />
                    <div className="text-left">
                      <div>Bazaar Expenses</div>
                      <div className="text-[10px] font-normal text-gray-400">Daily market & grocery</div>
                    </div>
                  </button>

                  <button
                    id="nav-link-universal"
                    onClick={() => {
                      onSelectScreen('universal');
                      setIsExpensesDropdownOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors mt-0.5 ${
                      currentScreen === 'universal'
                        ? 'bg-[#E6F2DD] text-[#1A332C]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5 text-[#659287]" />
                    <div className="text-left">
                      <div>Universal Expenses</div>
                      <div className="text-[10px] font-normal text-gray-400">Rent, bills, gas & Wi-Fi</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            id="nav-link-reports"
            onClick={() => onSelectScreen('reports')}
            className={`flex items-center gap-1.5 rounded-xl px-2 xl:px-3 py-1.5 xl:py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              currentScreen === 'reports'
                ? 'bg-[#659287] text-white shadow-xs'
                : 'text-gray-600 hover:bg-[#E6F2DD]/70 hover:text-[#1A332C]'
            }`}
          >
            <FileText className={`h-4 w-4 shrink-0 ${currentScreen === 'reports' ? 'text-white' : 'text-[#659287]'}`} />
            <span>Reports</span>
          </button>

          {isMasterKey && (
            <button
              id="nav-link-settings"
              onClick={() => onSelectScreen('settings')}
              className={`flex items-center gap-1.5 rounded-xl px-2 xl:px-3 py-1.5 xl:py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                currentScreen === 'settings'
                  ? 'bg-[#659287] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-[#E6F2DD]/70 hover:text-[#1A332C]'
              }`}
            >
              <Settings className={`h-4 w-4 shrink-0 ${currentScreen === 'settings' ? 'text-white' : 'text-[#659287]'}`} />
              <span>Settings</span>
            </button>
          )}
        </nav>

        {/* User profile & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Cloud Sync Status Indicator */}
          <button
            id="nav-cloud-sync-btn"
            onClick={() => forceSyncCloud()}
            title={`Cloud Sync Status: ${syncStatus.toUpperCase()}${lastSyncedAt ? ` (Last synced: ${lastSyncedAt})` : ''}. Click to refresh.`}
            className={`flex items-center gap-1.5 rounded-xl border px-2 py-1 text-xs font-semibold transition-all cursor-pointer select-none ${
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
              <Cloud className="h-3.5 w-3.5 text-emerald-600" />
            ) : syncStatus === 'syncing' ? (
              <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />
            ) : syncStatus === 'offline' ? (
              <CloudOff className="h-3.5 w-3.5 text-amber-600" />
            ) : (
              <CloudOff className="h-3.5 w-3.5 text-red-600" />
            )}
            <span className="hidden md:inline text-[11px] font-bold">
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
            <div
              title={`Logged in as ${currentUser.fullName || currentUser.username} (${isMasterKey ? 'Master Key' : 'Normal User'})`}
              className={`flex items-center gap-1.5 rounded-xl border px-1.5 sm:px-2 xl:px-3 py-1 shrink-0 ${
                isMasterKey
                  ? 'border-amber-200 bg-amber-50/60'
                  : 'border-[#B1D3B9]/60 bg-[#E6F2DD]/30'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-[10px] font-bold shrink-0 ${
                  isMasterKey ? 'bg-amber-600' : 'bg-[#659287]'
                }`}
              >
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold leading-none text-[#1A332C] max-w-[120px] truncate">
                  {currentUser.fullName || currentUser.username}
                </p>
                <span
                  className={`text-[10px] font-semibold capitalize ${
                    isMasterKey ? 'text-amber-700 font-bold' : 'text-[#659287]'
                  }`}
                >
                  {isMasterKey ? '🔑 Master Key' : '👤 Normal User'}
                </span>
              </div>
            </div>
          )}

          {/* Logout Button: ALWAYS VISIBLE, NEVER CUT OFF */}
          <button
            id="nav-logout-btn"
            onClick={logout}
            title="Sign out of current mess account"
            aria-label="Log out"
            className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 h-8 sm:h-9 px-2 sm:px-2.5 text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 select-none"
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">Logout</span>
          </button>
        </div>
      </div>

      {/* Lock banner if current month is locked or archived */}
      {isLockedOrArchived && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-center text-xs font-medium text-amber-800 flex items-center justify-center gap-2">
          <Lock className="h-3.5 w-3.5" />
          <span>
            This month ({activeMonth?.name} {activeMonth?.year}) is {activeMonth?.status}. Edits are restricted. You can view balances and generate reports.
          </span>
          {isMasterKey ? (
            <button
              onClick={() => onSelectScreen('settings')}
              className="underline font-bold hover:text-amber-900"
            >
              Manage in Settings
            </button>
          ) : (
            <span className="text-[11px] text-amber-700 italic">
              (Contact Mess Manager for adjustments)
            </span>
          )}
        </div>
      )}
    </header>
  );
};
