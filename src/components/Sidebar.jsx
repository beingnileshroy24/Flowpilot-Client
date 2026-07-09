import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { logout } from '../store/authSlice';
import {
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

import logoImg from '../assets/logo.png';

export const STATIC_PROJECTS = [];

const PROJECT_COLORS = ['#f59e0b', '#3b82f6', '#a855f7'];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [collapsed, setCollapsed] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isProjectActive = (id) => location.pathname === `/project/${id}`;

  return (
    <aside
      className={`relative h-screen flex flex-col shrink-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        ${collapsed ? 'w-[72px]' : 'w-[240px]'}
      `}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border)',
        boxShadow: '2px 0 20px rgba(0,0,0,0.06)',
      }}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-50 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-200 hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          boxShadow: '0 2px 8px rgba(245,158,11,0.40)',
          color: '#0f172a',
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Brand Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b transition-all duration-300`}
        style={{ borderColor: 'var(--border)' }}
      >
        <img
          src={logoImg}
          alt="FlowPilot Logo"
          className="w-9 h-9 object-contain shrink-0 rounded-xl"
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>
              FlowPilot
            </h2>
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--yellow)' }}>
              Nexucon
            </p>
          </div>
        )}
      </div>

      {/* User Profile Card */}
      {user && (
        <div
          className={`mx-3 my-3 rounded-2xl p-3 flex items-center gap-3 transition-all duration-300`}
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.18)',
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#0f172a',
              boxShadow: '0 3px 10px rgba(245,158,11,0.30)',
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="overflow-hidden min-w-0">
              <h4 className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text)' }}>
                {user.name}
              </h4>
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5"
                style={{
                  background: 'rgba(245,158,11,0.15)',
                  color: '#d97706',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}
              >
                {user.role}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-1 py-2">
        {!collapsed && (
          <p
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Workspace
          </p>
        )}

        {/* Dashboard Link */}
        <NavItem
          to="/"
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
          active={isActive('/')}
          collapsed={collapsed}
        />

        {/* Projects Section */}
        {!collapsed && (
          <p
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-2 pt-4"
            style={{ color: 'var(--text-muted)' }}
          >
            Projects
          </p>
        )}
        {collapsed && <div className="my-2 mx-2 h-px" style={{ background: 'var(--border)' }} />}

        {projects.map((proj, idx) => (
          <NavItem
            key={proj.id}
            to={`/project/${proj.id}`}
            icon={<FolderKanban size={18} />}
            label={proj.name}
            active={isProjectActive(proj.id)}
            collapsed={collapsed}
            accentColor={PROJECT_COLORS[idx % PROJECT_COLORS.length]}
          />
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group hover:scale-[1.01]`}
          style={{
            color: '#ef4444',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.10)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ to, icon, label, active, collapsed, accentColor }) {
  const activeColor = accentColor || '#f59e0b';

  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative"
      style={{
        background: active ? `${activeColor}18` : 'transparent',
        color: active ? activeColor : 'var(--text-muted)',
        borderLeft: active ? `3px solid ${activeColor}` : '3px solid transparent',
        boxShadow: active ? `0 0 12px ${activeColor}20` : 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--surface)';
          e.currentTarget.style.color = 'var(--text)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
        }
      }}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          <ChevronRight
            size={14}
            className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0"
          />
        </>
      )}
    </Link>
  );
}
