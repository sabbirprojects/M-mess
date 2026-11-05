import React, { useState } from 'react';
import { KeyRound, ShieldAlert, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface MasterKeyGateProps {
  onUnlockSuccess: () => void;
  onCancel: () => void;
}

export const MasterKeyGate: React.FC<MasterKeyGateProps> = ({
  onUnlockSuccess,
  onCancel,
}) => {
  const { unlockMasterAccess } = useApp();
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = masterKeyInput.trim();
    if (!trimmed) {
      setError('Please enter the Master Key to continue.');
      return;
    }

    const ok = unlockMasterAccess(trimmed);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        onUnlockSuccess();
      }, 400);
    } else {
      setError('Invalid Master Key. Access is restricted to master administrators.');
    }
  };

  return (
    <div className="mx-auto max-w-md my-8 p-6 sm:p-8 bg-white rounded-2xl border border-amber-200/80 shadow-xl text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4 ring-8 ring-amber-50">
        <KeyRound className="h-7 w-7" />
      </div>

      <h2 className="text-xl font-black text-gray-900 tracking-tight">
        Master Key Required
      </h2>
      <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
        System Settings is restricted to <strong>Master Key</strong> holders only. Normal users cannot view or modify meal rates, system configurations, or cloud backups.
      </p>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 text-left">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 text-left">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Master Key verified! Opening Settings...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Enter Master Key
          </label>
          <div className="relative">
            <input
              id="master-key-input"
              type={showKey ? 'text' : 'password'}
              value={masterKeyInput}
              onChange={e => {
                setMasterKeyInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter Master Password / Key"
              autoFocus
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 pr-10 text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
            />
            <button
              type="button"
              id="toggle-master-key-visibility"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="submit"
            id="btn-unlock-master-settings"
            className="w-full sm:flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Unlock Settings
          </button>
          <button
            type="button"
            id="btn-cancel-master-gate"
            onClick={onCancel}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </form>
    </div>
  );
};
