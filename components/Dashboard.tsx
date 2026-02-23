import React, { useMemo, useRef, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Receipt } from '../types';
import { GlassCard } from './ui/GlassCard';
import { TrendingUp, DollarSign, Calendar, ShoppingBag } from 'lucide-react';

interface DashboardProps {
  onNavigate: (id: string) => void;
  receipts: Receipt[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#ec4899', '#f59e0b', '#6366f1'];

const useChartDimensions = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (chartRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.contentBoxSize) {
            const contentBoxWidth = entry.contentBoxSize[0].inlineSize;
            const contentBoxHeight = entry.contentBoxSize[0].blockSize;
            setDimensions({ width: contentBoxWidth, height: contentBoxHeight });
          } else {
            setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
          }
        }
      });
      observer.observe(chartRef.current);
      return () => observer.disconnect();
    }
  }, []);

  return { chartRef, dimensions };
};

export const Dashboard: React.FC<DashboardProps> = ({ receipts, onNavigate }) => {
  const { chartRef: areaChartRef, dimensions: areaChartDimensions } = useChartDimensions();
  const { chartRef: pieChartRef, dimensions: pieChartDimensions } = useChartDimensions();

  // 1. Расчет трат за текущий месяц
  const currentMonthSpend = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return receipts
      .filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  }, [receipts]);

  // 2. Итоговая сумма за все время
  const totalSpend = useMemo(() => 
    receipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0), 
  [receipts]);
  
  // 3. Данные для круговой диаграммы (категории)
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    receipts.forEach(r => {
      r.items.forEach(item => {
        map.set(item.category, (map.get(item.category) || 0) + item.price);
      });
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [receipts]);

  // 4. Данные для графика трендов (по датам)
 const trendData = useMemo(() => {
  const dailyMap: Record<string, { date: string, amount: number, id: string }> = {};

  // Группируем и суммируем
  receipts.forEach(r => {
    const dateLabel = r.date.substring(5); // Получаем "02-16"
    
    if (dailyMap[dateLabel]) {
      // Если дата уже есть, прибавляем сумму
      dailyMap[dateLabel].amount += (r.totalAmount || 0);
      // Для навигации оставляем ID последнего чека (или можно хранить массив)
      dailyMap[dateLabel].id = r.id; 
    } else {
      // Если даты нет, создаем новую запись
      dailyMap[dateLabel] = { 
        date: dateLabel, 
        amount: r.totalAmount || 0, 
        id: r.id 
      };
    }
  });

  // Превращаем объект обратно в массив и сортируем по дате
  return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
}, [receipts]);

  // 5. Поиск самой затратной категории
  const topCategory = categoryData.length > 0 
    ? categoryData.reduce((prev, current) => (prev.value > current.value) ? prev : current)
    : { name: 'Нет данных', value: 0 };

  return (
    <div className="dashboard-container">
      
      {/* СЕКЦИЯ 1: Основные показатели */}
      <section className="dashboard-section">
        <span className="section-label">Финансовый обзор</span>
        <div className="stats-grid">
          
          {/* Карточка месяца и общих трат */}
          <GlassCard glow className="stat-card">
            <div className="glow-effect glow-blue"></div>
            <div className="stat-card-header">
              <div>
                <p className="stat-card-label">Этот месяц</p>
                <h3 className="stat-card-value">€{currentMonthSpend.toFixed(2)}</h3>
                <p className="stat-card-footer-p" style={{marginTop: '4px', opacity: 0.6}}>
                  Всего: €{totalSpend.toFixed(2)}
                </p>
              </div>
              <div className="stat-card-icon stat-card-icon-blue">
                <DollarSign size={20} />
              </div>
            </div>
          </GlassCard>
          
          {/* Карточка топ категории */}
          <GlassCard className="stat-card">
            <div className="glow-effect glow-purple"></div>
            <div className="stat-card-header">
              <div>
                <p className="stat-card-label">Топ категория</p>
                <h3 className="stat-card-value-small">{topCategory.name}</h3>
              </div>
              <div className="stat-card-icon stat-card-icon-purple">
                <ShoppingBag size={20} />
              </div>
            </div>
            <p className="stat-card-footer-p">
              €{topCategory.value.toFixed(2)} потрачено
            </p>
          </GlassCard>

          {/* Карточка количества чеков */}
          <GlassCard className="stat-card">
            <div className="glow-effect glow-orange"></div>
            <div className="stat-card-header">
              <div>
                <p className="stat-card-label">Обработано чеков</p>
                <h3 className="stat-card-value">{receipts.length}</h3>
              </div>
              <div className="stat-card-icon stat-card-icon-orange">
                <Calendar size={20} />
              </div>
            </div>
            <div className="stat-card-footer stat-card-footer-gray">
              <span>Последний: {receipts[0]?.date || 'N/A'}</span>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* СЕКЦИЯ 2: Визуальный анализ */}
      <section className="dashboard-section">
        <span className="section-label">Аналитика расходов</span>
        <div className="charts-grid">
          
          {/* График трендов */}
          <GlassCard className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Динамика трат</h3>
              <button className="chart-action">Отчет</button>
            </div>
            <div ref={areaChartRef} className="chart-content-wrapper" style={{ cursor: 'pointer' }}>
              {trendData.length > 0 && areaChartDimensions.width > 0 && areaChartDimensions.height > 0 ? (
                <ResponsiveContainer width={areaChartDimensions.width} 
      height={areaChartDimensions.height}>
                  <AreaChart 
                    data={trendData}
                    onClick={(data) => {
                      const index = data?.activeTooltipIndex;
                      if (index !== undefined && trendData[index]) {
                        onNavigate(trendData[index].id);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      tick={{fontSize: 12}} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#3b82f6' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorAmount)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#60a5fa' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-placeholder">
                  <p>Нет данных для анализа</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Круговая диаграмма */}
          <GlassCard className="chart-card">
            <h3 className="chart-title" style={{marginBottom: '1.5rem'}}>Категории</h3>
            <div ref={pieChartRef} className="chart-content-wrapper-pie">
              {categoryData.length > 0 && pieChartDimensions.width > 0 && pieChartDimensions.height > 0 ? (
                <>
                  <div className="pie-center-label">
                    <div className="pie-center-label-inner">
                      <p className="pie-center-label-top">Топ</p>
                      <p className="pie-center-label-bottom">{topCategory.name}</p>
                    </div>
                  </div>
                  <ResponsiveContainer width={pieChartDimensions.width} 
      height={pieChartDimensions.height}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="chart-placeholder-pie">Добавьте чеки</div>
              )}
            </div>
            
            <div className="legend-grid">
              {categoryData.map((cat, i) => (
                <div key={i} className="legend-item">
                  <div 
                    className="legend-color-dot" 
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  ></div>
                  <span className="legend-label">{cat.name}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};