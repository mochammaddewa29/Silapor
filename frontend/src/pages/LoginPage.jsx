import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Zap,
  Lock,
  User,
  Mail,
  AlertCircle,
  ArrowRight,
  Sun,
  Moon,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCcw,
  ChevronLeft,
  ShieldCheck,
  Building,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI, divisionAPI } from '../services/api';

// Mode: 'login' | 'register' | 'otp' | 'forgot' | 'reset_otp'
export const LoginPage = () => {
  const [mode, setMode] = useState('login');

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDivisi, setRegDivisi] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [divisionsList, setDivisionsList] = useState([]);

  // OTP Register state
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 menit
  const [resendLoading, setResendLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const otpRefs = useRef([]);
  const countdownRef = useRef(null);

  // Forgot Password & Reset state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetOtpValues, setResetOtpValues] = useState(['', '', '', '', '', '']);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetOtpCountdown, setResetOtpCountdown] = useState(300);
  const [resetResendLoading, setResetResendLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const resetOtpRefs = useRef([]);
  const resetCountdownRef = useRef(null);

  const [error, setError] = useState('');

  const { login, loginWithGoogle, isAuthenticated, isAdmin, register: registerUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/dashboard' : '/riwayat'} replace />;
  }

  // Fetch divisions
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const data = await divisionAPI.getAll();
        setDivisionsList(data);
      } catch (err) {
        console.error('Gagal mengambil data divisi:', err);
      }
    };
    fetchDivisions();
  }, []);

  // Countdown OTP Register
  useEffect(() => {
    if (mode === 'otp') {
      setOtpCountdown(300);
      countdownRef.current = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownRef.current);
  }, [mode]);

  // Countdown OTP Reset Password
  useEffect(() => {
    if (mode === 'reset_otp') {
      setResetOtpCountdown(300);
      resetCountdownRef.current = setInterval(() => {
        setResetOtpCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(resetCountdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(resetCountdownRef.current);
  }, [mode]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const parseErrorMessage = (err, defaultMsg) => {
    if (!err) return defaultMsg;
    if (typeof err === 'string') return err;
    if (typeof err.response?.data?.error === 'string') return err.response.data.error;
    if (typeof err.response?.data?.error === 'object' && err.response.data.error?.message) {
      return err.response.data.error.message;
    }
    if (err.message && typeof err.message === 'string') return err.message;
    return defaultMsg;
  };

  const switchMode = (newMode) => {
    setError('');
    setMode(newMode);
  };

  // ---- LOGIN ----
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(loginUsername, loginPassword);
      navigate(data.user.role === 'admin' ? '/dashboard' : '/riwayat');
    } catch (err) {
      setError(parseErrorMessage(err, 'Username atau password salah.'));
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
      setError(parseErrorMessage(err, 'Gagal login dengan Google. Pastikan popup tidak diblokir.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  // ---- REGISTER (SEND OTP) ----
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (regPassword !== regConfirmPassword) {
      return setError('Password dan konfirmasi password tidak cocok.');
    }
    if (regPassword.length < 6) {
      return setError('Password minimal 6 karakter.');
    }
    if (!regDivisi.trim()) {
      return setError('Divisi wajib diisi.');
    }
    if (!regUsername.trim()) {
      return setError('Username wajib diisi.');
    }

    setRegLoading(true);
    try {
      await authAPI.sendOTP(regEmail, regUsername, regFullName, regPassword, regDivisi);
      setOtpValues(['', '', '', '', '', '']);
      setOtpSuccess(false);
      switchMode('otp');
    } catch (err) {
      setError(parseErrorMessage(err, 'Gagal mengirim OTP. Coba lagi.'));
    } finally {
      setRegLoading(false);
    }
  };

  // ---- OTP INPUT HANDLING ----
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpValues(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  // ---- VERIFY OTP ----
  const handleVerifyOTP = async () => {
    const otp = otpValues.join('');
    if (otp.length < 6) return setError('Masukkan 6 digit kode OTP.');
    if (otpCountdown === 0) return setError('Kode OTP sudah kedaluwarsa. Silakan minta OTP baru.');

    setError('');
    setOtpLoading(true);
    try {
      const data = await authAPI.verifyOTP(regEmail, otp);
      // Simpan sesi
      sessionStorage.setItem('app_token', data.token);
      sessionStorage.setItem('app_user', JSON.stringify(data.user));
      setOtpSuccess(true);
      setTimeout(() => {
        navigate('/riwayat');
        window.location.reload();
      }, 1200);
    } catch (err) {
      setError(parseErrorMessage(err, 'Kode OTP salah atau sudah kedaluwarsa.'));
      setOtpValues(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  // ---- RESEND OTP ----
  const handleResendOTP = async () => {
    setError('');
    setResendLoading(true);
    setOtpValues(['', '', '', '', '', '']);
    try {
      await authAPI.sendOTP(regEmail, regFullName, regPassword, regDivisi);
      clearInterval(countdownRef.current);
      setOtpCountdown(300);
      countdownRef.current = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(parseErrorMessage(err, 'Gagal mengirim ulang OTP. Coba lagi.'));
    } finally {
      setResendLoading(false);
    }
  };

  // ---- FORGOT PASSWORD SUBMIT (SEND RESET OTP) ----
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!forgotEmail.trim()) {
      return setError('Email wajib diisi.');
    }
    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail.trim());
      setResetOtpValues(['', '', '', '', '', '']);
      setResetNewPassword('');
      setResetConfirmPassword('');
      setResetSuccess(false);
      switchMode('reset_otp');
    } catch (err) {
      setError(parseErrorMessage(err, 'Gagal mengirim OTP reset password. Pastikan email terdaftar.'));
    } finally {
      setForgotLoading(false);
    }
  };

  // ---- RESET OTP INPUT HANDLING ----
  const handleResetOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...resetOtpValues];
    newOtp[index] = value;
    setResetOtpValues(newOtp);
    if (value && index < 5) {
      resetOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleResetOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !resetOtpValues[index] && index > 0) {
      resetOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleResetOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setResetOtpValues(pasted.split(''));
      resetOtpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  // ---- RESEND RESET OTP ----
  const handleResendResetOTP = async () => {
    setError('');
    setResetResendLoading(true);
    setResetOtpValues(['', '', '', '', '', '']);
    try {
      await authAPI.forgotPassword(forgotEmail.trim());
      clearInterval(resetCountdownRef.current);
      setResetOtpCountdown(300);
      resetCountdownRef.current = setInterval(() => {
        setResetOtpCountdown((prev) => {
          if (prev <= 1) { clearInterval(resetCountdownRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
      resetOtpRefs.current[0]?.focus();
    } catch (err) {
      setError(parseErrorMessage(err, 'Gagal mengirim ulang OTP. Coba lagi.'));
    } finally {
      setResetResendLoading(false);
    }
  };

  // ---- RESET PASSWORD SUBMIT ----
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const otp = resetOtpValues.join('');
    if (otp.length < 6) return setError('Masukkan 6 digit kode OTP reset.');
    if (resetOtpCountdown === 0) return setError('Kode OTP sudah kedaluwarsa. Silakan minta OTP baru.');
    if (resetNewPassword !== resetConfirmPassword) {
      return setError('Password baru dan konfirmasi password tidak cocok.');
    }
    if (resetNewPassword.length < 6) {
      return setError('Password baru minimal 6 karakter.');
    }

    setError('');
    setResetLoading(true);
    try {
      const data = await authAPI.resetPassword(forgotEmail.trim(), otp, resetNewPassword);
      if (data.token) {
        sessionStorage.setItem('app_token', data.token);
        sessionStorage.setItem('app_user', JSON.stringify(data.user));
      }
      setResetSuccess(true);
      setTimeout(() => {
        navigate(data.user?.role === 'admin' ? '/dashboard' : '/riwayat');
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(parseErrorMessage(err, 'Gagal mereset password. Pastikan OTP benar.'));
      setResetOtpValues(['', '', '', '', '', '']);
      resetOtpRefs.current[0]?.focus();
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">

      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-[#0B1E3F] via-[#0E2A59] to-[#1E88E5] opacity-100 dark:opacity-20 transition-opacity duration-200"></div>
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#FFC107]/20 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10 space-y-6">

        {/* Dark Mode Toggle */}
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
        <div className="rounded-[2rem] border border-slate-200/80 dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-2xl shadow-blue-900/10 dark:shadow-none overflow-hidden transition-all duration-300">

          {/* Card Header */}
          <div className="bg-gradient-to-br from-[#0B1E3F] to-[#1E88E5] p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-900/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFC107] shadow-lg shadow-amber-500/20 font-black mb-4">
                <Zap className="h-8 w-8 fill-[#0B1E3F] text-[#0B1E3F]" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl font-black tracking-wider text-white">Lapor</span>
                <span className="rounded bg-[#FFC107] px-2 py-0.5 text-sm font-black uppercase text-[#0B1E3F]">JakBan</span>
              </div>
              <p className="text-sm font-medium text-blue-100/90">Sistem Pelaporan Terpadu & Terintegrasi</p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-8">

            {/* Mode Tabs (Login / Daftar) — only show on login/register mode */}
            {mode !== 'otp' && mode !== 'forgot' && mode !== 'reset_otp' && (
              <div className="flex mb-8 bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1">
                <button
                  id="tab-login"
                  onClick={() => switchMode('login')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                    mode === 'login'
                      ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Masuk
                </button>
                <button
                  id="tab-register"
                  onClick={() => switchMode('register')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                    mode === 'register'
                      ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Daftar Akun
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-4 text-sm font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{typeof error === 'string' ? error : error?.message || String(error)}</span>
              </div>
            )}

            {/* ========== LOGIN MODE ========== */}
            {mode === 'login' && (
              <>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Selamat datang kembali! Silakan login untuk melanjutkan.
                </p>

                {/* Google Login */}
                <button
                  id="btn-google-login"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>{googleLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-[#1E293B] px-4 text-slate-500 font-medium tracking-wide">
                      ATAU MASUK DENGAN AKUN
                    </span>
                  </div>
                </div>

                {/* Manual Login */}
                <form id="form-login" onSubmit={handleLoginSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Username/Email</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        id="input-login-username"
                        type="text"
                        required
                        placeholder="Masukkan username/email"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                      <button
                        id="btn-forgot-password"
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginUsername.includes('@') ? loginUsername : '');
                          switchMode('forgot');
                        }}
                        className="text-xs font-bold text-[#1E88E5] hover:underline transition-colors"
                      >
                        Lupa Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        id="input-login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-colors"
                      />
                      <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    id="btn-login-submit"
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1E3F] to-[#1E88E5] hover:from-[#0E2A59] hover:to-blue-600 text-white py-3.5 px-4 text-sm font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer mt-2"
                  >
                    <ArrowRight className="h-5 w-5" />
                    <span>{loading ? 'Memproses...' : 'Masuk Manual'}</span>
                  </button>
                </form>
              </>
            )}

            {/* ========== REGISTER MODE ========== */}
            {mode === 'register' && (
              <>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Buat akun baru untuk melaporkan keluhan atau pengaduan.
                </p>

                {/* Google Register */}
                <button
                  id="btn-google-register"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm disabled:opacity-50 mb-6"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>{googleLoading ? 'Menghubungkan...' : 'Daftar dengan Google (Instant)'}</span>
                </button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-[#1E293B] px-4 text-slate-500 font-medium tracking-wide">
                      ATAU DAFTAR DENGAN EMAIL
                    </span>
                  </div>
                </div>

                <form id="form-register" onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        id="input-reg-fullname"
                        type="text"
                        required
                        placeholder="Nama lengkap Anda"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        id="input-reg-username"
                        type="text"
                        required
                        placeholder="Username unik Anda"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        id="input-reg-email"
                        type="email"
                        required
                        placeholder="email@contoh.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Divisi / Bagian</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                      <select
                        id="input-reg-divisi"
                        required
                        value={regDivisi}
                        onChange={(e) => setRegDivisi(e.target.value)}
                        className={`w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-4 text-sm focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-colors appearance-none ${regDivisi ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
                      >
                        <option value="" disabled>Pilih Divisi / Bagian Anda</option>
                        {divisionsList.map((div) => (
                          <option key={div.id} value={div.name}>{div.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        id="input-reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Minimal 6 karakter"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-colors"
                      />
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Konfirmasi Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        id="input-reg-confirm"
                        type="password"
                        required
                        placeholder="Ulangi password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                          regConfirmPassword && regPassword !== regConfirmPassword
                            ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100 dark:focus:ring-rose-900/40'
                            : 'border-slate-200 dark:border-[#334155] focus:border-[#1E88E5] focus:ring-blue-100 dark:focus:ring-blue-900/40'
                        }`}
                      />
                      {regConfirmPassword && regPassword === regConfirmPassword && (
                        <CheckCircle2 className="absolute right-3.5 top-3.5 h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  </div>

                  <button
                    id="btn-register-submit"
                    type="submit"
                    disabled={regLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1E3F] to-[#1E88E5] hover:from-[#0E2A59] hover:to-blue-600 text-white py-3.5 px-4 text-sm font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer mt-2"
                  >
                    <Mail className="h-5 w-5" />
                    <span>{regLoading ? 'Mengirim OTP...' : 'Kirim Kode OTP ke Email'}</span>
                  </button>
                </form>
              </>
            )}

            {/* ========== OTP MODE ========== */}
            {mode === 'otp' && (
              <div className="text-center">
                {/* Success */}
                {otpSuccess ? (
                  <div className="py-8 flex flex-col items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Akun Berhasil Dibuat!</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Mengalihkan ke dashboard...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Back button */}
                    <button
                      onClick={() => switchMode('register')}
                      className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-6"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Kembali</span>
                    </button>

                    <div className="flex justify-center mb-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                        <ShieldCheck className="h-8 w-8 text-[#1E88E5]" />
                      </div>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Verifikasi Email</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      Kode OTP 6 digit telah dikirim ke:
                    </p>
                    <p className="text-sm font-bold text-[#1E88E5] mb-6">{regEmail}</p>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-3 mb-4">
                      {otpValues.map((val, i) => (
                        <input
                          key={i}
                          id={`otp-input-${i}`}
                          ref={(el) => (otpRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={val}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          onPaste={i === 0 ? handleOtpPaste : undefined}
                          className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none transition-all ${
                            val
                              ? 'border-[#1E88E5] bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-[#334155]'
                          } focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40`}
                        />
                      ))}
                    </div>

                    {/* Countdown */}
                    <div className={`text-sm font-semibold mb-6 ${otpCountdown === 0 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      {otpCountdown > 0 ? (
                        <>⏰ Kode berlaku: <span className="font-black text-[#1E88E5]">{formatCountdown(otpCountdown)}</span></>
                      ) : (
                        '⚠️ Kode OTP sudah kedaluwarsa'
                      )}
                    </div>

                    {/* Verify Button */}
                    <button
                      id="btn-verify-otp"
                      onClick={handleVerifyOTP}
                      disabled={otpLoading || otpValues.join('').length < 6 || otpCountdown === 0}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1E3F] to-[#1E88E5] hover:from-[#0E2A59] hover:to-blue-600 text-white py-3.5 px-4 text-sm font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 cursor-pointer mb-4"
                    >
                      <ShieldCheck className="h-5 w-5" />
                      <span>{otpLoading ? 'Memverifikasi...' : 'Verifikasi & Buat Akun'}</span>
                    </button>

                    {/* Resend */}
                    <button
                      id="btn-resend-otp"
                      onClick={handleResendOTP}
                      disabled={resendLoading || (otpCountdown > 240)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-[#1E88E5] dark:hover:text-[#1E88E5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCcw className={`h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
                      <span>{resendLoading ? 'Mengirim ulang...' : 'Kirim ulang OTP'}</span>
                    </button>
                    {otpCountdown > 240 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        (tersedia dalam {formatCountdown(otpCountdown - 240)})
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ========== FORGOT PASSWORD MODE ========== */}
            {mode === 'forgot' && (
              <div>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-6 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Kembali ke Login</span>
                </button>

                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                    <KeyRound className="h-8 w-8 text-[#F59E0B]" />
                  </div>
                </div>

                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 text-center">Lupa Password?</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
                  Masukkan email akun Anda. Kami akan mengirimkan kode verifikasi OTP 6 digit untuk mereset password.
                </p>

                <form id="form-forgot" onSubmit={handleForgotSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Alamat Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        id="input-forgot-email"
                        type="email"
                        required
                        placeholder="email@contoh.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-forgot-submit"
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1E3F] to-[#1E88E5] hover:from-[#0E2A59] hover:to-blue-600 text-white py-3.5 px-4 text-sm font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer mt-2"
                  >
                    <Mail className="h-5 w-5" />
                    <span>{forgotLoading ? 'Mengirim OTP...' : 'Kirim Kode OTP Reset'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* ========== RESET PASSWORD OTP MODE ========== */}
            {mode === 'reset_otp' && (
              <div className="text-center">
                {resetSuccess ? (
                  <div className="py-8 flex flex-col items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Password Berhasil Diubah!</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Mengalihkan ke dashboard...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-left">
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-6 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Kembali</span>
                      </button>
                    </div>

                    <div className="flex justify-center mb-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                        <KeyRound className="h-8 w-8 text-[#F59E0B]" />
                      </div>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Atur Password Baru</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      Masukkan kode OTP yang dikirim ke:
                    </p>
                    <p className="text-sm font-bold text-[#1E88E5] mb-6">{forgotEmail}</p>

                    <form id="form-reset-password" onSubmit={handleResetPasswordSubmit} className="space-y-4 text-left">
                      {/* OTP Boxes */}
                      <div>
                        <label className="block text-xs font-bold text-center text-slate-700 dark:text-slate-300 mb-2">
                          KODE VERIFIKASI OTP (6 DIGIT)
                        </label>
                        <div className="flex justify-center gap-3 mb-2">
                          {resetOtpValues.map((val, i) => (
                            <input
                              key={i}
                              id={`reset-otp-input-${i}`}
                              ref={(el) => (resetOtpRefs.current[i] = el)}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={val}
                              onChange={(e) => handleResetOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleResetOtpKeyDown(i, e)}
                              onPaste={i === 0 ? handleResetOtpPaste : undefined}
                              className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none transition-all ${
                                val
                                  ? 'border-[#F59E0B] bg-amber-50 dark:bg-amber-900/20'
                                  : 'border-slate-200 dark:border-[#334155]'
                              } focus:border-[#F59E0B] focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/40`}
                            />
                          ))}
                        </div>

                        {/* Countdown */}
                        <div className={`text-center text-xs font-semibold mb-4 ${resetOtpCountdown === 0 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                          {resetOtpCountdown > 0 ? (
                            <>⏰ Kode berlaku: <span className="font-black text-[#F59E0B]">{formatCountdown(resetOtpCountdown)}</span></>
                          ) : (
                            '⚠️ Kode OTP sudah kedaluwarsa'
                          )}
                        </div>
                      </div>

                      {/* Password Baru */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password Baru</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                          <input
                            id="input-reset-password"
                            type={showResetPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            placeholder="Minimal 6 karakter"
                            value={resetNewPassword}
                            onChange={(e) => setResetNewPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowResetPassword(!showResetPassword)}
                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Konfirmasi Password Baru */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Konfirmasi Password Baru</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                          <input
                            id="input-reset-confirm"
                            type="password"
                            required
                            placeholder="Ulangi password baru"
                            value={resetConfirmPassword}
                            onChange={(e) => setResetConfirmPassword(e.target.value)}
                            className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                              resetConfirmPassword && resetNewPassword !== resetConfirmPassword
                                ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100 dark:focus:ring-rose-900/40'
                                : 'border-slate-200 dark:border-[#334155] focus:border-[#1E88E5] focus:ring-blue-100 dark:focus:ring-blue-900/40'
                            }`}
                          />
                          {resetConfirmPassword && resetNewPassword === resetConfirmPassword && (
                            <CheckCircle2 className="absolute right-3.5 top-3.5 h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                      </div>

                      <button
                        id="btn-reset-submit"
                        type="submit"
                        disabled={resetLoading || resetOtpValues.join('').length < 6 || resetOtpCountdown === 0}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1E3F] to-[#1E88E5] hover:from-[#0E2A59] hover:to-blue-600 text-white py-3.5 px-4 text-sm font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 cursor-pointer mt-2"
                      >
                        <Lock className="h-5 w-5" />
                        <span>{resetLoading ? 'Menyimpan Password...' : 'Simpan Password Baru'}</span>
                      </button>

                      <div className="text-center pt-2">
                        <button
                          id="btn-resend-reset-otp"
                          type="button"
                          onClick={handleResendResetOTP}
                          disabled={resetResendLoading || (resetOtpCountdown > 240)}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-[#1E88E5] dark:hover:text-[#1E88E5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <RefreshCcw className={`h-4 w-4 ${resetResendLoading ? 'animate-spin' : ''}`} />
                          <span>{resetResendLoading ? 'Mengirim ulang...' : 'Kirim ulang OTP'}</span>
                        </button>
                        {resetOtpCountdown > 240 && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            (tersedia dalam {formatCountdown(resetOtpCountdown - 240)})
                          </p>
                        )}
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 text-center border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">© 2026 Lapor JakBan — Respon Tanggap 24/7</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
