import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  Zap, 
  Lock, 
  User, 
  AlertCircle, 
  ArrowRight,
  Sun, 
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LoginPage = () => {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, loginWithGoogle, isAuthenticated, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/dashboard" : "/riwayat"} replace />;
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(loginUsername, loginPassword);
      navigate(data.user.role === 'admin' ? '/dashboard' : '/riwayat');
    } catch (err) {
      console.error('Login error:', err);
      if (!err.response) {
        setError('Gagal terhubung ke server backend. Periksa koneksi internet Anda.');
      } else {
        setError(err.response?.data?.error || 'Username atau password salah.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const data = await loginWithGoogle();
      navigate(data.user.role === 'admin' ? '/dashboard' : '/riwayat');
    } catch (err) {
      console.error('Google Login error:', err);
      setError('Gagal login dengan Google. Pastikan popup tidak diblokir atau coba lagi.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-[#0B1E3F] via-[#0E2A59] to-[#1E88E5] opacity-100 dark:opacity-20 transition-opacity duration-200"></div>
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#FFC107]/20 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10 space-y-6">
        
        {/* Top Header Controls (Dark Mode) */}
        <div className="flex justify-end">
          <button
            onClick={toggleTheme}
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-800 backdrop-blur-sm text-slate-700 dark:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700"
          >
            {isDark ? <Sun className="h-5 w-5 text-[#FFC107]" /> : <Moon className="h-5 w-5 text-blue-600" />}
          </button>
        </div>

        {/* Card */}
        <div className="rounded-[2rem] border border-slate-200/80 dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-2xl shadow-blue-900/10 dark:shadow-none overflow-hidden transition-all duration-200">
          
          {/* Card Header (Branding) */}
          <div className="bg-gradient-to-br from-[#0B1E3F] to-[#1E88E5] p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-900/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]"></div>
            
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFC107] shadow-lg shadow-amber-500/20 font-black mb-4">
                <Zap className="h-8 w-8 fill-[#0B1E3F] text-[#0B1E3F]" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl font-black tracking-wider text-white">Lapor</span>
                <span className="rounded bg-[#FFC107] px-2 py-0.5 text-sm font-black uppercase text-[#0B1E3F]">
                  JakBan
                </span>
              </div>
              <p className="text-sm font-medium text-blue-100/90">
                Sistem Pelaporan Terpadu & Terintegrasi
              </p>
            </div>
          </div>

          {/* Card Body (Forms) */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Selamat Datang Kembali
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Silakan login untuk melanjutkan ke dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-4 text-sm font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>{googleLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-[#1E293B] px-4 text-slate-500 font-medium tracking-wide">
                  ATAU LOGIN MANUAL (ADMIN)
                </span>
              </div>
            </div>

            {/* Manual Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1E3F] to-[#1E88E5] hover:from-[#0E2A59] hover:to-blue-600 text-white py-3.5 px-4 text-sm font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer mt-2"
              >
                <ArrowRight className="h-5 w-5" />
                <span>{loading ? 'Memproses...' : 'Masuk Manual'}</span>
              </button>
            </form>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 text-center border-t border-slate-100 dark:border-slate-800">
             <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">© 2026 Lapor JakBan - Respon Tanggap 24/7</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
