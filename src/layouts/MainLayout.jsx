import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 1. Navigation Bar */}
      <Navbar />

      {/* 2. Main Content Area */}
      {/* flex-grow ensures this section takes up available space, pushing Footer down */}
      <main className="flex-grow">
        {/* <Outlet /> renders the child route's component (e.g., Home or Vote) */}
        <Outlet />
      </main>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;