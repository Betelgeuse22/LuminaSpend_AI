import React, { useState, useEffect, useRef} from 'react';
import { HashRouter } from 'react-router-dom';
import { LayoutGrid, List, Scan, Settings, LogIn, Bot } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

// Components
import { Scanner } from './components/Scanner';
import { Dashboard } from './components/Dashboard';
import { ReceiptList } from './components/ReceiptList';
import { InsightsPanel } from './components/InsightsPanel';
import { Auth } from './components/Auth';

// Services & Utils
import { supabase } from './lib/supabase';
import { deleteReceiptFromDb } from './services/aiService';
import { Receipt } from './types';

const App: React.FC = () => {
  // --- 1. Состояние ---
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'insights'>('dashboard');
  const [showScanner, setShowScanner] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);


  // Эффект для закрытия при клике вне меню
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Если меню открыто И клик был НЕ по меню и НЕ по аватару
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // --- 2. Эффекты (Авторизация) ---
  useEffect(() => {
    // Проверяем сессию при старте
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Слушаем изменения (вход/выход)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 3. Эффекты (Загрузка данных) ---
  useEffect(() => {
    if (session) {
      fetchReceipts();
    }
  }, [session]); // Перезагружаем, когда меняется пользователь

  // --- 4. Логика данных ---
  const fetchReceipts = async () => {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching receipts:', error);
    } else if (data) {
      const formattedData = data.map(r => ({
        id: r.id,
        storeName: r.store_name,
        date: r.transaction_date,
        totalAmount: r.total_amount,
        currency: r.currency,
        items: r.items,
        aiSummary: r.ai_summary
      }));
      setReceipts(formattedData);
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    const success = await deleteReceiptFromDb(id);
    if (success) {
      setReceipts(prev => prev.filter(r => r.id !== id));
    } else {
      alert('Не удалось удалить чек из базы данных.');
    }
  };

  const handleScanComplete = async (newReceipt: Partial<Receipt>) => {
    const { error } = await supabase
      .from('receipts')
      .insert([{
        store_name: newReceipt.storeName,
        transaction_date: newReceipt.date,
        total_amount: newReceipt.totalAmount,
        currency: newReceipt.currency,
        items: newReceipt.items,
        ai_summary: newReceipt.aiSummary,
        user_id: session?.user.id // Привязываем чек к юзеру
      }]);

    if (!error) {
      fetchReceipts();
      setShowScanner(false);
      setActiveTab('history');
    } else {
      console.error('Save error:', error);
    }
  };

  // --- 5. Вспомогательные функции UI ---
  const navigateToReceipt = (id: string) => {
    setActiveTab('history');
    setTimeout(() => {
      const element = document.getElementById(`receipt-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const header = element.querySelector('.receipt-card-header-clickable');
        const details = element.querySelector('.receipt-details-expand');
        if (header && !details) (header as HTMLElement).click();
        element.style.transition = "box-shadow 0.5s ease";
        element.style.boxShadow = "0 0 30px rgba(59, 130, 246, 0.8)";
        setTimeout(() => { element.style.boxShadow = ""; }, 2000);
      }
    }, 200);
  };

  const getNavButtonClasses = (tabName: string) => 
    `nav-button ${activeTab === tabName ? 'active' : ''}`;

  // --- 6. Условный рендеринг (Гварды) ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  // Данные профиля (теперь безопасно, так как session проверен)
  const userInitial = session.user.email?.[0].toUpperCase() || 'U';
  const avatarUrl = session.user.user_metadata?.avatar_url;

  return (
    <HashRouter>
      <div className="app-container">
        
       <header className="app-header">
  <div className="header-logo-container">
    <div className="header-logo-icon-wrapper"><Scan size={18} /></div>
    <h1 className="header-title">LuminaSpend</h1>
  </div>
  
  <div className="user-profile-relative" ref={menuRef}>
    {/* Кнопка аватара теперь просто открывает меню */}
    <div 
      className="user-profile-wrapper" 
      onClick={() => setShowProfileMenu(!showProfileMenu)}
    >
      <div className="user-profile-avatar glass-panel">
        {avatarUrl ? (
          <img src={avatarUrl} alt="User" className="avatar-image" />
        ) : (
          <span className="avatar-initial">{userInitial}</span>
        )}
      </div>
    </div>

    {/* Само всплывающее меню */}
    {showProfileMenu && (
      <>
        {/* Невидимая подложка, чтобы закрыть меню при клике вне его */}
        <div className="menu-overlay" onClick={() => setShowProfileMenu(false)} />
        
        <div className="profile-dropdown glass-panel animate-fade-in">
          <div className="dropdown-header">
            <p className="dropdown-name">{session.user.user_metadata?.full_name || 'Пользователь'}</p>
            <p className="dropdown-email">{session.user.email}</p>
          </div>
          
          <div className="dropdown-divider"></div>
          
          <button className="dropdown-item" onClick={() => { /* Тут можно открыть настройки */ }}>
            <Settings size={16} />
            <span>Настройки</span>
          </button>
          
          <button className="dropdown-item logout" onClick={() => supabase.auth.signOut()}>
            <LogIn size={16} style={{ transform: 'rotate(180deg)' }} />
            <span>Выйти</span>
          </button>
        </div>
      </>
    )}
  </div>
</header>

        <main className="main-content">
          {activeTab === 'dashboard' && (
            <div className="tab-content">
              <div className="page-header">
                <h2 className="page-title">Financial Overview</h2>
                <p className="page-subtitle">Your real-time spending intelligence.</p>
              </div>
              <Dashboard receipts={receipts} onNavigate={navigateToReceipt}/>
              <div className="insights-container"><InsightsPanel receipts={receipts} /></div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="tab-content">
              <div className="page-header-flex">
                <div>
                  <h2 className="page-title">Receipt History</h2>
                  <p className="page-subtitle">Archive of processed transactions.</p>
                </div>
              </div>
              <ReceiptList receipts={receipts} onDelete={handleDeleteReceipt} />
            </div>
          )}
          
          {activeTab === 'insights' && (
            <div className="tab-content">
              <div className="page-header"><h2 className="page-title">AI Advisor</h2></div>
              <InsightsPanel receipts={receipts} />
            </div>
          )}
        </main>

        <nav className="bottom-nav">
          <div className="bottom-nav-inner">
            <button onClick={() => setActiveTab('dashboard')} className={getNavButtonClasses('dashboard')}>
              <LayoutGrid size={20} /><span className="nav-button-label">Overview</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={getNavButtonClasses('history')}>
              <List size={20} /><span className="nav-button-label">History</span>
            </button>
            <button onClick={() => setShowScanner(true)} className="nav-button-scan">
              <Scan size={20} /><span className="nav-button-label">Scan</span>
            </button>
            <button onClick={() => setActiveTab('insights')} className={getNavButtonClasses('insights')}>
              <Bot size={20} /><span className="nav-button-label">Advisor</span>
            </button>
            <button className="nav-button"><Settings size={20} /><span className="nav-button-label">Settings</span></button>
          </div>
        </nav>

        {showScanner && (
          <Scanner onScanComplete={handleScanComplete} onCancel={() => setShowScanner(false)} />
        )}
      </div>
    </HashRouter>
  );
};

export default App;