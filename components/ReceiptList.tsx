import React from 'react';
import { Receipt } from '../types';
import { GlassCard } from './ui/GlassCard';
import { Tag, Calendar } from 'lucide-react';

interface ReceiptListProps {
  receipts: Receipt[];
}

export const ReceiptList: React.FC<ReceiptListProps> = ({ receipts }) => {
  return (
    <div className="receipt-list-container">
      <h3 className="receipt-list-title">Recent Transactions</h3>
      <div className="receipt-list-grid">
        {receipts.length === 0 ? (
          <div className="receipt-list-placeholder">
            No receipts scanned yet. Start scanning to track your expenses!
          </div>
        ) : (
          receipts.map((receipt) => (
            <GlassCard key={receipt.id} className="receipt-card glass-panel-hover">
              <div className="receipt-card-main">
                <div className="receipt-card-avatar">
                  {receipt.storeName.charAt(0)}
                </div>
                <div>
                  <h4 className="receipt-card-store">
                    {receipt.storeName}
                  </h4>
                  <div className="receipt-card-meta">
                    <span className="receipt-card-meta-item">
                      <Calendar size={12} /> {receipt.date}
                    </span>
                    <span className="receipt-card-meta-item">
                      <Tag size={12} /> {receipt.items.length} items
                    </span>
                  </div>
                </div>
              </div>
              <div className="receipt-card-amount-section">
                <p className="receipt-card-amount">
                  ${receipt.total.toFixed(2)}
                </p>
                {receipt.aiInsight && (
                    <span className="receipt-card-ai-badge">
                        AI Analyzed
                    </span>
                )}
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
};