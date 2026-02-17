import React, { useMemo, useRef, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Receipt } from '../types';
import { GlassCard } from './ui/GlassCard';
import { TrendingUp, DollarSign, Calendar, ShoppingBag } from 'lucide-react';

interface DashboardProps {
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

export const Dashboard: React.FC<DashboardProps> = ({ receipts }) => {
  const { chartRef: areaChartRef, dimensions: areaChartDimensions } = useChartDimensions();
  const { chartRef: pieChartRef, dimensions: pieChartDimensions } = useChartDimensions();

  const totalSpend = useMemo(() => receipts.reduce((sum, r) => sum + r.total, 0), [receipts]);
  
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    receipts.forEach(r => {
      r.items.forEach(item => {
        map.set(item.category, (map.get(item.category) || 0) + item.price);
      });
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [receipts]);

  const trendData = useMemo(() => {
    const sorted = [...receipts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted.map(r => ({ date: r.date.substring(5), amount: r.total }));
  }, [receipts]);

  const topCategory = categoryData.length > 0 
    ? categoryData.reduce((prev, current) => (prev.value > current.value) ? prev : current)
    : { name: 'None', value: 0 };

  return (
    <div className="dashboard-container">
      {/* Quick Stats Row */}
      <div className="stats-grid">
        <GlassCard glow className="stat-card">
          <div className="glow-effect glow-blue"></div>
          <div className="stat-card-header">
            <div>
              <p className="stat-card-label">Total Spend</p>
              <h3 className="stat-card-value">${totalSpend.toFixed(2)}</h3>
            </div>
            <div className="stat-card-icon stat-card-icon-blue">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-card-footer stat-card-footer-green">
            <TrendingUp size={14} />
            <span>+12% vs last month</span>
          </div>
        </GlassCard>

        <GlassCard className="stat-card">
           <div className="glow-effect glow-purple"></div>
           <div className="stat-card-header">
            <div>
              <p className="stat-card-label">Top Category</p>
              <h3 className="stat-card-value-small">{topCategory.name}</h3>
            </div>
            <div className="stat-card-icon stat-card-icon-purple">
              <ShoppingBag size={20} />
            </div>
          </div>
          <p className="stat-card-footer-p">
             ${topCategory.value.toFixed(2)} spent
          </p>
        </GlassCard>

        <GlassCard className="stat-card">
           <div className="glow-effect glow-orange"></div>
           <div className="stat-card-header">
            <div>
              <p className="stat-card-label">Receipts</p>
              <h3 className="stat-card-value">{receipts.length}</h3>
            </div>
            <div className="stat-card-icon stat-card-icon-orange">
              <Calendar size={20} />
            </div>
          </div>
          <div className="stat-card-footer stat-card-footer-gray">
            <span>Last scan: {receipts[0]?.date || 'N/A'}</span>
          </div>
        </GlassCard>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        
        <GlassCard className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Spending Trend</h3>
            <button className="chart-action">View Report</button>
          </div>
          <div ref={areaChartRef} className="chart-content-wrapper">
            {trendData.length > 0 && areaChartDimensions.width > 0 && areaChartDimensions.height > 0 ? (
              <ResponsiveContainer width={areaChartDimensions.width} height={areaChartDimensions.height}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <XAxis dataKey="date" stroke="#475569" tick={{fontSize: 12}} />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
               <div className="chart-placeholder">
                 <p>No data available</p>
               </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="chart-card">
          <h3 className="chart-title" style={{marginBottom: '1.5rem'}}>Category Breakdown</h3>
          <div ref={pieChartRef} className="chart-content-wrapper-pie">
            {categoryData.length > 0 && pieChartDimensions.width > 0 && pieChartDimensions.height > 0 ? (
              <>
                 <div className="pie-center-label">
                    <div className="pie-center-label-inner">
                       <p className="pie-center-label-top">Top</p>
                       <p className="pie-center-label-bottom">{topCategory.name}</p>
                    </div>
                 </div>
                 <ResponsiveContainer width={pieChartDimensions.width} height={pieChartDimensions.height}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
               <div className="chart-placeholder-pie">No categories yet</div>
            )}
          </div>
          <div className="legend-grid">
             {categoryData.slice(0, 4).map((cat, i) => (
                <div key={i} className="legend-item">
                   <div className="legend-color-dot" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                   <span className="legend-label">{cat.name}</span>
                </div>
             ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};