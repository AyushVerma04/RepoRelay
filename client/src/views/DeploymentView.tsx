import React from 'react';
import { ShieldCheck, Cpu, Loader2, ExternalLink, ChevronRight } from 'lucide-react';
import { Terminal } from '../components/Terminal';
import { EnvForm } from '../components/EnvForm';

interface DeploymentViewProps {
  deploying: boolean;
  handleDeploy: (envVars: Record<string, string>) => void;
  liveUrl: string;
  logs: string[];
  analysis: any;
}

export const DeploymentView: React.FC<DeploymentViewProps> = ({
  deploying, handleDeploy, liveUrl, logs, analysis
}) => {
  if (!analysis) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-1000">
        <div className="w-32 h-32 bg-blue-500/10 rounded-[40px] flex items-center justify-center border-2 border-blue-500/20 mb-8">
           <Cpu size={48} className="text-[#83aeff] animate-pulse" />
        </div>
        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Infrastructure Setup</h2>
        <p className="text-zinc-500 font-medium max-w-md mt-4">Initialize repository analysis on the Dashboard to configure deployment parameters.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-8 fade-in duration-1000">
      <div className="max-w-4xl mx-auto w-full space-y-12">
        <div className="text-center space-y-4">
           <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-400 text-[10px] font-black tracking-[0.2em] uppercase">
            <ShieldCheck size={12} className="fill-blue-400" />
            <span>Secure Imaging Active</span>
          </div>
          <h3 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Repository Pipeline</h3>
          <p className="text-zinc-500 text-sm font-medium">Inject configurations to instantiate high-security sandboxed instance.</p>
        </div>

        {/* Configuration Form */}
        {!liveUrl && !deploying && (
          <div className="min-h-[400px] glass-card rounded-[40px] p-12 border-t-2 border-t-blue-500/20 shadow-2xl relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-blue-500 opacity-5 group-hover:opacity-10 transition-opacity">
              <Cpu size={120} />
            </div>
            <EnvForm envVars={analysis.envVars} onSubmit={handleDeploy} disabled={deploying} />
          </div>
        )}

        {/* Status Indicator */}
        {deploying && !liveUrl && (
          <div className="glass-card rounded-[40px] p-16 text-center space-y-8 animate-pulse border-2 border-blue-500/10">
             <div className="w-24 h-24 bg-blue-500/10 rounded-[32px] flex items-center justify-center mx-auto border-2 border-blue-500/20 relative group">
              <div className="absolute inset-0 bg-blue-500/20 rounded-[32px] animate-ping opacity-20"></div>
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            </div>
            <div className="space-y-4">
              <h4 className="text-2xl font-black uppercase tracking-tighter text-white italic">Instantiating Sandbox...</h4>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Compiling Docker Image // RepoRelay Engine Overlay</p>
            </div>
          </div>
        )}

        {/* Live Manifest Success */}
        {liveUrl && (
          <div className="p-1 glass-card rounded-[48px] shadow-2xl shadow-emerald-500/10 animate-in zoom-in-95 duration-700">
             <div className="p-16 text-center bg-[#0a0e14]/40 rounded-[44px]">
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-green-600 rounded-[42px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/40 transition-transform duration-700 active:scale-95 cursor-pointer">
                <ExternalLink className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-6xl font-black text-white mb-6 tracking-tighter uppercase italic leading-none">REPOSITORY  HOSTED</h3>
              <p className="text-zinc-400 text-xl mb-12 max-w-lg mx-auto font-medium">Your application layer has been successfully federated and mapped to the host.</p>
              <div className="flex flex-col items-center space-y-6">
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-6 bg-white text-zinc-950 hover:bg-emerald-500 hover:text-white px-14 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.3em] transition-all transform hover:scale-110 active:scale-95 shadow-2xl shadow-white/10 active:shadow-emerald-500/40"
                >
                  <span>OPEN APPLICATION</span>
                  <ChevronRight size={20} />
                </a>
                <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800">
                  Endpoint: {liveUrl}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Execution Logs (Terminal) */}
        {logs.length > 0 && (
          <div className="h-[600px] mb-24">
            <div className="glass-card rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-full animate-in fade-in duration-1000 border-b-8 border-b-blue-600/30">
              <div className="flex-1 overflow-hidden p-2">
                <Terminal logs={logs} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
