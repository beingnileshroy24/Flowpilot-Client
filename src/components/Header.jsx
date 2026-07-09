import React from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Wifi } from 'lucide-react';

export default function Header({ title }) {
  const user = useSelector((state) => state.auth.user);
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0 z-20"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Left: Page title */}
      <div className="flex items-center gap-3">
        <h1
          className="text-base font-bold truncate"
          style={{ color: 'var(--text)' }}
        >
          {title || 'Dashboard'}
        </h1>
      </div>

      {/* Right: Server status, theme toggle, user */}
      <div className="flex items-center gap-3">
        {/* Server Status */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(34,197,94,0.10)',
            border: '1px solid rgba(34,197,94,0.20)',
            color: '#16a34a',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>API Online</span>
        </div>

        {/* Theme Toggle — Pill Switch */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="relative w-14 h-7 rounded-full flex items-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
          style={{
            background: theme === 'dark'
              ? 'rgba(245,158,11,0.20)'
              : 'rgba(245,158,11,0.30)',
            border: '1px solid rgba(245,158,11,0.35)',
          }}
        >
          {/* Sliding Knob */}
          <div
            className="absolute w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              left: theme === 'dark' ? '2px' : 'calc(100% - 22px)',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 2px 8px rgba(245,158,11,0.40)',
            }}
          >
            {theme === 'dark'
              ? <Moon size={11} className="text-stone-900" />
              : <Sun size={11} className="text-stone-900" />
            }
          </div>
        </button>

        {/* User Avatar */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text)' }}>
                {user.name}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {user.role}
              </p>
            </div>

            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#0f172a',
                boxShadow: '0 3px 10px rgba(245,158,11,0.30)',
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
