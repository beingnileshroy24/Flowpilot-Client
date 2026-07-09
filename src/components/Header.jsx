import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../context/ThemeContext';
import { notificationsApi } from '../api/notifications';
import { Sun, Moon, Bell, Check, Loader } from 'lucide-react';

export default function Header({ title }) {
  const user = useSelector((state) => state.auth.user);
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications dynamically
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getNotifications,
    enabled: !!user,
    refetchInterval: 10000, // Poll every 10 seconds for real-time updates
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Calculate unread notifications count
  const unreadCount = user
    ? notifications.filter((n) => !n.read_by_user_ids.includes(String(user.id))).length
    : 0;

  // Handle click outside to close popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0 z-25"
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

      {/* Right: Server status, notifications, theme toggle, user */}
      <div className="flex items-center gap-4">
        {/* Server Status */}
        <div
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(34,197,94,0.10)',
            border: '1px solid rgba(34,197,94,0.20)',
            color: '#16a34a',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>API Online</span>
        </div>

        {/* Notification Bell Dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-xl border transition-all duration-200 hover:scale-105 cursor-pointer flex items-center justify-center"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-bounce"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    boxShadow: '0 2px 5px rgba(239,68,68,0.4)',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover Menu */}
            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-72 rounded-2xl p-4 space-y-3 z-50 glass-elevated animate-fade-in"
                style={{
                  border: '1px solid var(--border)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  maxHeight: '320px',
                  overflowY: 'auto',
                }}
              >
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--yellow)' }}>
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {isLoading ? (
                    <div className="text-xs text-center py-4 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <Loader size={12} className="animate-spin" /> Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isUnread = !notif.read_by_user_ids.includes(String(user.id));
                      return (
                        <div
                          key={notif.id}
                          className="p-2.5 rounded-xl flex items-start gap-2.5 transition-all text-xs border"
                          style={{
                            background: isUnread ? 'rgba(245,158,11,0.06)' : 'transparent',
                            borderColor: isUnread ? 'rgba(245,158,11,0.15)' : 'transparent',
                          }}
                        >
                          <div className="flex-1 space-y-1">
                            <p style={{ color: isUnread ? 'var(--text)' : 'var(--text-muted)' }}>
                              {notif.message}
                            </p>
                            <span className="text-[9px] block" style={{ color: 'var(--text-muted)' }}>
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {isUnread && (
                            <button
                              onClick={() => markAsReadMutation.mutate(notif.id)}
                              className="w-5 h-5 rounded-lg border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 flex items-center justify-center cursor-pointer shrink-0"
                              title="Mark as read"
                            >
                              <Check size={11} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
