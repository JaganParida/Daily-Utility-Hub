import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, Shield, Laptop, Smartphone, LogOut, CheckCircle2, 
  Settings2, Activity, Clock, ArrowRight, Loader2, Key,
  BarChart3, Zap, Calendar, TrendingUp, Heart, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { allTools } from '../data/toolCategories';
import PageTransition from '../components/PageTransition';

const ProfileSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-10 animate-pulse bg-[#08090d]">
      <div className="mb-10 flex items-center gap-4">
        <div className="w-14 h-14 bg-[#141722] rounded-2xl shrink-0" />
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[#141722] rounded-xl" />
          <div className="h-4 w-72 bg-[#141722] rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0f1118] border border-[#1e2235] p-6 sm:p-8 rounded-2xl flex flex-col gap-6">
            <div className="h-6 w-36 bg-[#141722] rounded-lg" />
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-[#141722] rounded" />
                  <div className="h-11 w-full bg-[#141722] rounded-xl" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-[#141722] rounded" />
                  <div className="h-11 w-full bg-[#141722] rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#0f1118] border border-[#1e2235] p-6 sm:p-8 rounded-2xl flex flex-col gap-6">
            <div className="h-6 w-32 bg-[#141722] rounded-lg" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 w-full bg-[#141722] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const { currentUser: user, loading, updateProfile, terminateSession } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [terminatingId, setTerminatingId] = useState(null);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const usageInsights = useMemo(() => {
    if (!user?.recentHistory?.length) return null;

    const toolCounts = {};
    user.recentHistory.forEach(item => {
      toolCounts[item.toolPath] = (toolCounts[item.toolPath] || 0) + 1;
    });

    const sortedTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]);
    const topToolPath = sortedTools[0]?.[0];
    const topTool = allTools.find(t => t.to === topToolPath);

    const dayCounts = {};
    user.recentHistory.forEach(item => {
      const day = new Date(item.visitedAt).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const uniqueTools = new Set(user.recentHistory.map(h => h.toolPath)).size;

    return { topTool, topDay, uniqueTools, totalVisits: user.recentHistory.length };
  }, [user?.recentHistory]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08090d]">
        <Loader2 className="animate-spin text-indigo-400" size={36} />
      </div>
    );
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateProfile(name);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTerminate = async (sessionId) => {
    setTerminatingId(sessionId);
    try {
      await terminateSession(sessionId);
      toast.success("Device session logged out.");
    } catch (err) {
      toast.error("Failed to log out device.");
    } finally {
      setTerminatingId(null);
    }
  };

  const getToolDetails = (path) => {
    return allTools.find(tool => tool.to === path);
  };

  return (
    <PageTransition className="max-w-6xl mx-auto w-full px-4 md:px-8 py-12 bg-[#08090d] text-[#f8fafc] min-h-screen">
      
      {/* Page Header */}
      <div className="mb-8 flex items-center gap-4 border-b border-[#1e2235] pb-6">
        <div className="w-13 h-13 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
          <Settings2 size={26} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Account & Security
          </h1>
          <p className="text-slate-400 mt-0.5 text-xs md:text-sm">
            Manage your personal profile, active device authorizations, and usage telemetry.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column: Account Details & Sessions */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          
          {/* Account Details Card */}
          <div className="card-elevated p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#1e2235] pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="text-indigo-400" size={20} />
                Profile Information
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Verified Account
              </span>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-widest text-slate-400 ml-0.5 mb-1.5 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-[#1e2235] text-white bg-[#141722] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-widest text-slate-400 ml-0.5 mb-1.5 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-[#1e2235] text-slate-500 bg-[#0c0e17] cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-widest text-slate-400 ml-0.5 mb-1.5 block">
                    Security Protection
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 border border-emerald-500/20 rounded-xl bg-emerald-500/10 text-sm">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span className="text-emerald-400 font-bold text-xs">Email Verified & Protected</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-widest text-slate-400 ml-0.5 mb-1.5 block">
                    Authorized Devices
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 border border-[#1e2235] rounded-xl bg-[#141722] text-sm">
                    <Shield size={16} className="text-indigo-400 shrink-0" />
                    <span className="text-white font-bold text-xs">{user.activeSessions?.length || 0} of 2 active sessions</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="animate-spin" size={16} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Device & Session Management */}
          <div className="card-elevated p-6 sm:p-8 flex flex-col gap-5">
            <div className="border-b border-[#1e2235] pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="text-indigo-400" size={20} />
                Active Device Sessions
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                You can keep up to <strong>2 concurrent device sessions</strong> active. Signing in on a new device will safely revoke your oldest session.
              </p>
            </div>

            <div className="divide-y divide-[#1e2235]">
              <AnimatePresence mode="popLayout">
                {(user.activeSessions || []).map((session) => {
                  const isCurrent = session.isCurrent;
                  const isMobile = /Mobile|Phone|Android|iOS/.test(session.deviceName);
                  const isTerminating = terminatingId === session._id;

                  return (
                    <motion.div
                      key={session._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="py-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                          isCurrent ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' : 'bg-[#141722] border-[#1e2235] text-slate-400'
                        }`}>
                          {isMobile ? <Smartphone size={20} /> : <Laptop size={20} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm truncate">{session.deviceName}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                                Current Device
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                            Last active: {new Date(session.lastActive).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => handleTerminate(session._id)}
                          disabled={isTerminating}
                          className="px-3.5 py-1.5 border border-[#1e2235] hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 whitespace-nowrap disabled:opacity-50"
                        >
                          {isTerminating ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : (
                            <LogOut size={12} />
                          )}
                          <span>Log Out Device</span>
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Usage Analytics & Recent Activity */}
        <div className="space-y-6 lg:space-y-8">
          
          {/* Usage Analytics Dashboard */}
          <div className="card-elevated p-6 flex flex-col gap-4">
            <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase font-mono tracking-wider border-b border-[#1e2235] pb-3">
              <BarChart3 size={15} className="text-indigo-400" /> Platform Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#141722] border border-[#1e2235] rounded-xl p-3.5 text-center">
                <div className="w-8 h-8 mx-auto rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-1.5">
                  <Zap size={16} />
                </div>
                <span className="text-xl font-black text-white block">{usageInsights?.uniqueTools || 0}</span>
                <span className="text-[9px] uppercase font-mono text-slate-400 mt-0.5 block">Tools Used</span>
              </div>

              <div className="bg-[#141722] border border-[#1e2235] rounded-xl p-3.5 text-center">
                <div className="w-8 h-8 mx-auto rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-1.5">
                  <Activity size={16} />
                </div>
                <span className="text-xl font-black text-white block">{usageInsights?.totalVisits || 0}</span>
                <span className="text-[9px] uppercase font-mono text-slate-400 mt-0.5 block">Executions</span>
              </div>

              <div className="bg-[#141722] border border-[#1e2235] rounded-xl p-3.5 text-center">
                <div className="w-8 h-8 mx-auto rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center mb-1.5">
                  <Heart size={16} />
                </div>
                <span className="text-xl font-black text-white block">{user.favoriteTools?.length || 0}</span>
                <span className="text-[9px] uppercase font-mono text-slate-400 mt-0.5 block">Favorites</span>
              </div>

              <div className="bg-[#141722] border border-[#1e2235] rounded-xl p-3.5 text-center">
                <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-1.5">
                  <Calendar size={16} />
                </div>
                <span className="text-xl font-black text-white block">{user.activeSessions?.length || 0}</span>
                <span className="text-[9px] uppercase font-mono text-slate-400 mt-0.5 block">Active Devices</span>
              </div>
            </div>

            {/* Most Used Tool Highlight */}
            {usageInsights?.topTool && (
              <div className="mt-1 p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={13} className="text-indigo-400" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">Most Used Utility</span>
                </div>
                <Link
                  to={usageInsights.topTool.to}
                  className="flex items-center gap-3 group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${usageInsights.topTool.color}`}>
                    {usageInsights.topTool.icon && <usageInsights.topTool.icon size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-white block truncate group-hover:text-indigo-400 transition-colors">
                      {usageInsights.topTool.name}
                    </span>
                  </div>
                  <ArrowRight size={13} className="text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card-elevated p-6 flex flex-col gap-4">
            <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase font-mono tracking-wider border-b border-[#1e2235] pb-3">
              <Clock size={15} className="text-indigo-400" /> Session Timeline
            </h3>

            {(user.recentHistory || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No activity history yet. Start exploring the hub utilities!
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                {user.recentHistory.slice(0, 8).map((historyItem, idx) => {
                  const details = getToolDetails(historyItem.toolPath);
                  if (!details) return null;
                  const Icon = details.icon;
                  return (
                    <Link
                      key={historyItem._id || idx}
                      to={historyItem.toolPath}
                      className="flex items-center justify-between p-2.5 bg-[#141722] hover:bg-[#181b28] border border-[#1e2235] rounded-xl transition-all group min-w-0 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${details.color}`}>
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-white block truncate group-hover:text-indigo-400 transition-colors">{details.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono block">
                            {new Date(historyItem.visitedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-indigo-400 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </PageTransition>
  );
};

export default Profile;
