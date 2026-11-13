import { AppStateData } from '../types';

export const INITIAL_STORAGE_KEY = 'smart_meal_manager_state_v1';

export function getInitialSeedData(): AppStateData {
  const currentYear = 2026;
  const monthName = 'September';
  const monthId = 'month-sep-2026';
  const daysInMonth = 30;

  const users = [
    {
      id: 'usr-sabbirprogrammer',
      username: 'sabbirprogrammer',
      fullName: 'Sabbir Programmer',
      role: 'manager' as const,
      isMaster: true,
      // SHA-256 for 'ASmin1234'
      passwordHash: '42373e9eda5d1f30f701e8e4acbcf2a600e3d898239c62d8a0b2138905fe3349',
      createdAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'usr-manager',
      username: 'manager',
      fullName: 'Manager',
      role: 'member' as const,
      isMaster: false,
      // SHA-256 for 'manager123'
      passwordHash: '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5',
      createdAt: '2026-09-01T08:00:00.000Z',
    },
  ];

  const months = [
    {
      id: monthId,
      name: monthName,
      year: currentYear,
      daysInMonth: daysInMonth,
      status: 'active' as const,
      mealRateMode: 'auto' as const,
      fixedMealRate: 0,
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:00:00.000Z',
      createdBy: 'manager',
      updatedBy: 'manager',
    },
  ];

  return {
    users,
    currentUserId: null, // Require explicit authentication with username and password
    months,
    activeMonthId: monthId,
    members: [],
    deposits: [],
    meals: [],
    mealAudits: [],
    bazaarExpenses: [],
    universalExpenses: [],
    auditLogs: [],
  };
}
