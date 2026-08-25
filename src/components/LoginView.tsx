import { useState } from 'react';
import { googleSignIn } from '../lib/auth';
import { Code, Loader2, AlertCircle, ExternalLink, Copy, Check, Info, HelpCircle } from 'lucide-react';
import { User } from 'firebase/auth';

interface LoginViewProps {
  onSuccess: (user: User, token: string) => void;
}

export default function LoginView({ onSuccess }: LoginViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const appTitle = localStorage.getItem('cfg_app_title') || 'AI_GG';

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogin = async () => {
    setIsLoading(false);
    setIsLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onSuccess(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      // Construct a very helpful message based on typical Firebase errors
      const errCode = err?.code || '';
      if (errCode === 'auth/unauthorized-domain') {
        setError(`Domain "${currentDomain}" belum didaftarkan di Firebase Console Anda.`);
        setShowGuide(true);
      } else if (errCode === 'auth/popup-closed-by-user') {
        setError('Proses masuk dibatalkan karena popup ditutup sebelum selesai.');
      } else if (errCode === 'auth/popup-blocked') {
        setError('Popup masuk diblokir oleh peramban Anda. Izinkan popup untuk situs ini.');
      } else {
        setError(err?.message || 'Gagal masuk menggunakan Google. Pastikan domain Anda telah diizinkan.');
        // Show guidance if they are not on localhost (e.g. Vercel)
        if (currentDomain !== 'localhost' && currentDomain !== '127.0.0.1') {
          setShowGuide(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#121212] min-h-screen py-12 px-4 flex flex-col items-center justify-center text-white overflow-y-auto">
      <div className="mb-8 flex items-center gap-2">
        <Code className="w-8 h-8 text-orange-500 animate-pulse" />
        <h1 className="text-2xl font-bold tracking-tight">{appTitle}</h1>
      </div>
      
      <div className="max-w-md w-full space-y-6">
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] p-8 rounded-2xl shadow-2xl text-center">
          <h2 className="text-xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Sign in dengan Google.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Kesalahan Autentikasi</p>
                <p className="text-xs text-gray-300 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-950 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-white/5"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Masuk dengan Google</span>
              </>
            )}
          </button>

          {!showGuide && currentDomain !== 'localhost' && currentDomain !== '127.0.0.1' && (
            <button 
              onClick={() => setShowGuide(true)}
              className="mt-4 text-xs text-gray-500 hover:text-orange-400 flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Butuh bantuan integrasi Vercel / GitHub?
            </button>
          )}
        </div>

        {/* Beautiful Integration Setup Guidance */}
        {showGuide && (
          <div className="bg-[#181818] border border-[#2d2d2d] rounded-2xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-[#2d2d2d] pb-3">
              <Info className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-sm text-white">Panduan Otorisasi Google di Vercel</h3>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Firebase membatasi aktivitas autentikasi pop-up Google demi alasan keamanan. Agar <strong>Google Sign-In</strong> berfungsi di domain Vercel Anda, silakan ikuti langkah mudah berikut:
            </p>

            <div className="space-y-4 text-xs">
              {/* Step 1 */}
              <div className="space-y-1 bg-[#222] border border-[#2d2d2d] p-3 rounded-xl">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block">Langkah 1: Salin Domain Anda</span>
                <div className="flex items-center justify-between gap-2 mt-1.5 bg-[#121212] px-2.5 py-1.5 rounded-lg border border-[#333]">
                  <code className="text-gray-300 font-mono text-[11px] truncate select-all">{currentDomain}</code>
                  <button 
                    onClick={handleCopyOrigin}
                    className="shrink-0 p-1 bg-[#222] hover:bg-orange-500 hover:text-white rounded text-gray-400 transition-all flex items-center gap-1 text-[10px]"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-1 bg-[#222] border border-[#2d2d2d] p-3 rounded-xl">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block">Langkah 2: Daftarkan di Firebase Console</span>
                <p className="text-gray-400 leading-relaxed text-[11px] mt-1">
                  Buka <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline inline-flex items-center gap-0.5 font-semibold">Firebase Console <ExternalLink className="w-3 h-3" /></a>, masuk ke proyek Anda:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-gray-400 mt-1 text-[11px]">
                  <li>Pilih menu <strong>Authentication</strong> &gt; tab <strong>Settings</strong>.</li>
                  <li>Klik <strong>Authorized domains</strong> &gt; klik tombol <strong>Add domain</strong>.</li>
                  <li>Tempelkan domain yang Anda salin tadi (<code>{currentDomain}</code>) kemudian simpan.</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="space-y-1 bg-[#222] border border-[#2d2d2d] p-3 rounded-xl">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block">Langkah 3: Daftarkan di Google Cloud OAuth</span>
                <p className="text-gray-400 leading-relaxed text-[11px] mt-1">
                  Buka <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline inline-flex items-center gap-0.5 font-semibold">Google Cloud Credentials <ExternalLink className="w-3 h-3" /></a>:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-gray-400 mt-1 text-[11px]">
                  <li>Pilih Klien OAuth 2.0 Web Anda.</li>
                  <li>Di bagian <strong>Authorized JavaScript origins</strong>, klik Tambah URI dan masukkan domain lengkap Anda: <br /><code className="text-gray-300 font-mono text-[10px] block mt-1 bg-[#121212] p-1 rounded border border-[#333]">{currentOrigin}</code></li>
                  <li>Klik tombol <strong>Simpan</strong> di bagian bawah halaman.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setShowGuide(false)}
                className="w-full py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-xl text-xs font-semibold text-gray-300 transition-colors"
              >
                Sembunyikan Panduan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

