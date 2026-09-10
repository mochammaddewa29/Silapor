import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  ShieldCheck, 
  LogOut, 
  Zap, 
  Moon, 
  Sun,
  User,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dedicated menu items per role to avoid duplicate functions:
  // - Dashboard: Ringkasan overview
  // - Lapor: Form buat pengaduan
  // - User: Riwayat Laporan (khusus personal user)
  // - Admin: Manajemen Laporan (khusus operasional admin)
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      description: 'Ringkasan & Analitik',
      icon: LayoutDashboard,
    },
    {
      to: '/lapor',
      label: 'Buat Laporan',
      description: 'Pengaduan Kerusakan',
      icon: PlusCircle,
    },
    ...(isAdmin
      ? [
          {
            to: '/admin/laporan',
            label: 'Manajemen Laporan',
            description: 'Operasional & Tindakan',
            icon: ShieldCheck,
            badge: 'Admin',
          },
        ]
      : [
          {
            to: '/riwayat',
            label: 'Riwayat Laporan',
            description: 'Monitoring Aduan Saya',
            icon: FileText,
          },
        ]),
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto bg-[#0F172A] text-slate-200 p-4 sm:p-5 border-r border-slate-800 shadow-xl">
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {/* Lightning Icon Emblem */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-blue-950 shadow-md font-black shrink-0">
              <Zap className="h-5 w-5 fill-blue-950 text-blue-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-wider text-white">SI</span>
                <span className="rounded bg-[#FACC15] px-1.5 py-0.5 text-[10px] font-black uppercase text-blue-950">
                  LAPOR
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 tracking-tight">
                Maintenance System
              </p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="mt-6 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Menu Navigasi
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200 border-l-4 ${
                    isActive
                      ? 'border-[#2563EB] bg-blue-600/15 text-white font-bold shadow-sm'
                      : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                          isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <div className="min-w-0 text-left">
                        <p className={`text-xs font-semibold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          {item.label}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {item.badge && (
                      <span
                        className="rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="space-y-3 pt-4 border-t border-slate-800 shrink-0">
        {/* Dark mode switch */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-xl bg-slate-800/50 hover:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-all duration-200"
        >
          <div className="flex items-center gap-2.5">
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-400" />
            )}
            <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
          </div>
          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">
            {isDark ? 'Dark' : 'Light'}
          </span>
        </button>

        {/* User Profile Card */}
        <div className="rounded-xl bg-slate-800/40 p-3 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shrink-0 shadow-sm">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">
                {user?.full_name || 'Pengguna'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    isAdmin ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                ></span>
                <p className="text-[10px] font-medium text-slate-400 capitalize">
                  {user?.role === 'admin' ? 'Administrator' : 'Pelapor'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 px-3 py-2 text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          ></div>
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
