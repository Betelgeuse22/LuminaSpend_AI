import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { Scanner } from './components/Scanner';
import { Dashboard } from './components/Dashboard';
import { ReceiptList } from './components/ReceiptList';
import { InsightsPanel } from './components/InsightsPanel';
import { Receipt } from './types';
import { MOCK_RECEIPTS } from './constants';
import { LayoutGrid, List, Scan, Settings, Bot } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'insights'>('dashboard');
  const [showScanner, setShowScanner] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    setReceipts(MOCK_RECEIPTS);
  }, []);

  const handleScanComplete = (newReceipt: Receipt) => {
    setReceipts(prev => [newReceipt, ...prev]);
    setShowScanner(false);
    setActiveTab('history');
  };

  const getNavButtonClasses = (tabName: 'dashboard' | 'history' | 'insights') => {
    return `nav-button ${activeTab === tabName ? 'active' : ''}`;
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
               <Dashboard receipts={receipts} />
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
              <ReceiptList receipts={receipts} />
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