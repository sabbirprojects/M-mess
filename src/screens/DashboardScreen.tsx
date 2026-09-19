import React, { useState } from 'react';
import {
  Users,
  UtensilsCrossed,
  Receipt,
  Layers,
  PiggyBank,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  FileText,
  Calendar,
  AlertCircle,
  PlusCircle,
  Eye,
  X,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { MemberCalculation } from '../types';
import { ScreenType } from '../components/Navbar';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const {
    activeMonth,
    allMonths,
    setActiveMonthId,
    monthSummary,
    state,
    currentUser,
    isMasterKey,
  } = useApp();

  const [selectedMember, setSelectedMember] = useState<MemberCalculation | null>(null);

  if (!activeMonth) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-gray-800">No Month Selected</h3>
        <p className="text-sm text-gray-500 max-w-sm mt-1">
          Please select an active month to view the dashboard summary.
        </p>
        {isMasterKey ? (
          <button
            onClick={() => onNavigate('settings')}
            className="mt-4 rounded-xl bg-[#659287] px-4 py-2 text-sm font-bold text-white hover:bg-[#52776e]"
          >
            Go to Settings
          </button>
        ) : (
          <p className="text-xs text-amber-700 italic mt-3 font-medium">
            Contact the Mess Manager to activate or initialize the month.
          </p>
        )}
      </div>
    );
  }

  const {
    totalMembers,
    totalMeals,
    totalBazaarCost,
    totalUniversalExpenses,
    totalDeposits,
    mealRate,
    isFixedRate,
    memberCalculations,
  } = monthSummary;

  // Find detailed records for selected member modal
  const memberObj = selectedMember
    ? state.members.find(m => m.id === selectedMember.memberId)
    : null;
  const memberDeposits = selectedMember
    ? state.deposits.filter(d => d.monthId === activeMonth.id && d.memberId === selectedMember.memberId)
    : [];
  const memberBazaarPaid = selectedMember
    ? state.bazaarExpenses.filter(b => b.monthId === activeMonth.id && b.paidById === selectedMember.memberId)
    : [];
  const memberUniversalPaid = selectedMember
    ? state.universalExpenses.filter(u => u.monthId === activeMonth.id && u.paidById === selectedMember.memberId)
    : [];

  const myMemberCalc = React.useMemo(() => {
    if (!currentUser) return null;
    return memberCalculations.find(
      m =>
        (currentUser.fullName && m.memberName.toLowerCase() === currentUser.fullName.toLowerCase()) ||
        (currentUser.username && m.memberName.toLowerCase() === currentUser.username.toLowerCase()) ||
        m.memberId === `mem-${currentUser.id}`
    ) || null;
  }, [currentUser, memberCalculations]);

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header with Month Switcher & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1A332C]">
            Mess Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            Real-time monthly overview, meal rates, and member financial status for{' '}
            <span className="font-bold text-[#659287]">{activeMonth.name} {activeMonth.year}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Month Selector */}
          <div className="flex items-center gap-1 bg-white border border-[#B1D3B9] rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-[#659287]" />
            <select
              id="dashboard-month-select"
              value={activeMonth.id}
              onChange={e => setActiveMonthId(e.target.value)}
              className="text-xs font-bold text-[#1A332C] bg-transparent focus:outline-none cursor-pointer"
            >
              {allMonths.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.year} ({m.status})
                </option>
              ))}
            </select>
          </div>

          <button
            id="dash-view-reports-btn"
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs font-bold text-[#1A332C] hover:bg-[#E6F2DD] shadow-2xs transition-colors"
          >
            <FileText className="h-4 w-4 text-[#659287]" />
            <span>Monthly Report</span>
          </button>
        </div>
      </div>

      {/* My Personal Account Overview Banner (Shown for logged-in member / spec account) */}
      {myMemberCalc && (
        <div
          id="dash-my-account-banner"
          className="rounded-2xl border-2 border-[#659287] bg-white p-4 sm:p-5 shadow-xs transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#659287] text-white font-bold text-sm shadow-xs">
                {(currentUser?.fullName || currentUser?.username || 'ME').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#1A332C]">
                    My Account: {myMemberCalc.memberName}
                  </h3>
                  <span className="rounded-md bg-[#659287] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    {currentUser?.role || 'Member'}
                  </span>
                  {myMemberCalc.status === 'Receivable' && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                      Gets Back {formatCurrency(myMemberCalc.finalBalance)}
                    </span>
                  )}
                  {myMemberCalc.status === 'Payable' && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                      Must Pay {formatCurrency(Math.abs(myMemberCalc.finalBalance))}
                    </span>
                  )}
                  {myMemberCalc.status === 'Settled' && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                      <CheckCircle className="h-3 w-3 text-gray-500" />
                      Settled
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-600">
                  <span>
                    Meals: <strong className="text-[#1A332C]">{formatNumber(myMemberCalc.totalMeals, 1)}</strong>
                  </span>
                  <span>
                    Deposit: <strong className="text-emerald-700">{formatCurrency(myMemberCalc.totalDeposit)}</strong>
                  </span>
                  <span>
                    Total Cost: <strong className="text-red-700">{formatCurrency(myMemberCalc.totalCost)}</strong>
                  </span>
                  <span>
                    Final Balance:{' '}
                    <strong
                      className={
                        myMemberCalc.finalBalance >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }
                    >
                      {formatCurrency(myMemberCalc.finalBalance)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="dash-my-log-meal-btn"
                type="button"
                onClick={() => onNavigate('meals')}
                className="flex items-center gap-1.5 rounded-xl bg-[#E6F2DD] px-3.5 py-2 text-xs font-bold text-[#1A332C] hover:bg-[#88BDA4]/30 transition-colors"
              >
                <UtensilsCrossed className="h-3.5 w-3.5 text-[#659287]" />
                <span>Log Meals</span>
              </button>
              <button
                id="dash-my-view-details-btn"
                type="button"
                onClick={() => setSelectedMember(myMemberCalc)}
                className="flex items-center gap-1.5 rounded-xl bg-[#659287] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#52776e] transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>My Breakdown</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards Grid (6 cards required by prompt) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Card 1: Total Members */}
        <div
          onClick={() => onNavigate('members')}
          className="group cursor-pointer rounded-2xl border border-[#B1D3B9]/60 bg-white p-4 shadow-xs hover:border-[#659287] transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Members
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#659287] group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-[#1A332C]">
              {totalMembers}
            </div>
            <span className="text-[11px] font-semibold text-[#659287]">Active</span>
          </div>
        </div>

        {/* Card 2: Total Meals */}
        <div
          onClick={() => onNavigate('meals')}
          className="group cursor-pointer rounded-2xl border border-[#B1D3B9]/60 bg-white p-4 shadow-xs hover:border-[#659287] transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Total Meals
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#659287] group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-[#1A332C]">
              {formatNumber(totalMeals, 1)}
            </div>
            <span className="text-[11px] font-semibold text-gray-500">Meals</span>
          </div>
        </div>

        {/* Card 3: Total Bazaar Cost */}
        <div
          id="dash-card-bazaar"
          onClick={() => onNavigate('bazaar')}
          className="group cursor-pointer rounded-2xl border border-[#B1D3B9]/60 bg-white p-4 shadow-xs hover:border-[#659287] transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Bazaar Cost
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#659287] group-hover:scale-110 transition-transform">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-extrabold text-[#1A332C] truncate">
              {formatCurrency(totalBazaarCost)}
            </div>
          </div>
        </div>

        {/* Card 4: Total Universal Expenses */}
        <div
          id="dash-card-universal"
          onClick={() => onNavigate('universal')}
          className="group cursor-pointer rounded-2xl border-2 border-[#88BDA4]/40 bg-white p-4 shadow-xs hover:border-[#659287] transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#456c63] uppercase tracking-wider truncate">
              Universal Bills
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#659287] group-hover:scale-110 transition-transform">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-extrabold text-[#1A332C] truncate">
              {formatCurrency(totalUniversalExpenses)}
            </div>
            <span className="text-[10px] font-bold text-[#659287] underline">View</span>
          </div>
        </div>

        {/* Card 5: Total Deposits */}
        <div
          onClick={() => onNavigate('members')}
          className="group cursor-pointer rounded-2xl border border-[#B1D3B9]/60 bg-white p-4 shadow-xs hover:border-[#659287] transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Total Deposits
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F2DD] text-[#659287] group-hover:scale-110 transition-transform">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-extrabold text-[#1A332C] truncate">
              {formatCurrency(totalDeposits)}
            </div>
          </div>
        </div>

        {/* Card 6: Current Meal Rate */}
        <div className="rounded-2xl border-2 border-[#659287] bg-white p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-[#659287]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#659287] uppercase tracking-wider">
              Meal Rate
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#88BDA4]/20 text-[#659287]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-extrabold text-[#659287]">
              {formatCurrency(mealRate)}
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#E6F2DD] text-[#456c63]">
              {isFixedRate ? 'Fixed' : 'Auto'}
            </span>
          </div>
        </div>

      </div>

      {/* Universal Expenses Quick Banner */}
      <div className="rounded-2xl border border-[#B1D3B9]/70 bg-gradient-to-r from-white via-white to-[#E6F2DD]/50 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#659287] text-white shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#1A332C]">
                Universal Expenses: {formatCurrency(totalUniversalExpenses)}
              </h4>
              <span className="rounded-full bg-[#E6F2DD] px-2 py-0.5 text-[10px] font-bold text-[#456c63]">
                Fixed Mess Costs
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Includes WiFi, Cook/Maid Salary, Gas Cylinder, Utilities. Split equally among members without affecting Meal Rate.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="dash-open-universal-expenses-btn"
            onClick={() => onNavigate('universal')}
            className="flex items-center gap-1.5 rounded-xl bg-[#659287] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#52776e] transition-all"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Open Universal Expenses</span>
          </button>
        </div>
      </div>

      {/* Member Balance Table */}
      <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-gray-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-[#1A332C]">
              Member Balances & Settlement Status
            </h3>
            <p className="text-xs text-gray-500">
              Formula: Final Balance = (Previous Balance + Deposits + Credits) − Member Cost
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('members')}
              className="flex items-center gap-1.5 text-xs font-bold text-[#659287] hover:text-[#456c63] transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Manage Members</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#E6F2DD]/30 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                <th className="px-6 py-3.5">Member Name</th>
                <th className="px-6 py-3.5 text-right">Total Meals</th>
                <th className="px-6 py-3.5 text-right">Deposits & Credits</th>
                <th className="px-6 py-3.5 text-right">Total Cost (Meals + Bills)</th>
                <th className="px-6 py-3.5 text-right">Final Balance</th>
                <th className="px-6 py-3.5 text-center">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {memberCalculations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No members added for this month yet. Click "Manage Members" to add members.
                  </td>
                </tr>
              ) : (
                memberCalculations.map(m => {
                  const isReceivable = m.status === 'Receivable';
                  const isPayable = m.status === 'Payable';
                  const isSettled = m.status === 'Settled';
                  const isMe = Boolean(myMemberCalc && m.memberId === myMemberCalc.memberId);
                  const totalCredits = m.totalDeposit + m.universalCredit + m.bazaarCredit;

                  return (
                    <tr
                      key={m.memberId}
                      className={`hover:bg-[#E6F2DD]/20 transition-colors group ${
                        isMe ? 'bg-[#E6F2DD]/35 font-semibold' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-[#1A332C]">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                              isMe
                                ? 'bg-[#659287] text-white'
                                : 'bg-[#E6F2DD] text-[#659287]'
                            }`}
                          >
                            {m.memberName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{m.memberName}</span>
                              {isMe && (
                                <span className="rounded bg-[#659287] px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            {m.previousBalance !== 0 && (
                              <div className="text-[10px] text-gray-400 font-normal">
                                Prev: {formatCurrency(m.previousBalance)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-gray-700">
                        {formatNumber(m.totalMeals, 1)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-gray-800">
                        <div>{formatCurrency(totalCredits)}</div>
                        {m.universalCredit > 0 && (
                          <div className="text-[10px] text-emerald-700 font-sans font-semibold">
                            incl. +{formatCurrency(m.universalCredit)} uni paid
                          </div>
                        )}
                        {m.bazaarCredit < 0 && (
                          <div className="text-[10px] text-amber-700 font-sans font-semibold">
                            incl. -{formatCurrency(Math.abs(m.bazaarCredit))} market deducted
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-gray-800">
                        <div>{formatCurrency(m.totalCost)}</div>
                        {m.universalExpenseShare > 0 && (
                          <div className="text-[10px] text-red-600 font-sans font-medium">
                            incl. -{formatCurrency(m.universalExpenseShare)} uni share
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold">
                        <span
                          className={
                            isReceivable
                              ? 'text-emerald-700 font-extrabold'
                              : isPayable
                              ? 'text-red-600 font-extrabold'
                              : 'text-gray-600'
                          }
                        >
                          {formatCurrency(m.finalBalance)}
                        </span>
                      </td>
                      {/* Merged Status & Action column */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-gray-50/90 border border-gray-200/70 p-1.5 shadow-2xs">
                          {isReceivable && (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                              <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                              Receivable
                            </span>
                          )}
                          {isPayable && (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800 border border-red-200">
                              <ArrowDownRight className="h-3 w-3 text-red-600" />
                              Payable
                            </span>
                          )}
                          {isSettled && (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-gray-200/70 px-2.5 py-1 text-xs font-bold text-gray-700 border border-gray-300/70">
                              <CheckCircle className="h-3 w-3 text-gray-500" />
                              Settled
                            </span>
                          )}

                          <div className="h-4 w-px bg-gray-200" />

                          <button
                            id={`dash-view-details-${m.memberId}`}
                            onClick={() => setSelectedMember(m)}
                            className="inline-flex items-center gap-1 rounded-xl bg-white border border-gray-200/80 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-[#E6F2DD] hover:text-[#659287] hover:border-[#659287]/40 shadow-2xs transition-all cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {memberCalculations.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50/70 font-bold text-xs sm:text-sm text-[#1A332C]">
                  <td className="px-6 py-3.5">Total Mess Net</td>
                  <td className="px-6 py-3.5 text-right font-mono">
                    {formatNumber(totalMeals, 1)}
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono">
                    {formatCurrency(totalDeposits)}
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono">
                    {formatCurrency(
                      memberCalculations.reduce((acc, c) => acc + c.totalCost, 0)
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono">
                    {formatCurrency(
                      memberCalculations.reduce((acc, c) => acc + c.finalBalance, 0)
                    )}
                  </td>
                  <td colSpan={2} className="px-6 py-3.5 text-center text-xs text-gray-500 font-normal">
                    {memberCalculations.filter(m => m.status === 'Receivable').length} Receivable,{' '}
                    {memberCalculations.filter(m => m.status === 'Payable').length} Payable
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#659287] text-white font-bold">
                  {selectedMember.memberName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1A332C]">
                    {selectedMember.memberName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Detailed breakdown for {activeMonth.name} {activeMonth.year}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Calculations breakdown list */}
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#E6F2DD]/40 p-3">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Meals Consumed</span>
                  <div className="text-lg font-bold text-[#1A332C]">
                    {formatNumber(selectedMember.totalMeals, 1)} meals
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    @ {formatCurrency(mealRate)}/meal = {formatCurrency(selectedMember.mealCost)}
                  </div>
                </div>

                <div className="rounded-xl bg-[#E6F2DD]/40 p-3">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Universal Bill Share</span>
                  <div className="text-lg font-bold text-red-700">
                    -{formatCurrency(selectedMember.universalExpenseShare)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Equal share deducted from balance
                  </div>
                </div>
              </div>

              {selectedMember.universalCredit > 0 && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <span>Universal Bill Paid by {selectedMember.memberName}</span>
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Rule: Full amount paid is credited directly to their total balance
                    </p>
                  </div>
                  <span className="font-mono font-extrabold text-emerald-800 text-sm">
                    +{formatCurrency(selectedMember.universalCredit)}
                  </span>
                </div>
              )}

              <div className="rounded-2xl border border-gray-100 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Initial Deposit:</span>
                  <span className="font-mono font-medium">{formatCurrency(selectedMember.initialDeposit)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Additional Deposits:</span>
                  <span className="font-mono font-medium">{formatCurrency(selectedMember.additionalDeposits)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Previous Month Carried Balance:</span>
                  <span className="font-mono font-medium">{formatCurrency(selectedMember.previousBalance)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>
                    {selectedMember.bazaarCredit < 0
                      ? 'Market Balance Deduction (Deposit Adjusted):'
                      : 'Bazaar Expense Credits (Paid):'}
                  </span>
                  <span
                    className={`font-mono font-medium ${
                      selectedMember.bazaarCredit < 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700'
                    }`}
                  >
                    {selectedMember.bazaarCredit < 0
                      ? `-${formatCurrency(Math.abs(selectedMember.bazaarCredit))}`
                      : `+${formatCurrency(selectedMember.bazaarCredit)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Universal Expense Paid (Full Credit Added):</span>
                  <span className="font-mono font-medium text-emerald-700">+{formatCurrency(selectedMember.universalCredit)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Universal Expense Share (Equal Deduction):</span>
                  <span className="font-mono font-medium text-red-600">-{formatCurrency(selectedMember.universalExpenseShare)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Meal Cost ({formatNumber(selectedMember.totalMeals, 1)} meals @ {formatCurrency(mealRate)}):</span>
                  <span className="font-mono font-medium text-red-600">-{formatCurrency(selectedMember.mealCost)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold">
                  <span>Final Balance:</span>
                  <span
                    className={
                      selectedMember.status === 'Receivable'
                        ? 'text-emerald-700'
                        : selectedMember.status === 'Payable'
                        ? 'text-red-600'
                        : 'text-gray-700'
                    }
                  >
                    {formatCurrency(selectedMember.finalBalance)} ({selectedMember.status})
                  </span>
                </div>
              </div>

              {/* Logged deposits for this member */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Logged Deposits ({memberDeposits.length})
                </h4>
                {memberDeposits.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No extra deposits logged beyond initial deposit.</p>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {memberDeposits.map(d => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs"
                      >
                        <div>
                          <span className="font-medium text-gray-800">{d.date}</span>
                          {d.note && <span className="text-gray-500 ml-2">({d.note})</span>}
                        </div>
                        <span className="font-mono font-bold text-[#1A332C]">
                          {formatCurrency(d.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="rounded-xl bg-[#659287] px-4 py-2 text-xs font-bold text-white hover:bg-[#52776e]"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
