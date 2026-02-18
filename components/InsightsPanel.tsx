import React, { useEffect, useState } from 'react';
import { Receipt, SpendingInsight } from '../types';
import { generateSavingsAdvice } from '../services/aiService'; // Убедись, что путь верный
import { GlassCard } from './ui/GlassCard';
import { Lightbulb, AlertTriangle, TrendingDown, RefreshCw, Sparkles } from 'lucide-react';

interface InsightsPanelProps {
  receipts: Receipt[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ receipts }) => {
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    if (receipts.length === 0) return;
    setLoading(true);
    
    try {
      const data = await generateSavingsAdvice(receipts);
      
      // ГЛАВНОЕ ИСПРАВЛЕНИЕ: Проверяем, что пришел именно массив
      if (Array.isArray(data)) {
        setInsights(data);
      } else if (data && typeof data === 'object') {
        // Если ИИ обернул массив в объект, пытаемся найти его внутри
        const potentialArray = Object.values(data).find(val => Array.isArray(val));
        setInsights(Array.isArray(potentialArray) ? potentialArray : []);
      } else {
        setInsights([]);
      }
    } catch (error) {
      console.error("Ошибка получения инсайтов:", error);
      setInsights([]); // В случае ошибки сбрасываем в пустой массив
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipts.length]);

  if (receipts.length === 0) return (
    <div className="insights-placeholder">
       <Sparkles size={24} />
       <p>Загрузите первый чек, чтобы AI-советник проанализировал ваши траты</p>
    </div>
  );

  return (
    <div className="insights-panel-container">
      <div className="insights-header">
         <h3 className="insights-title">
           <Lightbulb size={20} className="text-yellow-400" />
           AI Советник по экономии
         </h3>
         <button 
           onClick={fetchInsights} 
           disabled={loading} 
           className="insights-refresh-button"
           title="Обновить советы"
         >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
         </button>
      </div>

      <div className="insights-grid">
        {loading ? (
          // Скелетон при загрузке
          [1, 2].map(i => (
            <GlassCard key={i} className="insight-card loading-shimmer">
              <div style={{ height: '80px', width: '100%', opacity: 0.1, background: 'white', borderRadius: '8px' }}></div>
            </GlassCard>
          ))
        ) : (
          // ЗАЩИТА: Добавляем Array.isArray перед map на всякий случай
          Array.isArray(insights) && insights.length > 0 ? (
            insights.map((insight, idx) => (
              <GlassCard key={idx} className={`insight-card insight-${insight.type || 'trend'}`}>
                  <div className="insight-card-bg-icon">
                      {insight.type === 'warning' ? <AlertTriangle size={40} /> : <TrendingDown size={40} />}
                  </div>
                  <div className="insight-card-content">
                      <h4 className="insight-card-title">{insight.title || 'Инсайт'}</h4>
                      <p className="insight-card-description">
                          {insight.description}
                      </p>
                      {insight.impact && (
                          <div className="insight-card-impact">
                              <Sparkles size={12} />
                              ПОТЕНЦИАЛЬНАЯ ЭКОНОМИЯ: {insight.impact}
                          </div>
                      )}
                  </div>
              </GlassCard>
            ))
          ) : (
            <div className="insights-placeholder-small">
              Пока нет новых советов. Добавьте больше чеков для глубокого анализа.
            </div>
          )
        )}
      </div>
    </div>
  );
};