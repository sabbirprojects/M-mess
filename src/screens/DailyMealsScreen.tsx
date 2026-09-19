import React, { useState } from 'react';
import {
  UtensilsCrossed,
  History,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  User,
  Clock,
  Check,
  Plus,
  Minus,
  Table as TableIcon,
  CalendarDays,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber } from '../utils/calculations';

const MEAL_QUANTITY_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3];

export const DailyMealsScreen: React.FC = () => {
  const {
    activeMonth,
    state,
    updateMeal,
    monthSummary,
    isLockedOrArchived,
  } = useApp();

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ memberId: string; day: number } | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'daily'>('matrix');
  const [selectedDay, setSelectedDay] = useState<number>(1);

  if (!activeMonth) {
    return (
      <div className="p-8 text-center text-gray-500">
        No active month selected.
      </div>
    );
  }

  const daysInMonth = activeMonth.daysInMonth || 30;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthMembers = state.members.filter(m => m.monthId === activeMonth.id);

  // Helper to get meal quantity
  const getMealValue = (memberId: string, day: number): number => {
    const meal = state.meals.find(
      m => m.monthId === activeMonth.id && m.memberId === memberId && m.day === day
    );
    return meal !== undefined ? meal.quantity : 0;
  };

  // Helper for day totals
  const getDayTotal = (day: number): number => {
    return monthMembers.reduce((acc, m) => acc + getMealValue(m.id, day), 0);
  };

  // Helper for member total
  const getMemberTotalMeals = (memberId: string): number => {
    return daysArray.reduce((acc, day) => acc + getMealValue(memberId, day), 0);
  };

  const handleSelectQuantity = (memberId: string, day: number, qty: number) => {
    if (isLockedOrArchived) return;
    updateMeal(memberId, day, Math.max(0, qty));
    setEditingCell(null);
  };

  const monthAudits = state.mealAudits.filter(a => a.monthId === activeMonth.id);

  // Editing cell member object
  const activeEditingMember = editingCell
    ? monthMembers.find(m => m.id === editingCell.memberId)
    : null;
  const activeEditingValue = editingCell
    ? getMealValue(editingCell.memberId, editingCell.day)
    : 0;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#659287] text-white shadow-xs">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1A332C]">
              Daily Meal Sheet
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Track and update meals per member. Meal rate updates automatically in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Meal Rate Pill */}
          <div className="flex items-center gap-2 rounded-2xl border border-[#B1D3B9] bg-white px-3.5 py-1.5 shadow-2xs">
            <TrendingUp className="h-4 w-4 text-[#659287]" />
            <div className="text-left">
              <span className="text-[10px] font-bold text-gray-400 uppercase block leading-tight">
                Live Meal Rate
              </span>
              <span className="text-sm font-extrabold text-[#659287]">
                {formatCurrency(monthSummary.mealRate)}
              </span>
            </div>
          </div>

          {/* Audit History Button */}
          <button
            id="meals-view-history-btn"
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-[#E6F2DD] hover:text-[#1A332C] transition-colors shadow-2xs"
          >
            <History className="h-4 w-4 text-[#659287]" />
            <span>Audit History</span>
            {monthAudits.length > 0 && (
              <span className="rounded-full bg-[#E6F2DD] px-1.5 py-0.5 text-[10px] font-bold text-[#456c63]">
                {monthAudits.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* View Switcher: Matrix vs Single Day */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-[#E6F2DD]/60 border border-[#B1D3B9]/60">
        <div className="flex items-center gap-1">
          <button
            id="meals-view-matrix-btn"
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-[#659287] text-white shadow-xs'
                : 'text-gray-700 hover:bg-white/80'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>Full Month Matrix</span>
          </button>

          <button
            id="meals-view-daily-btn"
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-[#659287] text-white shadow-xs'
                : 'text-gray-700 hover:bg-white/80'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Daily Log View</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600 px-2">
          <Calendar className="h-4 w-4 text-[#659287]" />
          <span className="font-semibold">
            {activeMonth.name} {activeMonth.year} ({daysInMonth} Days)
          </span>
          <span className="hidden sm:inline text-gray-400">• Total: {formatNumber(monthSummary.totalMeals, 1)} meals</span>
        </div>
      </div>

      {/* VIEW MODE 1: Single Day Quick Log View */}
      {viewMode === 'daily' && (
        <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-5 sm:p-6 shadow-xs space-y-6">
          {/* Day Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <button
                disabled={selectedDay <= 1}
                onClick={() => setSelectedDay(prev => Math.max(1, prev - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-[#E6F2DD] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="text-center px-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Recording Date
                </span>
                <span className="text-lg font-extrabold text-[#1A332C]">
                  Day {selectedDay} of {daysInMonth}
                </span>
              </div>

              <button
                disabled={selectedDay >= daysInMonth}
                onClick={() => setSelectedDay(prev => Math.min(daysInMonth, prev + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-[#E6F2DD] disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Day Chips Slider */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full sm:max-w-md">
              {daysArray.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`shrink-0 h-8 w-8 rounded-lg text-xs font-mono font-bold transition-all ${
                    selectedDay === day
                      ? 'bg-[#659287] text-white shadow-xs'
                      : getDayTotal(day) > 0
                      ? 'bg-[#E6F2DD] text-[#1A332C] hover:bg-[#88BDA4]/40'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Members List for Selected Day */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase px-1">
              <span>Member Name</span>
              <span>Meals for Day {selectedDay} (Total: {formatNumber(getDayTotal(selectedDay), 1)})</span>
            </div>

            {monthMembers.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No members found in this month. Please add members first.
              </div>
            ) : (
              monthMembers.map(member => {
                const val = getMealValue(member.id, selectedDay);
                return (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 hover:bg-[#E6F2DD]/30 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#659287] text-white font-bold text-xs">
                        {member.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1A332C]">
                          {member.name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Total so far: {formatNumber(getMemberTotalMeals(member.id), 1)} meals
                        </div>
                      </div>
                    </div>

                    {/* Stepper + Option Chips */}
                    <div className="flex items-center gap-2">
                      <button
                        disabled={isLockedOrArchived || val <= 0}
                        onClick={() => handleSelectQuantity(member.id, selectedDay, Math.max(0, val - 0.5))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex items-center gap-1">
                        {MEAL_QUANTITY_OPTIONS.map(opt => (
                          <button
                            key={opt}
                            disabled={isLockedOrArchived}
                            onClick={() => handleSelectQuantity(member.id, selectedDay, opt)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                              val === opt
                                ? 'bg-[#659287] text-white shadow-xs'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-[#E6F2DD]'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      <button
                        disabled={isLockedOrArchived}
                        onClick={() => handleSelectQuantity(member.id, selectedDay, val + 0.5)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Full Month Matrix Grid */}
      {viewMode === 'matrix' && (
        <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white shadow-xs overflow-hidden">
          
          {/* Legend and instructions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50/50 text-xs text-gray-500 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">
                Matrix View:
              </span>
              <span className="text-gray-500">
                Click any cell to edit. Scroll horizontally to browse all {daysInMonth} days.
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-gray-400">Values:</span>
              {MEAL_QUANTITY_OPTIONS.map(val => (
                <span
                  key={val}
                  className="rounded bg-white border border-gray-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-700"
                >
                  {val}
                </span>
              ))}
            </div>
          </div>

          {/* Matrix Table with Robust Border Separation and Fixed Dimensions */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="text-xs font-bold text-gray-700">
                  {/* Sticky Member Column Header */}
                  <th className="sticky left-0 z-30 bg-[#E6F2DD] px-3.5 py-3 w-44 min-w-[176px] max-w-[176px] border-b border-r border-gray-200 shadow-xs">
                    Member Name
                  </th>
                  
                  {/* Day Headers */}
                  {daysArray.map(day => (
                    <th
                      key={day}
                      className="w-11 min-w-[44px] max-w-[44px] px-1 py-3 text-center font-mono text-xs text-gray-700 border-b border-r border-gray-200 bg-[#E6F2DD]/60"
                    >
                      {day}
                    </th>
                  ))}

                  {/* Sticky Total Column Header */}
                  <th className="sticky right-0 z-30 bg-[#E6F2DD] px-3 py-3 text-right w-24 min-w-[96px] max-w-[96px] font-bold border-b border-l border-gray-200 shadow-xs">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="text-xs font-mono">
                {monthMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={daysInMonth + 2}
                      className="px-6 py-12 text-center text-gray-400 font-sans border-b border-gray-200"
                    >
                      No members added yet for this month.
                    </td>
                  </tr>
                ) : (
                  monthMembers.map(member => {
                    const memberTotal = getMemberTotalMeals(member.id);

                    return (
                      <tr key={member.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Sticky Member Name Cell */}
                        <td className="sticky left-0 z-20 bg-white px-3.5 py-2 font-sans font-bold text-[#1A332C] border-b border-r border-gray-200 shadow-xs truncate w-44 min-w-[176px] max-w-[176px]">
                          <div className="flex items-center gap-2 truncate">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#E6F2DD] text-[#659287] text-[10px] font-bold">
                              {member.name.substring(0, 1).toUpperCase()}
                            </div>
                            <span className="truncate">{member.name}</span>
                          </div>
                        </td>

                        {/* Day Cells */}
                        {daysArray.map(day => {
                          const val = getMealValue(member.id, day);
                          const isSelected =
                            editingCell?.memberId === member.id && editingCell?.day === day;

                          return (
                            <td
                              key={day}
                              className="w-11 min-w-[44px] max-w-[44px] p-0 text-center border-b border-r border-gray-100 align-middle bg-white"
                            >
                              <button
                                id={`meal-cell-${member.id}-day-${day}`}
                                disabled={isLockedOrArchived}
                                onClick={() => setEditingCell({ memberId: member.id, day })}
                                className={`h-9 w-full flex items-center justify-center font-mono transition-all cursor-pointer ${
                                  val > 0
                                    ? 'font-bold text-[#1A332C] bg-[#88BDA4]/20 hover:bg-[#88BDA4]/40'
                                    : 'text-gray-300 hover:bg-gray-50'
                                } ${isSelected ? 'ring-2 ring-[#659287] bg-white' : ''}`}
                              >
                                {val > 0 ? val : '·'}
                              </button>
                            </td>
                          );
                        })}

                        {/* Sticky Member Total Cell */}
                        <td className="sticky right-0 z-20 bg-white px-3 py-2 text-right font-mono font-bold text-[#1A332C] border-b border-l border-gray-200 shadow-xs w-24 min-w-[96px] max-w-[96px]">
                          {formatNumber(memberTotal, 1)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Daily Totals Footer */}
              {monthMembers.length > 0 && (
                <tfoot>
                  <tr className="font-bold text-xs">
                    {/* Sticky Daily Total label */}
                    <td className="sticky left-0 z-20 bg-[#E6F2DD] px-3.5 py-3 font-sans font-bold text-gray-800 border-t-2 border-b border-r border-gray-300 shadow-xs w-44 min-w-[176px] max-w-[176px]">
                      Daily Total
                    </td>

                    {/* Day total cells */}
                    {daysArray.map(day => {
                      const dayTotal = getDayTotal(day);
                      return (
                        <td
                          key={day}
                          className="w-11 min-w-[44px] max-w-[44px] px-1 py-3 text-center font-mono text-gray-800 border-t-2 border-b border-r border-gray-200 text-[11px] bg-[#E6F2DD]/30"
                        >
                          {dayTotal > 0 ? formatNumber(dayTotal, 1) : '-'}
                        </td>
                      );
                    })}

                    {/* Sticky Month Total Cell */}
                    <td className="sticky right-0 z-20 bg-[#E6F2DD] px-3 py-3 text-right font-mono text-sm text-[#659287] font-extrabold border-t-2 border-b border-l border-gray-300 shadow-xs w-24 min-w-[96px] max-w-[96px]">
                      {formatNumber(monthSummary.totalMeals, 1)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* QUICK MEAL INPUT MODAL (Renders safely outside scrolling container) */}
      {editingCell && activeEditingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#659287] text-white font-bold">
                  {activeEditingMember.name.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A332C]">
                    {activeEditingMember.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Day {editingCell.day} • {activeMonth.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Value Display & Stepper */}
            <div className="flex items-center justify-between rounded-2xl bg-[#E6F2DD]/40 border border-[#B1D3B9]/60 p-4">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Current Meals
                </span>
                <span className="text-2xl font-extrabold font-mono text-[#1A332C]">
                  {activeEditingValue}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={activeEditingValue <= 0}
                  onClick={() =>
                    handleSelectQuantity(
                      editingCell.memberId,
                      editingCell.day,
                      Math.max(0, activeEditingValue - 0.5)
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <button
                  onClick={() =>
                    handleSelectQuantity(
                      editingCell.memberId,
                      editingCell.day,
                      activeEditingValue + 0.5
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Option Buttons */}
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Quick Select:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_QUANTITY_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() =>
                      handleSelectQuantity(editingCell.memberId, editingCell.day, opt)
                    }
                    className={`py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeEditingValue === opt
                        ? 'bg-[#659287] text-white shadow-sm ring-2 ring-[#659287]/30'
                        : 'bg-gray-50 hover:bg-[#E6F2DD] text-gray-700 border border-gray-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Day Navigators */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                disabled={editingCell.day <= 1}
                onClick={() =>
                  setEditingCell({
                    memberId: editingCell.memberId,
                    day: Math.max(1, editingCell.day - 1),
                  })
                }
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev Day</span>
              </button>

              <button
                onClick={() => setEditingCell(null)}
                className="rounded-xl bg-[#659287] px-4 py-2 text-xs font-bold text-white hover:bg-[#52776e]"
              >
                Done
              </button>

              <button
                disabled={editingCell.day >= daysInMonth}
                onClick={() =>
                  setEditingCell({
                    memberId: editingCell.memberId,
                    day: Math.min(daysInMonth, editingCell.day + 1),
                  })
                }
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-30"
              >
                <span>Next Day</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meal History / Audit Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#659287] text-white">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1A332C]">
                    Meal Update Audit History
                  </h3>
                  <p className="text-xs text-gray-500">
                    Full changelog showing User, Previous value, New value, and Date & Time
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto">
              {monthAudits.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No meal updates recorded yet for this month.
                </div>
              ) : (
                <div className="space-y-2">
                  {monthAudits.map(audit => {
                    const dateObj = new Date(audit.timestamp);
                    const formattedDate = dateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const formattedTime = dateObj.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={audit.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 text-xs hover:bg-[#E6F2DD]/30 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1A332C]">
                              {audit.memberName}
                            </span>
                            <span className="rounded-md bg-white border border-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                              Day {audit.day}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <User className="h-3 w-3 text-[#659287]" />
                            <span>Updated by: <strong className="text-gray-700">{audit.user}</strong></span>
                          </div>
                        </div>

                        <div className="mt-2 sm:mt-0 flex items-center gap-4">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="rounded-lg bg-gray-200/80 px-2 py-1 text-gray-600 line-through">
                              {audit.previousValue}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="rounded-lg bg-[#659287] px-2 py-1 font-bold text-white shadow-2xs">
                              {audit.newValue}
                            </span>
                          </div>
                          <div className="text-right text-[11px] text-gray-400 whitespace-nowrap">
                            <div>{formattedDate}</div>
                            <div>{formattedTime}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="rounded-xl bg-[#659287] px-4 py-2 text-xs font-bold text-white hover:bg-[#52776e]"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
