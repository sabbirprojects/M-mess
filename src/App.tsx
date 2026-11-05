import React, { useState } from 'react';
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

const MainAppContent: React.FC = () => {
  const { currentUser, isMasterKey } = useApp();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');

  // If user is not logged in, show Screen 1: Login
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#E6F2DD] text-[#1A332C] flex flex-col selection:bg-[#88BDA4]/30 selection:text-[#183329] w-full max-w-full overflow-x-hidden">
      {/* Top Navbar Header */}
      <Navbar currentScreen={currentScreen} onSelectScreen={setCurrentScreen} />

      {/* Main Screen Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8 2xl:px-12 pt-4 sm:pt-6 pb-28 lg:pb-10">
        {currentScreen === 'dashboard' && (
          <DashboardScreen onNavigate={setCurrentScreen} />
        )}
        {currentScreen === 'members' && <MembersScreen />}
        {currentScreen === 'meals' && <DailyMealsScreen />}
        {currentScreen === 'bazaar' && (
          <ExpensesScreen
            initialTab="bazaar"
            onTabChange={tab => setCurrentScreen(tab as ScreenType)}
          />
        )}
        {currentScreen === 'universal' && (
          <ExpensesScreen
            initialTab="universal"
            onTabChange={tab => setCurrentScreen(tab as ScreenType)}
          />
        )}
        {currentScreen === 'expenses' && (
          <ExpensesScreen
            initialTab="bazaar"
            onTabChange={tab => setCurrentScreen(tab as ScreenType)}
          />
        )}
        {currentScreen === 'reports' && <ReportsScreen />}
        {currentScreen === 'settings' && (
          isMasterKey ? (
            <SettingsScreen />
          ) : (
            <MasterKeyGate
              onUnlockSuccess={() => setCurrentScreen('settings')}
              onCancel={() => setCurrentScreen('dashboard')}
            />
          )
        )}
      </main>

      {/* Global Bottom Navigation for Mobile & Small Devices */}
      <BottomNav currentScreen={currentScreen} onSelectScreen={setCurrentScreen} />

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
