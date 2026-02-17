import React, { useEffect, useState } from 'react';
import { Receipt, SpendingInsight } from '../types';
import { generateSavingsAdvice } from '../services/geminiService';
import { GlassCard } from './ui/GlassCard';
import { Lightbulb, AlertTriangle, TrendingDown, RefreshCw } from 'lucide-react';

interface InsightsPanelProps {
  receipts: Receipt[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ receipts }) => {
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    if (receipts.length === 0) return;
    setLoading(true);
    const data = await generateSavingsAdvice(receipts);
    setInsights(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipts.length]); // Only refresh if receipt count changes to avoid spamming API

  if (receipts.length === 0) return null;

  return (
    <div className="insights-panel-container">
      <div className="insights-header">
         <h3 className="insights-title">
           <Lightbulb size={20} />
           AI Savings Advisor
         </h3>
         <button onClick={fetchInsights} disabled={loading} className="insights-refresh-button">
            <RefreshCw size={16} className={loading ? "spinning" : ""} />
         </button>
      </div>

      <div className="insights-grid">
        {loading && insights.length === 0 ? (
             <GlassCard className="insight-card-loading">
                <div />
             </GlassCard>
        ) : (
            insights.map((insight, idx) => (
            <GlassCard key={idx} className="insight-card">
                <div className="insight-card-bg-icon">
                    {insight.type === 'warning' ? <AlertTriangle size={40} /> : <TrendingDown size={40} />}
                </div>
                <div className="insight-card-content">
                    <h4 className="insight-card-title">{insight.title}</h4>
                    <p className="insight-card-description">
                        {insight.description}
                    </p>
                    {insight.impact && (
                        <div className="insight-card-impact">
                            POTENTIAL SAVINGS: {insight.impact}
                        </div>
                    )}
                </div>
            </GlassCard>
            ))
        )}
        
        {!loading && insights.length === 0 && (
            <div className="insights-placeholder">
                Add more receipts to unlock personalized AI insights.
            </div>
        )}
      </div>
    </div>
  );
};