import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ✅ API_URL যুক্ত করা হয়েছে
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const AdminLogin = () => {
  const { login, isAdminAccessActivated, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    console.log('[AdminLogin] Checking access:', { isAdminAccessActivated, role });
    if (!isAdminAccessActivated && role !== 'admin') {
      console.warn('[AdminLogin] Access not activated. Redirecting to home.');
      navigate('/');
    }
  }, [isAdminAccessActivated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // ✅ fetch এর ভেতর API_URL যুক্ত করা হয়েছে
      const res = await fetch(`${API_URL}/api/login/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, pin })
      });
      
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an invalid response. Please try again later.');
      }
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      if (data.token) {
        login(data.token, data.role || 'admin', data.user || { id: 'admin', email: 'admin@metamatrix.com', role: 'admin', status: 'active' });
        navigate('/admin');
      } else {
        throw new Error('No response from server');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#110515]/90 backdrop-blur-xl border border-red-500/30 rounded-3xl shadow-[0_0_50px_-15px_rgba(239,68,68,0.3)] p-8">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black bg-gradient-to-r from-red-400 to-orange-400 text-transparent bg-clip-text inline-flex items-center gap-2">
              <Key className="w-8 h-8 text-red-400" />
              Admin Access
            </h1>
            <p className="text-red-400/60 mt-2 text-sm font-medium uppercase tracking-widest">
              Restricted Area
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-red-300 uppercase tracking-wider mb-1.5">Admin Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-red-500/50" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#05000A] border border-red-500/20 rounded-xl py-3 pl-10 pr-4 text-sm text-[#F1F5F9] focus:outline-none focus:border-red-400 focus:shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)] transition-all placeholder:text-red-900/50"
                  placeholder="admin@metamatrix.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-red-300 uppercase tracking-wider mb-1.5">Master Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-red-500/50" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#05000A] border border-red-500/20 rounded-xl py-3 pl-10 pr-12 text-sm text-[#F1F5F9] focus:outline-none focus:border-red-400 focus:shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)] transition-all placeholder:text-red-900/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 text-xs font-bold text-red-500 hover:text-red-400"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-red-300 uppercase tracking-wider mb-1.5">Access PIN</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-red-500/50" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full bg-[#05000A] border border-red-500/20 rounded-xl py-3 pl-10 pr-12 text-sm text-[#F1F5F9] focus:outline-none focus:border-red-400 focus:shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)] transition-all placeholder:text-red-900/50"
                  placeholder="••••"
                  maxLength={4}
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
              className="w-full py-3 mt-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Override Entry'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};