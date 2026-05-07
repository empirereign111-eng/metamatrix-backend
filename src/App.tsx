import React from 'react';
// ✅ BrowserRouter এর বদলে HashRouter ইমপোর্ট করা হলো
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Models } from './pages/Models';
import { About } from './pages/About';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { ForgotPassword } from './pages/ForgotPassword';
import { UserLogin } from './pages/UserLogin';
import { AdminLogin } from './pages/AdminLogin';
import { Workspace } from './pages/Workspace';
import { AdminPanel } from './pages/AdminPanel';
import { AuthProvider, useAuth } from './context/AuthContext';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { role, isVerifying } = useAuth();
  
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0314]">
        <div className="text-purple-400 font-medium animate-pulse">Initializing Admin...</div>
      </div>
    );
  }
  
  if (role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};

const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isVerifying, accessError } = useAuth();
  
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0314]">
        <div className="text-purple-400 font-medium animate-pulse">Verifying Access...</div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0314]">
        <div className="p-8 bg-[#1A0B2E] border border-red-500/20 rounded-2xl text-center max-w-sm">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400">{accessError}</p>
          <button 
            onClick={() => window.location.href = '#/login'} // Hash routing pattern
            className="mt-6 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-sm font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isNavMinimized, setIsNavMinimized } = useAuth();
  const location = useLocation();
  const isWorkspace = location.pathname === '/workspace';

  React.useEffect(() => {
    if (!isWorkspace) {
      setIsNavMinimized(false);
    }
  }, [isWorkspace, setIsNavMinimized]);

  return (
    <div className="min-h-screen bg-[#0B0314] text-white overflow-y-auto flex flex-col">
      <div 
        className={`transition-all duration-300 ease-in-out relative origin-top ${
          isNavMinimized ? 'h-0 opacity-0 -translate-y-full overflow-hidden' : 'h-auto opacity-100 translate-y-0'
        }`}
      >
        <Navbar />
      </div>
      
      <div className="flex-1">
        {children}
      </div>

      <footer className="py-8 border-t border-white/5 bg-[#0F051D]/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center">
              <span className="text-[10px] font-black italic text-white">MM</span>
            </div>
            <span className="text-sm font-bold text-slate-300">MetaMatrix</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <Link to="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-purple-400 transition-colors">Terms & Conditions</Link>
          </div>
          
          <p className="text-xs text-slate-600 font-medium">
            © {new Date().getFullYear()} MetaMatrix Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

import { motion, AnimatePresence } from 'motion/react';

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AuthProvider>
      {/* ✅ BrowserRouter এর বদলে HashRouter ব্যবহার করা হলো */}
      <HashRouter>
        <ScrollToTop />
        <Layout>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/models" element={<Models />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/login" element={<UserLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route 
                path="/workspace" 
                element={
                  <UserRoute>
                    <Workspace />
                  </UserRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                } 
              />
              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </Layout>
      </HashRouter>
    </AuthProvider>
  );
}