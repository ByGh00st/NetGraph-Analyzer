import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from 'recharts';
import { NetworkStats } from '../types';
import { PROTOCOL_COLORS } from '../constants';

interface Props {
  stats: NetworkStats;
}

const TrafficCharts: React.FC<Props> = ({ stats }) => {
  return (
    <div className="w-full h-full flex flex-col p-4">
      {/* Chart Area */}
      <div className="flex-1 min-h-0 relative w-full">
        {stats.protocolDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.protocolDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                />
                <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                />
                <Tooltip 
                    cursor={{fill: '#ffffff', opacity: 0.05}}
                    contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#334155', 
                        borderRadius: '8px', 
                        fontSize: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{ color: '#cbd5e1' }}
                    formatter={(value: number) => [`${value} packets`, 'Volume']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {stats.protocolDistribution.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={PROTOCOL_COLORS[entry.name as keyof typeof PROTOCOL_COLORS] || '#64748b'} 
                        strokeWidth={0}
                    />
                ))}
                </Bar>
            </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                No Data Available
            </div>
        )}
      </div>

      {/* Mini Stats Footer */}
      <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between px-2">
             <div className="text-[10px] uppercase text-slate-500 font-bold">Inbound Bandwidth</div>
             <div className="text-sm font-mono text-blue-400">{(stats.bandwidthIn / 1024 / 1024).toFixed(2)} MB</div>
          </div>
          <div className="flex items-center justify-between px-2 border-l border-white/5">
             <div className="text-[10px] uppercase text-slate-500 font-bold">Active Hosts</div>
             <div className="text-sm font-mono text-green-400">{stats.activeIPs}</div>
          </div>
      </div>
    </div>
  );
};

export default React.memo(TrafficCharts);