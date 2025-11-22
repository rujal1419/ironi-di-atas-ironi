import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TypingResult } from '../types';

interface StatsDisplayProps {
  history: TypingResult[];
  isDark: boolean;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ history, isDark }) => {
  const data = history.map((h, i) => ({
    name: `Sesi ${i + 1}`,
    wpm: h.wpm,
    accuracy: h.accuracy
  }));

  const strokeColor = isDark ? '#818cf8' : '#ea580c';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  if (history.length === 0) return (
    <div className={`flex items-center justify-center h-full text-xs opacity-50 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
      Belum ada data latihan
    </div>
  );

  return (
    <div className="w-full h-64">
      <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
        Progres Performa
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <XAxis dataKey="name" stroke={textColor} fontSize={10} tickLine={false} tick={{fontSize: 9}} interval="preserveStartEnd" />
          <YAxis stroke={textColor} fontSize={10} tickLine={false} width={25} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#1e293b' : '#fff',
              borderColor: gridColor,
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="wpm" 
            stroke={strokeColor} 
            strokeWidth={3} 
            dot={{ r: 3 }} 
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsDisplay;