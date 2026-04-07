import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface LanguageChartProps {
  languages: Record<string, number>;
}

export const LanguageChart: React.FC<LanguageChartProps> = ({ languages }) => {
  const data = Object.entries(languages)
    .filter(([name]) => name !== 'message' && name !== 'documentation_url')
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Take top 5


  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500">
        No language data available
      </div>
    );
  }

  // A sleek dark-friendly color palette with teal as the primary
  const COLORS = ['#14b8a6', '#0ea5e9', '#8b5cf6', '#f43f5e', '#f59e0b'];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
            itemStyle={{ color: '#f4f4f5' }}
            formatter={(value: any) => {
               return [Number(value).toLocaleString() + ' bytes', 'Size'];
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
