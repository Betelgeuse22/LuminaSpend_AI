import React, { useState, useRef } from 'react';
import { Camera, X, Loader2, Sparkles, ScanLine } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { parseReceiptImage } from '../services/geminiService';
import { Receipt } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface ScannerProps {
  onScanComplete: (receipt: Receipt) => void;
  onCancel: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onCancel }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('Ready to scan');
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
    setStatus('Initializing Quantum Core...');
    
    try {
      setTimeout(() => setStatus('Extracting neural patterns...'), 1000);
      setTimeout(() => setStatus('Categorizing molecular data...'), 2500);

      const data = await parseReceiptImage(image);
      
      const newReceipt: Receipt = {
        id: generateId(),
        storeName: data.storeName || "Unknown Store",
        date: data.date || new Date().toISOString().split('T')[0],
        total: data.total || 0,
        currency: data.currency || "USD",
        items: data.items || [],
        imageUrl: image,
        confidence: data.confidence || 0.8,
        aiInsight: data.aiInsight
      };

      setStatus('Complete');
      onScanComplete(newReceipt);
    } catch (error) {
      console.error(error);
      setStatus('Scan Failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="scanner-overlay">
      <GlassCard className="scanner-card">
        <button 
          onClick={onCancel}
          className="scanner-close-button"
        >
          <X size={24} />
        </button>

        <h2 className="scanner-title">
          <ScanLine />
          AI Receipt Scanner
        </h2>

        {!image ? (
          <div className="scanner-upload-box">
            <div className="scanner-upload-icon-wrapper">
              <Camera size={48} />
            </div>
            <div className="scanner-upload-text">
              <p className="scanner-upload-main-text">Capture Receipt</p>
              <p className="scanner-upload-sub-text">Take a clear photo for best AI results</p>
            </div>
            
            <div className="scanner-button-group">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="scanner-button"
              >
                <Camera size={20} />
                Camera
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
            
            <p className="scanner-upload-info">Supports: JPG, PNG • Max 10MB</p>
          </div>
        ) : (
          <div className="scanner-preview-container">
            <div className="scanner-image-preview-wrapper">
              <img src={image} alt="Preview" className="scanner-image-preview" />
              
              {isProcessing && <div className="scan-beam"></div>}
              
              <div className="scanner-grid-overlay"></div>
            </div>

            <div className="scanner-processing-section">
               {isProcessing ? (
                 <div className="scanner-processing-info">
                   <div className="processing-status-bar">
                      <span className="processing-status-text">
                        <Loader2 size={14} />
                        PROCESSING
                      </span>
                      <span>{Math.floor(Math.random() * 30) + 70}%</span>
                   </div>
                   <div className="progress-bar-bg">
                     <div className="progress-bar-fg"></div>
                   </div>
                   <p className="processing-status-message">{status}</p>
                 </div>
               ) : (
                 <div className="scanner-actions-grid">
                   <button 
                     onClick={() => setImage(null)}
                     className="scanner-retake-button"
                   >
                     Retake
                   </button>
                   <button 
                     onClick={processImage}
                     className="scanner-analyze-button"
                   >
                     <Sparkles size={18} />
                     Analyze
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