import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Lock, Save, Camera, CheckCircle2, AlertCircle } from 'lucide-react';

const ProfilePage = () => {
  const { user, login } = useAuth(); // login function will update user context
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
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

    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setErrorMsg('Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    if (formData.new_password && formData.new_password.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }

    try {
      setLoading(true);
      const dataToUpdate = {
        full_name: formData.full_name
      };

      if (formData.new_password) {
        dataToUpdate.current_password = formData.current_password;
        dataToUpdate.new_password = formData.new_password;
      }

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

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Profil Pengguna
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelola informasi akun dan pengaturan keamanan Anda.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        
        {/* Avatar Section */}
        <div className="px-6 relative flex justify-between items-end pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-end gap-4 -mt-10 sm:-mt-12 relative z-10">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white dark:bg-slate-800 p-1.5 shadow-md">
              <div className="h-full w-full rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold">
                {getInitials(user?.full_name)}
              </div>
            </div>
            <div className="pb-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.full_name}</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">@{user?.username}</p>
            </div>
          </div>
          <div className="pb-2 hidden sm:block">
            <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
              {user?.role === 'admin' ? 'Administrator' : 'Pengguna Biasa'}
            </span>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-6">
          {successMsg && (
            <div className="mb-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200/50 dark:border-emerald-900/50 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{successMsg}</p>
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-4 border border-rose-200/50 dark:border-rose-900/50 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5" />
              <p className="text-sm font-medium text-rose-800 dark:text-rose-300">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4" /> Informasi Pribadi
              </h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-500 mt-1">Username tidak dapat diubah.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="h-4 w-4" /> Ganti Password
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kosongkan bagian ini jika Anda tidak ingin mengubah password.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
  );
};

export default ProfilePage;
