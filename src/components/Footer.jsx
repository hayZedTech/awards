import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="mb-2">&copy; {new Date().getFullYear()} Award Nomination Platform. All rights reserved.</p>
        <p className="text-xs text-gray-600">
          Designed with <span className="text-red-500">❤</span> for Excellence.
        </p>
      </div>
    </footer>
  );
};

export default Footer;