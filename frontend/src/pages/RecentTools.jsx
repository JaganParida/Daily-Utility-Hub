import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Pin } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAnalytics } from '../hooks/useAnalytics';
import { allTools } from '../data/toolCategories';

const RecentTools = () => {
  const { recentTools, pinnedTools, togglePin } = useAnalytics();
  
  const recentToolObjects = recentTools
    .map(path => allTools.find(t => t.to === path))
    .filter(Boolean)
    .slice(0, 16);

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto w-full py-12 px-4 sm:px-6 md:px-8 bg-[#08090d] text-[#f8fafc] min-h-screen">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1e2235] pb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
              Recently <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Used</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Quickly re-open tools you've recently interacted with during this session.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-mono bg-[#0f1118] border border-[#1e2235] px-4 py-2 rounded-xl text-slate-300">
              {recentToolObjects.length} Utilities
            </span>
          </div>
        </div>

        {/* Content */}
        {recentToolObjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-[#0f1118] border border-dashed border-[#23273c] rounded-3xl shadow-xl text-center"
          >
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mb-5 text-cyan-400">
              <Clock size={28} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No tools used recently</h2>
            <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
              Your recently opened utilities will automatically populate here as you run operations.
            </p>
            <Link to="/dashboard" className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95">
              Explore Utilities
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentToolObjects.map((tool, index) => {
              const isPinned = pinnedTools.includes(tool.to);
              return (
                <motion.div 
                  key={tool.name} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="group relative h-full"
                >
                  <div className="card-elevated p-5 flex flex-col justify-between h-full group">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 rounded-xl bg-[#141722] text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <tool.icon size={22} />
                        </div>
                        <button
                          onClick={() => togglePin(tool.to)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            isPinned
                              ? 'bg-indigo-500/15 text-indigo-400 hover:bg-rose-500/15 hover:text-rose-400'
                              : 'bg-[#141722] text-slate-400 hover:bg-indigo-500/15 hover:text-indigo-400'
                          }`}
                          title={isPinned ? "Remove from pinned" : "Pin to Workspace"}
                        >
                          <Pin size={14} className={isPinned ? "fill-current" : ""} />
                        </button>
                      </div>
                      
                      <h3 className="font-bold text-base text-white tracking-tight mb-1 group-hover:text-cyan-400 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                    
                    <Link 
                      to={tool.to}
                      className="mt-5 pt-3 border-t border-[#1e2235] flex items-center justify-between font-bold text-xs text-slate-400 group-hover:text-cyan-400 transition-colors"
                    >
                      <span>Launch Utility</span>
                      <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </PageTransition>
  );
};

export default RecentTools;
