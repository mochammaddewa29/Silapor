import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  TrendingUp, 
  PieChart as PieIcon, 
  Plus, 
  FileText,
  ArrowRight, 
  RefreshCw, 
  AlertCircle,
  Zap,
  CheckCircle,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await reportsAPI.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Gagal memuat data statistik dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Theme palettes (PLN Style)
  const CATEGORY_COLORS = ['#2563EB', '#FACC15', '#10B981', '#6366F1', '#EC4899', '#64748B'];
  const STATUS_COLORS = {
    Menunggu: '#FACC15', // Soft Yellow
    Diproses: '#2563EB', // Soft Blue
    Selesai: '#10B981',  // Soft Green
    Ditolak: '#EF4444',  // Rose Red
  };

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-amber-400"></div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Menyiapkan ringkasan dashboard...
          </p>
        </div>
      </div>
    );
  }

  const pendingCount = stats?.summary?.pending || 0;
  const processingCount = stats?.summary?.processing || 0;
  const completedCount = stats?.summary?.completed || 0;
  const totalCount = stats?.summary?.total || 0;

  // Format monthly trend data for chart
  const formattedMonthly = (stats?.byMonth || []).map((item) => {
    const parts = (item.month || '').split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const label = parts.length === 2 ? `${monthNames[parseInt(parts[1], 10) - 1]} ${parts[0].slice(2)}` : item.month;
    return {
      ...item,
      label,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Dashboard Ringkasan
            </h1>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {isAdmin ? 'Operasional Admin' : 'Portal Pelapor'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ringkasan metrik pengaduan dan statistik perbaikan fasilitas.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate('/lapor')}
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white px-3.5 py-2.5 text-xs font-bold shadow-sm shadow-blue-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>+ Buat Laporan</span>
          </button>

          <button
            onClick={() => navigate(isAdmin ? '/admin/laporan' : '/riwayat')}
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold shadow-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="truncate">Semua Laporan</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </button>

          <button
            onClick={fetchStats}
            title="Perbarui Data"
            className="rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Insight Singkat Banner */}
      <div className="rounded-2xl border border-blue-100 dark:border-[#334155] bg-gradient-to-r from-blue-50/80 via-white to-amber-50/50 dark:from-[#1E293B] dark:via-[#1E293B] dark:to-slate-800/80 p-4 sm:p-5 shadow-xs transition-all duration-200">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] text-white shrink-0 shadow-sm">
            <Zap className="h-4 w-4 text-[#FACC15] fill-[#FACC15]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Insight Operasional</span>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {pendingCount > 0 ? (
                <>
                  Terdapat <span className="font-bold text-amber-600 dark:text-amber-400">{pendingCount} laporan belum ditangani</span> yang membutuhkan tindak lanjut teknisi. Sebanyak <span className="font-bold text-emerald-600 dark:text-emerald-400">{completedCount} laporan</span> telah selesai diperbaiki.
                </>
              ) : (
                <>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Semua laporan telah ditindaklanjuti!</span> Tidak ada antrean tiket tertunda. Sebanyak <span className="font-bold text-blue-600 dark:text-blue-400">{processingCount} laporan</span> sedang dalam pengerjaan teknisi.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 1 Row Summary (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Laporan */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Total Laporan</p>
              <h3 className="mt-1 text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {totalCount}
              </h3>
              <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">Semua pengaduan</p>
            </div>
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Inbox className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>

        {/* Menunggu */}
        <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-[#1E293B] p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400">Menunggu</p>
              <h3 className="mt-1 text-xl sm:text-3xl font-black tracking-tight text-amber-900 dark:text-amber-300">
                {pendingCount}
              </h3>
              <p className="mt-0.5 text-[10px] sm:text-[11px] text-amber-600/80 dark:text-amber-400/70">Perlu konfirmasi</p>
            </div>
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>

        {/* Diproses */}
        <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/40 dark:bg-[#1E293B] p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-blue-700 dark:text-blue-400">Diproses</p>
              <h3 className="mt-1 text-xl sm:text-3xl font-black tracking-tight text-blue-950 dark:text-blue-200">
                {processingCount}
              </h3>
              <p className="mt-0.5 text-[10px] sm:text-[11px] text-blue-600/80 dark:text-blue-400/70">Penanganan</p>
            </div>
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>

        {/* Selesai */}
        <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-[#1E293B] p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400">Selesai</p>
              <h3 className="mt-1 text-xl sm:text-3xl font-black tracking-tight text-emerald-950 dark:text-emerald-200">
                {completedCount}
              </h3>
              <p className="mt-0.5 text-[10px] sm:text-[11px] text-emerald-600/80 dark:text-emerald-400/70">Selesai</p>
            </div>
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Chart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom 1: Tren Laporan Per Bulan */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Grafik Tren Laporan Per Bulan
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Aktivitas volume laporan kerusakan masuk
                </p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {formattedMonthly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E2E8F0'} vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} 
                    axisLine={{ stroke: isDark ? '#334155' : '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} 
                    axisLine={{ stroke: isDark ? '#334155' : '#E2E8F0' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: isDark ? '#334155' : '#F1F5F9', opacity: 0.5 }}
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      color: isDark ? '#FFFFFF' : '#0F172A',
                    }}
                    formatter={(value) => [`${value} Laporan`, 'Jumlah']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#2563EB" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={45} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Belum ada data riwayat bulanan.
              </div>
            )}
          </div>
        </div>

        {/* Kolom 2: Distribusi Status & Kategori */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-500">
                <PieIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Distribusi Kategori Kerusakan
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Proporsi pengaduan berdasarkan jenis fasilitas
                </p>
              </div>
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              {stats?.byCategory && stats.byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.byCategory}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {stats.byCategory.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                      }}
                      formatter={(val, name) => [`${val} Tiket`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  Belum ada data kategori.
                </div>
              )}
            </div>
          </div>

          {/* Category Legend Pills */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#334155] flex flex-wrap gap-1.5">
            {stats?.byCategory?.map((cat, idx) => (
              <div 
                key={cat.category} 
                className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60"
              >
                <span 
                  className="h-2 w-2 rounded-full shrink-0" 
                  style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                ></span>
                <span className="truncate max-w-[100px]">{cat.category}</span>
                <span className="font-bold text-slate-900 dark:text-white">({cat.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
