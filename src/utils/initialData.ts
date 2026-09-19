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
      passwordHash: '8cb2237d0679ca88db6464eac60da96345513964ec4f45bb8d0b00808d965229',
      createdAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'usr-manager',
      username: 'manager',
      fullName: 'Manager',
      role: 'member' as const,
      isMaster: false,
      // SHA-256 for 'manager123'
      passwordHash: '326848245582f349c253fc52fd38d8f07efd93e1bcfb0a88099c27710bfe317b',
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
