import {
  BazaarExpense,
  Deposit,
  MealEntry,
  Member,
  MemberCalculation,
  MonthRecord,
  MonthSummary,
  UniversalExpense,
} from '../types';

export function calculateMonthSummary(
  month: MonthRecord,
  members: Member[],
  deposits: Deposit[],
  meals: MealEntry[],
  bazaarExpenses: BazaarExpense[],
  universalExpenses: UniversalExpense[]
): MonthSummary {
  const monthMembers = members.filter(m => m.monthId === month.id);
  const monthDeposits = deposits.filter(d => d.monthId === month.id);
  const monthMeals = meals.filter(m => m.monthId === month.id);
  const monthBazaar = bazaarExpenses.filter(b => b.monthId === month.id);
  const monthUniversal = universalExpenses.filter(u => u.monthId === month.id);

  // Total Bazaar Cost:
  // Out-of-pocket spending and market purchases represent real, positive expenses for the mess.
  // Therefore, when calculating total expenditure, out-of-pocket spending is added (+)
  // to the total expenses (using absolute magnitude), not subtracted, ensuring the total cost
  // and meal rate reflect the true total expenditure of the mess.
  const totalBazaarCost = monthBazaar
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);

  // Total Meals in the month
  const totalMeals = monthMeals.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  // Total Universal Expenses in the month (added as positive expenditures)
  const totalUniversalExpenses = monthUniversal
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);

  // Meal Rate calculation
  let mealRate = 0;
  const isFixedRate = month.mealRateMode === 'fixed';
  if (isFixedRate) {
    mealRate = Number(month.fixedMealRate) || 0;
  } else {
    mealRate = totalMeals > 0 ? totalBazaarCost / totalMeals : 0;
  }

  // Precompute universal expense shares per member
  // Universal Expense Rule: Full amount credited to payer, equal shares deducted from every member's account
  const memberUniversalShareMap: Record<string, number> = {};
  monthMembers.forEach(m => {
    memberUniversalShareMap[m.id] = 0;
  });

  monthUniversal.forEach(expense => {
    let applicable = (expense.applicableMemberIds || []).filter(id =>
      monthMembers.some(m => m.id === id)
    );
    // If no specific subset is selected or list is empty, default to splitting equally across EVERY member
    if (applicable.length === 0 && monthMembers.length > 0) {
      applicable = monthMembers.map(m => m.id);
    }
    if (applicable.length > 0) {
      const splitAmount = (Number(expense.amount) || 0) / applicable.length;
      applicable.forEach(id => {
        memberUniversalShareMap[id] = (memberUniversalShareMap[id] || 0) + splitAmount;
      });
    }
  });

  // Calculate per-member breakdown
  let totalDepositsSum = 0;

  const memberCalculations: MemberCalculation[] = monthMembers.map(member => {
    // Member's meals
    const memberMealsCount = monthMeals
      .filter(m => m.memberId === member.id)
      .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

    // Member's additional deposits logged
    const addDeposits = monthDeposits
      .filter(d => d.memberId === member.id)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const initialDep = Number(member.initialDeposit) || 0;
    const totalMemberDeposit = initialDep + addDeposits;
    totalDepositsSum += totalMemberDeposit;

    const prevBal = Number(member.previousBalance) || 0;

    // Bazaar Credit: amount paid by this member for bazaar
    const bazaarCredit = monthBazaar
      .filter(b => b.paidById === member.id)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // Universal Credit: amount paid by this member for universal expenses
    const universalCredit = monthUniversal
      .filter(u => u.paidById === member.id)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // Member's universal expense share
    const universalExpenseShare = memberUniversalShareMap[member.id] || 0;

    // Meal Cost = Total Meals * Meal Rate
    const mealCost = memberMealsCount * mealRate;

    // Total Cost = (Total Meals * Meal Rate) + Universal Expense Share
    const totalCost = mealCost + universalExpenseShare;

    // Final Balance = (Previous Balance + Deposits + Bazaar Credits + Universal Credits) - Member Cost
    const totalCreditsAndDeposits = prevBal + totalMemberDeposit + bazaarCredit + universalCredit;
    const finalBalance = totalCreditsAndDeposits - totalCost;

    // Status:
    // If Final Balance > 0 -> Status = Receivable
    // If Final Balance < 0 -> Status = Payable
    // If Final Balance = 0 -> Status = Settled
    // (using 0.001 tolerance for floating point rounding)
    let status: 'Receivable' | 'Payable' | 'Settled' = 'Settled';
    if (Math.abs(finalBalance) < 0.001) {
      status = 'Settled';
    } else if (finalBalance > 0) {
      status = 'Receivable';
    } else {
      status = 'Payable';
    }

    return {
      memberId: member.id,
      memberName: member.name,
      totalMeals: memberMealsCount,
      initialDeposit: initialDep,
      additionalDeposits: addDeposits,
      totalDeposit: totalMemberDeposit,
      previousBalance: prevBal,
      bazaarCredit,
      universalCredit,
      universalExpenseShare,
      mealCost,
      totalCost,
      finalBalance,
      status,
    };
  });

  return {
    totalMembers: monthMembers.length,
    totalMeals,
    totalBazaarCost,
    totalUniversalExpenses,
    totalDeposits: totalDepositsSum,
    mealRate,
    isFixedRate,
    memberCalculations,
  };
}

export function formatCurrency(value: number, currencySymbol: string = '৳'): string {
  if (isNaN(value)) return `${currencySymbol}0.00`;
  const formatted = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (value < -0.001) {
    return `-${currencySymbol}${formatted}`;
  }
  return `${currencySymbol}${formatted}`;
}

export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '0.00';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
