import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Sparkles, CheckCircle2, ShieldCheck, KeyRound, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TermsModal } from '../components/TermsModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const UserLogin = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [isForgotPage, setIsForgotPage] = useState(false);
  const [resetStage, setResetStage] = useState<'email' | 'code'>('email');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const navigate = useNavigate();

  const getDeviceId = () => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('deviceId', id);
    }
    return id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const endpoint = isLogin
        ? `${API_URL}/api/login/user`
        : `${API_URL}/api/register`;

      const body = isLogin 
        ? { email, password, deviceId: getDeviceId() } 
        : { 
            name, 
            email, 
            password, 
            agreedToTerms, 
            agreedAt: new Date().toISOString() 
          };
        
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (data.status === 'unverified') {
        setIsVerifying(true);
        setSuccessMsg(data.message || 'Verification needed');
        return;
      }

      if (data.status === 'pending') {
        setError(data.message || 'Waiting for approval');
        return;
      }
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Authentication failed');
      }
      
      if (data.success === false) {
        setError(data.message || 'Authentication failed');
        return;
      }
      
      if (data.token) {
        login(data.token, data.role || 'user', data.user);
        navigate('/workspace');
      } else if (!isLogin && res.ok) {
        setIsVerifying(true);
        setSuccessMsg(data.message || 'Check your email for verification code');
      } else {
        throw new Error('No response from server');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      
      setSuccessMsg(data.message || 'Verified! You can now login.');
      setIsVerifying(false);
      setIsLogin(true);
      setVerificationCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccessMsg('');
    setResendLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend');
      setSuccessMsg(data.message || 'Code resent!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset code');
      setSuccessMsg(data.message);
      setResetStage('code');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setSuccessMsg(data.message);
      setTimeout(() => {
        setIsForgotPage(false);
        setResetStage('email');
        setIsLogin(true);
        setResetCode('');
        setNewPassword('');
        setConfirmNewPassword('');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#1A0B2E]/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl shadow-[0_0_40px_-15px_rgba(139,92,246,0.3)] p-8">
          
          {isVerifying ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text inline-flex items-center gap-2">
                  <KeyRound className="w-8 h-8 text-emerald-400" />
                  Verify Email
                </h1>
                <p className="text-slate-400 mt-2">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Verification Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-center text-2xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_15px_-3px_rgba(52,211,153,0.4)] transition-all placeholder:text-slate-700"
                      placeholder="000000"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
                    {error}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl text-center flex flex-col gap-1 items-center">
                    <CheckCircle2 className="h-5 w-5" />
                    {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full py-3 mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>

              <div className="mt-6 flex flex-col items-center gap-4 border-t border-white/10 pt-6">
                <button
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                  {resendLoading ? 'Resending...' : "Didn't get code? Resend"}
                </button>

                <button
                  onClick={() => {
                    setIsVerifying(false);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to {isLogin ? 'Login' : 'Register'}
                </button>
              </div>
            </>
          ) : isForgotPage ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-400 text-transparent bg-clip-text inline-flex items-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-amber-400" />
                  Reset Password
                </h1>
                <p className="text-slate-400 mt-2">
                  {resetStage === 'email' 
                    ? 'Enter your email to receive a reset code.' 
                    : 'Enter the 6-digit code and your new password.'}
                </p>
              </div>

              {resetStage === 'email' ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-[#F1F5F9] focus:outline-none focus:border-amber-400 focus:shadow-[0_0_15px_-3px_rgba(251,191,36,0.4)] transition-all placeholder:text-slate-500"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
                      {error}
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl text-center flex flex-col gap-1 items-center">
                      <CheckCircle2 className="h-5 w-5" />
                      {successMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Reset Code</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyRound className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={resetCode}
                        onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-center text-xl font-bold tracking-[0.3em] text-white focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-700"
                        placeholder="000000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-[#F1F5F9] focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CheckCircle2 className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-[#F1F5F9] focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
                      {error}
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl text-center flex flex-col gap-1 items-center">
                      <CheckCircle2 className="h-5 w-5" />
                      {successMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || resetCode.length !== 6}
                    className="w-full py-3 mt-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {loading ? 'Resetting...' : 'Update Password'}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center border-t border-white/10 pt-6">
                <button
                  onClick={() => {
                    setIsForgotPage(false);
                    setResetStage('email');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 justify-center mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text inline-flex items-center gap-2">
                  <User className="w-8 h-8 text-purple-400" />
                  User Portal
                </h1>
                <p className="text-slate-400 mt-2">
                  {isLogin ? 'Welcome back to your workspace.' : 'Create an account to start.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-[#F1F5F9] focus:outline-none focus:border-purple-400 focus:shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)] transition-all placeholder:text-slate-500"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-[#F1F5F9] focus:outline-none focus:border-purple-400 focus:shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)] transition-all placeholder:text-slate-500"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-12 text-sm text-[#F1F5F9] focus:outline-none focus:border-purple-400 focus:shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)] transition-all placeholder:text-slate-500"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 text-xs font-bold text-purple-400 hover:text-purple-300"
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  {isLogin && (
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPage(true);
                          setError('');
                          setSuccessMsg('');
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-wider"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CheckCircle2 className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#0F051D] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-[#F1F5F9] focus:outline-none focus:border-purple-400 focus:shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)] transition-all placeholder:text-slate-500"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
                    {error}
                  </div>
                )}

                {!isLogin && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <input
                          id="terms-checkbox"
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="w-4 h-4 bg-[#0F051D] border-white/10 rounded accent-purple-500 cursor-pointer focus:ring-purple-500 focus:ring-offset-[#1A0B2E]"
                        />
                      </div>
                      <label htmlFor="terms-checkbox" className="text-sm text-slate-400 leading-tight cursor-pointer select-none">
                        I agree to the <Link to="/terms" target="_blank" className="text-purple-400 hover:text-purple-300 font-bold transition-colors">Terms and Conditions</Link> and <Link to="/privacy" target="_blank" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">Privacy Policy</Link> for MetaMatrix AI.
                      </label>
                    </div>
                    {!agreedToTerms && (
                      <p className="text-[10px] font-bold text-amber-500/80 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        You must agree to continue
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (!isLogin && !agreedToTerms)}
                  className="w-full py-3 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
                </button>
              </form>
          
              {successMsg && !isVerifying && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl text-center flex flex-col gap-1 items-center">
                  <CheckCircle2 className="h-5 w-5" />
                  {successMsg}
                </div>
              )}

              <div className="mt-6 text-center text-sm text-slate-400 border-t border-white/10 pt-6">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccessMsg('');
                    setAgreedToTerms(false);
                  }}
                  className="font-bold text-purple-400 hover:text-purple-300 hover:underline transition-colors ml-1"
                >
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      <TermsModal 
        isOpen={isTermsModalOpen} 
        onClose={() => setIsTermsModalOpen(false)} 
      />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 flex items-center gap-4 uppercase tracking-[0.2em] font-medium z-0 pointer-events-auto">
        <Link to="/terms" className="hover:text-purple-400 transition-colors">Terms</Link>
        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
        <Link to="/privacy" className="hover:text-purple-400 transition-colors">Privacy</Link>
        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
        <span className="cursor-default">Security</span>
      </div>
    </div>
  );
};