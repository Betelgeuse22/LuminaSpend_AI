import React, { useState } from 'react';
import { Receipt, Product, Category } from '../types';
import { GlassCard } from './ui/GlassCard';
import { Tag, Calendar, ChevronDown, ChevronUp, ShoppingBasket } from 'lucide-react';

interface ReceiptListProps {
  receipts: Receipt[];
}

export const ReceiptList: React.FC<ReceiptListProps> = ({ receipts }) => {
  // Храним ID развернутого чека
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Функция для группировки товаров по категориям
  const groupByCategory = (items: Product[]) => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, Product[]>);
  };

  return (
    <div className="receipt-list-container">
      <h3 className="receipt-list-title">История чеков</h3>
      <div className="receipt-list-grid">
        {receipts.length === 0 ? (
          <div className="receipt-list-placeholder">Чеков пока нет...</div>
        ) : (
          receipts.map((receipt) => {
            const isExpanded = expandedId === receipt.id;
            const groups = groupByCategory(receipt.items);

            return (
              <GlassCard 
                key={receipt.id} 
                className={`receipt-card glass-panel-hover ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedId(isExpanded ? null : receipt.id)}
              >
                <div className="receipt-card-header-main">
                  <div className="receipt-card-main">
                    <div className="receipt-card-avatar">{receipt.storeName.charAt(0)}</div>
                    <div>
                      <h4 className="receipt-card-store">{receipt.storeName}</h4>
                      <div className="receipt-card-meta">
                        <span><Calendar size={12} /> {receipt.date}</span>
                        <span><Tag size={12} /> {receipt.items.length} поз.</span>
                      </div>
                    </div>
                  </div>
                  <div className="receipt-card-amount-section">
                    <p className="receipt-card-amount">
                      {receipt.totalAmount.toLocaleString()} {receipt.currency}
                    </p>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* РАЗВОРАЧИВАЕМАЯ ПАНЕЛЬ С ТОВАРАМИ */}
                {isExpanded && (
                  <div className="receipt-details-expand">
                    <div className="ai-summary-box">
                       <p>✨ {receipt.aiSummary || "AI проанализировал этот чек"}</p>
                    </div>
                    
                    {Object.entries(groups).map(([category, items]) => (
                      <div key={category} className="category-group">
                        <h5 className="category-group-title">{category}</h5>
                        <div className="items-list">
                          {items.map((item, idx) => (
                            <div key={idx} className="product-item">
                              <span className="product-name">{item.name}</span>
                              <div className="product-details">
                                <span className="product-qty">{item.quantity} шт.</span>
                                <span className="product-price">{item.price} {receipt.currency}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
};