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
      <div className="max-w-[1400px] mx-auto w-full py-8 px-4 sm:px-6 md:px-12 bg-[#0b141a] text-[#e9edef] min-h-screen">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#222d34] pb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#e9edef] mb-2">
              Recently <span className="text-[#00a884]">Used</span>
            </h1>
            <p className="text-sm text-[#8696a0] max-w-2xl font-medium">
              Pick up right where you left off. Utilities you've interacted with on this browser session.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-bold bg-[#111b21] border border-[#222d34] px-4 py-2 rounded-xl text-[#8696a0]">
              {recentToolObjects.length} Utilities
            </span>
          </div>
        </div>

        {/* Content */}
        {recentToolObjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-[#111b21] border border-dashed border-[#2a3942] rounded-3xl shadow-xs text-center"
          >
            <div className="w-16 h-16 bg-[#00a884]/15 border border-[#00a884]/30 rounded-2xl flex items-center justify-center mb-5 text-[#00a884]">
              <Clock size={28} />
            </div>
            <h2 className="text-xl font-bold text-[#e9edef] mb-2">No tools used recently</h2>
            <p className="text-[#8696a0] max-w-sm text-xs leading-relaxed">
              Your recently accessed utilities will automatically appear here as you interact with the application.
            </p>
            <Link to="/dashboard" className="mt-6 px-6 py-2.5 bg-[#00a884] text-white font-bold text-xs rounded-xl shadow-md shadow-[#00a884]/25 hover:bg-[#25d366] transition-all active:scale-[0.98]">
              Explore Utilities
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {recentToolObjects.map((tool, index) => {
              const isPinned = pinnedTools.includes(tool.to);
              return (
                <motion.div 
                  key={tool.name} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -4, transition: { type: "spring", stiffness: 180, damping: 18 } }}
                  className="group relative h-full"
                >
                  <Link 
                    to={tool.to}
                    className="relative flex flex-col justify-between h-full p-5 transition-all duration-300 bg-[#111b21] hover:bg-[#202c33] border border-[#222d34] hover:border-[#00a884]/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] overflow-hidden"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 rounded-xl bg-[#202c33] group-hover:bg-[#00a884] group-hover:text-white text-[#00a884] flex items-center justify-center transition-colors shrink-0">
                          <tool.icon size={22} strokeWidth={1.75} />
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault(); 
                            togglePin(tool.to);
                          }}
                          className={`p-2 rounded-xl transition-all z-30 cursor-pointer
                            ${isPinned 
                              ? 'bg-[#00a884]/15 text-[#00a884] hover:bg-rose-500/10 hover:text-rose-500' 
                              : 'bg-[#202c33] text-[#8696a0] hover:bg-[#00a884]/15 hover:text-[#00a884]'
                            }`}
                          title={isPinned ? "Remove from pinned" : "Pin to Workspace"}
                        >
                          <Pin size={15} className={isPinned ? "fill-current" : ""} />
                        </button>
                      </div>
                      
                      <h3 className="font-bold text-base text-[#e9edef] tracking-tight mb-1 group-hover:text-[#00a884] transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-[#8696a0] text-xs leading-relaxed font-medium">
                        {tool.description}
                      </p>
                    </div>
                    
                    <div className="mt-5 pt-3 border-t border-[#222d34] flex items-center font-bold text-xs text-[#8696a0] group-hover:text-[#00a884] transition-colors">
                      Launch Utility
                      <ArrowRight size={13} className="ml-1.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
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
