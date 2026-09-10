import React from 'react';
import { Menu, Plus, Bell, Sun, Moon, Shield, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CloudStatusBadge from './CloudStatusBadge';

export const Navbar = ({ onOpenSidebar }) => {
  const { user, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard Ringkasan';
      case '/lapor':
        return 'Buat Laporan Kerusakan';
      case '/riwayat':
        return 'Riwayat Laporan Saya';
      case '/admin/laporan':
        return 'Manajemen Laporan Operasional';
      default:
        return 'Sistem Pengaduan Maintenance';
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-3 sm:px-6 lg:px-8 backdrop-blur-md dark:border-[#334155] dark:bg-[#0F172A]/90 transition-colors duration-200">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
        <button
          onClick={onOpenSidebar}
          aria-label="Buka Menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden focus:outline-none transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate max-w-[145px] xs:max-w-[200px] sm:max-w-xs md:max-w-none">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">
            Sistem Informasi Pengaduan & Layanan Maintenance
          </p>
        </div>
      </div>

      {/* Right side: Action items */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Quick Report Button if not already on report page */}
        {location.pathname !== '/lapor' && (
          <button
            onClick={() => navigate('/lapor')}
            className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>+ Buat Laporan</span>
          </button>
        )}

        {/* Cloud Connection Status Badge */}
        <CloudStatusBadge />

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/90 px-2 sm:px-3 py-1 sm:py-1.5 dark:border-gray-700 dark:bg-gray-800/90">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[100px]">
              {user?.full_name || 'User'}
            </p>
            <p className="text-[10px] font-semibold text-blue-600 dark:text-amber-400">
              {isAdmin ? 'Administrator' : 'Pelapor'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
