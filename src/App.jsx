import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';

// Public Pages
import Home from './pages/Home';
import Vote from './pages/Vote';
import Winners from './pages/Winners'; // <-- NEW: Import the Winners component

// Admin Pages
import AdminDashboard from './pages/Admin'; 
import AdminCategories from './pages/AdminCategories'; 
import AdminNominees from './pages/AdminNominees'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* PUBLIC ROUTES */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/winners" element={<Winners />} /> {/* <-- NEW: Winners Route */}
        </Route>
        
        {/* ADMIN ROUTES */}
        {/* We don't wrap these in a layout here because AdminLayout is inside the pages */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/nominees" element={<AdminNominees />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;