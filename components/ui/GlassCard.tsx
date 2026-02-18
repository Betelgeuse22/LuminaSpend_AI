import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  glow = false,
  ...props // Собираем все остальные пропсы (включая onClick)
}) => {
  return (
    <div 
      className={`glass-card ${glow ? 'glass-glow' : ''} ${className}`}
      {...props} // ПЕРЕДАЕМ ИХ СЮДА
    >
      {children}
    </div>
  );
};