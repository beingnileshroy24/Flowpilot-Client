import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import { 
  LayoutDashboard, 
  FolderKanban, 
  LogOut, 
  Settings, 
  Layers, 
  User, 
  ChevronRight
} from 'lucide-react';

export const STATIC_PROJECTS = [
  { id: 'flowpilot-core', name: 'Flowpilot Core App', desc: 'Core React/FastAPI workspace' },
  { id: 'ai-agent-engine', name: 'AI Engine Integration', desc: 'DeepMind models & routing' },
  { id: 'analytics-portal', name: 'Client Portal', desc: 'Telemetry & analytics dashboard' }
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isProjectActive = (id) => location.pathname === `/project/${id}`;

  return (
    <aside className="w-64 glassmorphism border-r border-white/5 h-screen flex flex-col shrink-0">
      {/* Brand logo */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="bg-brand-primary/20 p-2 rounded-lg text-brand-primary border border-brand-primary/30">
          <Layers size={22} className="animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">FlowPilot</h2>
          <p className="text-[10px] text-brand-secondary font-mono tracking-widest uppercase">Nexucon Engine</p>
        </div>
      </div>

      {/* User details summary card */}
      {user && (
        <div className="p-4 mx-4 my-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
          <div className="bg-gradient-to-br from-brand-primary to-brand-secondary w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-glow-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">{user.name}</h4>
            <span className="text-[10px] bg-brand-primary/20 text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded-full uppercase font-semibold">
              {user.role}
            </span>
          </div>
        </div>
      )}

      {/* Primary Navigation links */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-brand-textMuted uppercase tracking-wider px-2 py-2">
          Core Workspaces
        </div>
        
        <Link
          to="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isActive('/') 
              ? 'bg-brand-primary/20 text-white border-l-4 border-brand-primary shadow-glow-primary pl-4' 
              : 'text-brand-textMuted hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        {/* Dynamic Project items */}
        <div className="pt-4">
          <div className="text-[11px] font-semibold text-brand-textMuted uppercase tracking-wider px-2 py-2">
            Active Projects
          </div>
          {STATIC_PROJECTS.map((proj) => (
            <Link
              key={proj.id}
              to={`/project/${proj.id}`}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isProjectActive(proj.id)
                  ? 'bg-brand-secondary/20 text-white border-l-4 border-brand-secondary shadow-glow-secondary pl-4'
                  : 'text-brand-textMuted hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <FolderKanban size={18} className={isProjectActive(proj.id) ? 'text-brand-secondary' : ''} />
                <span className="truncate">{proj.name}</span>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom Profile / Settings */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
