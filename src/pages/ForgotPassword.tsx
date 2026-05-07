import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

import { useNavigate, Link } from 'react-router-dom';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [stage, setStage] = useState<'email' | 'code'>('email');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/api/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'Failed to send reset code'
        );
      }

      setSuccess('Reset code sent to your email.');
      setStage('code');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/api/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            code: resetCode,
            newPassword
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Reset failed');
      }

      setSuccess(
        'Password reset successful! Redirecting...'
      );

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-4 py-20">

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >

        <div className="bg-[#1A0B2E]/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl shadow-[0_0_40px_-15px_rgba(139,92,246,0.3)] p-8">

          <div className="text-center mb-8">

            <div className="inline-flex p-3 bg-purple-500/10 rounded-2xl mb-4">
              <ShieldCheck className="w-8 h-8 text-purple-400" />
            </div>

            <h1 className="text-3xl font-black bg-gradient-to-r from-white to-purple-400 text-transparent bg-clip-text">
              Recovery Portal
            </h1>

            <p className="text-slate-400 mt-2 text-sm">
              {stage === 'email'
                ? 'Enter your email to receive a secure recovery code.'
                : 'Check your inbox for the 6-digit verification code.'}
            </p>

          </div>

          {stage === 'email' ? (

            <form onSubmit={handleEmailSubmit} className="space-y-4">

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>

                <div className="relative">

                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                    placeholder="name@example.com"
                  />

                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Recovery Code'}
              </button>

            </form>

          ) : (

            <form onSubmit={handleResetSubmit} className="space-y-4">

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Security Code
                </label>

                <div className="relative">

                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                  </div>

                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={e =>
                      setResetCode(
                        e.target.value.replace(/\D/g, '')
                      )
                    }
                    className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-center text-xl font-bold tracking-[0.3em] text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-700"
                    placeholder="000000"
                  />

                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>

                <div className="relative">

                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>

                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-12 text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                    placeholder="Minimum 8 characters"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-wider"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>

                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>

                <div className="relative">

                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CheckCircle2 className="h-5 w-5 text-slate-400" />
                  </div>

                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-12 text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                    placeholder="Repeat new password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-wider"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>

                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl text-center">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || resetCode.length !== 6}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => setStage('email')}
                className="w-full text-xs font-bold text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-widest pt-2"
              >
                Wrong email? Re-enter
              </button>

            </form>

          )}

          <div className="mt-8 pt-6 border-t border-white/5 text-center">

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>

          </div>
        </div>
      </motion.div>
    </div>
  );
};