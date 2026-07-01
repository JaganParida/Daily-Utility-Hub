import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';

const Layout = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Global Ambient Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] opacity-30 dark:opacity-20 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-background to-transparent blur-3xl"></div>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto flex flex-col relative z-10">
          <div className="p-4 md:p-6 lg:p-8 flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
