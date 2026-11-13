import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, ScreenType } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { CalculatorWidget } from './components/CalculatorWidget';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { MembersScreen } from './screens/MembersScreen';
import { DailyMealsScreen } from './screens/DailyMealsScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { MasterKeyGate } from './components/MasterKeyGate';

const VALID_SCREENS: ScreenType[] = [
  'dashboard',
  'members',
  'meals',
  'bazaar',
  'universal',
  'expenses',
  'reports',
  'settings',
];

const getScreenFromHash = (): ScreenType => {
  if (typeof window === 'undefined') return 'dashboard';
  const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  if (VALID_SCREENS.includes(raw as ScreenType)) {
    return raw as ScreenType;
  }
  return 'dashboard';
};

const MainAppContent: React.FC = () => {
  const { currentUser, isMasterKey } = useApp();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => getScreenFromHash());

  // Navigation function that updates browser history so the back button navigates between views
  const navigate = useCallback((targetScreen: ScreenType, replace = false) => {
    if (!VALID_SCREENS.includes(targetScreen)) return;

    const targetHash = `#${targetScreen}`;
    if (currentScreen === targetScreen && window.location.hash === targetHash) {
      return;
    }

    // History side effects run outside the state updater so React StrictMode
    // cannot double-push entries (which would make Back require two presses).
    if (replace) {
      window.history.replaceState({ screen: targetScreen }, '', targetHash);
    } else {
      window.history.pushState({ screen: targetScreen }, '', targetHash);
    }

    setCurrentScreen(targetScreen);
  }, [currentScreen]);

  // Listen to browser popstate (back and forward buttons / Android back gesture)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const screenFromState = event.state?.screen;
      const target = screenFromState && VALID_SCREENS.includes(screenFromState)
        ? screenFromState
        : getScreenFromHash();

      setCurrentScreen(target);
    };

    const handleHashChange = () => {
      const target = getScreenFromHash();
      setCurrentScreen(prev => (prev !== target ? target : prev));
    };

    // Initialize history baseline so pressing back from a sub-view navigates back rather than exiting
    const current = getScreenFromHash();
    if (!window.history.state || !window.history.state.initialized) {
      if (current !== 'dashboard') {
        window.history.replaceState({ screen: 'dashboard', initialized: true }, '', '#dashboard');
        window.history.pushState({ screen: current, initialized: true }, '', `#${current}`);
      } else {
        window.history.replaceState({ screen: 'dashboard', initialized: true }, '', '#dashboard');
      }
    }

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // If user is not logged in, show Screen 1: Login
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#E6F2DD] text-[#1A332C] flex flex-col selection:bg-[#88BDA4]/30 selection:text-[#183329] w-full max-w-full overflow-x-hidden">
      {/* Top Navbar Header */}
      <Navbar currentScreen={currentScreen} onSelectScreen={navigate} />

      {/* Main Screen Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8 2xl:px-12 pt-4 sm:pt-6 pb-28 lg:pb-10">
        {currentScreen === 'dashboard' && (
          <DashboardScreen onNavigate={navigate} />
        )}
        {currentScreen === 'members' && <MembersScreen />}
        {currentScreen === 'meals' && <DailyMealsScreen />}
        {currentScreen === 'bazaar' && (
          <ExpensesScreen
            initialTab="bazaar"
            onTabChange={tab => navigate(tab as ScreenType)}
          />
        )}
        {currentScreen === 'universal' && (
          <ExpensesScreen
            initialTab="universal"
            onTabChange={tab => navigate(tab as ScreenType)}
          />
        )}
        {currentScreen === 'expenses' && (
          <ExpensesScreen
            initialTab="bazaar"
            onTabChange={tab => navigate(tab as ScreenType)}
          />
        )}
        {currentScreen === 'reports' && <ReportsScreen />}
        {currentScreen === 'settings' && (
          isMasterKey ? (
            <SettingsScreen />
          ) : (
            <MasterKeyGate
              onUnlockSuccess={() => navigate('settings')}
              onCancel={() => navigate('dashboard')}
            />
          )
        )}
      </main>

      {/* Global Bottom Navigation for Mobile & Small Devices */}
      <BottomNav currentScreen={currentScreen} onSelectScreen={navigate} />

      {/* Global Calculator Widget (visible on every screen per prompt) */}
      <CalculatorWidget />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
