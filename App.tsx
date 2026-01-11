import React, { useState, useEffect, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { AppTab, EarningEntry, ExpenseEntry, AppView, UserProfile, Theme, Language } from './types';
import { MOCK_EARNINGS, NAV_ITEMS } from './constants';
import Dashboard from './components/Dashboard';
import EarningsTracker from './components/EarningsTracker';
import DemandMap from './components/DemandMap';
import FinancialCoach from './components/FinancialCoach';
import CareerHub from './components/CareerHub';
import AuthFlow from './components/AuthFlow';
import Onboarding from './components/Onboarding';
import { useTranslation } from './services/i18nService';
import { analytics } from './services/analyticsService';
import ProfileManager from './components/ProfileManager';
import { Edit2, FileText } from 'lucide-react';

const App: React.FC = () => {
  // Global State
  const [view, setView] = useState<AppView>(() => (localStorage.getItem('gm_view') as AppView) || 'AUTH');
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('gm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [earnings, setEarnings] = useState<EarningEntry[]>(() => {
    const saved = localStorage.getItem('gm_earnings');
    return saved ? JSON.parse(saved) : MOCK_EARNINGS;
  });
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(() => {
    const saved = localStorage.getItem('gm_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { t } = useTranslation(user?.language || 'en');

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('gm_view', view);
    if (user) localStorage.setItem('gm_user', JSON.stringify(user));
    localStorage.setItem('gm_earnings', JSON.stringify(earnings));
    localStorage.setItem('gm_expenses', JSON.stringify(expenses));
  }, [view, user, earnings, expenses]);

  // Dark Mode Support
  useEffect(() => {
    const isDark = user?.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [user?.theme]);

  const handleAuthSuccess = (phoneNumber: string) => {
    analytics.logEvent('auth_success', { phone_masked: phoneNumber.slice(-2) });
    setView('ONBOARDING');
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    analytics.logEvent('onboarding_complete', { language: profile.language });
    setUser(profile);
    setView('MAIN');
  };

  const addEarning = (entry: Omit<EarningEntry, 'id'>) => {
    const newEntry = { ...entry, id: Math.random().toString(36).substr(2, 9) };
    setEarnings(prev => [newEntry, ...prev]);
    analytics.logEvent('earning_added', { platform: entry.platform, amount: entry.amount });
  };

  const addExpense = (entry: Omit<ExpenseEntry, 'id'>) => {
    const newEntry = { ...entry, id: Math.random().toString(36).substr(2, 9) };
    setExpenses(prev => [newEntry, ...prev]);
    analytics.logEvent('expense_added', { category: entry.category, amount: entry.amount });
  };

  const toggleTheme = () => {
    if (!user) return;
    const newTheme: Theme = user.theme === 'light' ? 'dark' : 'light';
    setUser({ ...user, theme: newTheme });
    analytics.logEvent('theme_toggled', { theme: newTheme });
  };

  const renderMain = useMemo(() => {
    switch (activeTab) {
      case AppTab.DASHBOARD:
        return <Dashboard earnings={earnings} expenses={expenses} language={user?.language || 'en'} />;
      case AppTab.EARNINGS:
        return <EarningsTracker earnings={earnings} onAdd={addEarning} language={user?.language || 'en'} />;
      case AppTab.MAP:
        return <DemandMap language={user?.language || 'en'} city={user?.city} platforms={user?.platforms} />;
      case AppTab.FINANCE:
        return <FinancialCoach earnings={earnings} expenses={expenses} onAddExpense={addExpense} language={user?.language || 'en'} />;
      case AppTab.CAREER:
        return <CareerHub language={user?.language || 'en'} />;
      default:
        return <Dashboard earnings={earnings} expenses={expenses} language={user?.language || 'en'} />;
    }
  }, [activeTab, earnings, expenses, user?.language, user?.theme]);

  if (view === 'AUTH') {
    return (
      <div className="max-w-md mx-auto h-screen bg-white">
        <AuthFlow onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  if (view === 'ONBOARDING') {
    return (
      <div className="max-w-md mx-auto h-screen bg-white">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  if (view === 'PROFILE_DETAILS' || view === 'PROFILE_EDIT') {
    return (
      <div className="max-w-md mx-auto h-screen bg-white relative z-[200]">
        <ProfileManager
          mode={view === 'PROFILE_EDIT' ? 'edit' : 'view'}
          user={user!}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            if (view === 'PROFILE_EDIT') setView('PROFILE_DETAILS');
          }}
          onBack={() => setView('MAIN')}
          onEdit={() => setView('PROFILE_EDIT')}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-[100dvh] overflow-hidden max-w-md mx-auto relative animate-in fade-in duration-700 ${user?.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`flex-none p-4 z-50 flex items-center justify-between border-b shadow-sm transition-colors duration-300 ${user?.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <img src="/icon.png" alt="GigMate Icon" className="w-8 h-8 rounded-lg shadow-sm" />
          <div className="flex items-baseline">
            <span className="text-2xl font-black italic text-gigmate-green tracking-tight">Gig</span>
            <span className="text-2xl font-black italic text-gigmate-blue tracking-tight">Mate</span>
          </div>
          <div className="h-4 w-px bg-gray-200"></div>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">{t.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${user?.theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100/50 text-gray-600'}`}
          >
            {user?.theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button
            onClick={() => setIsProfileOpen(true)}
            className={`flex items-center gap-2 p-1 pr-3 rounded-full border transition-all active:scale-95 ${user?.theme === 'dark'
              ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
              : 'bg-white border-gray-100 hover:bg-gray-50 shadow-sm'
              }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gigmate-green to-gigmate-blue flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
              {user?.phoneNumber?.slice(-2) || 'GM'}
            </div>
            <div className="text-left hidden xs:block">
              <p className={`text-[9px] font-black uppercase leading-none ${user?.theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>Partner</p>
              <p className="text-[11px] font-bold leading-none mt-0.5">+91...{user?.phoneNumber?.slice(-4)}</p>
            </div>
          </button>
        </div>
      </header>

      {/* Profile Overlay */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)}></div>
          <div className={`relative w-72 h-full shadow-2xl animate-in slide-in-from-right duration-500 p-6 flex flex-col ${user?.theme === 'dark' ? 'bg-gray-900 border-l border-gray-800' : 'bg-white border-l border-gray-100'}`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black italic tracking-tight">Your Profile</h3>
              <button onClick={() => setIsProfileOpen(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">✕</button>
            </div>

            <div className="flex flex-col items-center mb-8 relative">
              <button
                onClick={() => { setIsProfileOpen(false); setView('PROFILE_EDIT'); }}
                className="absolute top-0 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gigmate-blue"
              >
                <Edit2 size={16} />
              </button>
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-gigmate-green to-gigmate-blue flex items-center justify-center text-white text-3xl font-black shadow-xl mb-4">
                {user?.name ? user.name.charAt(0).toUpperCase() : (user?.phoneNumber?.slice(-2) || 'GM')}
              </div>
              <h4 className="text-lg font-black tracking-tight">{user?.name || `Partner + 91 ${user?.phoneNumber?.slice(-4)}`}</h4>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">+91 {user?.phoneNumber}</p>
              <div className="mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                Verified Partner
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className={`p-4 rounded-3xl border ${user?.theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">My Vehicle</p>
                <p className="text-sm font-bold flex items-center gap-2">
                  <span className="p-1 px-3 bg-gigmate-blue/10 text-gigmate-blue rounded-full text-[10px]">{user?.vehicle}</span>
                </p>
              </div>

              <div className={`p-4 rounded-3xl border ${user?.theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Daily Goal</p>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-gigmate-green tracking-tighter italic">₹{user?.dailyGoal}</span>
                  <span className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase">/ Day</span>
                </div>
              </div>

              <div className={`p-4 rounded-3xl border ${user?.theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Registered Platforms</p>
                <div className="flex flex-wrap gap-2">
                  {user?.platforms?.map(p => (
                    <span key={p} className="text-[9px] font-black p-1.5 px-3 bg-gray-200 dark:bg-gray-700 rounded-full">{p}</span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => { setIsProfileOpen(false); setView('PROFILE_DETAILS'); }}
              className={`w-full mb-3 p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors ${user?.theme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}
            >
              <FileText size={18} />
              View Full Details
            </button>

            <button
              onClick={() => { setView('AUTH'); setIsProfileOpen(false); localStorage.removeItem('gm_user'); }}
              className="w-full p-4 rounded-2xl bg-red-50 text-red-500 font-black text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-24">
        {renderMain}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t flex justify-around items-center h-16 px-2 z-50 transition-colors duration-300 ${user?.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              analytics.logEvent('nav_click', { tab: item.id });
            }}
            className={`flex flex-col items-center justify-center flex-1 transition-all duration-300 ${activeTab === item.id ? 'text-gigmate-green' : 'text-gray-400'
              }`}
          >
            <div className={`transition-all duration-300 p-1.5 rounded-xl ${activeTab === item.id ? 'bg-green-50/10 scale-110 shadow-sm' : 'scale-100'}`}>
              {item.icon}
            </div>
            <span className={`text-[9px] mt-1 font-black tracking-tight ${activeTab === item.id ? 'text-gigmate-green' : 'text-gray-400'}`}>
              {t[item.id as keyof typeof t] || item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
