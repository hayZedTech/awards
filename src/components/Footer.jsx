import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="mb-2">&copy; {new Date().getFullYear()} Award Nomination Platform. All rights reserved.</p>
        <p className="text-xs text-gray-600">
          Designed by <span className="text-white">Azeez Ololade Musa</span> for Excellence.
        </p>
      </div>
    </footer>
  );
};

export default Footer;