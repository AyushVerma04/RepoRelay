import React, { useEffect, useState } from 'react';
import { User, ShieldCheck, Mail, MapPin, Database, Activity, History, LogOut } from 'lucide-react';
import { API_URL } from '../config/api';

export const ProfileView: React.FC<{ userId: string; onLogout: () => void }> = ({ userId, onLogout }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      // Fetch History
      fetch(`${API_URL}/history/${userId}`)
        .then(res => res.json())
        .then(data => setHistory(data))
        .catch(err => console.error(err));
      
      // Fetch User Info
      fetch(`${API_URL}/user/${userId}`)
        .then(res => res.json())
        .then(data => {
            setProfile({
                name: data.name,
                role: 'RepoRelay Agent',
                bio: `Registered Agent. Network initialization active since ${new Date(data.createdAt).toLocaleDateString()}. Monitoring ecosystem health and federated coordinates.`,
                email: data.email
            });
        })
        .catch(err => console.error(err));
    }
  }, [userId]);

  if (!profile) {
     return <div className="flex-1 flex items-center justify-center text-white font-black italic uppercase">Loading Identity...</div>;
  }

  return (
    <div className="flex-1 flex flex-col p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-left-8 fade-in duration-1000 pb-32">
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar: Compact All-in-One Profile */}
          <div className="lg:col-span-1 space-y-6">
             <div className="glass-card rounded-[32px] p-8 relative overflow-hidden flex flex-col items-center text-center">
                
                <div className="w-24 h-24 rounded-[24px] bg-zinc-950 p-1 border-2 border-zinc-800 shadow-xl mb-6 transform transition-transform duration-700 hover:-translate-y-1 active:scale-95 cursor-pointer">
                   <div className="w-full h-full rounded-[20px] bg-zinc-900 border border-zinc-800 overflow-hidden relative">
                      <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                         <User size={40} className="text-[#83aeff]" />
                      </div>
                   </div>
                </div>

                <div className="space-y-3 mb-8 w-full">
                   <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 text-[#83aeff] text-[9px] font-black tracking-widest uppercase">
                      <ShieldCheck size={10} className="fill-blue-400" />
                      <span>Verified</span>
                   </div>
                   <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{profile.name}</h2>
                   <p className="text-zinc-500 text-xs font-medium opacity-80 leading-relaxed text-left line-clamp-3">{profile.bio}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-zinc-800/40 mb-8">
                    <div className="text-center group">
                        <div className="flex items-center justify-center space-x-1.5 text-white group-hover:text-[#83aeff] transition-colors mb-1">
                           <Database size={16} />
                           <span className="text-xl font-black italic tracking-tighter">{history.length}</span>
                        </div>
                        <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Analyzed</div>
                    </div>
                    <div className="text-center group">
                        <div className="flex items-center justify-center space-x-1.5 text-white group-hover:text-emerald-400 transition-colors mb-1">
                           <Activity size={16} />
                           <span className="text-xl font-black italic tracking-tighter">0</span>
                        </div>
                        <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Deployments</div>
                    </div>
                </div>

                {/* Identity Records inside Profile Card */}
                <div className="w-full pt-6 border-t border-zinc-800/40 space-y-4 text-left">
                   <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Identity Details</h4>
                   <div className="space-y-4">
                      <div className="flex items-center space-x-4 group">
                         <Mail size={14} className="text-zinc-800 group-hover:text-[#83aeff] transition-colors shrink-0" />
                         <span className="text-[10px] font-black text-zinc-400 group-hover:text-white transition-colors tracking-widest truncate">{profile.email}</span>
                      </div>
                      <div className="flex items-center space-x-4 group">
                         <MapPin size={14} className="text-zinc-800 group-hover:text-[#83aeff] transition-colors shrink-0" />
                         <span className="text-[10px] font-black text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest">Global IP Range</span>
                      </div>
                      <div className="flex items-center space-x-4 group">
                         <Activity size={14} className="text-zinc-800 group-hover:text-[#83aeff] transition-colors shrink-0" />
                         <span className="text-[10px] font-black text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest">Registered {new Date().getFullYear()}</span>
                      </div>
                   </div>
                </div>

                <div className="w-full mt-8 pt-8 border-t border-zinc-800/40">
                   <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 transition-all text-[10px] font-black uppercase tracking-[0.2em] group border border-red-500/20">
                      <LogOut size={14} className="group-hover:translate-x-1 transition-transform" />
                      <span>Log Out</span>
                   </button>
                </div>
             </div>
          </div>

          {/* Right Main Content: Scanner Log */}
          <div className="lg:col-span-2">
             <div className="glass-card rounded-[32px] p-10 h-full">
                 <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2.5 rounded-xl bg-[#83aeff]/10 border border-[#83aeff]/20 text-[#83aeff]">
                      <History size={18} />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-[0.1em]">History</h3>
                 </div>
                 
                 {history.length === 0 ? (
                    <div className="flex items-center justify-center h-48 border border-dashed border-zinc-800/60 rounded-2xl">
                      <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">No previous scans found in session</p>
                    </div>
                 ) : (
                    <div className="space-y-3">
                       {history.map((item, i) => (
                           <a href={item.repoUrl} target="_blank" rel="noreferrer" key={i} className="flex items-center justify-between p-4 bg-zinc-950/40 rounded-[20px] border border-zinc-800/40 hover:border-zinc-600 hover:bg-zinc-900/50 transition-all group">
                              <div className="min-w-0 flex-1 pr-6">
                                 <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white uppercase tracking-widest truncate">{item.repoName}</h4>
                                 <p className="text-[10px] text-zinc-600 uppercase tracking-widest group-hover:text-[#83aeff] transition-colors truncate mt-1">{item.repoUrl}</p>
                              </div>
                              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 group-hover:border-zinc-700">
                                 {new Date(item.searchedAt).toLocaleDateString()}
                              </div>
                           </a>
                       ))}
                    </div>
                 )}
             </div>
          </div>

       </div>
    </div>
  );
};
