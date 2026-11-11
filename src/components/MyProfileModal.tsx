import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Phone,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  UtensilsCrossed,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber } from '../utils/calculations';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    currentUserMember,
    isMasterKey,
    isManager,
    isMemberOnly,
    updateMyProfile,
    monthSummary,
  } = useApp();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || currentUserMember?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || currentUserMember?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen || !currentUser) return null;

  // Personal statistics if linked to a member
  const memberCalc = currentUserMember
    ? monthSummary.memberCalculations.find(c => c.memberId === currentUserMember.id)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!fullName.trim()) {
      setFeedback({ type: 'error', message: 'Display name cannot be empty.' });
      return;
    }

    if (isChangingPassword) {
      if (!currentPassword) {
        setFeedback({ type: 'error', message: 'Please enter your current password.' });
        return;
      }
      if (newPassword.length < 4) {
        setFeedback({ type: 'error', message: 'New password must be at least 4 characters long.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setFeedback({ type: 'error', message: 'New passwords do not match.' });
        return;
      }
    }

    setIsSaving(true);
    const res = await updateMyProfile({
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      currentPassword: isChangingPassword ? currentPassword : undefined,
      newPassword: isChangingPassword ? newPassword : undefined,
    });
    setIsSaving(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Your personal information was updated successfully!',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update profile.' });
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white font-bold text-sm shadow-xs ${
                isMasterKey ? 'bg-amber-600' : isManager ? 'bg-[#659287]' : 'bg-[#456c63]'
              }`}
            >
              {(fullName || currentUser.username).substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#1A332C] leading-tight">
                My Profile
              </h2>
              <p className="text-xs text-gray-500">
                Manage your credentials and personal contact details
              </p>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Account Info Pill */}
        <div className="flex flex-wrap items-center justify-between rounded-2xl border border-gray-200/80 bg-[#E6F2DD]/30 p-3.5 gap-2 text-xs">
          <div>
            <span className="text-[11px] text-gray-500 block">Username:</span>
            <span className="font-mono font-bold text-[#1A332C]">@{currentUser.username}</span>
          </div>

          <div>
            <span className="text-[11px] text-gray-500 block">Role:</span>
            {isMasterKey ? (
              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 border border-amber-200 rounded-md px-2 py-0.5 text-[10px]">
                <ShieldCheck className="h-3 w-3 text-amber-600" />
                🔑 Master Key
              </span>
            ) : isManager ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 rounded-md px-2 py-0.5 text-[10px]">
                🛡️ Manager
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-[#456c63] bg-[#E6F2DD] border border-[#B1D3B9] rounded-md px-2 py-0.5 text-[10px]">
                👤 Mess Member
              </span>
            )}
          </div>

          {currentUserMember && (
            <div>
              <span className="text-[11px] text-gray-500 block">Linked Member:</span>
              <span className="font-bold text-[#659287]">{currentUserMember.name}</span>
            </div>
          )}
        </div>

        {/* Financial & Meals Quick Summary for Members */}
        {memberCalc && (
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#B1D3B9]/60 bg-white p-3 text-center shadow-2xs">
            <div className="p-1.5 rounded-xl bg-gray-50">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Meals</span>
              <span className="text-sm font-extrabold text-[#1A332C] flex items-center justify-center gap-1">
                <UtensilsCrossed className="h-3 w-3 text-[#659287]" />
                {formatNumber(memberCalc.totalMeals, 1)}
              </span>
            </div>
            <div className="p-1.5 rounded-xl bg-gray-50">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Deposit</span>
              <span className="text-sm font-extrabold text-emerald-700 flex items-center justify-center gap-1">
                <CreditCard className="h-3 w-3 text-emerald-600" />
                {formatCurrency(memberCalc.totalDeposit)}
              </span>
            </div>
            <div className="p-1.5 rounded-xl bg-gray-50">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Current Balance</span>
              <span
                className={`text-sm font-extrabold ${
                  memberCalc.finalBalance > 0
                    ? 'text-emerald-700'
                    : memberCalc.finalBalance < 0
                    ? 'text-red-600'
                    : 'text-gray-700'
                }`}
              >
                {formatCurrency(memberCalc.finalBalance)}
              </span>
            </div>
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`rounded-xl border p-3 text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Edit Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Display Name *
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                id="profile-fullname-input"
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Tanvir Ahmed"
                className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs font-medium text-[#1A332C] focus:border-[#659287] focus:outline-none focus:ring-1 focus:ring-[#88BDA4]"
              />
            </div>
            {isMemberOnly && (
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                This updates your name on the mess meal sheet and reports
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="profile-phone-input"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs font-medium text-[#1A332C] focus:border-[#659287] focus:outline-none focus:ring-1 focus:ring-[#88BDA4]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="profile-email-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs font-medium text-[#1A332C] focus:border-[#659287] focus:outline-none focus:ring-1 focus:ring-[#88BDA4]"
                />
              </div>
            </div>
          </div>

          {/* Change Password Toggle */}
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="flex items-center gap-2 text-xs font-bold text-[#659287] hover:text-[#456c63] transition-colors cursor-pointer select-none"
            >
              <KeyRound className="h-4 w-4" />
              <span>{isChangingPassword ? 'Cancel Password Change' : 'Change Password'}</span>
            </button>
          </div>

          {/* Password Fields */}
          {isChangingPassword && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5 space-y-3 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Current Password *
                </label>
                <input
                  id="profile-current-pass-input"
                  type="password"
                  required={isChangingPassword}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-[#1A332C] focus:border-[#659287] focus:outline-none focus:ring-1 focus:ring-[#88BDA4]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    New Password *
                  </label>
                  <input
                    id="profile-new-pass-input"
                    type="password"
                    required={isChangingPassword}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-[#1A332C] focus:border-[#659287] focus:outline-none focus:ring-1 focus:ring-[#88BDA4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    id="profile-confirm-pass-input"
                    type="password"
                    required={isChangingPassword}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-[#1A332C] focus:border-[#659287] focus:outline-none focus:ring-1 focus:ring-[#88BDA4]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="save-my-profile-btn"
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#659287] hover:bg-[#52776e] text-white px-5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
