import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Layers, AlertCircle, CheckCircle, ArrowRight, Loader } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register mutation
  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      setSuccessMsg('Account registered successfully! Redirecting to login...');
      setErrorMsg('');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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

    if (name.trim().length < 2) {
      setErrorMsg('Name must be at least 2 characters.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    signupMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-brand-bg">
      {/* Dynamic background accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-secondary/10 rounded-full blur-3xl" />

      {/* Main card */}
      <div className="w-full max-w-md glassmorphism border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-brand-primary/20 p-3 rounded-2xl text-brand-primary border border-brand-primary/30 mb-3 shadow-glow-primary">
            <Layers size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Create FlowPilot Account</h2>
          <p className="text-sm text-brand-textMuted mt-1">Initialize workspace access controls</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2 mb-4 animate-shake">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alexis Carter"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-brand-primary placeholder:text-gray-600"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alexis@company.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-brand-primary placeholder:text-gray-600"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-brand-primary placeholder:text-gray-600"
              required
            />
          </div>

          {/* System Role */}
          <div>
            <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Workspace Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-brand-primary"
            >
              <option value="DEVELOPER" className="bg-brand-bg text-white">DEVELOPER (Builds Tickets)</option>
              <option value="MANAGER" className="bg-brand-bg text-white">MANAGER (Organizes & Allocates)</option>
              <option value="CLIENT" className="bg-brand-bg text-white">CLIENT (Raises Feedback Issues)</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={signupMutation.isPending}
            className="w-full mt-6 py-2.5 bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-brand-primaryHover hover:to-indigo-700 text-white font-bold rounded-lg text-sm transition-all shadow-glow-primary hover:shadow-glow-secondary flex items-center justify-center gap-2 group"
          >
            {signupMutation.isPending && <Loader size={16} className="animate-spin" />}
            {signupMutation.isPending ? 'Registering...' : 'Register Workspace Account'}
            {!signupMutation.isPending && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-brand-textMuted">
          Already have workspace access?{' '}
          <Link to="/login" className="text-brand-secondary hover:text-white font-semibold transition-colors">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
