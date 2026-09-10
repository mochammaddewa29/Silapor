import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0F172A] p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-700 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                Terjadi Kendala Tampilan
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Halaman mengalami kendala saat memuat komponen. Silakan refresh atau kembali ke halaman utama.
              </p>
            </div>
            {this.state.error && (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3 text-left font-mono text-[11px] text-rose-600 dark:text-rose-400 max-h-32 overflow-auto">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Muat Ulang</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 dark:border-gray-600 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Ke Beranda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
