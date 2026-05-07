import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, CheckCircle, Ban, Trash2, Calendar, Sparkles, Search, ChevronDown, ChevronUp, Clock, XCircle, Plus, SlidersHorizontal, Edit3, Activity, Terminal, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { socket } from '../socket';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// ✅ Electron-এ কাজ করার জন্য API_URL ডিফাইন করা হলো
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const AdminPanel = () => {
  const { token, logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<{ [key: string]: any }>({});
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // ✅ API_URL যুক্ত করা হয়েছে [cite: 9]
        const [sumRes, topRes, modelRes] = await Promise.all([
           fetch(`${API_URL}/api/admin/analytics/summary`, { headers: { 'Authorization': `Bearer ${token}` } }),
           fetch(`${API_URL}/api/admin/analytics/top-users`, { headers: { 'Authorization': `Bearer ${token}` } }),
           fetch(`${API_URL}/api/admin/analytics/model-usage`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const summary = await sumRes.json();
        const topUsers = await topRes.json();
        const modelUsage = await modelRes.json();
        
        setAnalytics({ summary, topUsers, modelUsage });
      } catch (e) {
        console.error('Failed to fetch analytics', e);
      } finally {
        setLoadingAnalytics(false);
      }
    };
    if (token) fetchAnalytics();
  }, [token]);

  const [extendDays, setExtendDays] = useState<{ [key: string]: string }>({});

  const fetchUserDetails = async (userId: string) => {
    if (userDetails[userId]) return; // Cache

    try {
      // ✅ API_URL যুক্ত করা হয়েছে [cite: 13]
      const res = await fetch(`${API_URL}/api/admin/user/${userId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserDetails(prev => ({ ...prev, [userId]: data }));
      }
    } catch (e) {
      console.error('Failed to fetch user details', e);
    }
  };

  const toggleExpand = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
      fetchUserDetails(userId);
    }
  };

  const [approvalModal, setApprovalModal] = useState<{ userId: string; plan: string; accessStart: string; accessEnd: string; maxLimit: number; limitType: string; isEditing?: boolean } | null>(null);
  const [currentAdminView, setCurrentAdminView] = useState('summary');

  // Live Control Panel State
  const [activeSockets, setActiveSockets] = useState<any[]>([]);
  const [runningBatches, setRunningBatches] = useState<any[]>([]);

  useEffect(() => {
    socket.on('admin:sync', (data) => {
      setActiveSockets(data.activeUsers.map((item: any) => item[1]));
      setRunningBatches(data.runningBatches.map((item: any) => ({ socketId: item[0], ...item[1] })));
    });

    socket.on('user:join', (data) => {
      setActiveSockets(prev => {
        if (!prev.find(u => u.socketId === data.socketId)) return [...prev, data];
        return prev;
      });
    });

    socket.on('user:offline', (data) => {
      setActiveSockets(prev => prev.filter(u => u.socketId !== data.socketId));
    });

    socket.on('batch:started', (data) => {
      setRunningBatches(prev => {
        if (!prev.find(b => b.socketId === data.socketId)) return [...prev, data];
        return prev.map(b => b.socketId === data.socketId ? data : b);
      });
    });

    socket.on('batch:progress', (data) => {
      setRunningBatches(prev => prev.map(b => b.socketId === data.socketId ? { ...b, ...data } : b));
    });

    socket.on('batch:completed', (data) => {
      setRunningBatches(prev => prev.filter(b => b.socketId !== data.socketId));
    });

    socket.on('batch:stopped', (data) => {
      setRunningBatches(prev => prev.filter(b => b.socketId !== data.socketId));
    });

    socket.on('batch:failed', (data) => {
      setRunningBatches(prev => prev.filter(b => b.socketId !== data.socketId));
    });

    return () => {
      socket.off('admin:sync');
      socket.off('user:join');
      socket.off('user:offline');
      socket.off('batch:started');
      socket.off('batch:progress');
      socket.off('batch:completed');
      socket.off('batch:stopped');
      socket.off('batch:failed');
    };
  }, []);

  const handleForceLogout = (socketId: string) => {
    socket.emit('admin:force-logout', socketId);
  };

  const handleStopBatch = (socketId: string) => {
    socket.emit('admin:stop-batch', socketId);
  };
  
  const navigate = useNavigate();
  
  const openApprovalModal = (user: any) => {
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1); // Default 1 month
    setApprovalModal({
      userId: user._id,
      plan: 'Free Plan',
      accessStart: now.toISOString().split('T')[0],
      accessEnd: end.toISOString().split('T')[0],
      maxLimit: user.maxLimit || 10,
      limitType: user.limitType || 'daily',
      isEditing: false
    });
  };

  const openEditPlanModal = (user: any) => {
    setApprovalModal({
      userId: user._id,
      plan: user.planName || 'Free Plan',
      accessStart: user.accessStart ? new Date(user.accessStart).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      accessEnd: user.accessEnd ? new Date(user.accessEnd).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      maxLimit: user.maxLimit || 10,
      limitType: user.limitType || 'daily',
      isEditing: true
    });
  };

  const closeApprovalModal = () => setApprovalModal(null);

  const handleApproval = async () => {
    if (!approvalModal) return;
    
    const action = approvalModal.isEditing ? 'plan' : 'approve';
    const payload: any = {
      plan: approvalModal.plan,
      accessStart: approvalModal.accessStart,
      accessEnd: approvalModal.accessEnd,
      maxLimit: approvalModal.maxLimit,
      limitType: approvalModal.limitType
    };

    if (approvalModal.isEditing) {
      payload.planName = approvalModal.plan;
    }

    await handleAction(approvalModal.userId, action, payload);
    setApprovalModal(null);
  };
  
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 12000); // 12s timeout
    
    try {
      // ✅ API_URL যুক্ত করা হয়েছে [cite: 34]
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: abortController.signal
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) {
         if (res.status === 401 || res.status === 403) {
           logout();
           navigate('/admin/login');
           return;
         }
         throw new Error(`Server returned status ${res.status}`);
      }
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setUsers(data);
      } else {
        throw new Error('Invalid format from server');
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setError('Network timeout. Please refresh.');
      } else {
        setError(e.message || 'Connection error');
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate, logout]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (id: string, action: string, data?: any) => {
    if (!token) return;
    
    try {
      const method = action === 'delete' ? 'DELETE' : 'PUT';
      const body = data ? JSON.stringify(data) : undefined;
      // ✅ API_URL যুক্ত করা হয়েছে এবং পাথ ঠিক করা হয়েছে [cite: 43]
      const res = await fetch(`${API_URL}/api/admin/users/${id}/${action}`, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body
      });
      
      if (res.ok) {
        if (action === 'extend') {
          setExtendDays({ ...extendDays, [id]: '' });
        }
        fetchUsers();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed: ${errorData.error || action}`);
      }
    } catch(e) {
      alert(`System error performing ${action}`);
    }
  };

  const getRemainingDays = (endDateString: string) => {
    if (!endDateString) return 0;
    const end = new Date(endDateString);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                            (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeTab === 'requests') return u.requestedPlan !== null && u.requestedPlan !== undefined;
      if (activeTab === 'active') return u.status === 'active';
      if (activeTab === 'pending') return u.status === 'pending';
      if (activeTab === 'blocked') return u.status === 'blocked';
      if (activeTab === 'expired') {
        if (!u.accessEnd) return false;
        return new Date(u.accessEnd) < new Date();
      }
      return true; // all
    });
  }, [users, searchTerm, activeTab]);

  const getStatusBadge = (user: any) => {
    if (user.requestedPlan) {
      return <span className="px-2 py-1 flex items-center gap-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><Clock className="w-3 h-3"/> Plan Request</span>;
    }
    if (user.status === 'active') {
      const isExpired = user.accessEnd && new Date(user.accessEnd) < new Date();
      if (isExpired) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">Expired</span>;
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Active</span>;
    }
    if (user.status === 'blocked') return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Blocked</span>;
    if (user.status === 'pending_request') return <span className="px-2 py-1 flex items-center gap-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><Clock className="w-3 h-3"/> Plan Request</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Pending</span>;
  };

  if (loading) return <div className="text-center p-20 text-slate-400 font-medium">Loading...</div>;
  if (error) return <div className="text-center p-20 text-red-400 font-medium border border-red-500/20 bg-red-500/10 rounded-xl max-w-2xl mx-auto mt-10">Error loading admin panel: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 text-white min-h-[calc(100vh-100px)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Admin Control Center</h1>
            <p className="text-slate-400 mt-1">Manage users, access, and plans</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/workspace')}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl flex items-center gap-2 font-medium shadow-lg shadow-purple-500/20 transition-all"
        >
          <Sparkles className="w-5 h-5" />
          SEO Page
        </button>
      </div>

      <div className="flex bg-white/5 p-1 rounded-xl mb-8 w-fit border border-white/5">
         {['summary', 'control', 'users', 'topUsers', 'modelUsage'].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentAdminView(view)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                 currentAdminView === view 
                 ? 'bg-purple-500/20 text-purple-400' 
                 : 'text-slate-400 hover:text-white'
              }`}
            >
              {view === 'summary' ? 'Overview' : view === 'control' ? 'Live Control' : view === 'topUsers' ? 'Top Users' : view === 'modelUsage' ? 'Model Usage' : 'Users'}
            </button>
         ))}
      </div>

      {currentAdminView === 'summary' && (
        <>
        {/* Analytics Summary */}
        {loadingAnalytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             {[1,2,3,4].map(i => <div key={i} className="bg-[#1A0B2E]/50 border border-purple-500/20 p-6 rounded-2xl animate-pulse h-24"></div>)}
          </div>
        ) : analytics?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             <div className="bg-[#1A0B2E]/50 border border-purple-500/20 p-6 rounded-2xl">
                 <div className="text-slate-400 text-xs font-semibold uppercase">Total Users</div>
                 <div className="text-white text-3xl font-bold mt-2">{analytics.summary.totalUsers}</div>
             </div>
             <div className="bg-[#1A0B2E]/50 border border-purple-500/20 p-6 rounded-2xl">
                 <div className="text-slate-400 text-xs font-semibold uppercase">Active Users (Today)</div>
                 <div className="text-white text-3xl font-bold mt-2">{analytics.summary.activeUsers}</div>
             </div>
             <div className="bg-[#1A0B2E]/50 border border-purple-500/20 p-6 rounded-2xl">
                 <div className="text-slate-400 text-xs font-semibold uppercase">Total Files</div>
                 <div className="text-white text-3xl font-bold mt-2">{analytics.summary.totalFiles}</div>
             </div>
             <div className="bg-[#1A0B2E]/50 border border-purple-500/20 p-6 rounded-2xl">
                 <div className="text-slate-400 text-xs font-semibold uppercase">Avg Success Rate</div>
                 <div className="text-white text-3xl font-bold mt-2">100%</div>
             </div>
          </div>
        )}
  
        {/* Analytics Detailed Charts (Top 5 Preview inside Summary) */}
        {analytics && !loadingAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
             <div className="bg-[#1A0B2E]/50 border border-purple-500/10 rounded-2xl p-6">
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">Top Users by Usage (Top 5)</h3>
               <div className="space-y-4">
                  {analytics.topUsers.slice(0, 5).map((u: any, i:number) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">{i+1}</div>
                         <div>
                           <div className="text-sm font-medium text-white">{u.name}</div>
                           <div className="text-xs text-slate-500">{u.email}</div>
                         </div>
                      </div>
                      <div className="text-sm font-bold text-emerald-400">{u.usageCount}</div>
                    </div>
                  ))}
               </div>
             </div>
             
             <div className="bg-[#1A0B2E]/50 border border-purple-500/10 rounded-2xl p-6">
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">Model Usage Breakdown</h3>
               <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analytics.modelUsage.map((m:any) => ({name: m._id, value: m.count}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {analytics.modelUsage.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={['#8b5cf6', '#a855f7', '#6366f1'][index % 3]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
             </div>
          </div>
        )}
        </>
      )}

      {currentAdminView === 'topUsers' && analytics && (
          <div className="bg-[#1A0B2E]/50 border border-purple-500/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">All Users by Usage</h3>
            <div className="space-y-4">
              {analytics.topUsers.map((u: any, i:number) => (
                <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">{i+1}</div>
                      <div>
                        <div className="text-sm font-medium text-white">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                  </div>
                  <div className="text-sm font-bold text-emerald-400">{u.usageCount}</div>
                </div>
              ))}
            </div>
          </div>
      )}

      {currentAdminView === 'modelUsage' && analytics && (
          <div className="bg-[#1A0B2E]/50 border border-purple-500/10 rounded-2xl p-6">
             <h3 className="text-xl font-bold text-white mb-6">Model Usage Breakdown</h3>
             <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.modelUsage.map((m:any) => ({name: m._id, value: m.count}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                      {analytics.modelUsage.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={['#8b5cf6', '#a855f7', '#6366f1'][index % 3]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
      )}

      {currentAdminView === 'control' && (
        <div className="bg-[#1A0B2E]/50 border border-emerald-500/20 rounded-2xl p-6 mb-8 relative overflow-hidden">
          {/* Live Control Panel */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0"></div>
        <div className="flex items-center gap-3 mb-6">
           <Activity className="w-6 h-6 text-emerald-400" />
           <h2 className="text-xl font-bold text-white">Live Control Panel</h2>
           <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse border border-emerald-500/20">LIVE</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
             <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wide">
               <Users className="w-4 h-4 text-purple-400" />
               Active Connections ({activeSockets.length})
             </h3>
             <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {activeSockets.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-4">No active users</div>
                ) : (
                  activeSockets.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                       <div>
                         <div className="text-sm font-medium text-white flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                           {s.email || 'Unknown User'}
                         </div>
                         <div className="text-xs text-slate-500 mt-1 font-mono">{s.socketId}</div>
                       </div>
                       <button onClick={() => handleForceLogout(s.socketId)} className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors border border-red-500/20 flex items-center gap-1.5 font-medium">
                         <Ban className="w-3.5 h-3.5" />
                         Logout
                       </button>
                    </div>
                  ))
                )}
             </div>
          </div>

           <div className="bg-black/20 rounded-xl p-4 border border-white/5">
             <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wide">
               <Terminal className="w-4 h-4 text-blue-400" />
               Running Batches ({runningBatches.length})
             </h3>
             <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {runningBatches.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-4">No active batches</div>
                ) : (
                  runningBatches.map((b, i) => {
                    const activeSocket = activeSockets.find(s => s.socketId === b.socketId);
                    const isTotalValid = b.total && b.total > 0;
                    const c = b.completed || 0;
                    const pct = isTotalValid ? Math.round((c / b.total) * 100) : 0;

                    return (
                       <div key={i} className="flex flex-col bg-white/5 p-3 rounded-lg border border-white/5">
                          <div className="flex items-start justify-between mb-2">
                             <div>
                                <div className="text-sm font-medium text-blue-300">
                                   {activeSocket?.email || 'User Batch'}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                   {c} of {b.total} items completed  •  {b.failed || 0} errors
                                </div>
                             </div>
                             <button onClick={() => handleStopBatch(b.socketId)} className="text-xs px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-md transition-colors border border-orange-500/20 flex items-center gap-1.5 font-medium">
                               <XCircle className="w-3.5 h-3.5" />
                               Stop
                             </button>
                          </div>
                          {isTotalValid && (
                             <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-500 h-1.5 transition-all duration-300 ease-out" style={{ width: `${pct}%` }}></div>
                             </div>
                          )}
                       </div>
                    );
                  })
                )}
             </div>
          </div>
        </div>
      </div>
      )}

      {currentAdminView === 'users' ? (
        <div className="bg-[#1A0B2E]/50 border border-purple-500/10 rounded-2xl p-6 overflow-hidden flex flex-col min-h-[600px]">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            {['all', 'requests', 'active', 'pending', 'expired', 'blocked'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 capitalize rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                {tab === 'requests' ? 'Plan Requests' : tab}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0F051D] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto flex-1 rounded-xl border border-white/5">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0F051D] text-slate-400 uppercase font-semibold text-xs border-b border-white/5 sticky top-0">
              <tr>
                <th className="px-4 py-4 w-10"></th>
                <th className="px-4 py-4">User</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Plan Info</th>
                <th className="px-4 py-4">Approved At</th>
                <th className="px-4 py-4">Expire At</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map(user => (
                <React.Fragment key={user._id}>
                  <tr className={`hover:bg-white/[0.02] transition-colors ${expandedUser === user._id ? 'bg-white/[0.02]' : ''}`}>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => toggleExpand(user._id)}
                        className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                      >
                        {expandedUser === user._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-4 py-4">
                       <span className="font-medium text-purple-300">{user.requestedPlan ? 'Requested: ' + user.requestedPlan : (user.planName || 'Basic')}</span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {user.accessStart ? new Date(user.accessStart).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {user.accessEnd ? new Date(user.accessEnd).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* ✅ ২য় ছবির ভিত্তিতে Approve বাটন এবং Active ইউজারের জন্য Edit বাটন [cite: 121-131] */}
                        {user.status === 'pending' ? (
                          <button onClick={() => openApprovalModal(user)} className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                        ) : (
                          <button 
                            onClick={() => openEditPlanModal(user)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit Plan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {user.requestedPlan && (
                           <>
                              <button onClick={() => openApprovalModal(user)} className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                                <CheckCircle className="w-3 h-3" /> Approve Plan
                              </button>
                              <button onClick={() => handleAction(user._id, 'reject-plan')} className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                           </>
                        )}
                        
                        {!user.requestedPlan && user.status !== 'blocked' && (
                          <button onClick={() => handleAction(user._id, 'block')} className="p-2 hover:bg-orange-500/10 text-orange-400 rounded-lg transition-colors" title="Block Account">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleAction(user._id, 'delete')} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors" title="Delete Account">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  <AnimatePresence>
                    {expandedUser === user._id && (
                      <tr>
                        <td colSpan={7} className="p-0 border-none bg-black/20">
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {/* Usage Overview */}
                              <div className="bg-[#1A0B2E] border border-white/5 rounded-xl p-4">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <Activity className="w-4 h-4" /> Usage
                                </h4>
                                {userDetails[user._id] ? (
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-400">Today:</span>
                                      <span className="text-white font-medium">{userDetails[user._id].usage.today} / {userDetails[user._id].usage.max}</span>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                                       <div className="bg-purple-500 h-1.5" style={{width: `${userDetails[user._id].usage.max > 0 ? Math.min(100, (userDetails[user._id].usage.today / userDetails[user._id].usage.max) * 100) : 0}%`}}></div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-400">Total:</span>
                                      <span className="text-white font-medium">{userDetails[user._id].usage.total}</span>
                                    </div>
                                  </div>
                                ) : <div className="text-slate-500 text-sm">Loading...</div>}
                              </div>
                              
                              {/* Subscription */}
                              <div className="bg-[#1A0B2E] border border-white/5 rounded-xl p-4">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <Shield className="w-4 h-4" /> Subscription
                                </h4>
                                <div className="space-y-3">
                                  <div className="text-white font-medium text-sm">{user.planName || 'Basic'}</div>
                                  <div className="text-xs text-slate-400">Expires: {user.accessEnd ? new Date(user.accessEnd).toLocaleDateString() : 'N/A'}</div>
                                  <div className="text-xs font-bold text-orange-400">{getRemainingDays(user.accessEnd)} Days Remaining</div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="bg-[#1A0B2E] border border-white/5 rounded-xl p-4 md:col-span-2 flex flex-col justify-between">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <SlidersHorizontal className="w-4 h-4" /> Quick Actions
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  <button onClick={() => openEditPlanModal(user)} className="px-3 py-2 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20">Edit Plan</button>
                                  <button onClick={() => handleAction(user._id, 'reset-usage')} className="px-3 py-2 bg-yellow-500/10 text-yellow-400 text-xs rounded-lg border border-yellow-500/20">Reset Usage</button>
                                  <button onClick={() => handleAction(user._id, 'block')} className="px-3 py-2 bg-orange-500/10 text-orange-400 text-xs rounded-lg border border-orange-500/20">Block/Unblock</button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Users className="w-8 h-8 opacity-20" />
                      <p>No users found matching the criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* ✅ ৩য় ছবির ভিত্তিতে প্ল্যান এডিট মোডাল [cite: 157-179] */}
        {approvalModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1A0B2E] border border-purple-500/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4">{approvalModal.isEditing ? 'Edit User Plan' : 'Approve User'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Select Plan</label>
                  <select 
                    value={approvalModal.plan}
                    onChange={(e) => {
                      const plan = e.target.value;
                      const now = new Date();
                      const end = new Date(now);
                      if (plan.includes('1 Month')) end.setMonth(end.getMonth() + 1);
                      else if (plan.includes('3 Month')) end.setMonth(end.getMonth() + 3);
                      else if (plan.includes('6 Month')) end.setMonth(end.getMonth() + 6);
                      else if (plan.includes('1 Year')) end.setFullYear(end.getFullYear() + 1);
                      else end.setDate(end.getDate() + 30); // Default
                      
                      setApprovalModal({...approvalModal, plan, accessEnd: end.toISOString().split('T')[0]});
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white mb-4"
                  >
                    <option value="Free Plan">Free Plan</option>
                    <option value="1 Month">1 Month</option>
                    <option value="3 Month">3 Month</option>
                    <option value="6 Month">6 Month</option>
                    <option value="1 Year">1 Year</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Max Limit</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        disabled={approvalModal.maxLimit === -1}
                        value={approvalModal.maxLimit === -1 ? '' : (approvalModal.maxLimit || 0)} 
                        onChange={(e) => setApprovalModal({...approvalModal, maxLimit: parseInt(e.target.value) || 0})} 
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white disabled:opacity-50" 
                        placeholder="∞"
                      />
                      <button 
                        type="button"
                        onClick={() => setApprovalModal({...approvalModal, maxLimit: approvalModal.maxLimit === -1 ? 10 : -1})}
                        className={`px-2.5 rounded-lg text-[9px] font-bold border transition-colors ${
                          approvalModal.maxLimit === -1 
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' 
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        UNLTD
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Limit Type</label>
                    <select 
                      value={approvalModal.limitType} 
                      onChange={(e) => setApprovalModal({...approvalModal, limitType: e.target.value})} 
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                      <option value="unlimited">Unlimited</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs text-slate-400 mb-1">Start</label>
                    <input type="date" value={approvalModal.accessStart} onChange={(e) => setApprovalModal({...approvalModal, accessStart: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white" />
                   </div>
                   <div>
                    <label className="block text-xs text-slate-400 mb-1">End</label>
                    <input type="date" value={approvalModal.accessEnd} onChange={(e) => setApprovalModal({...approvalModal, accessEnd: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white" />
                   </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closeApprovalModal} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button 
                  onClick={handleApproval} 
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${approvalModal.isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400'} text-white shadow-lg`}
                >
                  {approvalModal.isEditing ? 'Update Plan' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      ) : null}
    </div>
  );
};