import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useState } from 'react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} isCollapsed={isCollapsed} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
