import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  small?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color = 'text-[#83aeff]', small }) => {
  return (
    <div className={`glass-card ${small ? 'rounded-[20px] p-4' : 'rounded-[32px] p-6'} flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-500`}>
      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className={`${small ? 'p-2.5 mb-2' : 'p-4 mb-4'} rounded-xl bg-zinc-950 border border-zinc-900 ${color}`}>
        <Icon size={small ? 20 : 32} />
      </div>
      <p className={`${small ? 'text-xl' : 'text-4xl'} font-black text-white tracking-tighter italic`}>{value}</p>
      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1 opacity-60">{title}</p>
    </div>
  );
};
