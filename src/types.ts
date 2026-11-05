export type MonthStatus = 'active' | 'locked' | 'archived';
export type MealRateMode = 'auto' | 'fixed';
export type BalanceStatus = 'Receivable' | 'Payable' | 'Settled';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'manager' | 'member';
  isMaster?: boolean;
  passwordHash: string;
  createdAt: string;
}

export interface MonthRecord {
  id: string;
  name: string; // e.g. "September"
  year: number; // e.g. 2026
  daysInMonth: number;
  status: MonthStatus;
  mealRateMode: MealRateMode;
  fixedMealRate: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface Member {
  id: string;
  monthId: string;
  name: string;
  email?: string;
  phone?: string;
  initialDeposit: number;
  previousBalance: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface Deposit {
  id: string;
  monthId: string;
  memberId: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface MealEntry {
  id: string;
  monthId: string;
  memberId: string;
  day: number;
  quantity: number; // 0, 0.5, 1, 1.5, 2, 2.5
  updatedAt: string;
  updatedBy: string;
}

export interface MealAuditRecord {
  id: string;
  monthId: string;
  memberId: string;
  memberName: string;
  day: number;
  previousValue: number;
  newValue: number;
  user: string;
  timestamp: string;
}

export interface BazaarExpense {
  id: string;
  monthId: string;
  date: string;
  description: string;
  amount: number; // Can be negative e.g. if taken from shared mess funds
  paidById: string; // memberId or 'shared_fund'
  paidByName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface UniversalExpense {
  id: string;
  monthId: string;
  date: string;
  description: string;
  amount: number;
  paidById: string; // memberId
  paidByName: string;
  applicableMemberIds: string[]; // members splitting this expense
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface AuditLog {
  id: string;
  monthId?: string;
  user: string;
  action: string;
  target: string;
  date: string;
  time: string;
  details?: string;
}

export interface MemberCalculation {
  memberId: string;
  memberName: string;
  totalMeals: number;
  initialDeposit: number;
  additionalDeposits: number;
  totalDeposit: number;
  previousBalance: number;
  bazaarCredit: number;
  universalCredit: number;
  universalExpenseShare: number;
  mealCost: number;
  totalCost: number;
  finalBalance: number;
  status: BalanceStatus;
}

export interface MonthSummary {
  totalMembers: number;
  totalMeals: number;
  totalBazaarCost: number;
  totalUniversalExpenses: number;
  totalDeposits: number;
  mealRate: number;
  isFixedRate: boolean;
  memberCalculations: MemberCalculation[];
}

export interface AppStateData {
  users: User[];
  currentUserId: string | null;
  months: MonthRecord[];
  activeMonthId: string;
  members: Member[];
  deposits: Deposit[];
  meals: MealEntry[];
  mealAudits: MealAuditRecord[];
  bazaarExpenses: BazaarExpense[];
  universalExpenses: UniversalExpense[];
  auditLogs: AuditLog[];
}
