import React from 'react';
import { useSelector } from 'react-redux';
import { ShieldCheck, UserCheck, Radio } from 'lucide-react';

export default function Header({ title }) {
  const user = useSelector((state) => state.auth.user);

  return (
    <header className="h-16 glassmorphism border-b border-white/5 px-8 flex items-center justify-between shrink-0 z-10">
      {/* Title */}
      <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent truncate tracking-wide">
        {title || 'Dashboard'}
      </h1>

      {/* Stats, Health & Profile Summary */}
      <div className="flex items-center gap-6">
        {/* Server Connection status */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-medium">
          <Radio size={14} className="text-brand-secondary animate-status-pulse" />
          <span className="text-brand-textMuted font-mono">FastAPI Link:</span>
          <span className="text-brand-secondary font-semibold">Online</span>
        </div>

        {/* User Role Quick Indicator */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-tight">{user.name}</p>
              <p className="text-[10px] text-brand-textMuted tracking-wider font-mono uppercase">{user.role}</p>
            </div>
            
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20 text-brand-primary">
              {user.role === 'CLIENT' ? (
                <ShieldCheck size={18} className="text-brand-secondary" />
              ) : (
                <UserCheck size={18} className="text-brand-primary" />
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
