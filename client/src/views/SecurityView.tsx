import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { API_URL } from '../config/api';

export const SecurityView: React.FC<{ analysis: any }> = ({ analysis }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!analysis?.runId) return;
    setLoading(true);
    fetch(`${API_URL}/security`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId: analysis.runId })
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, [analysis]);

  if (loading || (!data && analysis)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
         <Loader2 size={64} className="text-red-400 animate-spin mb-6" />
         <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Generating Threat Model</h2>
         <p className="text-zinc-500 font-medium tracking-widest text-[10px] uppercase mt-2">Connecting to Groq AI Engine...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
         <ShieldAlert size={64} className="text-zinc-700 mb-6" />
         <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Analysis Required</h2>
         <p className="text-zinc-500 font-medium">Please initialize a repository scan first to view security insights.</p>
      </div>
    );
  }

  const risks = data.risks || [];
  const metrics = data.metrics || { critical: 0, high: 0, medium: 0, healthScore: 0, infrastructureRows: [] };

  return (
    <div className="flex-1 flex flex-col p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-8 fade-in duration-1000">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-16 px-4">
        <div className="flex items-center space-x-6">
           <div className="w-16 h-16 bg-red-400/10 rounded-2xl flex items-center justify-center border border-red-400/20 shadow-lg shadow-red-400/5">
              <ShieldAlert size={32} className="text-red-400" />
           </div>
           <div>
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Security Center</h2>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em] mt-2 italic">Infra-Level Vulnerability Analysis</p>
           </div>
        </div>
        <div className="flex items-center space-x-4">
           <div className="px-5 py-2 glass rounded-xl border border-red-400/10 flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">4 Critical Threats</span>
           </div>
        </div>
      </div>

      {/* Circle Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Critical', value: metrics.critical < 10 ? `0${metrics.critical}` : metrics.critical, color: 'text-red-500', bg: 'bg-red-500/5' },
          { label: 'High', value: metrics.high < 10 ? `0${metrics.high}` : metrics.high, color: 'text-orange-400', bg: 'bg-orange-500/5' },
          { label: 'Medium', value: metrics.medium < 10 ? `0${metrics.medium}` : metrics.medium, color: 'text-yellow-400', bg: 'bg-yellow-500/5' },
          { label: 'Health Score', value: `${metrics.healthScore}%`, color: 'text-[#83aeff]', bg: 'bg-blue-500/5' },
        ].map((stat, i) => (
          <div key={i} className={`glass-card rounded-[24px] p-6 flex flex-col items-center justify-center space-y-4 relative group overflow-hidden border-b-2 border-b-transparent hover:border-b-[#83aeff]/50 transition-all duration-500 ${stat.bg}`}>
             <div className="absolute top-0 right-0 p-4 text-white opacity-[0.02] transform rotate-12">
                <ShieldCheck size={40} />
             </div>
             <div className={`w-20 h-20 rounded-full border-2 border-zinc-800 flex items-center justify-center relative`}>
                <div className={`absolute inset-0 rounded-full border-2 ${stat.color.replace('text-', 'border-')} border-t-transparent animate-spin-slow opacity-20`}></div>
                <span className={`text-3xl font-black italic tracking-tighter ${stat.color}`}>{stat.value}</span>
             </div>
             <div className="text-center">
                <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{stat.label}</h4>
             </div>
          </div>
        ))}
      </div>

      {/* Detailed Risk Table Breakdown */}
      <div className="w-full pb-32">
        
        {/* Risk Feed */}
        <div className="space-y-6">
           <div className="flex items-center space-x-3 mb-8 ml-4">
              <div className="w-1.5 h-6 bg-red-400 rounded-full"></div>
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-white">Live Threat Intelligence</h3>
           </div>
           {risks.map((risk: any, i: number) => (
             <div key={i} className="glass-card rounded-[20px] p-6 hover:translate-x-2 transition-all duration-300 group cursor-pointer border-l-4 border-l-transparent hover:border-l-red-500">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg bg-zinc-950 border border-zinc-900 ${risk.severity === 'critical' ? 'text-red-400' : 'text-zinc-500'}`}>
                         <AlertTriangle size={18} />
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors italic">{risk.title}</h4>
                         <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest mt-0.5">Buffer: 0x44F</p>
                      </div>
                   </div>
                   <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                     risk.severity === 'critical' ? 'border-red-500/20 text-red-500 bg-red-500/5' :
                     risk.severity === 'high' ? 'border-orange-500/20 text-orange-400 bg-orange-500/5' :
                     'border-yellow-500/20 text-yellow-500 bg-yellow-500/5'
                   }`}>
                      {risk.severity}
                   </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl group-hover:text-zinc-300 transition-colors">{risk.desc}</p>
             </div>
           ))}
        </div>

      </div>

    </div>
  );
};
