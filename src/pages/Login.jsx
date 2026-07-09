import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { setCredentials, setLoading } from '../store/authSlice';
import { Layers, AlertCircle, ArrowRight, Loader } from 'lucide-react';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Login sequence mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      // 1. Authenticate with server (returns JWT)
      const tokenData = await authApi.login(email, password);
      
      // Temporary token storage to allow interceptors to work for the profile fetch
      sessionStorage.setItem('flowpilot_token', tokenData.access_token);

      try {
        // 2. Fetch profile of the authenticated user
        const userData = await usersApi.getMyProfile();
        return { token: tokenData.access_token, user: userData };
      } catch (err) {
        // Cleanup if profile fetch fails
        sessionStorage.removeItem('flowpilot_token');
        throw err;
      }
    },
    onSuccess: (data) => {
      // 3. Save into Redux store (which also updates sessionStorage)
      dispatch(setCredentials({ token: data.token, user: data.user }));
      setErrorMsg('');
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

    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-brand-bg">
      {/* Glow shapes */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-brand-secondary/10 rounded-full blur-3xl" />

      {/* Login Card */}
      <div className="w-full max-w-md glassmorphism border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-brand-primary/20 p-3 rounded-2xl text-brand-primary border border-brand-primary/30 mb-3 shadow-glow-primary">
            <Layers size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Welcome to FlowPilot</h2>
          <p className="text-sm text-brand-textMuted mt-1">Authenticate workspace session</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-brand-textMuted uppercase mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. manager@nexucon.com"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full mt-6 py-2.5 bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-brand-primaryHover hover:to-indigo-700 text-white font-bold rounded-lg text-sm transition-all shadow-glow-primary hover:shadow-glow-secondary flex items-center justify-center gap-2 group"
          >
            {loginMutation.isPending && <Loader size={16} className="animate-spin" />}
            {loginMutation.isPending ? 'Signing In...' : 'Sign In to Workspace'}
            {!loginMutation.isPending && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-brand-textMuted">
          New to FlowPilot?{' '}
          <Link to="/signup" className="text-brand-secondary hover:text-white font-semibold transition-colors">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
