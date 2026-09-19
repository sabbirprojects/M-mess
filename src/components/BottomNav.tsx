import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Receipt,
  FileText,
  Settings,
} from 'lucide-react';
import { ScreenType } from './Navbar';
import { useApp } from '../context/AppContext';

interface BottomNavProps {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onSelectScreen,
}) => {
  const { isMasterKey } = useApp();

  const isExpensesActive =
    currentScreen === 'bazaar' ||
    currentScreen === 'universal' ||
    currentScreen === 'expenses';

  const navTabs = [
    {
      id: 'dashboard' as ScreenType,
      label: 'Home',
      icon: LayoutDashboard,
      isActive: currentScreen === 'dashboard',
    },
    {
      id: 'meals' as ScreenType,
      label: 'Meals',
      icon: UtensilsCrossed,
      isActive: currentScreen === 'meals',
    },
    {
      id: 'members' as ScreenType,
      label: 'Members',
      icon: Users,
      isActive: currentScreen === 'members',
    },
    {
      id: 'bazaar' as ScreenType,
      label: 'Expenses',
      icon: Receipt,
      isActive: isExpensesActive,
    },
    {
      id: 'reports' as ScreenType,
      label: 'Reports',
      icon: FileText,
      isActive: currentScreen === 'reports',
    },
    ...(isMasterKey
      ? [
          {
            id: 'settings' as ScreenType,
            label: 'Settings',
            icon: Settings,
            isActive: currentScreen === 'settings',
          },
        ]
      : []),
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Navigation"
      className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#88BDA4]/30 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] transition-all"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-1.5 py-1 sm:py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <button
              key={tab.id}
              id={`bottom-nav-tab-${tab.id}`}
              onClick={() => onSelectScreen(tab.id)}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 sm:px-2 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
                active
                  ? 'text-[#659287]'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <div
                className={`flex h-7 w-8 sm:h-8 sm:w-10 items-center justify-center rounded-xl transition-all ${
                  active
                    ? 'bg-[#E6F2DD] text-[#659287] shadow-2xs font-bold'
                    : 'text-gray-500'
                }`}
              >
                <Icon className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[9px] sm:text-[10px] tracking-tight mt-0.5 truncate max-w-full leading-none transition-all ${
                  active ? 'font-extrabold text-[#1A332C]' : 'font-medium text-gray-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
