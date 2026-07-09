import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { setCredentials } from '../store/authSlice';
import { AlertCircle, ArrowRight, Loader } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const tokenData = await authApi.login(email, password);
      sessionStorage.setItem('flowpilot_token', tokenData.access_token);
      try {
        const userData = await usersApi.getMyProfile();
        return { token: tokenData.access_token, user: userData };
      } catch (err) {
        sessionStorage.removeItem('flowpilot_token');
        throw err;
      }
    },
    onSuccess: (data) => {
      dispatch(setCredentials({ token: data.token, user: data.user }));
      navigate('/');
    },
    onError: (err) => {
      sessionStorage.removeItem('flowpilot_token');
      setErrorMsg(err.response?.data?.detail || 'Incorrect email or password.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) { setErrorMsg('Please fill in all fields.'); return; }
    loginMutation.mutate({ email, password });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Decorative background orbs */}
      <div
        className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none animate-orb-float"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 65%)' }}
      />
      <div
        className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 65%)',
          animation: 'orb-float 8s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute top-[40%] left-[5%] w-[200px] h-[200px] rounded-full pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%)',
          animation: 'orb-float 10s ease-in-out infinite 2s',
        }}
      />

      {/* Login Card */}
      <div
        className="relative z-10 w-full max-w-[420px] animate-slide-up"
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
        {/* Yellow top shimmer line */}
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.60), transparent)' }}
        />

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={logoImg}
            alt="FlowPilot Logo"
            className="w-14 h-14 object-contain mb-4 rounded-2xl"
          />
          <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
            Welcome back
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Sign in to your FlowPilot workspace
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm mb-5"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.22)',
              color: '#dc2626',
            }}
          >
            <AlertCircle size={16} className="shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@nexucon.com"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="btn-primary w-full py-3 mt-2 text-sm font-bold rounded-xl group"
          >
            {loginMutation.isPending ? (
              <>
                <Loader size={16} className="animate-spin" />
                Signing In…
              </>
            ) : (
              <>
                Sign In to Workspace
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          New to FlowPilot?{' '}
          <Link
            to="/signup"
            className="font-semibold transition-colors hover:opacity-80"
            style={{ color: '#3b82f6' }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
