import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Plus,
  AlertTriangle,
  X,
  CreditCard,
  Phone,
  Mail,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
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
    deleteDeposit,
    monthSummary,
    isLockedOrArchived,
  } = useApp();

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
      <div className="p-8 text-center text-gray-500">
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
            Manage mess members for <span className="font-bold text-[#659287]">{activeMonth.name} {activeMonth.year}</span>, set initial deposits, and track balances.
          </p>
        </div>

        {!isLockedOrArchived && (
          <button
            id="members-add-btn"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-[#659287] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#659287]/20 hover:bg-[#52776e] transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Member List Table */}
      <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#E6F2DD]/30 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                <th className="px-6 py-4">Member Name</th>
                <th className="px-6 py-4 text-right">Initial Deposit</th>
                <th className="px-6 py-4 text-right">Previous Balance</th>
                <th className="px-6 py-4 text-right">Additional Deposits</th>
                <th className="px-6 py-4 text-center">Status & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {currentMonthMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No members added for this month yet. Click "Add Member" to begin.
                  </td>
                </tr>
              ) : (
                currentMonthMembers.map(member => {
                  const calc = monthSummary.memberCalculations.find(c => c.memberId === member.id);
                  const status = calc ? calc.status : 'Settled';
                  const addDeposits = calc ? calc.additionalDeposits : 0;

                  return (
                    <tr key={member.id} className="hover:bg-[#E6F2DD]/15 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6F2DD] text-[#659287] font-bold">
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#1A332C]">{member.name}</div>
                            {(member.phone || member.email) && (
                              <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
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

                      <td className="px-6 py-4 text-right font-mono font-semibold text-gray-800">
                        {formatCurrency(member.initialDeposit)}
                      </td>

                      <td className="px-6 py-4 text-right font-mono font-semibold">
                        <span
                          className={
                            member.previousBalance > 0
                              ? 'text-emerald-700'
                              : member.previousBalance < 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }
                        >
                          {formatCurrency(member.previousBalance)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-mono font-medium text-gray-700">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{formatCurrency(addDeposits)}</span>
                          {!isLockedOrArchived && (
                            <button
                              id={`add-deposit-btn-${member.id}`}
                              onClick={() => {
                                setDepositModalMember(member);
                                setDepositAmount('');
                                setDepositNote('');
                              }}
                              title="Add new deposit"
                              className="rounded-lg p-1 text-[#659287] hover:bg-[#E6F2DD] transition-colors cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Unified Status & Actions Premium Cell */}
                      <td className="px-6 py-4 text-center">
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
                              <CheckCircle className="h-3 w-3 text-gray-500" />
                              Settled
                            </span>
                          )}

                          <div className="h-4 w-px bg-gray-200" />

                          {!isLockedOrArchived ? (
                            <div className="flex items-center gap-0.5">
                              <button
                                id={`edit-member-${member.id}`}
                                onClick={() => handleOpenEditModal(member)}
                                title="Edit Member"
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-[#659287] hover:shadow-2xs transition-all cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                id={`delete-member-${member.id}`}
                                onClick={() => setDeletingMember(member)}
                                title="Delete Member"
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:shadow-2xs transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic px-1.5">Locked</span>
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
      {(isAddModalOpen || editingMember) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#1A332C]">
                {editingMember ? 'Edit Member Details' : 'Add New Member'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMember(null);
                }}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  id="member-form-name"
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Shakil Hossain"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Initial Deposit (৳)
                  </label>
                  <input
                    id="member-form-initial-deposit"
                    type="number"
                    step="any"
                    value={formInitialDeposit}
                    onChange={e => setFormInitialDeposit(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Previous Balance (৳)
                  </label>
                  <input
                    id="member-form-prev-balance"
                    type="number"
                    step="any"
                    value={formPreviousBalance}
                    onChange={e => setFormPreviousBalance(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Carry forward (+ surplus, - deficit)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    id="member-form-phone"
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="+880 17..."
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email (Optional)
                  </label>
                  <input
                    id="member-form-email"
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingMember(null);
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  id="member-form-submit-btn"
                  type="submit"
                  className="rounded-xl bg-[#659287] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#52776e] shadow-xs"
                >
                  {editingMember ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1A332C]">
                Confirm Member Removal
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to remove <span className="font-bold text-[#1A332C]">{deletingMember.name}</span> from this month?
            </p>
            <p className="text-xs text-red-600 mt-2">
              This will also remove their recorded meals and deposits for this month. Confirmation required before deletion.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeletingMember(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-member-btn"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
              >
                Yes, Delete Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Additional Deposit Modal */}
      {depositModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-[#1A332C]">
                  Add Deposit
                </h3>
                <p className="text-xs text-gray-500">
                  For {depositModalMember.name} ({activeMonth.name} {activeMonth.year})
                </p>
              </div>
              <button
                onClick={() => setDepositModalMember(null)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeposit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Deposit Amount (৳) *
                </label>
                <input
                  id="deposit-amount-input"
                  type="number"
                  step="any"
                  required
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Date *
                </label>
                <input
                  id="deposit-date-input"
                  type="date"
                  required
                  value={depositDate}
                  onChange={e => setDepositDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Note / Reference (Optional)
                </label>
                <input
                  id="deposit-note-input"
                  type="text"
                  value={depositNote}
                  onChange={e => setDepositNote(e.target.value)}
                  placeholder="e.g. bKash TrxID, Cash, Bank Transfer"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositModalMember(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  id="save-deposit-btn"
                  type="submit"
                  className="rounded-xl bg-[#659287] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#52776e] shadow-xs"
                >
                  Save Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
