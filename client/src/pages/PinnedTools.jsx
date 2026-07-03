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
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-4">
              Pinned <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Tools</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl font-medium">
              Your quick access collection. Pin your favorite tools from the dashboard to keep them here for instant access.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-sm font-bold bg-muted px-4 py-2 rounded-full text-foreground shadow-sm">
              {pinnedToolObjects.length} / 8 Pinned
            </span>
          </div>
        </div>

        {/* Content */}
        {pinnedToolObjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-3xl shadow-sm text-center"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 text-muted-foreground">
              <Pin size={32} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No tools pinned yet</h2>
            <p className="text-muted-foreground max-w-sm">
              Go to the Dashboard and click the Pin icon on any tool to add it to your quick access collection.
            </p>
            <Link to="/dashboard" className="mt-8 px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors">
              Browse Tools
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
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 180, damping: 18 } }}
                className="group relative h-full"
              >
                <Link 
                  to={tool.to}
                  className={`relative flex flex-col h-full p-6 transition-all duration-500 bg-card/25 hover:bg-card/65 backdrop-blur-md border border-border/30 hover:${tool.color.split(' ')[0].replace('text-', 'border-') + '/50'} rounded-2xl shadow-sm hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_40px_rgba(99,102,241,0.05)] overflow-hidden`}
                >
                  {/* Subtle glow effect in the corner on hover */}
                  <div className={`absolute -right-8 -top-8 w-20 h-20 rounded-full ${tool.color.split(' ')[1].replace('/10', '/5')} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                  
                  <div className="flex items-start justify-between mb-5 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl ${tool.color} flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0`}>
                      <tool.icon size={28} strokeWidth={1.5} />
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault(); 
                        togglePin(tool.to);
                      }}
                      className="p-2 rounded-xl transition-all duration-300 z-30 bg-indigo-500/10 text-indigo-500 hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
                      title="Remove from pinned"
                    >
                      <Pin size={18} className="fill-current" />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-xl text-foreground tracking-tight mb-3 group-hover:text-primary transition-colors relative z-10">
                    {tool.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow font-medium relative z-10">
                    {tool.description}
                  </p>
                  
                  <div className="mt-auto flex items-center font-semibold text-sm text-muted-foreground group-hover:text-primary transition-colors relative z-10">
                    Launch Tool
                    <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
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
