import { 
  LayoutDashboard, 
  ShieldAlert, 
  User, 
  Globe, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export type ViewType = 'landing' | 'dashboard' | 'security' | 'profile' | 'deployment';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout }) => {
  const menuItems: { id: ViewType; icon: any; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'security', icon: ShieldAlert, label: 'Security' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'deployment', icon: Globe, label: 'Deployment' },
  ];

  return (
    <div className="w-64 glass-surface flex flex-col h-screen sticky top-0 border-r border-zinc-800/40 z-50">
      {/* Brand */}
      <div className="py-8 pl-[12px] pr-8 mb-4">
        <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => onViewChange('landing')}>
          <img 
            src={logoImg} 
            alt="RepoRelay Logo" 
            className="w-16 h-16 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
          />
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase text-glow-primary leading-none">
              RepoRelay
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-blue-500/10 text-white border border-blue-500/20 shadow-inner' 
                  : 'text-[#72757d] hover:bg-zinc-800/20 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#83aeff]' : 'group-hover:text-white'}`} />
                <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                  {item.label}
                </span>
              </div>
              {isActive && <ChevronRight size={14} className="text-[#83aeff] animate-in slide-in-from-left-2 fade-in" />}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 space-y-2 border-t border-zinc-800/40">
        <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all text-xs font-bold uppercase tracking-widest">
          <LogOut size={18} />
          <span>Exit System</span>
        </button>
      </div>

      {/* Version Tag */}
      <div className="p-6 text-center">
        <span className="text-[10px] font-black text-zinc-700 tracking-[0.3em] uppercase">V1.0.4 - Proto_04</span>
      </div>
    </div>
  );
};
