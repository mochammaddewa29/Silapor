import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Lock, Save, Camera, CheckCircle2, AlertCircle, Shield, AtSign } from 'lucide-react';

const ProfilePage = () => {
  const { user, login } = useAuth(); // login function will update user context
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    full_name: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!formData.full_name.trim()) {
      setErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }

    try {
      setLoading(true);
      const dataToUpdate = {
        full_name: formData.full_name
      };

      const res = await authAPI.updateProfile(dataToUpdate);
      setSuccessMsg(res.message || 'Profil berhasil diperbarui!');
      
      // Update local storage and context
      if (res.user) {
        sessionStorage.setItem('app_user', JSON.stringify(res.user));
        localStorage.setItem('app_user', JSON.stringify(res.user));
        // Soft refresh to apply context changes
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }


    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Profil Pengguna
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola informasi akun dan preferensi Anda.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#1E293B]/80 shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden relative transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/40">
        
        {/* Decorative Background Elements */}
        <div className="relative w-full h-32 sm:h-48 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 opacity-100 overflow-hidden">
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/20 blur-3xl rounded-full"></div>
          <div className="absolute top-10 -left-10 w-40 h-40 bg-white/20 blur-3xl rounded-full"></div>
          
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        </div>
        
        {/* Avatar & Header Section */}
        <div className="px-6 sm:px-10 relative flex flex-col sm:flex-row sm:items-end sm:justify-between pb-8 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-12 sm:-mt-16 relative z-10 text-center sm:text-left">
            
            {/* Avatar Profile */}
            <div className="group relative h-24 w-24 sm:h-32 sm:w-32 rounded-3xl bg-white dark:bg-[#1E293B] p-2 shadow-xl ring-1 ring-slate-900/5 dark:ring-white/10 transition-transform duration-500 hover:scale-105">
              <div className="h-full w-full rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-inner relative overflow-hidden">
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                {getInitials(user?.full_name)}
              </div>
              
              <button className="absolute -bottom-1 -right-1 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors z-20 hover:scale-110 active:scale-95 duration-200">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="pb-1 mt-3 sm:mt-0">
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                {user?.full_name}
                {user?.role === 'admin' && (
                  <div className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" title="Administrator">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                )}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <AtSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-70" />
                  {user?.username}
                </p>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-70" />
                  {user?.role === 'admin' ? 'Administrator' : 'Pengguna Biasa'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="pb-2 mt-4 sm:mt-0 hidden sm:block">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Akun Aktif
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-10 bg-slate-50/50 dark:bg-transparent">
          {successMsg && (
            <div className="mb-8 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-4 border border-emerald-200/60 dark:border-emerald-500/20 flex items-start gap-3">
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 p-1 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Berhasil</h4>
                <p className="text-sm font-medium text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}
          {errorMsg && (
            <div className="mb-8 rounded-2xl bg-rose-50 dark:bg-rose-500/10 p-4 border border-rose-200/60 dark:border-rose-500/20 flex items-start gap-3">
              <div className="rounded-full bg-rose-100 dark:bg-rose-500/20 p-1 shrink-0">
                <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">Gagal</h4>
                <p className="text-sm font-medium text-rose-700/80 dark:text-rose-400/80 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" /> 
                Informasi Pribadi
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                Perbarui informasi dasar profil Anda. Pastikan menggunakan nama asli untuk memudahkan identifikasi pada sistem.
              </p>
            </div>

            <div className="lg:col-span-8">
              <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800/40 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                      </div>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 pl-12 pr-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600"
                        placeholder="Masukkan nama lengkap Anda"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Username
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <AtSign className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={user?.username || ''}
                        disabled
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 pl-12 pr-4 py-3.5 text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-80"
                      />
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      Username merupakan identitas unik dan tidak dapat diubah.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
