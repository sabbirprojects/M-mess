import React, { useRef, useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
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
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/calculations';

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
    a.download = `Smart_Meal_Manager_Backup_${new Date().toISOString().split('T')[0]}.json`;
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#659287]">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A332C]">
                Month Management
              </h2>
              <p className="text-xs text-gray-500">
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
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Month Name *
                </label>
                <select
                  id="settings-new-month-name"
                  value={newMonthName}
                  onChange={e => setNewMonthName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-[#1A332C] focus:border-[#659287] focus:outline-none"
                >
                  <option value="">Select month</option>
                  {monthsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Year *
                </label>
                <input
                  id="settings-new-month-year"
                  type="number"
                  value={newMonthYear}
                  onChange={e => setNewMonthYear(parseInt(e.target.value) || 2026)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-[#1A332C] focus:border-[#659287] focus:outline-none"
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              Tip: Creating a new month automatically carries forward the previous month's final balances!
            </p>

            <button
              id="settings-create-month-btn"
              type="submit"
              disabled={!newMonthName}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#659287] px-4 py-2 text-xs font-bold text-white hover:bg-[#52776e] disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Month</span>
            </button>
          </form>

          {/* Month Status & Controls for All Months */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Existing Months & Status
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
                        <span className="rounded-md bg-[#659287] text-white px-1.5 py-0.2 text-[10px]">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 capitalize">
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#659287]">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A332C]">
                Meal Rate Rules
              </h2>
              <p className="text-xs text-gray-500">
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Calculation Mode
              </label>
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
                      className="text-[#659287]"
                    />
                  </div>
                  <span className="text-[11px] text-gray-500">
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
                      className="text-[#659287]"
                    />
                  </div>
                  <span className="text-[11px] text-gray-500">
                    Manually set rate per meal
                  </span>
                </label>
              </div>
            </div>

            {rateMode === 'fixed' && (
              <div className="animate-in fade-in">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Fixed Rate Amount (৳ per meal) *
                </label>
                <input
                  id="settings-fixed-meal-rate-input"
                  type="number"
                  step="any"
                  value={fixedRateValue}
                  onChange={e => setFixedRateValue(e.target.value)}
                  placeholder="e.g. 65"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                />
              </div>
            )}

            <button
              id="settings-save-rate-config-btn"
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#659287] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#52776e] shadow-xs transition-colors"
            >
              <span>Save Meal Rate Rule</span>
            </button>
          </form>
        </div>

        {/* Module 3: Account Credentials & Security */}
        <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#659287]">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A332C]">
                Account & Security
              </h2>
              <p className="text-xs text-gray-500">
                Manage your login username, name, and security password
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
              <span className="font-mono text-xs font-extrabold bg-white px-2 py-0.5 rounded-md border border-gray-200 text-[#1A332C]">
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

          {/* System Role Assignments */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Configured Roles & Accounts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                    Master Key Role
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                    Full Control
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-800">Sabbir Programmer</div>
                <div className="text-[11px] font-mono text-gray-500">username: sabbirprogrammer</div>
                <div className="text-[11px] text-gray-500">Has administrative settings, system controls & rate management.</div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-gray-600" />
                    Normal User Role
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                    Standard
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-800">Manager</div>
                <div className="text-[11px] font-mono text-gray-500">username: manager</div>
                <div className="text-[11px] text-gray-500">Daily meals, bazaars, deposits, and reports. Settings protected.</div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 italic">
              All other user accounts have been deleted from the system.
            </p>
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
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              {passMsg.text}
            </div>
          )}

          {/* Update Account & Password Form */}
          <form onSubmit={handleUpdateAccount} className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Login Username *
                </label>
                <input
                  id="settings-username-input"
                  type="text"
                  required
                  value={accountUsername}
                  onChange={e => setAccountUsername(e.target.value)}
                  placeholder="e.g. sabbirprogrammer"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-[#659287] focus:outline-none bg-gray-50/50 hover:bg-white focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Manager Full Name
                </label>
                <input
                  id="settings-fullname-input"
                  type="text"
                  value={accountFullName}
                  onChange={e => setAccountFullName(e.target.value)}
                  placeholder="e.g. Mess Manager"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-[#659287] focus:outline-none bg-gray-50/50 hover:bg-white focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  New Password <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="settings-new-password-input"
                  type="password"
                  value={accountNewPass}
                  onChange={e => setAccountNewPass(e.target.value)}
                  placeholder="Leave empty to keep current"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-[#659287] focus:outline-none bg-gray-50/50 hover:bg-white focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="settings-confirm-password-input"
                  type="password"
                  value={accountConfirmPass}
                  onChange={e => setAccountConfirmPass(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-[#659287] focus:outline-none bg-gray-50/50 hover:bg-white focus:bg-white"
                />
              </div>
            </div>

            <button
              id="settings-update-account-btn"
              type="submit"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#659287] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#52776e] transition-colors shadow-xs cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Save Account & Password</span>
            </button>
          </form>

          <p className="text-[11px] text-gray-400">
            Updated credentials take effect immediately and are saved across all sessions.
          </p>
        </div>

        {/* Module 4: Backup & Restore */}
        <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#659287]">
              <FileJson className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A332C]">
                Backup & Restore
              </h2>
              <p className="text-xs text-gray-500">
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
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
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
              <span className="text-[10px] text-gray-500">Months</span>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-2 text-center">
              <span className="block text-xs font-bold text-gray-800">{(state.members || []).length}</span>
              <span className="text-[10px] text-gray-500">Members</span>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-2 text-center">
              <span className="block text-xs font-bold text-gray-800">{(state.meals || []).length}</span>
              <span className="text-[10px] text-gray-500">Meal Entries</span>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-2 text-center">
              <span className="block text-xs font-bold text-gray-800">{(state.bazaarExpenses || []).length + (state.universalExpenses || []).length}</span>
              <span className="text-[10px] text-gray-500">Expenses</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              id="settings-export-backup-btn"
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#659287] bg-white px-4 py-3 text-xs font-bold text-[#659287] hover:bg-[#E6F2DD] transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export Backup JSON</span>
            </button>

            <button
              id="settings-import-backup-btn"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#659287] px-4 py-3 text-xs font-bold text-white hover:bg-[#52776e] transition-colors"
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
              <p className="text-[10px] text-gray-400">Clear all members, meals, deposits, and expenses</p>
            </div>
            <button
              id="settings-reset-demo-btn"
              onClick={() => setShowResetConfirmModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#659287]">
                <Cloud className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1A332C]">
                  Real-Time Cloud Persistence & Cross-Device Sync
                </h2>
                <p className="text-xs text-gray-500">
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
                {syncStatus === 'error' && <AlertCircle className="h-3.5 w-3.5 text-red-600" />}
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
                <RefreshCw className="h-3.5 w-3.5 text-[#659287]" />
                <span>Sync Now</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cloud Engine</div>
              <div className="text-xs font-semibold text-[#1A332C] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Google Cloud Firestore
              </div>
              <div className="text-[10px] text-gray-400 font-mono truncate">ID: elaborate-box-72ts5</div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last Sync Time</div>
              <div className="text-xs font-semibold text-[#1A332C]">
                {lastSyncedAt ? `${lastSyncedAt}` : 'Just now'}
              </div>
              <div className="text-[10px] text-gray-400">Automatic real-time stream active</div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Multi-Device Coverage</div>
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Real-Time Synchronized
              </div>
              <div className="text-[10px] text-gray-400">Zero data loss on cache clear or device change</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#B1D3B9]/80 bg-[#E6F2DD]/30 p-3.5 text-xs text-gray-700 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[#659287] shrink-0 mt-0.5" />
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
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mx-auto">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900">
                Clear All Mess Records?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                This will permanently delete all members, daily meals, bazaar expenses, universal bills, and deposit records for a clean slate. Your manager credentials will remain safe.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
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
                className="rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm cursor-pointer"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Log Module (Full Width) */}
      <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#659287]">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A332C]">
                Audit History
              </h2>
              <p className="text-xs text-gray-500">
                Immutable activity log recording who created or updated records
              </p>
            </div>
          </div>

          {/* Filter Input */}
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="audit-search-input"
              type="text"
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              placeholder="Search user, action, target..."
              className="w-full rounded-xl border border-gray-200 pl-8 pr-3 py-1.5 text-xs focus:border-[#659287] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left border-collapse">
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
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
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
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400 whitespace-nowrap">
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
