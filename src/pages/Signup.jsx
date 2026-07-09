import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Layers, AlertCircle, CheckCircle, ArrowRight, Loader } from 'lucide-react';

const ROLES = [
  { value: 'DEVELOPER', label: 'Developer', desc: 'Builds & resolves tickets' },
  { value: 'MANAGER',   label: 'Manager',   desc: 'Organizes & allocates work' },
  { value: 'CLIENT',    label: 'Client',     desc: 'Raises feedback issues' },
];

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => {
      setSuccessMsg('Account created! Redirecting to login…');
      setErrorMsg('');
      setTimeout(() => navigate('/login'), 2000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail || 'Registration failed. Try a different email.');
      setSuccessMsg('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (name.trim().length < 2) { setErrorMsg('Name must be at least 2 characters.'); return; }
    if (password.length < 6)   { setErrorMsg('Password must be at least 6 characters.'); return; }
    signupMutation.mutate({ name: name.trim(), email: email.trim(), password, role });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Orbs */}
      <div
        className="absolute top-[-10%] left-[-8%] w-[450px] h-[450px] rounded-full pointer-events-none animate-orb-float"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.11) 0%, transparent 65%)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-8%] w-[380px] h-[380px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 65%)',
          animation: 'orb-float 9s ease-in-out infinite reverse',
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[440px] animate-slide-up"
        style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderRadius: '1.5rem',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-lg)',
          padding: '2.5rem',
        }}
      >
        {/* Shimmer */}
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.60), transparent)' }}
        />

        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
            }}
          >
            <Layers size={28} className="text-stone-900" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
            Create Account
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Initialize your FlowPilot workspace access
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', color: '#dc2626' }}
          >
            <AlertCircle size={16} className="shrink-0" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm mb-4"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', color: '#16a34a' }}
          >
            <CheckCircle size={16} className="shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alexis Carter"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alexis@company.com"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm"
              required
            />
          </div>

          {/* Role Visual Selector */}
          <div>
            <label className="form-label">Workspace Role</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {ROLES.map((r) => {
                const active = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className="flex flex-col items-center p-3 rounded-xl text-center transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      background: active ? 'rgba(245,158,11,0.12)' : 'var(--surface)',
                      border: `1px solid ${active ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`,
                      boxShadow: active ? '0 0 12px rgba(245,158,11,0.15)' : 'none',
                    }}
                  >
                    <span
                      className="text-xs font-bold mb-0.5"
                      style={{ color: active ? '#d97706' : 'var(--text)' }}
                    >
                      {r.label}
                    </span>
                    <span className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                      {r.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={signupMutation.isPending}
            className="btn-primary w-full py-3 mt-2 text-sm font-bold rounded-xl group"
          >
            {signupMutation.isPending ? (
              <>
                <Loader size={16} className="animate-spin" />
                Registering…
              </>
            ) : (
              <>
                Create Account
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Already have access?{' '}
          <Link
            to="/login"
            className="font-semibold transition-colors hover:opacity-80"
            style={{ color: '#3b82f6' }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
