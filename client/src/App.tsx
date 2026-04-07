import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import type { ViewType } from './components/Sidebar';
import { DeploymentView } from './views/DeploymentView';
import { Landing } from './views/Landing';
import { RepositoryView } from './views/RepositoryView';
import { SecurityView } from './views/SecurityView';
import { ProfileView } from './views/ProfileView';

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

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [userId, setUserId] = useState<string>('');

  // Persistent Login Check
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const userJson = sessionStorage.getItem('user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        setUserId(user.id);
        setCurrentView('dashboard');
      } catch (e) {
        console.error("Failed to parse stored user", e);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }
  }, []);

  // Analysis State (Moved from original App)
  const [repoUrl, setRepoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  // Deployment State
  const [logs, setLogs] = useState<string[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setAnalyzing(true);
    setError('');
    setAnalysis(null);
    setLiveUrl('');
    setLogs([]);
    setCurrentView('dashboard'); // Switch to dashboard view when analysis starts

    try {
      const res = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze repository');
      
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeploy = (envVars: Record<string, string>) => {
    if (!analysis) return;
    setDeploying(true);
    setLogs(['[SYSTEM] Connecting to RepoRelay High-Security Engine...']);
    
    // Connect WS
    const ws = new WebSocket('ws://localhost:5000/ws');
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'log') {
        setLogs(prev => [...prev, `[BUILD] ${msg.message}`]);
      } else if (msg.type === 'success') {
        setLiveUrl(msg.url);
        setDeploying(false);
        setLogs(prev => [...prev, `[MANIFEST] Live Deployment :: ${msg.url}`]);
      } else if (msg.type === 'error') {
        setLogs(prev => [...prev, `[CRITICAL] Error: ${msg.message}`]);
        setDeploying(false);
      }
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'deploy',
        runId: analysis.runId,
        envVars
      }));
    };
    
    ws.onerror = () => {
      setError('WebSocket connection failed');
      setDeploying(false);
    };
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleLogin = (token: string, user: any) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    setUserId(user.id);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUserId('');
    setCurrentView('landing');
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <Landing onLogin={handleLogin} />;
      case 'dashboard': return (
        <RepositoryView 
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          analyzing={analyzing}
          analysis={analysis}
          error={error}
          handleAnalyze={handleAnalyze}
          onViewChange={setCurrentView}
        />
      );
      case 'security': return <SecurityView analysis={analysis} />;
      case 'profile': return <ProfileView userId={userId} onLogout={handleLogout} />;
      case 'deployment': return (
        <DeploymentView 
          deploying={deploying}
          handleDeploy={handleDeploy}
          liveUrl={liveUrl}
          logs={logs}
          analysis={analysis}
        />
      );
      default: return <Landing onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-zinc-100 flex font-sans selection:bg-blue-500/30 overflow-hidden">
      
      {/* Platform Shell */}
      {currentView !== 'landing' && (
        <Sidebar currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogout} />
      )}

      <main className="flex-1 h-screen flex flex-col relative overflow-hidden bg-reporelay-gradient">
        {/* Dynamic Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full"></div>
        </div>

        {/* Dynamic Header */}
        {currentView !== 'landing' && (
        <header className="px-12 py-6 flex items-center justify-between relative z-10 shrink-0">
           <div className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-[#83aeff] animate-pulse shadow-sm shadow-blue-500/50"></span>
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-500">System_Online // Sync:{new Date().toLocaleTimeString()}</span>
           </div>
           <div className="flex items-center space-x-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              <span className="hover:text-white transition-colors cursor-pointer">Protocol</span>
              <span className="hover:text-white transition-colors cursor-pointer">Encryption</span>
              <span className="hover:text-white transition-colors cursor-pointer">Latency</span>
           </div>
        </header>
        )}

        {/* View Content */}
        <div className="flex-1 relative z-10 flex flex-col min-h-0">
          {renderView()}
        </div>
      </main>

    </div>
  );
}
