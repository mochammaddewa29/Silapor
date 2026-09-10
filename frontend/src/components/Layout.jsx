import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>

        <footer className="py-4 text-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200/60 dark:border-gray-800">
          © 2026 SI-LAPOR. Sistem Informasi Pengaduan & Layanan Maintenance Terpadu.
        </footer>
      </div>
    </div>
  );
};

export default Layout;
