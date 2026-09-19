import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Layers,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Users,
  AlertTriangle,
  X,
  TrendingUp,
  Info,
  CheckSquare,
  Square,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/calculations';
import { BazaarExpense, UniversalExpense } from '../types';

interface ExpensesScreenProps {
  initialTab?: 'bazaar' | 'universal';
  onTabChange?: (tab: 'bazaar' | 'universal') => void;
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  initialTab = 'bazaar',
  onTabChange,
}) => {
  const {
    activeMonth,
    state,
    addBazaarExpense,
    editBazaarExpense,
    deleteBazaarExpense,
    addUniversalExpense,
    editUniversalExpense,
    deleteUniversalExpense,
    monthSummary,
    isLockedOrArchived,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'bazaar' | 'universal'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSwitch = (tab: 'bazaar' | 'universal') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Modals state
  const [isBazaarModalOpen, setIsBazaarModalOpen] = useState(false);
  const [editingBazaar, setEditingBazaar] = useState<BazaarExpense | null>(null);
  const [deletingBazaar, setDeletingBazaar] = useState<BazaarExpense | null>(null);

  const [isUniversalModalOpen, setIsUniversalModalOpen] = useState(false);
  const [editingUniversal, setEditingUniversal] = useState<UniversalExpense | null>(null);
  const [deletingUniversal, setDeletingUniversal] = useState<UniversalExpense | null>(null);

  // Form Bazaar fields
  const [bazaarDate, setBazaarDate] = useState(new Date().toISOString().split('T')[0]);
  const [bazaarDesc, setBazaarDesc] = useState('');
  const [bazaarAmount, setBazaarAmount] = useState('');
  const [bazaarPaidBy, setBazaarPaidBy] = useState('');

  // Form Universal fields
  const [uniDate, setUniDate] = useState(new Date().toISOString().split('T')[0]);
  const [uniDesc, setUniDesc] = useState('');
  const [uniAmount, setUniAmount] = useState('');
  const [uniPaidBy, setUniPaidBy] = useState('');
  const [uniApplicableMembers, setUniApplicableMembers] = useState<string[]>([]);

  if (!activeMonth) {
    return <div className="p-8 text-center text-gray-500">No active month selected.</div>;
  }

  const monthMembers = state.members.filter(m => m.monthId === activeMonth.id);
  const monthBazaarExpenses = state.bazaarExpenses.filter(b => b.monthId === activeMonth.id);
  const monthUniversalExpenses = state.universalExpenses.filter(u => u.monthId === activeMonth.id);

  // Bazaar Handlers
  const handleOpenAddBazaar = () => {
    setEditingBazaar(null);
    setBazaarDate(new Date().toISOString().split('T')[0]);
    setBazaarDesc('');
    setBazaarAmount('');
    setBazaarPaidBy(monthMembers[0]?.id || 'shared_fund');
    setIsBazaarModalOpen(true);
  };

  const handleOpenEditBazaar = (exp: BazaarExpense) => {
    setEditingBazaar(exp);
    setBazaarDate(exp.date);
    setBazaarDesc(exp.description);
    setBazaarAmount(exp.amount.toString());
    setBazaarPaidBy(exp.paidById);
    setIsBazaarModalOpen(true);
  };

  const handleSaveBazaar = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(bazaarAmount);
    if (isNaN(amt) || !bazaarDesc.trim()) return;

    if (editingBazaar) {
      editBazaarExpense(editingBazaar.id, bazaarDate, bazaarDesc, amt, bazaarPaidBy);
    } else {
      addBazaarExpense(bazaarDate, bazaarDesc, amt, bazaarPaidBy);
    }
    setIsBazaarModalOpen(false);
  };

  // Universal Handlers
  const handleOpenAddUniversal = () => {
    setEditingUniversal(null);
    setUniDate(new Date().toISOString().split('T')[0]);
    setUniDesc('');
    setUniAmount('');
    setUniPaidBy(monthMembers[0]?.id || '');
    setUniApplicableMembers(monthMembers.map(m => m.id)); // default all selected
    setIsUniversalModalOpen(true);
  };

  const handleOpenEditUniversal = (exp: UniversalExpense) => {
    setEditingUniversal(exp);
    setUniDate(exp.date);
    setUniDesc(exp.description);
    setUniAmount(exp.amount.toString());
    setUniPaidBy(exp.paidById);
    setUniApplicableMembers(exp.applicableMemberIds || []);
    setIsUniversalModalOpen(true);
  };

  const handleToggleMemberApplicable = (id: string) => {
    setUniApplicableMembers(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleSelectAllMembers = () => {
    setUniApplicableMembers(monthMembers.map(m => m.id));
  };

  const handleSaveUniversal = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(uniAmount);
    if (isNaN(amt) || !uniDesc.trim() || uniApplicableMembers.length === 0) return;

    if (editingUniversal) {
      editUniversalExpense(editingUniversal.id, uniDate, uniDesc, amt, uniPaidBy, uniApplicableMembers);
    } else {
      addUniversalExpense(uniDate, uniDesc, amt, uniPaidBy, uniApplicableMembers);
    }
    setIsUniversalModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {activeTab === 'universal' ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#659287] text-white shadow-xs">
                <Layers className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#659287] text-white shadow-xs">
                <Receipt className="h-5 w-5" />
              </div>
            )}
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1A332C]">
              {activeTab === 'universal' ? 'Universal Expenses' : 'Bazaar Expenses'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {activeTab === 'universal'
              ? 'Shared fixed bills (WiFi, Cook/Maid, Gas, Rent, Utilities). Does NOT affect meal rate; split equally among selected members.'
              : 'Shared grocery market costs (Rice, Oil, Meat, Fish, Spices). Directly calculates the monthly Meal Rate.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isLockedOrArchived && (
            <>
              {activeTab === 'bazaar' ? (
                <button
                  id="add-bazaar-expense-btn"
                  onClick={handleOpenAddBazaar}
                  className="flex items-center gap-2 rounded-xl bg-[#659287] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#659287]/20 hover:bg-[#52776e] transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Bazaar Expense</span>
                </button>
              ) : (
                <button
                  id="add-universal-expense-btn"
                  onClick={handleOpenAddUniversal}
                  className="flex items-center gap-2 rounded-xl bg-[#659287] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#659287]/20 hover:bg-[#52776e] transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Universal Expense</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#E6F2DD]/60 border border-[#B1D3B9]/60">
        <button
          id="tab-bazaar-expenses"
          onClick={() => handleTabSwitch('bazaar')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'bazaar'
              ? 'bg-[#659287] text-white shadow-md shadow-[#659287]/20'
              : 'text-gray-700 hover:bg-white/80 hover:text-[#1A332C]'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Section A: Bazaar Expenses</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-mono font-bold ${
              activeTab === 'bazaar'
                ? 'bg-white/20 text-white'
                : 'bg-[#E6F2DD] text-[#456c63]'
            }`}
          >
            {formatCurrency(monthSummary.totalBazaarCost)}
          </span>
        </button>

        <button
          id="tab-universal-expenses"
          onClick={() => handleTabSwitch('universal')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'universal'
              ? 'bg-[#659287] text-white shadow-md shadow-[#659287]/20'
              : 'text-gray-700 hover:bg-white/80 hover:text-[#1A332C]'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Section B: Universal Expenses</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-mono font-bold ${
              activeTab === 'universal'
                ? 'bg-white/20 text-white'
                : 'bg-[#E6F2DD] text-[#456c63]'
            }`}
          >
            {formatCurrency(monthSummary.totalUniversalExpenses)}
          </span>
        </button>
      </div>

      {/* Section A: Bazaar Expenses View */}
      {activeTab === 'bazaar' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#E6F2DD]/40 border border-[#B1D3B9]/60 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-[#659287] shrink-0 mt-0.5" />
            <div className="text-xs text-[#1A332C] space-y-1">
              <p className="font-bold">Bazaar Expenses directly determine Meal Rate.</p>
              <p className="text-gray-600">
                Formula: Meal Rate = Total Bazaar Cost ÷ Total Meals. Out-of-pocket spending and market purchases represent real, positive expenses for the mess and are added (+) to the total expenditure, while individual member balances and deposits are adjusted accordingly.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#E6F2DD]/30 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Paid By</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Status & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {monthBazaarExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        No bazaar expenses recorded yet for this month.
                      </td>
                    </tr>
                  ) : (
                    monthBazaarExpenses.map(b => (
                      <tr key={b.id} className="hover:bg-[#E6F2DD]/15 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-600 whitespace-nowrap">
                          {b.date}
                        </td>
                        <td className="px-6 py-4 font-bold text-[#1A332C]">
                          {b.description}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-semibold">
                            <User className="h-3 w-3 text-[#659287]" />
                            {b.paidByName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold whitespace-nowrap">
                          <span className={b.amount < 0 ? 'text-amber-700' : 'text-[#1A332C]'}>
                            {formatCurrency(b.amount)}
                          </span>
                          {b.amount < 0 && (
                            <span className="ml-1 text-[10px] text-amber-600 font-normal block">
                              (Deposit Deduction)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2 rounded-2xl bg-gray-50/90 border border-gray-200/70 p-1.5 shadow-2xs">
                            {b.amount < 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-xl bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200" title="Negative market balance deducted from member deposit">
                                Balance Deduction
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                                Bazaar Expense
                              </span>
                            )}

                            <div className="h-4 w-px bg-gray-200" />

                            {!isLockedOrArchived ? (
                              <div className="flex items-center gap-0.5">
                                <button
                                  id={`edit-bazaar-${b.id}`}
                                  onClick={() => handleOpenEditBazaar(b)}
                                  title="Edit"
                                  className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-[#659287] hover:shadow-2xs transition-all cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  id={`delete-bazaar-${b.id}`}
                                  onClick={() => setDeletingBazaar(b)}
                                  title="Delete"
                                  className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:shadow-2xs transition-all cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs italic px-1.5">Locked</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {monthBazaarExpenses.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/70 font-bold text-xs sm:text-sm text-[#1A332C]">
                      <td colSpan={3} className="px-6 py-3.5">
                        <div className="flex flex-col">
                          <span>
                            Total Market Cost ({monthBazaarExpenses.length} {monthBazaarExpenses.length === 1 ? 'entry' : 'entries'})
                          </span>
                          {monthBazaarExpenses.some(b => b.amount < 0) && (
                            <span className="text-[11px] font-normal text-gray-500 mt-0.5">
                              * Includes out-of-pocket spending added (+) to total expenditure while adjusting individual member balances
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-base text-[#659287]">
                        {formatCurrency(monthSummary.totalBazaarCost)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Section B: Universal Expenses View */}
      {activeTab === 'universal' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#E6F2DD]/60 border-2 border-[#B1D3B9] p-4 flex items-start gap-3 shadow-xs">
            <Info className="h-5 w-5 text-[#659287] shrink-0 mt-0.5" />
            <div className="text-xs text-[#1A332C] space-y-1">
              <p className="font-extrabold text-sm text-[#1A332C]">
                Universal Expense Rule: Full Payment Credited, Equal Shares Deducted
              </p>
              <p className="text-gray-700 leading-relaxed">
                When a member pays for a shared/universal expense (WiFi, Cook/Maid salary, Gas cylinder, House rent, Utilities),{' '}
                <strong className="text-emerald-800 font-bold">the full amount is added to their total balance</strong>, and{' '}
                <strong className="text-red-700 font-bold">equal shares are automatically deducted from every member's account</strong>.{' '}
                Universal expenses do not affect the Meal Rate.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#E6F2DD]/30 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Paid By (Full Credit)</th>
                    <th className="px-6 py-4">Split Deduction</th>
                    <th className="px-6 py-4 text-right">Total Amount</th>
                    <th className="px-6 py-4 text-center">Status & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {monthUniversalExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        No universal expenses recorded yet for this month.
                      </td>
                    </tr>
                  ) : (
                    monthUniversalExpenses.map(u => {
                      const splitCount = (u.applicableMemberIds || []).length || monthMembers.length || 1;
                      const sharePerPerson = splitCount > 0 ? u.amount / splitCount : 0;

                      return (
                        <tr key={u.id} className="hover:bg-[#E6F2DD]/15 transition-colors">
                          <td className="px-6 py-4 font-mono text-gray-600 whitespace-nowrap">
                            {u.date}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#1A332C]">
                            {u.description}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-semibold">
                                <User className="h-3 w-3 text-[#659287]" />
                                {u.paidByName}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5 font-mono">
                                +{formatCurrency(u.amount)} added to balance
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#E6F2DD] px-2 py-0.5 text-xs font-semibold text-[#456c63]">
                                <Users className="h-3 w-3" />
                                {splitCount} Members
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200/60 rounded px-1.5 py-0.5 font-mono">
                                -{formatCurrency(sharePerPerson)} deducted/each
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-[#1A332C] whitespace-nowrap">
                            {formatCurrency(u.amount)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-gray-50/90 border border-gray-200/70 p-1.5 shadow-2xs">
                              <span className="inline-flex items-center gap-1 rounded-xl bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800 border border-teal-200">
                                Universal
                              </span>

                              <div className="h-4 w-px bg-gray-200" />

                              {!isLockedOrArchived ? (
                                <div className="flex items-center gap-0.5">
                                  <button
                                    id={`edit-uni-${u.id}`}
                                    onClick={() => handleOpenEditUniversal(u)}
                                    title="Edit"
                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-[#659287] hover:shadow-2xs transition-all cursor-pointer"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    id={`delete-uni-${u.id}`}
                                    onClick={() => setDeletingUniversal(u)}
                                    title="Delete"
                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:shadow-2xs transition-all cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs italic px-1.5">Locked</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {monthUniversalExpenses.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/70 font-bold text-xs sm:text-sm text-[#1A332C]">
                      <td colSpan={4} className="px-6 py-3.5">
                        Total Universal Expenses ({monthUniversalExpenses.length} entries)
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-base text-[#659287]">
                        {formatCurrency(monthSummary.totalUniversalExpenses)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Bazaar Modal */}
      {isBazaarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#1A332C]">
                {editingBazaar ? 'Edit Bazaar Expense' : 'Add Bazaar Expense'}
              </h3>
              <button
                onClick={() => setIsBazaarModalOpen(false)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBazaar} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Date *
                </label>
                <input
                  id="bazaar-form-date"
                  type="date"
                  required
                  value={bazaarDate}
                  onChange={e => setBazaarDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <input
                  id="bazaar-form-desc"
                  type="text"
                  required
                  value={bazaarDesc}
                  onChange={e => setBazaarDesc(e.target.value)}
                  placeholder="e.g. Fish, Chicken & Spices from Local Market"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Amount (৳) *
                  </label>
                  <input
                    id="bazaar-form-amount"
                    type="number"
                    step="any"
                    required
                    value={bazaarAmount}
                    onChange={e => setBazaarAmount(e.target.value)}
                    placeholder="e.g. 2400 (or -300 for refund)"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Negative amounts adjust the member's balance while still adding the expenditure (+) to total mess costs
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Paid By *
                  </label>
                  <select
                    id="bazaar-form-paidby"
                    value={bazaarPaidBy}
                    onChange={e => setBazaarPaidBy(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                  >
                    <option value="shared_fund">Shared Mess Fund (General)</option>
                    {monthMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Payer is credited automatically</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBazaarModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  id="bazaar-form-submit-btn"
                  type="submit"
                  className="rounded-xl bg-[#659287] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#52776e] shadow-xs"
                >
                  {editingBazaar ? 'Update Expense' : 'Save Bazaar Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Bazaar Confirmation */}
      {deletingBazaar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1A332C]">
                Delete Bazaar Expense
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-bold text-[#1A332C]">{deletingBazaar.description}</span> ({formatCurrency(deletingBazaar.amount)})?
            </p>
            <p className="text-xs text-red-500 mt-2">
              The payer's credit and total bazaar cost will be recalculated.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeletingBazaar(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-bazaar-btn"
                onClick={() => {
                  deleteBazaarExpense(deletingBazaar.id);
                  setDeletingBazaar(null);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Universal Modal */}
      {isUniversalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#1A332C]">
                {editingUniversal ? 'Edit Universal Expense' : 'Add Universal Expense'}
              </h3>
              <button
                onClick={() => setIsUniversalModalOpen(false)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUniversal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Date *
                </label>
                <input
                  id="uni-form-date"
                  type="date"
                  required
                  value={uniDate}
                  onChange={e => setUniDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <input
                  id="uni-form-desc"
                  type="text"
                  required
                  value={uniDesc}
                  onChange={e => setUniDesc(e.target.value)}
                  placeholder="e.g. WiFi Bill, Maid Salary, Gas Cylinder"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Amount (৳) *
                  </label>
                  <input
                    id="uni-form-amount"
                    type="number"
                    step="any"
                    required
                    value={uniAmount}
                    onChange={e => setUniAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Paid By *
                  </label>
                  <select
                    id="uni-form-paidby"
                    value={uniPaidBy}
                    onChange={e => setUniPaidBy(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40"
                  >
                    <option value="shared_fund">Shared Mess Fund (General)</option>
                    {monthMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Member Selection for Split */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Split Equally Among:
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllMembers}
                    className="text-[11px] font-bold text-[#659287] hover:underline"
                  >
                    Select All
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto rounded-xl border border-gray-200 p-2 space-y-1 bg-gray-50/50">
                  {monthMembers.map(m => {
                    const isChecked = uniApplicableMembers.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white text-xs cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleMemberApplicable(m.id)}
                          className="rounded text-[#659287] focus:ring-[#659287]"
                        />
                        <span className="font-semibold text-gray-800">{m.name}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-1 text-right text-[11px] text-gray-500 font-mono">
                  {uniApplicableMembers.length > 0 && parseFloat(uniAmount) > 0
                    ? `৳${(parseFloat(uniAmount) / uniApplicableMembers.length).toFixed(2)} per member (${uniApplicableMembers.length} members)`
                    : `${uniApplicableMembers.length} members selected`}
                </div>
              </div>

              {/* Universal Expense Rule preview */}
              <div className="rounded-2xl bg-[#E6F2DD]/60 border border-[#B1D3B9] p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#1A332C]">
                  <CheckCircle2 className="h-4 w-4 text-[#659287]" />
                  <span>Universal Expense Rule Calculation</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-white/90 p-2 border border-[#B1D3B9]/50 shadow-2xs">
                    <span className="text-gray-500 block">Full Amount Added to Balance:</span>
                    <strong className="text-emerald-700 font-mono text-xs block mt-0.5">
                      +{formatCurrency(parseFloat(uniAmount) || 0)}
                    </strong>
                    <span className="text-gray-600 block text-[10px] truncate mt-0.5">
                      Credited to {monthMembers.find(m => m.id === uniPaidBy)?.name || 'Payer'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/90 p-2 border border-[#B1D3B9]/50 shadow-2xs">
                    <span className="text-gray-500 block">Automatic Equal Deduction:</span>
                    <strong className="text-red-700 font-mono text-xs block mt-0.5">
                      -{formatCurrency(
                        uniApplicableMembers.length > 0 && parseFloat(uniAmount) > 0
                          ? parseFloat(uniAmount) / uniApplicableMembers.length
                          : 0
                      )}/each
                    </strong>
                    <span className="text-gray-600 block text-[10px] truncate mt-0.5">
                      Deducted from all {uniApplicableMembers.length} accounts
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUniversalModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  id="uni-form-submit-btn"
                  type="submit"
                  disabled={uniApplicableMembers.length === 0}
                  className="rounded-xl bg-[#659287] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#52776e] shadow-xs disabled:opacity-50"
                >
                  {editingUniversal ? 'Update Universal Expense' : 'Save Universal Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Universal Confirmation */}
      {deletingUniversal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1A332C]">
                Delete Universal Expense
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-bold text-[#1A332C]">{deletingUniversal.description}</span> ({formatCurrency(deletingUniversal.amount)})?
            </p>
            <p className="text-xs text-red-500 mt-2">
              Each member's share and payer credit will be adjusted.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeletingUniversal(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-uni-btn"
                onClick={() => {
                  deleteUniversalExpense(deletingUniversal.id);
                  setDeletingUniversal(null);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
