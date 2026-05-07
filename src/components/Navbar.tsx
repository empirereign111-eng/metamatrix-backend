import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Key, User, Menu, X, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, role, logout, activateAdminAccess, resetAdminAccess, isAdminAccessActivated, isNavMinimized, setIsNavMinimized } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Hidden Admin Interaction Refs
  const clickCountRef = React.useRef(0);
  const clickTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isArmedRef = React.useRef(false);
  const armedTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const pressStartRef = React.useRef<number>(0);
  const isTriggeredRef = React.useRef(false);

  const localResetAdminTrigger = () => {
    console.log('[AdminTrigger] Resetting all states');
    clickCountRef.current = 0;
    isArmedRef.current = false;
    isTriggeredRef.current = false;
    pressStartRef.current = 0;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (armedTimerRef.current) clearTimeout(armedTimerRef.current);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    // If admin is logged in or already triggered, ignore
    if (isAdminAccessActivated || role === 'admin') return;

    clickCountRef.current++;
    console.log(`[AdminTrigger] Click count: ${clickCountRef.current}`);

    if (clickCountRef.current === 1) {
      clickTimerRef.current = setTimeout(() => {
        if (!isArmedRef.current) {
          console.log('[AdminTrigger] Click timer expired');
          clickCountRef.current = 0;
        }
      }, 3000);
    }

    if (clickCountRef.current >= 10) {
      console.log('[AdminTrigger] ARMED - Wait for long press');
      isArmedRef.current = true;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      
      // Stay armed for 10 seconds to start the long press
      if (armedTimerRef.current) clearTimeout(armedTimerRef.current);
      armedTimerRef.current = setTimeout(() => {
        if (pressStartRef.current === 0) {
          console.log('[AdminTrigger] Armed timer expired');
          localResetAdminTrigger();
        }
      }, 10000);
    }
  };

  const handleLogoMouseDown = () => {
    if (isArmedRef.current && !isAdminAccessActivated && role !== 'admin') {
      console.log('[AdminTrigger] Long press STARTED');
      pressStartRef.current = Date.now();
      isTriggeredRef.current = false;
      // Clear armed timer while holding
      if (armedTimerRef.current) {
        clearTimeout(armedTimerRef.current);
        armedTimerRef.current = null;
      }
    }
  };

  const handleLogoMouseUp = () => {
    if (pressStartRef.current > 0 && !isTriggeredRef.current) {
      const duration = Date.now() - pressStartRef.current;
      console.log(`[AdminTrigger] Long press RELEASED. Duration: ${duration}ms`);
      
      if (duration >= 5000) {
        console.log('[AdminTrigger] SUCCESS! Activating...');
        isTriggeredRef.current = true;
        // Don't reset everything yet, activate first
        activateAdminAccess();
        
        // Use a small delay to ensure state propagates before navigation
        setTimeout(() => {
          localResetAdminTrigger();
          navigate('/admin/login');
        }, 100);
      } else {
        console.log('[AdminTrigger] FAILED: Hold duration too short');
        localResetAdminTrigger();
      }
    }
    pressStartRef.current = 0;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavLinks = () => (
    <>
      <Link onClick={() => setMenuOpen(false)} to="/" className={`hover:text-purple-400 transition-colors ${location.pathname === '/' ? 'text-purple-400' : ''}`}>Home</Link>
      <Link onClick={() => setMenuOpen(false)} to="/pricing" className={`hover:text-purple-400 transition-colors ${location.pathname === '/pricing' ? 'text-purple-400' : ''}`}>Pricing</Link>
      <Link onClick={() => setMenuOpen(false)} to="/models" className={`hover:text-purple-400 transition-colors ${location.pathname === '/models' ? 'text-purple-400' : ''}`}>Models</Link>
      {token && role === 'user' && (
        <Link onClick={() => setMenuOpen(false)} to="/workspace" className={`hover:text-purple-400 transition-colors ${location.pathname === '/workspace' ? 'text-purple-400' : ''}`}>Workspace</Link>
      )}
      {token && role === 'admin' && (
        <Link onClick={() => setMenuOpen(false)} to="/admin" className={`hover:text-purple-400 transition-colors ${location.pathname === '/admin' ? 'text-purple-400' : ''}`}>Admin Panel</Link>
      )}
      <Link onClick={() => setMenuOpen(false)} to="/about" className={`hover:text-purple-400 transition-colors ${location.pathname === '/about' ? 'text-purple-400' : ''}`}>About</Link>
    </>
  );

  return (
    <>
      <nav className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 px-6 md:px-8 max-w-7xl mx-auto w-full border-b border-white/5 bg-[#0F051D]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link 
            to="/" 
            className="flex items-center gap-2 select-none" 
            onClick={(e) => {
              setMenuOpen(false);
              // Prevent navigation if we are in the middle of a trigger or just succeeded
              if (pressStartRef.current > 0 || isTriggeredRef.current || isArmedRef.current) {
                e.preventDefault();
              }
              handleLogoClick(e);
            }}
            onMouseDown={handleLogoMouseDown}
            onMouseUp={handleLogoMouseUp}
            onMouseLeave={handleLogoMouseUp}
          >
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-xl pointer-events-none">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 pointer-events-none">
              MetaMatrix
            </span>
          </Link>
          <button 
            className="md:hidden text-slate-300 hover:text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div className={`${menuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row md:items-center gap-6 text-sm font-medium text-slate-400 mt-6 md:mt-0 w-full md:w-auto`}>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full md:w-auto">
            <NavLinks />
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t border-white/10 md:border-none">
            {token ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors text-left md:text-center"
                >
                  Logout
                </button>
                {location.pathname === '/workspace' && (
                  <button 
                    onClick={() => setIsNavMinimized(!isNavMinimized)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-all font-bold text-[10px] shadow-[0_0_10px_rgba(139,92,246,0.2)] uppercase tracking-wider"
                    title="Hide Navigation Menu"
                  >
                    <EyeOff className="w-3 h-3" />
                    Hide Menu
                  </button>
                )}
              </div>
            ) : (
              <>
                <Link 
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center md:justify-start gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <User className="h-4 w-4" />
                  User Login
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};
