import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, Shield, Laptop, Smartphone, LogOut, CheckCircle2, 
  Settings2, Activity, Bookmark, Clock, ArrowRight, Loader2, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { allTools } from '../data/toolCategories';
import PageTransition from '../components/PageTransition';

const ProfileSkeleton = () => {
  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 md:px-8 py-12 animate-pulse">
      {/* Page Title Skeleton */}
      <div className="mb-10 flex items-center gap-4">
        <div className="w-14 h-14 bg-muted rounded-2xl border border-border shrink-0" />
        <div className="space-y-2">
          <div className="h-10 w-48 bg-muted rounded-xl" />
          <div className="h-4 w-72 bg-muted rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Account Details Skeleton */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl flex flex-col gap-6">
            <div className="h-6 w-36 bg-muted rounded-lg" />
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-12 w-full bg-muted/40 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-12 w-full bg-muted/40 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-12 w-full bg-muted/40 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-muted rounded" />
                  <div className="h-12 w-full bg-muted/40 rounded-xl" />
                </div>
              </div>
              <div className="h-12 w-32 bg-muted rounded-xl mt-2" />
            </div>
          </div>
        </div>

        {/* Right Column: Sessions & Stats Skeletons */}
        <div className="space-y-8">
          {/* Active Devices Card Skeleton */}
          <div className="bg-card border border-border p-6 rounded-3xl flex flex-col gap-6">
            <div className="h-6 w-32 bg-muted rounded-lg" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border rounded-2xl bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-xl" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="w-20 h-8 bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Analytics Summary Skeleton */}
          <div className="bg-card border border-border p-6 rounded-3xl flex flex-col gap-6">
            <div className="h-6 w-36 bg-muted rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-2xl bg-muted/10 space-y-2">
                <div className="w-8 h-8 bg-muted rounded-xl" />
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-6 w-8 bg-muted rounded-lg" />
              </div>
              <div className="p-4 border border-border rounded-2xl bg-muted/10 space-y-2">
                <div className="w-8 h-8 bg-muted rounded-xl" />
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-6 w-8 bg-muted rounded-lg" />
              </div>
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync profile form input values on page refresh auth load
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile(name, password || undefined);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to map tool paths to tool details
  const getToolDetails = (path) => {
    return allTools.find(tool => tool.to === path);
  };

  return (
    <PageTransition className="max-w-[1400px] mx-auto w-full px-4 md:px-8 py-12">
      
      {/* Page Title */}
      <div className="mb-10 flex items-center gap-4">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-sm border border-primary/20 shrink-0">
          <Settings2 size={28} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">
            Profile Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            Manage your account, active device sessions, and user history.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Account Details & Password */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden flex flex-col gap-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <User className="text-primary" size={20} />
              Account Details
            </h2>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1.5 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-border placeholder-muted-foreground/50 text-foreground bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1.5 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-border/50 text-muted-foreground bg-muted/40 cursor-not-allowed sm:text-sm"
                  />
                </div>
              </div>

              <div className="w-full h-px bg-border my-6"></div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Key size={14} /> Change Password
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1.5 block">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="•••••••• (Min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-border placeholder-muted-foreground/30 text-foreground bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1.5 block">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-border placeholder-muted-foreground/30 text-foreground bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Device & Session Management */}
          <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Shield className="text-primary" size={20} />
                Active Device Sessions
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                You are allowed up to **2 active sessions** simultaneously. Signing in on a 3rd device will automatically log out your oldest session.
              </p>
            </div>

            <div className="divide-y divide-border/60">
              <AnimatePresence mode="popLayout">
                {user.activeSessions.map((session) => {
                  const isCurrent = session.isCurrent;
                  const isMobile = /Mobile|Phone|Android|iOS/.test(session.deviceName);

                  return (
                    <motion.div
                      key={session._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="py-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-border ${
                          isCurrent ? 'bg-primary/10 text-primary' : 'bg-muted/40 text-muted-foreground'
                        }`}>
                          {isMobile ? <Smartphone size={22} /> : <Laptop size={22} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm truncate">{session.deviceName}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground block mt-0.5">
                            Last Active: {new Date(session.lastActive).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => terminateSession(session._id)}
                          className="px-4 py-2 border border-border hover:border-red-500/30 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                          title="Revoke session and log out device"
                        >
                          <LogOut size={13} />
                          Log Out Device
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Phase 7 Analytics (History, Bookmarks) */}
        <div className="space-y-8">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Bookmark size={20} />
              </div>
              <span className="text-2xl font-black text-foreground block">
                {user.pinnedTools.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-1 block">
                Bookmarks
              </span>
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Activity size={20} />
              </div>
              <span className="text-2xl font-black text-foreground block">
                {user.recentHistory.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-1 block">
                Recent Visited
              </span>
            </div>
          </div>

          {/* Bookmarked / Pinned Tools */}
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              <Bookmark size={16} className="text-primary" /> Bookmarked Utilities
            </h3>

            {user.pinnedTools.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No bookmarked tools yet. Pin your favorite tools to see them here!
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto no-scrollbar">
                {user.pinnedTools.map(path => {
                  const details = getToolDetails(path);
                  if (!details) return null;
                  const Icon = details.icon;
                  return (
                    <Link
                      key={path}
                      to={path}
                      className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 border border-border rounded-xl transition-all group min-w-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-foreground ${details.color}`}>
                          <Icon size={16} />
                        </div>
                        <span className="font-bold text-xs text-foreground truncate">{details.name}</span>
                      </div>
                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-primary transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent History */}
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              <Clock size={16} className="text-primary" /> Recent Activity
            </h3>

            {user.recentHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No activity history yet. Start exploring the hub utilities!
              </p>
            ) : (
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto no-scrollbar">
                {user.recentHistory.slice(0, 8).map(historyItem => {
                  const details = getToolDetails(historyItem.toolPath);
                  if (!details) return null;
                  const Icon = details.icon;
                  return (
                    <Link
                      key={historyItem._id}
                      to={historyItem.toolPath}
                      className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 border border-border rounded-xl transition-all group min-w-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-foreground ${details.color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-foreground block truncate">{details.name}</span>
                          <span className="text-[9px] text-muted-foreground mt-0.5 block">
                            {new Date(historyItem.visitedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-primary transition-all shrink-0" />
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
