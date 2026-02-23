import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { Scanner } from './components/Scanner';
import { Dashboard } from './components/Dashboard';
import { ReceiptList } from './components/ReceiptList';
import { InsightsPanel } from './components/InsightsPanel';
import { Receipt } from './types';
import { MOCK_RECEIPTS } from './constants';
import { LayoutGrid, List, Scan, Settings, Bot } from 'lucide-react';
import { supabase } from './lib/supabase';
import { deleteReceiptFromDb } from './services/aiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'insights'>('dashboard');
  const [showScanner, setShowScanner] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const fetchReceipts = async () => {
    const { data, error } = await supabase
    .from('receipts')
     .select('*')
     .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching receipts:', error);
    } else {
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
  // 1. Пытаемся удалить из базы
  const success = await deleteReceiptFromDb(id);
  
  if (success) {
    // 2. Если в базе удалилось, убираем из стейта на экране
    setReceipts(prev => prev.filter(r => r.id !== id));
  } else {
    alert('Не удалось удалить чек из базы данных.');
  }
};

  useEffect(() => {
    fetchReceipts()
  }, []);


  const handleScanComplete = async (newReceipt: Partial<Receipt>) => {
  const { data, error } = await supabase
    .from('receipts')
    .insert([
      {
        store_name: newReceipt.storeName,
        transaction_date: newReceipt.date,
        total_amount: newReceipt.totalAmount,
        currency: newReceipt.currency,
        items: newReceipt.items,
        ai_summary: newReceipt.aiSummary
      }
    ])
    .select();

  if (!error) {
    fetchReceipts(); // Обновляем список
    setShowScanner(false);
    setActiveTab('history');
  } else {
    console.error('Save error:', error);
  }
};

  const getNavButtonClasses = (tabName: 'dashboard' | 'history' | 'insights') => {
    return `nav-button ${activeTab === tabName ? 'active' : ''}`;
  };

 const navigateToReceipt = (id: string) => {
  setActiveTab('history');

  // Увеличим задержку до 150-200мс, чтобы React точно успел переключить таб
  setTimeout(() => {
    const element = document.getElementById(`receipt-${id}`);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Находим кликабельную шапку
      const header = element.querySelector('.receipt-card-header-clickable');
      
      // Проверяем, не развернут ли он уже (по классу или стейту мы не можем, 
      // но можем проверить наличие блока деталей)
      const details = element.querySelector('.receipt-details-expand');
      
      if (header && !details) {
        (header as HTMLElement).click();
      }

      // Эффект "неонового мигания" для привлечения внимания
      element.style.transition = "box-shadow 0.5s ease";
      element.style.boxShadow = "0 0 30px rgba(59, 130, 246, 0.8)";
      setTimeout(() => {
        element.style.boxShadow = "";
      }, 2000);
    } else {
      console.warn(`Receipt element with id receipt-${id} not found in DOM`);
    }
  }, 200);
};
  return (
    <HashRouter>
      <div className="app-container">
        
        <header className="app-header">
          <div className="header-logo-container">
             <div className="header-logo-icon-wrapper">
               <Scan size={18} />
             </div>
             <h1 className="header-title">
               LuminaSpend
             </h1>
          </div>
          <button className="header-action-button">
            <div className="notification-dot"></div>
            <Bot size={24} />
          </button>
        </header>

        <main className="main-content">
          
          {activeTab === 'dashboard' && (
             <div className="tab-content">
               <div className="page-header">
                 <h2 className="page-title">Financial Overview</h2>
                 <p className="page-subtitle">Your real-time spending intelligence.</p>
               </div>
               <Dashboard receipts={receipts} onNavigate={navigateToReceipt}/>
               <div className="insights-container">
                  <InsightsPanel receipts={receipts} />
               </div>
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
                <div className="page-header">
                   <h2 className="page-title">AI Advisor</h2>
                   <p className="page-subtitle">Deep learning analysis of your habits.</p>
                </div>
                <InsightsPanel receipts={receipts} />
             </div>
          )}
        </main>

        <nav className="bottom-nav">
          <div className="bottom-nav-inner">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={getNavButtonClasses('dashboard')}
            >
              <LayoutGrid size={20} />
              <span className="nav-button-label">Overview</span>
            </button>

            <button 
              onClick={() => setActiveTab('history')}
              className={getNavButtonClasses('history')}
            >
              <List size={20} />
              <span className="nav-button-label">History</span>
            </button>
            
            <button
              onClick={() => setShowScanner(true)}
              className="nav-button-scan"
            >
              <Scan size={20} />
              <span className="nav-button-label">Scan</span>
            </button>

            <button 
              onClick={() => setActiveTab('insights')}
              className={getNavButtonClasses('insights')}
            >
              <Bot size={20} />
              <span className="nav-button-label">Advisor</span>
            </button>

             <button 
              className="nav-button"
            >
              <Settings size={20} />
              <span className="nav-button-label">Settings</span>
            </button>
          </div>
        </nav>

        {showScanner && (
          <Scanner 
            onScanComplete={handleScanComplete} 
            onCancel={() => setShowScanner(false)} 
          />
        )}
      </div>
    </HashRouter>
  );
};

export default App;