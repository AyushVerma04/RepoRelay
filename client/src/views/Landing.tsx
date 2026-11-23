import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ChevronRight, 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config/api';
import logoImg from '../assets/logo.png';

export const Landing: React.FC<{ onLogin: (token: string, user: any) => void }> = ({ onLogin }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = isRegistering ? `${API_URL}/auth/register` : `${API_URL}/auth/login`;
      const body = isRegistering ? JSON.stringify({ email, password, name }) : JSON.stringify({ email, password });
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[INIT] RepoRelay Analytic Engine v1.0.4",
    "[AUTH] System Access Granted :: Level 7 Auditor",
    "[SCAN] Monitoring 14.8M Global Repositories...",
    "[SCAN] Critical Security Shift Detected in 142,903 nodes",
    "[LIVE] Uptime: 99.998% // Region: Global-Edge-01"
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const logs = [
        `[INFO] Repository analysis complete for node_${Math.floor(Math.random() * 1000)}`,
        `[SECURITY] Patching vulnerability CVE-2026-${Math.floor(Math.random() * 9000) + 1000}`,
        `[TRAFFIC] Inbound request from region_${['US-EAST', 'EU-WEST', 'ASIA-SOUTH'][Math.floor(Math.random() * 3)]}`,
        `[SYNC] Federated ecosystem sync initiated...`,
        `[DB] Scaling analytic throughput to ${Math.floor(Math.random() * 50) + 50} GB/s`
      ];
      setTerminalLogs(prev => [...prev.slice(-4), logs[Math.floor(Math.random() * logs.length)]]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const words = ["ANALYZE", "BUILD", "LAUNCH"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden px-12 md:px-24 animate-in fade-in duration-1000 relative">
      
      {!showAuth && (
      <div className="flex-1 flex flex-row items-center justify-between gap-0 min-h-0 py-12 relative z-10">
        
        {/* Left Side: Hero Text (45%) */}
        <div className="flex-[1.7] flex flex-col items-start space-y-8 animate-in slide-in-from-left-8 duration-1000">
          
          {/* Logo & Brand Header */}
          <div className="flex items-center space-x-4 group cursor-pointer">
            <img 
              src={logoImg} 
              alt="RepoRelay Logo" 
              className="w-16 h-16 object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] group-hover:scale-105 transition-transform" 
            />
            <div>
              <span className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">RepoRelay</span>
              <span className="block text-[10px] font-black tracking-widest text-[#83aeff] uppercase opacity-75">Automated Engine</span>
            </div>
          </div>

          <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-blue-500/5 border border-blue-500/10 text-[#83aeff] text-[10px] font-black tracking-[0.4em] uppercase shadow-lg shadow-blue-500/5">
            <Zap size={14} className="fill-[#83aeff]" />
            <span>SEAMLESS REPO AUTOMATION</span>
          </div>
          
          <h1 className="text-[4.275rem] lg:text-[5.7rem] font-black tracking-tighter text-white leading-none uppercase italic drop-shadow-2xl h-[1.2em] flex items-center overflow-visible">
            <AnimatePresence mode="wait">
              <motion.span
                key={words[index]}
                initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
                transition={{ 
                  duration: 0.8, 
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-[#83aeff] via-white to-[#83aeff] bg-[length:200%_auto] animate-gradient inline-block pr-6 overflow-visible"
              >
                {words[index]}
              </motion.span>
            </AnimatePresence>
          </h1>
          
          <p className="text-[#a8abb3] text-base lg:text-lg leading-relaxed max-w-md font-medium opacity-80">
           Analyze and deploy any public GitHub repository in seconds. Securely add your environment variables, and our engine automatically containerizes and launches your project via Docker.
          </p>
          
          <div className="pt-4">
             <button onClick={() => setShowAuth(true)} className="bg-white text-zinc-950 font-black px-12 py-5 rounded-full inline-flex items-center space-x-3 uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-transform shadow-2xl shadow-white/10 group">
                <span>Get Started</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>

        {/* Right Side: Terminal Overlay (65%) */}
        <div className="flex-[1.8] relative animate-in fade-in slide-in-from-right-12 duration-1000 flex items-center justify-center" style={{ perspective: '2000px' }}>
          <div className="absolute -inset-20 bg-gradient-to-tr from-blue-600/20 via-purple-600/10 to-transparent rounded-full blur-[160px] opacity-20 pointer-events-none"></div>
          
          <div 
            className="w-full max-w-5xl relative transition-transform duration-700 ease-out hover:scale-[1.01]"
            style={{ 
              transform: 'rotateX(8deg) rotateY(-12deg) rotateZ(2deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-transparent to-purple-600 rounded-3xl blur-xl opacity-20"></div>
            <div className="relative glass-card rounded-2xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-zinc-700/30 backdrop-blur-3xl bg-zinc-950/20">
              {/* Header */}
              <div className="bg-zinc-950/90 px-6 py-4 flex items-center justify-between border-b border-zinc-800/40">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40 shadow-sm shadow-red-500/20"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40 shadow-sm shadow-yellow-500/20"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 shadow-sm shadow-emerald-500/20"></div>
                </div>
                <div className="text-[9px] font-black text-[#72757d] uppercase tracking-[0.4em] opacity-80">ROOT_SESSION_04.SH</div>
                <div className="w-10"></div>
              </div>
              {/* Content */}
              <div className="p-10 bg-zinc-950/40 min-h-[440px] font-mono text-[13px] space-y-4 custom-scrollbar overflow-y-auto max-h-[550px]">
                 {terminalLogs.map((log, i) => (
                    <div key={i} className={`flex items-start space-x-3 transition-opacity duration-700`}>
                      <span className="text-[#4a4d52] font-bold">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                      <span className={log.includes('[SCAN]') || log.includes('[SECURITY]') || log.includes('[INIT]') ? 'text-white' : 'text-[#83aeff] opacity-80'}>{log}</span>
                    </div>
                 ))}
                 <div className="flex items-center space-x-2 animate-pulse text-white mt-4">
                    <span className="text-[#83aeff]">$</span>
                    <span className="w-1.5 h-4 bg-[#83aeff]/60"></span>
                 </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      )}

      {showAuth && (
      <div className="flex-1 flex items-center justify-center relative z-20 animate-in zoom-in-95 fade-in duration-500 min-h-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#83aeff]/10 to-transparent blur-3xl opacity-20 rounded-full -z-10 bg-center"></div>
        <div className="glass-card rounded-[40px] p-12 border border-zinc-800/50 shadow-2xl bg-zinc-950/80 backdrop-blur-3xl w-full max-w-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-600/20 transition-colors duration-1000"></div>
          
          <div className="text-center mb-8 relative z-10 flex flex-col items-center">
            <img src={logoImg} alt="RepoRelay" className="w-14 h-14 object-contain mb-3 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#83aeff] italic tracking-tighter uppercase drop-shadow-sm">{isRegistering ? 'Register' : 'Log In'}</h2>
          </div>

          <form className="relative z-10 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center space-x-2 text-red-400 text-[10px] font-bold bg-red-500/5 border border-red-500/20 p-4 rounded-xl uppercase tracking-widest text-left animate-in slide-in-from-top-2 fade-in">
                <Zap size={14} className="fill-red-500/50 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-4">
              {isRegistering && (
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Username"
                      className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-2xl px-6 py-5 text-white placeholder-zinc-700 font-mono text-xs focus:outline-none focus:border-[#83aeff]/70 focus:bg-zinc-900 transition-all shadow-inner"
                    />
                  </div>
              )}
              <div className="relative group">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Email"
                    className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-2xl px-6 py-5 text-white placeholder-zinc-700 font-mono text-xs focus:outline-none focus:border-[#83aeff]/70 focus:bg-zinc-900 transition-all shadow-inner"
                  />
              </div>
              <div className="relative group">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Password"
                    className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-2xl px-6 py-5 text-white placeholder-zinc-700 font-mono text-xs focus:outline-none focus:border-[#83aeff]/70 focus:bg-zinc-900 transition-all shadow-inner"
                  />
              </div>
            </div>
            
            <div className="pt-2">
              <button disabled={loading} type="submit" className="w-full relative group overflow-hidden bg-white text-zinc-950 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl hover:shadow-white/20 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center space-x-3 disabled:opacity-50">
                <span className="relative z-10">{loading ? 'PROCESSING...' : (isRegistering ? 'INITIALIZE ACCOUNT' : 'AUTHENTICATE')}</span>
                {!loading && <ChevronRight size={16} className="relative z-10" />}
              </button>
            </div>
          </form>

          <div className="relative z-10 mt-8 text-center border-t border-zinc-800/50 pt-8">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-[9px] font-black text-zinc-600 hover:text-white uppercase tracking-[0.3em] transition-colors"
            >
              {isRegistering ? 'Return to authentication' : 'Create new entry'}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Page Footer - Repositioned for No-Scroll */}
      <div className={`${showAuth ? 'hidden' : 'flex'} pb-12 shrink-0 items-center justify-between relative z-10 border-t border-zinc-800/20 pt-8 mt-auto`}>
        <div className="flex items-center space-x-12">
            {['Infrastructure', 'Geometry', 'Vector', 'Sync'].map((item) => (
              <span key={item} className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] hover:text-[#83aeff] cursor-pointer transition-colors">
                {item}
              </span>
            ))}
        </div>
        <p className="text-[9px] text-zinc-800 font-bold uppercase tracking-widest italic">
          RepoRelay_v1.0.4 // Analytic_Node_Active
        </p>
      </div>

    </div>
  );
};
