import React, { useState } from 'react';
import {
  UserPlus,
  Edit2,
  Trash2,
  Plus,
  AlertTriangle,
  Phone,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../utils/calculations';
import { Member } from '../types';

export const MembersScreen: React.FC = () => {
  const {
    activeMonth,
    state,
    addMember,
    editMember,
    deleteMember,
    addDeposit,
    monthSummary,
    isLockedOrArchived,
    currentUser,
    currentUserMember,
    isMemberOnly,
  } = useApp();

  const myMemberId = currentUser?.memberId || currentUserMember?.id;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [depositModalMember, setDepositModalMember] = useState<Member | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState('');
  const [formInitialDeposit, setFormInitialDeposit] = useState('0');
  const [formPreviousBalance, setFormPreviousBalance] = useState('0');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');

  // Form states for Add Deposit
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositNote, setDepositNote] = useState('');

  const currentMonthMembers = activeMonth
    ? state.members.filter(m => m.monthId === activeMonth.id)
    : [];

  const handleOpenAddModal = () => {
    setFormName('');
    setFormInitialDeposit('0');
    setFormPreviousBalance('0');
    setFormEmail('');
    setFormPhone('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormInitialDeposit(member.initialDeposit.toString());
    setFormPreviousBalance(member.previousBalance.toString());
    setFormEmail(member.email || '');
    setFormPhone(member.phone || '');
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const initDep = parseFloat(formInitialDeposit) || 0;
    const prevBal = parseFloat(formPreviousBalance) || 0;

    if (editingMember) {
      editMember(
        editingMember.id,
        formName,
        initDep,
        prevBal,
        formEmail,
        formPhone
      );
      setEditingMember(null);
    } else {
      addMember(
        formName,
        initDep,
        prevBal,
        formEmail,
        formPhone
      );
      setIsAddModalOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingMember) {
      deleteMember(deletingMember.id);
      setDeletingMember(null);
    }
  };

  const handleSaveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModalMember) return;
    const amt = parseFloat(depositAmount);
    if (!amt || isNaN(amt)) return;

    addDeposit(depositModalMember.id, amt, depositDate, depositNote);
    setDepositAmount('');
    setDepositNote('');
    setDepositModalMember(null);
  };

  if (!activeMonth) {
    return (
      <div className="p-8 text-center text-gray-600">
        No active month selected. Please select a month in Settings.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1A332C]">
            Member Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            Manage mess members for <span className="font-bold text-[#456C63]">{activeMonth.name} {activeMonth.year}</span>, set initial deposits, and track balances.
          </p>
        </div>

        {!isLockedOrArchived && !isMemberOnly && (
          <button
            id="members-add-btn"
            onClick={handleOpenAddModal}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-[#456C63] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#456C63]/20 hover:bg-[#38564f] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#456C63] focus-visible:ring-offset-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Member List Table */}
      <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#E6F2DD]/30 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                <th className="px-3 sm:px-6 py-4">Member Name</th>
                <th className="px-3 sm:px-6 py-4 text-right">Initial Deposit</th>
                <th className="px-3 sm:px-6 py-4 text-right">Previous Balance</th>
                <th className="px-3 sm:px-6 py-4 text-right">Additional Deposits</th>
                <th className="px-3 sm:px-6 py-4 text-center">Status & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {currentMonthMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-12 text-center text-gray-600">
                    No members added for this month yet. Click "Add Member" to begin.
                  </td>
                </tr>
              ) : (
                currentMonthMembers.map(member => {
                  const calc = monthSummary.memberCalculations.find(c => c.memberId === member.id);
                  const status = calc ? calc.status : 'Settled';
                  const addDeposits = calc ? calc.additionalDeposits : 0;
                  const isSelf = member.id === myMemberId;

                  return (
                    <tr
                      key={member.id}
                      className={isSelf ? 'bg-[#E6F2DD]/25 hover:bg-[#E6F2DD]/40 transition-colors' : 'hover:bg-[#E6F2DD]/15 transition-colors'}
                    >
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold ${
                              isSelf ? 'bg-[#456C63] text-white shadow-xs' : 'bg-[#E6F2DD] text-[#456C63]'
                            }`}
                          >
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#1A332C] flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {isSelf && (
                                <span className="rounded-md bg-[#456C63] text-white px-1.5 py-0.5 text-[10px] font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            {(member.phone || member.email) && (
                              <div className="flex items-center gap-2 text-[10px] text-gray-600 mt-0.5">
                                {member.phone && (
                                  <span className="flex items-center gap-0.5">
                                    <Phone className="h-2.5 w-2.5" />
                                    {member.phone}
                                  </span>
                                )}
                                {member.email && (
                                  <span className="flex items-center gap-0.5">
                                    <Mail className="h-2.5 w-2.5" />
                                    {member.email}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 sm:px-6 py-4 text-right font-mono tabular-nums font-semibold text-gray-800">
                        {formatCurrency(member.initialDeposit)}
                      </td>

                      <td className="px-3 sm:px-6 py-4 text-right font-mono tabular-nums font-semibold">
                        <span
                          className={
                            member.previousBalance > 0
                              ? 'text-emerald-700'
                              : member.previousBalance < 0
                              ? 'text-[#B91C1C]'
                              : 'text-gray-600'
                          }
                        >
                          {formatCurrency(member.previousBalance)}
                        </span>
                      </td>

                      <td className="px-3 sm:px-6 py-4 text-right font-mono tabular-nums font-medium text-gray-700">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{formatCurrency(addDeposits)}</span>
                          {!isLockedOrArchived && !isMemberOnly && (
                            <button
                              id={`add-deposit-btn-${member.id}`}
                              onClick={() => {
                                setDepositModalMember(member);
                                setDepositAmount('');
                                setDepositNote('');
                              }}
                              aria-label={`Add deposit for ${member.name}`}
                              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#456C63] hover:bg-[#E6F2DD] transition-colors cursor-pointer sm:h-7 sm:w-7"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Unified Status & Actions Premium Cell */}
                      <td className="px-3 sm:px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-gray-50/90 border border-gray-200/70 p-1.5 shadow-2xs">
                          {status === 'Receivable' && (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                              <ArrowUpRight className="h-3 w-3 text-emerald-700" />
                              Receivable
                            </span>
                          )}
                          {status === 'Payable' && (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800 border border-red-200">
                              <ArrowDownRight className="h-3 w-3 text-red-700" />
                              Payable
                            </span>
                          )}
                          {status === 'Settled' && (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-gray-200/70 px-2.5 py-1 text-xs font-bold text-gray-700 border border-gray-300/70">
                              <CheckCircle className="h-3 w-3 text-gray-600" />
                              Settled
                            </span>
                          )}

                          <div className="h-4 w-px bg-gray-200" />

                          {!isLockedOrArchived ? (
                            !isMemberOnly ? (
                              <div className="flex items-center gap-0.5">
                                <button
                                  id={`edit-member-${member.id}`}
                                  onClick={() => handleOpenEditModal(member)}
                                  title="Edit Member"
                                  aria-label={`Edit ${member.name}`}
                                  className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-white hover:text-[#456C63] hover:shadow-2xs transition-all cursor-pointer sm:h-8 sm:w-8"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  id={`delete-member-${member.id}`}
                                  onClick={() => setDeletingMember(member)}
                                  title="Delete Member"
                                  aria-label={`Delete ${member.name}`}
                                  className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-[#B91C1C] hover:shadow-2xs transition-all cursor-pointer sm:h-8 sm:w-8"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : isSelf ? (
                              <button
                                id={`edit-member-${member.id}`}
                                onClick={() => handleOpenEditModal(member)}
                                title="Edit My Info"
                                className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[#456C63] bg-white hover:bg-[#E6F2DD] shadow-2xs transition-all cursor-pointer sm:min-h-8"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Edit My Info</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-600 italic px-1 select-none">
                                View only
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-gray-600 italic px-1.5">Locked</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={isAddModalOpen || Boolean(editingMember)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMember(null);
        }}
        title={editingMember ? 'Edit Member Details' : 'Add New Member'}
        size="md"
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          <div>
            <label
              htmlFor="member-form-name"
              className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
            >
              Full Name *
            </label>
            <input
              id="member-form-name"
              type="text"
              required
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g. Shakil Hossain"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#456C63] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
            />
          </div>

          {!isMemberOnly && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="member-form-initial-deposit"
                  className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
                >
                  Initial Deposit (৳)
                </label>
                <input
                  id="member-form-initial-deposit"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={formInitialDeposit}
                  onChange={e => setFormInitialDeposit(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono tabular-nums focus:border-[#456C63] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                />
              </div>

              <div>
                <label
                  htmlFor="member-form-prev-balance"
                  className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
                >
                  Previous Balance (৳)
                </label>
                <input
                  id="member-form-prev-balance"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={formPreviousBalance}
                  onChange={e => setFormPreviousBalance(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono tabular-nums focus:border-[#456C63] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                />
                <p className="text-[11px] text-gray-600 mt-1">Carry forward (+ surplus, - deficit)</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="member-form-phone"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
              >
                Phone (Optional)
              </label>
              <input
                id="member-form-phone"
                type="tel"
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                placeholder="+880 17..."
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#456C63] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
              />
            </div>

            <div>
              <label
                htmlFor="member-form-email"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
              >
                Email (Optional)
              </label>
              <input
                id="member-form-email"
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#456C63] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingMember(null);
              }}
              className="min-h-11 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              id="member-form-submit-btn"
              type="submit"
              className="min-h-11 rounded-xl bg-[#456C63] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#38564f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#456C63] focus-visible:ring-offset-2 shadow-xs"
            >
              {editingMember ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Member Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingMember)}
        onClose={() => setDeletingMember(null)}
        title="Confirm Member Removal"
        size="md"
        icon={
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-[#B91C1C]">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
        }
        footer={
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setDeletingMember(null)}
              className="min-h-11 rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-member-btn"
              type="button"
              onClick={handleConfirmDelete}
              className="min-h-11 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
            >
              Yes, Delete Member
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-700">
          Are you sure you want to remove{' '}
          <span className="font-bold text-[#1A332C]">{deletingMember?.name}</span> from this month?
        </p>
        <p className="mt-2 text-xs text-[#B91C1C]">
          This will also remove their recorded meals and deposits for this month. Confirmation required before deletion.
        </p>
      </Modal>

      {/* Add Additional Deposit Modal */}
      <Modal
        isOpen={Boolean(depositModalMember)}
        onClose={() => setDepositModalMember(null)}
        title="Add Deposit"
        description={
          depositModalMember && activeMonth
            ? `For ${depositModalMember.name} (${activeMonth.name} ${activeMonth.year})`
            : undefined
        }
        size="md"
      >
        <form onSubmit={handleSaveDeposit} className="space-y-4">
          <div>
            <label
              htmlFor="deposit-amount-input"
              className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
            >
              Deposit Amount (৳) *
            </label>
            <input
              id="deposit-amount-input"
              type="number"
              step="any"
              inputMode="decimal"
              required
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              placeholder="e.g. 2000"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono tabular-nums focus:border-[#456C63] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
            />
          </div>

          <div>
            <label
              htmlFor="deposit-date-input"
              className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
            >
              Date *
            </label>
            <input
              id="deposit-date-input"
              type="date"
              required
              value={depositDate}
              onChange={e => setDepositDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#456C63] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
            />
          </div>

          <div>
            <label
              htmlFor="deposit-note-input"
              className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
            >
              Note / Reference (Optional)
            </label>
            <input
              id="deposit-note-input"
              type="text"
              value={depositNote}
              onChange={e => setDepositNote(e.target.value)}
              placeholder="e.g. bKash TrxID, Cash, Bank Transfer"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#456C63] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
            />
          </div>

          <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setDepositModalMember(null)}
              className="min-h-11 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              id="save-deposit-btn"
              type="submit"
              className="min-h-11 rounded-xl bg-[#456C63] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#38564f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#456C63] focus-visible:ring-offset-2 shadow-xs"
            >
              Save Deposit
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
