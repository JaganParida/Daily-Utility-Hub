import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pin, ArrowRight } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAnalytics } from '../hooks/useAnalytics';
import { allTools } from '../data/toolCategories';

const PinnedTools = () => {
  const { pinnedTools, togglePin } = useAnalytics();
  
  // Resolve tool paths to objects
  const pinnedToolObjects = pinnedTools
    .map(path => allTools.find(t => t.to === path))
    .filter(Boolean);

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto w-full py-8 px-4 md:px-12 lg:px-20 xl:px-32">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
              Pinned <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Utilities</span>
            </h1>
            <p className="text-base text-slate-500 max-w-2xl font-medium">
              Your personal workspace collection. Pin frequently used utilities from the dashboard for instantaneous access.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-bold bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 shadow-2xs">
              {pinnedToolObjects.length} / 8 Pinned
            </span>
          </div>
        </div>

        {/* Content */}
        {pinnedToolObjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl shadow-xs text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 text-blue-600">
              <Pin size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No utilities pinned yet</h2>
            <p className="text-slate-500 max-w-sm text-xs leading-relaxed">
              Explore tools on the dashboard and click the Pin icon on any utility to add it to this workspace.
            </p>
            <Link to="/dashboard" className="mt-6 px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98]">
              Browse Utilities
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {pinnedToolObjects.map((tool, index) => (
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
                  className="relative flex flex-col h-full p-6 transition-all duration-300 bg-white hover:bg-blue-50/20 border border-slate-200/90 hover:border-blue-400 rounded-2xl shadow-2xs hover:shadow-md overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-5 relative z-10">
                    <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-105 shrink-0`}>
                      <tool.icon size={24} strokeWidth={1.75} />
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault(); 
                        togglePin(tool.to);
                      }}
                      className="p-2 rounded-xl transition-all duration-200 z-30 bg-blue-50 text-blue-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      title="Remove from pinned"
                    >
                      <Pin size={16} className="fill-current" />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors relative z-10">
                    {tool.name}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-6 flex-grow font-medium relative z-10">
                    {tool.description}
                  </p>
                  
                  <div className="mt-auto flex items-center font-bold text-xs text-slate-400 group-hover:text-blue-600 transition-colors relative z-10">
                    Launch Utility
                    <ArrowRight size={14} className="ml-1.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </PageTransition>
  );
};

export default PinnedTools;
