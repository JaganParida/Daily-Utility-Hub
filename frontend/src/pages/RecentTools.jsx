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
      <div className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-6 md:px-8 bg-[#f8f9fa] text-[#202124] min-h-screen">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#dadce0] pb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#202124] mb-2">
              Recently <span className="text-[#1a73e8]">Used</span>
            </h1>
            <p className="text-sm text-[#5f6368] max-w-2xl">
              Quickly re-open tools you've recently interacted with during this session.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-semibold bg-white border border-[#dadce0] px-3.5 py-1.5 rounded-full text-[#5f6368] shadow-2xs">
              {recentToolObjects.length} Utilities
            </span>
          </div>
        </div>

        {/* Content */}
        {recentToolObjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-[#dadce0] rounded-3xl shadow-xs text-center"
          >
            <div className="w-16 h-16 bg-[#e8f0fe] border border-[#d2e3fc] rounded-2xl flex items-center justify-center mb-5 text-[#1a73e8]">
              <Clock size={28} />
            </div>
            <h2 className="text-xl font-bold text-[#202124] mb-2">No tools used recently</h2>
            <p className="text-[#5f6368] max-w-sm text-xs leading-relaxed">
              Your recently opened utilities will automatically populate here as you run operations.
            </p>
            <Link to="/dashboard" className="mt-6 px-6 py-2.5 bg-[#1a73e8] text-white font-bold text-xs rounded-full shadow-xs hover:bg-[#1557b0] transition-all active:scale-95">
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
                  <div className="card-elevated p-5 flex flex-col justify-between h-full bg-white border border-[#dadce0] hover:border-[#1a73e8] rounded-2xl shadow-xs group">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 rounded-xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <tool.icon size={22} />
                        </div>
                        <button
                          onClick={() => togglePin(tool.to)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            isPinned
                              ? 'bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#fce8e6] hover:text-[#ea4335]'
                              : 'bg-[#f8f9fa] text-[#80868b] hover:bg-[#e8f0fe] hover:text-[#1a73e8]'
                          }`}
                          title={isPinned ? "Remove from pinned" : "Pin to Workspace"}
                        >
                          <Pin size={14} className={isPinned ? "fill-current" : ""} />
                        </button>
                      </div>
                      
                      <h3 className="font-bold text-base text-[#202124] tracking-tight mb-1 group-hover:text-[#1a73e8] transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-[#5f6368] text-xs leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                    
                    <Link 
                      to={tool.to}
                      className="mt-5 pt-3 border-t border-[#dadce0] flex items-center justify-between font-bold text-xs text-[#5f6368] group-hover:text-[#1a73e8] transition-colors"
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
