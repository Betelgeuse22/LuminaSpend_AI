import React, { useState, useRef } from 'react';
import { Camera, X, Loader2, Sparkles, ScanLine } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { parseReceiptImage } from '../services/aiService';
import { Receipt } from '../types';

// Вспомогательная функция для генерации ID
const generateId = () => Math.random().toString(36).substring(2, 9);

interface ScannerProps {
  onScanComplete: (receipt: Receipt) => void;
  onCancel: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onCancel }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('Готов к работе');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image) return;

    setIsProcessing(true);
    setStatus('Инициализация ИИ...');
    
    try {
      // Имитация этапов для красоты интерфейса
      setTimeout(() => setStatus('Анализ структуры чека...'), 1000);
      setTimeout(() => setStatus('Распознавание товаров...'), 2500);

      // Вызываем наш сервис (он обращается к Gemini)
      const data = await parseReceiptImage(image);
      
      // МАППИНГ: Приводим данные от ИИ к нашему стандарту
      const newReceipt: Receipt = {
        id: generateId(),
        storeName: data.storeName || "Неизвестный магазин",
        date: data.date || new Date().toISOString().split('T')[0],
        totalAmount: data.totalAmount || 0, // ИСПРАВЛЕНО
        currency: data.currency || "RUB",
        items: (data.items || []).map((item: any) => ({
          ...item,
          id: generateId(), // Добавляем ID каждому товару
          confidence: item.confidence || 0.9 // Устанавливаем уверенность
        })),
        imageUrl: image,
        aiSummary: data.aiSummary // ИСПРАВЛЕНО
      };

      setStatus('Готово!');
      // Передаем результат в родительский компонент App.tsx
      onScanComplete(newReceipt);
    } catch (error) {
      console.error("Ошибка сканирования:", error);
      setStatus('Ошибка. Попробуйте другое фото.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="scanner-overlay">
      <GlassCard className="scanner-card">
        <button onClick={onCancel} className="scanner-close-button">
          <X size={24} />
        </button>

        <h2 className="scanner-title">
          <ScanLine className="scanner-title-icon" />
          AI Сканер чеков
        </h2>

        {!image ? (
          <div className="scanner-upload-box">
            <div className="scanner-upload-icon-wrapper">
              <Camera size={48} />
            </div>
            <div className="scanner-upload-text">
              <p className="scanner-upload-main-text">Сфотографируйте чек</p>
              <p className="scanner-upload-sub-text">Для лучшего результата сделайте четкое фото</p>
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="scanner-button"
            >
              <Camera size={20} />
              Выбрать фото
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden-file-input" 
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="scanner-preview-container">
            <div className="scanner-image-preview-wrapper">
              <img src={image} alt="Preview" className="scanner-image-preview" />
              
              {/* ТОТ САМЫЙ ЛАЗЕРНЫЙ ЛУЧ */}
              {isProcessing && <div className="scan-beam"></div>}
              
              <div className="scanner-grid-overlay"></div>
            </div>

            <div className="scanner-processing-section">
               {isProcessing ? (
                 <div className="scanner-processing-info">
                   <div className="processing-status-bar">
                      <span className="processing-status-text">
                        <Loader2 className="animate-spin" size={14} />
                        ОБРАБОТКА
                      </span>
                   </div>
                   <div className="progress-bar-bg">
                     <div className="progress-bar-fg"></div>
                   </div>
                   <p className="processing-status-message">{status}</p>
                 </div>
               ) : (
                 <div className="scanner-actions-grid">
                   <button onClick={() => setImage(null)} className="scanner-retake-button">
                     Заново
                   </button>
                   <button onClick={processImage} className="scanner-analyze-button">
                     <Sparkles size={18} />
                     Анализировать
                   </button>
                 </div>
               )}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};