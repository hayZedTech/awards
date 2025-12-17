import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, LogOut, Menu, X, Award } from 'lucide-react';

const AdminLayout = ({ children, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Clear session
    localStorage.removeItem('isAdminLoggedIn');
    // 2. Trigger parent logout state update if provided
    if (onLogout) onLogout();
    // 3. Navigate to home or reload
    navigate('/'); 
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Categories', path: '/admin/categories', icon: <Trophy size={20} /> }, // Example future route
    { name: 'Nominees', path: '/admin/nominees', icon: <Users size={20} /> }, // Example future route
  ];

  // Helper to check active state (ignoring query params)
  const isActive = (path) => location.pathname === path;

  // Home
  const homekey=()=>{
    navigate("/");
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* --- SIDEBAR (Desktop & Mobile) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 shadow-xl
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-center h-16 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-2 font-bold text-xl tracking-wider">
            <Award className="text-yellow-500" /> ADMIN
          </div>
          {/* Close button for mobile */}
          <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute right-4 text-gray-400">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200
                ${isActive(item.path) 
                  ? 'bg-yellow-500 text-gray-900 font-bold' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        

        {/* Logout Button (Bottom) */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg transition"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>


      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header (Mobile Toggle) */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600">
            <Menu size={24} />
          </button>
          
          <h1 className="text-lg font-semibold text-gray-700">
            Administration Panel
          </h1>

          <div className="flex items-center gap-3">
             <div className="">
                <button onClick={homekey} className='h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs'>Home</button>
             </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
        />
      )}
    </div>
  );
};

export default AdminLayout;