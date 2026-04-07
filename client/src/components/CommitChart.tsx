import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface CommitChartProps {
  commits: Array<{ sha: string; message: string; author: string; date: string }>;
}

export const CommitChart: React.FC<CommitChartProps> = ({ commits }) => {
  if (!commits || commits.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500">
        No commit data available
      </div>
    );
  }

  // We have the raw commits but recharts wants time-series data.
  // Group commits by day for the area chart.
  const groupedDates: Record<string, number> = {};
  
  // Sort commits historically (oldest first) so area goes left to right properly
  const sortedCommits = [...commits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedCommits.forEach(commit => {
    // Only grab YYYY-MM-DD
    const day = commit.date.split('T')[0];
    groupedDates[day] = (groupedDates[day] || 0) + 1;
  });

  const data = Object.keys(groupedDates).map(date => ({
    date,
    count: groupedDates[date]
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10, fill: '#71717a' }} 
            tickFormatter={(str) => {
              const d = new Date(str);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
            stroke="#3f3f46"
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
            itemStyle={{ color: '#14b8a6' }}
            labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#14b8a6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorCount)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
