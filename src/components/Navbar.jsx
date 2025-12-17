import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Award } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  // Helper to highlight active link
  const navClass = (path) => 
    `text-sm font-medium transition-colors hover:text-yellow-500 ${
      location.pathname === path ? 'text-yellow-400 font-bold' : 'text-white'
    }`;

  return (
    <nav className="bg-amber-950 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white text-xl font-bold tracking-wider">
            <Award className="text-yellow-500" size={28} />
            <span>AWARD<span className="text-yellow-500"> APP</span></span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link to="/" className={navClass('/')}>Home</Link>
              <Link to="/vote" className={navClass('/vote')}>Vote</Link>
              <Link to="/winners" className={navClass('/winners')}>Winners</Link>
              <Link to="/admin" className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-md transition text-sm">
                Admin
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-gray-300 hover:text-white focus:outline-none">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700">Home</Link>
            <Link to="/vote" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700">Vote</Link>
            <Link to="/winners" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700">Winners</Link>
            <Link to="/admin" onClick={toggleMenu} className="block px-3 py-2 rounded-md text-base font-medium text-yellow-500 hover:bg-gray-700">Admin Portal</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;