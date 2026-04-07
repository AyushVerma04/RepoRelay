import React from 'react';
import {
  GitBranch,
  Loader2,
  Star,
  GitFork,
  Eye,
  AlertCircle,
  ShieldCheck,
  Activity,
  Database,
  Network,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { StatCard } from '../components/StatCard';
import { LanguageChart } from '../components/LanguageChart';
import { CommitChart } from '../components/CommitChart';
import { DirectoryTree } from '../components/DirectoryTree';
import { OwnerProfile } from '../components/OwnerProfile';

interface EnvVarInfo {
  key: string;
  defaultValue: string;
  isSecret: boolean;
}

interface AnalysisResult {
  runId: string;
  summary: string;
  envVars: EnvVarInfo[];
  repoMeta: any;
  ownerProfile: any;
  ownerRepos: any[];
  languages: any;
  contributors: any[];
  recentCommits: any[];
  directoryTree: any[];
}

interface RepositoryViewProps {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  analyzing: boolean;
  analysis: AnalysisResult | null;
  error: string;
  handleAnalyze: (e: React.FormEvent) => void;
  onViewChange: (view: any) => void;
}

export const RepositoryView: React.FC<RepositoryViewProps> = ({
  repoUrl, setRepoUrl, analyzing, analysis, error, handleAnalyze, onViewChange
}) => {
  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4 fade-in duration-700">

      {/* Precision Input Form */}
      <div className={`transition-all duration-1000 ${analysis ? 'mt-4 mb-12' : 'mt-16 mb-24 flex flex-col items-center'}`}>
        {!analysis && !analyzing && (
          <div className="text-center mb-16 space-y-6 max-w-4xl animate-in zoom-in-95 fade-in duration-700">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/5 border border-blue-500/10 text-[#83aeff] text-[10px] font-black tracking-[0.4em] uppercase shadow-lg shadow-blue-500/5 mb-4">
              <Network size={14} className="fill-[#83aeff]/50" />
              <span>PIPELINE INITIALIZATION</span>
            </div>
            <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#83aeff] italic tracking-tighter uppercase leading-[0.8] pb-2 drop-shadow-sm">AUTOMATED REPOSITORY DIAGNOSTICS</h2>
            <p className="text-zinc-500 text-sm font-medium tracking-widest max-w-xl mx-auto leading-relaxed">
                    Provide a repository link to generate a comprehensive report on code structure and potential security drift.
            </p>
          </div>
        )}

        <form onSubmit={handleAnalyze} className={`w-full max-w-3xl relative group ${analysis ? 'mt-0' : 'animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-300'}`}>
          <div className="absolute -inset-2 bg-gradient-to-r from-[#83aeff]/40 via-purple-600/40 to-[#83aeff]/40 rounded-[24px] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative glass-card rounded-[24px] p-3 flex items-center shadow-2xl transition-all duration-500 group-focus-within:border-[#83aeff]/50 border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-3xl">
            <div className="pl-6 pr-4 py-4 text-zinc-600 group-focus-within:text-[#83aeff] transition-colors">
              <GitBranch className="w-6 h-6" />
            </div>
            <input
              type="url"
              required
              disabled={analyzing}
              placeholder="Inject Source URL (GitHub)..."
              className="w-full bg-transparent text-white placeholder-zinc-700 text-xl focus:outline-none disabled:opacity-50 font-bold tracking-tight lowercase"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <button
              type="submit"
              disabled={analyzing || !repoUrl}
              className="relative group/btn overflow-hidden bg-white text-zinc-950 px-10 py-5 rounded-[16px] font-black uppercase tracking-widest text-[11px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 ml-2 hover:-translate-y-0.5 active:translate-y-0"
            >
              {analyzing ? <Loader2 className="w-5 h-5 animate-spin relative z-10" /> : (
                <>
                  <span className="relative z-30">Scan</span>
                  
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#83aeff] to-blue-400 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300"></div>
            </button>
          </div>
        </form>

        {/* Empty State Grid Background Elements (Only shown when not analyzing and no analysis) */}
        {!analysis && !analyzing && (
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-500 px-8">
            <div className="glass-card rounded-[40px] p-8 text-center bg-gradient-to-b from-zinc-950/50 to-transparent border-t-4 border-t-blue-500/20 hover:border-t-[#83aeff] transition-colors group">
              <Database size={40} className="mx-auto text-zinc-800 mb-6 group-hover:text-[#83aeff] transition-colors" />
              <h4 className="text-white font-black italic tracking-tighter text-xl uppercase mb-2">14.8M Nodes</h4>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Global Repositories Synchronized</p>
            </div>
            <div className="glass-card rounded-[40px] p-8 text-center bg-gradient-to-b from-zinc-950/50 to-transparent border-t-4 border-t-purple-500/20 hover:border-t-purple-400 transition-colors group">
              <Activity size={40} className="mx-auto text-zinc-800 mb-6 group-hover:text-purple-400 transition-colors" />
              <h4 className="text-white font-black italic tracking-tighter text-xl uppercase mb-2">0.03ms Latency</h4>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Neural Parsing Delay</p>
            </div>
            <div className="glass-card rounded-[40px] p-8 text-center bg-gradient-to-b from-zinc-950/50 to-transparent border-t-4 border-t-emerald-500/20 hover:border-t-emerald-400 transition-colors group">
              <ShieldCheck size={40} className="mx-auto text-zinc-800 mb-6 group-hover:text-emerald-400 transition-colors" />
              <h4 className="text-white font-black italic tracking-tighter text-xl uppercase mb-2">Secure</h4>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Encrypted Execution Sandbox</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 glass rounded-xl w-full max-w-2xl mx-auto text-center flex items-center justify-center space-x-3 mb-8 border-red-500/20 text-red-400 shadow-xl shadow-red-500/5 animate-in shake-in-from-left duration-500">
          <AlertCircle size={18} />
          <span className="font-bold text-xs uppercase tracking-widest">{error}</span>
        </div>
      )}

      {analysis && (
        <div className="w-full space-y-8 animate-in slide-in-from-bottom-12 fade-in duration-1000 pb-24">

          {/* 1. Top Section: Horizontal Profile */}
          {analysis.repoMeta && (
            <div className="glass-card rounded-[32px] overflow-hidden border border-zinc-800/50 shadow-2xl">
              <OwnerProfile owner={analysis.ownerProfile} repos={analysis.ownerRepos} layout="horizontal" />
            </div>
          )}

          {/* 2. Stats Section: Full Width Row */}
          {analysis.repoMeta && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
              <StatCard title="Stars" value={analysis.repoMeta.stars} icon={Star} color="text-yellow-400" small />
              <StatCard title="Forks" value={analysis.repoMeta.forks} icon={GitFork} color="text-[#83aeff]" small />
              <StatCard title="Watchers" value={analysis.repoMeta.watchers} icon={Eye} color="text-blue-400" small />
              <StatCard title="Open Issues" value={analysis.repoMeta.openIssues} icon={AlertCircle} color="text-red-400" small />
            </div>
          )}

          {/* 3. Analysis Grid: Custom Spacing */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            
            {/* Row 1, Slot 1: Architectural Report (70%) */}
            <div className="glass-card rounded-[32px] p-10 flex flex-col h-[600px] relative overflow-hidden border border-zinc-800/50 lg:col-span-7">
              <div className="flex items-center space-x-3 mb-8 shrink-0">
                <div className="w-1.5 h-6 bg-[#83aeff] rounded-full"></div>
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-white">Architectural Report</h3>
              </div>
              <div className="prose prose-invert prose-p:text-zinc-400 prose-a:text-[#83aeff] prose-headings:text-zinc-100 max-w-none text-sm leading-relaxed overflow-y-auto pr-4 custom-scrollbar flex-1">
                <ReactMarkdown>{analysis.summary}</ReactMarkdown>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-800/30">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Logic Scan Complete</span>
              </div>
            </div>

            {/* Row 1, Slot 2: Ecosystem Health (30%) */}
            <div className="glass-card rounded-[32px] p-10 flex flex-col h-[600px] border border-zinc-800/50 lg:col-span-3">
              <div className="flex items-center space-x-3 mb-12 shrink-0">
                <div className="w-1.5 h-6 bg-[#b387ff] rounded-full"></div>
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-white">Ecosystem Health</h3>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center">
                <LanguageChart languages={analysis.languages} />
              </div>
            </div>

            {/* Row 2, Slot 1: Source Blueprint (40%) */}
            <div className="glass-card rounded-[32px] p-10 flex flex-col h-[600px] border border-zinc-800/50 lg:col-span-4">
              <div className="flex items-center space-x-3 mb-8 shrink-0">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-white">Source Blueprint</h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <DirectoryTree tree={analysis.directoryTree} />
              </div>
            </div>

            {/* Row 2, Slot 2: Version Control Narrative (60%) */}
            <div className="glass-card rounded-[32px] p-10 flex flex-col h-[600px] border border-zinc-800/50 lg:col-span-6">
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-black text-xs uppercase tracking-[0.2em] text-white">Version Control Narrative</h3>
                </div>
                <div className="text-[9px] font-black text-zinc-600 font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-900 uppercase tracking-tighter">
                  SHA-256 Validated
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center overflow-hidden">
                <CommitChart commits={analysis.recentCommits} />
              </div>
            </div>

          </div>

          <div className="w-full h-px bg-zinc-800/30 my-16 flex items-center justify-center">
            <span className="bg-[#0a0e14] px-8 text-[11px] font-black text-zinc-700 tracking-[1rem] uppercase">End of System Report</span>
          </div>

          {/* 4. Footer Section: Deploy Pipeline */}
          <div className="glass-card rounded-[48px] p-20 max-w-7xl mx-auto w-full relative overflow-hidden group border border-zinc-800/50">
            <div className="absolute top-[10%] right-[-10%] w-[50%] h-[80%] bg-[#83aeff]/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="text-center space-y-10 relative z-10">
              <div className="inline-flex items-center space-x-3 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-[0.3em] uppercase shadow-lg shadow-emerald-500/5 backdrop-blur-md">
                <ShieldCheck size={14} className="fill-emerald-400/50" />
                <span>Architecture Sandboxed & Staged</span>
              </div>

              <div>
                <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-md">Deploy Ecosystem</h2>
                <p className="text-[#a8abb3] font-bold tracking-[0.3em] uppercase text-[10px] mt-6">Initiate secure deployment sequence to local docker swarm.</p>
              </div>

              <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-8">
                <button 
                  onClick={() => onViewChange('deployment')}
                  className="relative group/deploy overflow-hidden bg-white text-zinc-950 px-14 py-6 rounded-[24px] font-black uppercase tracking-widest text-xs transition-all shadow-2xl hover:shadow-white/20 hover:-translate-y-1 active:translate-y-0 flex items-center space-x-4"
                >
                  <span className="relative z-10">Initialize Production Build</span>
                  <Zap size={18} className="relative z-10 fill-zinc-950" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#83aeff] to-blue-400 opacity-0 group-hover/deploy:opacity-30 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
