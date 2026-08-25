import { useState, useEffect } from 'react';
import { 
  Lock, 
  Key, 
  Users, 
  Palette, 
  Check, 
  X, 
  ShieldAlert, 
  ArrowLeft, 
  RefreshCw, 
  Eye, 
  Save, 
  LockOpen,
  UserCheck,
  UserX
} from 'lucide-react';
import { db, auth } from '../lib/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, updateDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

interface UserLog {
  name: string;
  status: 'allowed' | 'rejected' | 'pending';
  firstLogin: string;
  lastLogin?: string;
}

interface SettingsViewProps {
  onBack: () => void;
  onUpdateConfig: () => void;
}

const SUPER_ADMIN_EMAIL = "ahmad.andryanto50@admin.smp.belajar.id";
const DEFAULT_SUPER_ADMIN: Record<string, UserLog> = {
  [SUPER_ADMIN_EMAIL]: {
    name: "AHMAD ANDRYANTO",
    status: "allowed",
    firstLogin: "2026-08-25T00:00:00.000Z",
    lastLogin: new Date().toISOString()
  }
};

const getInitialUsersList = (): Record<string, UserLog> => {
  try {
    const saved = localStorage.getItem('cfg_users_list');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      ...DEFAULT_SUPER_ADMIN,
      ...parsed,
      [SUPER_ADMIN_EMAIL]: {
        name: parsed[SUPER_ADMIN_EMAIL]?.name || "AHMAD ANDRYANTO",
        status: "allowed",
        firstLogin: parsed[SUPER_ADMIN_EMAIL]?.firstLogin || "2026-08-25T00:00:00.000Z",
        lastLogin: new Date().toISOString()
      }
    };
  } catch (e) {
    return DEFAULT_SUPER_ADMIN;
  }
};

export default function SettingsView({ onBack, onUpdateConfig }: SettingsViewProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'appearance' | 'security'>('users');
  
  // Tab users state initialized with persistent admin data
  const [users, setUsers] = useState<Record<string, UserLog>>(getInitialUsersList);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Tab appearance state
  const [appTitle, setAppTitle] = useState('AI_GG');
  const [welcomeText, setWelcomeText] = useState('Sistem apa yang ingin kamu bangun hari ini');
  const [themeColor, setThemeColor] = useState('#3460e4');
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tab security state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [secMessage, setSecMessage] = useState<{ text: string; type: 'success' | 'error' }>({ text: '', type: 'success' });

  // Notification states and logic
  const [showNotification, setShowNotification] = useState(false);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      // Beautiful warm dual-chime chime (D5 then A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.12, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (err) {
      console.error("Gagal memutar notifikasi audio:", err);
    }
  };

  const triggerAdminNotification = () => {
    setShowNotification(true);
    playNotificationSound();
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  // Load current dynamic theme config and check Super Admin auth
  useEffect(() => {
    // Get local config if any
    const savedTitle = localStorage.getItem('cfg_app_title') || 'AI_GG';
    const savedWelcome = localStorage.getItem('cfg_welcome_text') || 'Sistem apa yang ingin kamu bangun hari ini';
    const savedColor = localStorage.getItem('cfg_theme_color') || '#3460e4';
    
    setAppTitle(savedTitle);
    setWelcomeText(savedWelcome);
    setThemeColor(savedColor);

    // Auto authenticate if logged in as Super Admin via Google Auth
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
        setIsAuthenticated(true);
      }
    });

    if (auth.currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
      setIsAuthenticated(true);
    }

    return () => unsubAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/settings/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!response.ok && response.status === 404) {
        throw new Error('Vercel/Offline Mode');
      }
      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        fetchUsers();
        triggerAdminNotification();
      } else {
        setLoginError(data.message || 'Password salah');
      }
    } catch (err) {
      // Offline / Vercel Client-side fallback
      const savedLocalPassword = localStorage.getItem('cfg_admin_password') || 'gg123';
      if (password === savedLocalPassword) {
        setIsAuthenticated(true);
        fetchUsers();
        triggerAdminNotification();
      } else {
        setLoginError('Password salah (Offline Mode)');
      }
    }
  };

  // Set up real-time listener for users in settings if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Only set loading indicator if user list is currently empty
    if (Object.keys(users).length === 0) {
      setLoadingUsers(true);
    }

    // Listen to real-time updates from Firestore "users" collection
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList: Record<string, UserLog> = { ...DEFAULT_SUPER_ADMIN };
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const emailKey = docSnap.id.toLowerCase();
        usersList[emailKey] = {
          name: data.name || emailKey.split('@')[0],
          status: emailKey === SUPER_ADMIN_EMAIL ? 'allowed' : (data.status || 'pending'),
          firstLogin: data.firstLogin || new Date().toISOString(),
          lastLogin: data.lastLogin
        };
      });

      // Always guarantee Super Admin is in the list
      if (!usersList[SUPER_ADMIN_EMAIL]) {
        usersList[SUPER_ADMIN_EMAIL] = DEFAULT_SUPER_ADMIN[SUPER_ADMIN_EMAIL];
      }

      setUsers(usersList);
      localStorage.setItem('cfg_users_list', JSON.stringify(usersList));
      setLoadingUsers(false);
    }, (err) => {
      console.log("Firestore snapshot info:", err);
      fetchUsers();
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const fetchUsers = async () => {
    if (Object.keys(users).length === 0) {
      setLoadingUsers(true);
    }
    try {
      const res = await fetch('/api/settings/users');
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) throw new Error('Offline/Vercel Mode');
      const data = await res.json();
      if (data.success && data.users) {
        const merged = { ...DEFAULT_SUPER_ADMIN, ...data.users };
        if (!merged[SUPER_ADMIN_EMAIL]) {
          merged[SUPER_ADMIN_EMAIL] = DEFAULT_SUPER_ADMIN[SUPER_ADMIN_EMAIL];
        }
        setUsers(merged);
        localStorage.setItem('cfg_users_list', JSON.stringify(merged));
      }
    } catch (err) {
      const saved = localStorage.getItem('cfg_users_list');
      const localUsers = saved ? JSON.parse(saved) : {};
      const merged = { ...DEFAULT_SUPER_ADMIN, ...localUsers };
      setUsers(merged);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateStatus = async (email: string, status: 'allowed' | 'rejected') => {
    try {
      // 1. Update Cloud Firestore (the primary synchronized database) using normalized lowercase email
      const emailLower = email.toLowerCase();
      const userDocRef = doc(db, 'users', emailLower);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        await updateDoc(userDocRef, { status });
      } else {
        await setDoc(userDocRef, {
          name: emailLower.split('@')[0],
          status,
          firstLogin: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      }
      
      // 2. Also update Express backend API if running in fullstack mode
      fetch(`/api/settings/users/${encodeURIComponent(emailLower)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }).catch(() => {});
      
    } catch (err) {
      console.error("Gagal memperbarui status via Firestore, mencoba backend/local storage...", err);
      
      try {
        const res = await fetch(`/api/settings/users/${encodeURIComponent(email)}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Offline/Vercel Mode');
        const data = await res.json();
        if (data.success) {
          setUsers(data.users);
          localStorage.setItem('cfg_users_list', JSON.stringify(data.users));
        }
      } catch (fallbackErr) {
        // Local storage fallback
        const localUsers = JSON.parse(localStorage.getItem('cfg_users_list') || '{}');
        if (localUsers[email]) {
          localUsers[email].status = status;
        } else {
          localUsers[email] = { name: email.split('@')[0], status, firstLogin: new Date().toISOString() };
        }
        localStorage.setItem('cfg_users_list', JSON.stringify(localUsers));
        setUsers(localUsers);
      }
    }
  };

  const handleSaveAppearance = () => {
    setSavingConfig(true);
    localStorage.setItem('cfg_app_title', appTitle);
    localStorage.setItem('cfg_welcome_text', welcomeText);
    localStorage.setItem('cfg_theme_color', themeColor);
    
    // Also notify other components via onUpdateConfig
    setTimeout(() => {
      setSavingConfig(false);
      setSaveSuccess(true);
      onUpdateConfig();
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 600);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecMessage({ text: '', type: 'error' });
    
    if (newPassword !== confirmNewPassword) {
      setSecMessage({ text: 'Konfirmasi password baru tidak cocok!', type: 'error' });
      return;
    }
    if (newPassword.length < 4) {
      setSecMessage({ text: 'Password baru minimal 4 karakter!', type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      if (!res.ok && res.status === 404) {
        throw new Error('Vercel/Offline Mode');
      }
      const data = await res.json();
      if (data.success) {
        setSecMessage({ text: 'Password sukses diubah!', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setSecMessage({ text: data.message || 'Password lama salah', type: 'error' });
      }
    } catch (err) {
      // Local password fallback
      const savedLocalPassword = localStorage.getItem('cfg_admin_password') || 'gg123';
      if (oldPassword === savedLocalPassword) {
        localStorage.setItem('cfg_admin_password', newPassword);
        setSecMessage({ text: 'Password sukses diubah secara lokal!', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setSecMessage({ text: 'Password lama salah (Offline Mode)', type: 'error' });
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 bg-[#111] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#181818] border border-[#2d2d2d] rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Akses Terkunci</h2>
            <p className="text-gray-400 text-sm text-center">Masukkan password pengaturan untuk masuk ke dashboard admin</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password Pengaturan</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..." 
                  className="w-full bg-[#222] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm transition-colors"
                  required
                />
                <Key className="absolute right-4 top-3.5 w-4 h-4 text-gray-500" />
              </div>
              {loginError && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {loginError}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={onBack}
                className="flex-1 py-3 bg-[#222] hover:bg-[#2d2d2d] border border-[#333] rounded-xl text-sm font-medium text-gray-300 transition-colors"
              >
                Kembali
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
              >
                <LockOpen className="w-4 h-4" />
                Masuk
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#111] flex flex-col h-screen text-gray-200 overflow-hidden">
      {/* Top Header */}
      <div className="h-16 border-b border-[#222] px-6 flex items-center justify-between bg-[#141414]">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-[#222] rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Dashboard Pengaturan Admin</h1>
            <p className="text-xs text-gray-500">Kelola izin masuk & kustomisasi tampilan aplikasi</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#1e1e1e] px-3 py-1.5 rounded-full border border-[#2d2d2d] text-xs font-semibold text-green-400">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          Sesi Admin Aktif
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Settings Navigation Tabs */}
        <div className="w-64 bg-[#141414] border-r border-[#222] p-4 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'users' 
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                : 'text-gray-400 hover:bg-[#1e1e1e] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Pengguna & Otorisasi
          </button>

          <button 
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'appearance' 
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                : 'text-gray-400 hover:bg-[#1e1e1e] hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            Kustomisasi Tampilan
          </button>

          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'security' 
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                : 'text-gray-400 hover:bg-[#1e1e1e] hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            Keamanan Admin
          </button>
        </div>

        {/* Content Panel */}
        <div className="flex-1 p-8 overflow-y-auto bg-[#111]">
          {activeTab === 'users' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Kelola Hak Akses Pengguna</h2>
                  <p className="text-sm text-gray-400">Izinkan atau tolak pengguna agar tidak bisa menggunakan aplikasi ini (hanya dapat melihat tampilan saja)</p>
                </div>
                <button 
                  onClick={fetchUsers} 
                  disabled={loadingUsers}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#2e2e2e] border border-[#333] rounded-lg text-xs font-medium text-gray-300 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                  Segarkan
                </button>
              </div>

              {loadingUsers && Object.keys(users).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                  <p className="text-sm text-gray-500">Memuat log aktivitas pengguna...</p>
                </div>
              ) : Object.keys(users).length === 0 ? (
                <div className="border border-[#2d2d2d] border-dashed rounded-xl p-12 text-center bg-[#141414]">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-400 font-medium">Belum Ada Pengguna yang Terdaftar</p>
                  <p className="text-xs text-gray-500 mt-1">Pengguna yang melakukan login akan otomatis tercatat di halaman ini.</p>
                </div>
              ) : (
                <div className="bg-[#141414] border border-[#2d2d2d] rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-[#1b1b1b] text-gray-400 text-xs uppercase tracking-wider border-b border-[#2d2d2d]">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Email Pengguna</th>
                        <th className="px-6 py-4 font-semibold">Nama</th>
                        <th className="px-6 py-4 font-semibold">Login Pertama</th>
                        <th className="px-6 py-4 font-semibold">Izin Akses</th>
                        <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222]">
                      {Object.entries(users).map(([email, userLog]) => {
                        const isAdmin = email === "ahmad.andryanto50@admin.smp.belajar.id";
                        return (
                          <tr key={email} className="hover:bg-[#1a1a1a] transition-colors">
                            <td className="px-6 py-4 font-medium text-white">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>{email}</span>
                                {isAdmin && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
                                    Super Admin
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-300">{userLog.name || '-'}</td>
                            <td className="px-6 py-4 text-xs text-gray-500">
                              {new Date(userLog.firstLogin).toLocaleString('id-ID')}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                userLog.status === 'allowed' 
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                  : userLog.status === 'pending'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {userLog.status === 'allowed' ? (
                                  <UserCheck className="w-3.5 h-3.5" />
                                ) : userLog.status === 'pending' ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                ) : (
                                  <UserX className="w-3.5 h-3.5" />
                                )}
                                {userLog.status === 'allowed' ? 'Diizinkan' : userLog.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isAdmin ? (
                                <span className="text-xs text-gray-500 italic">Proteksi Aktif</span>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => handleUpdateStatus(email, 'allowed')}
                                    disabled={userLog.status === 'allowed'}
                                    className="px-2.5 py-1 bg-green-950/40 border border-green-800/50 text-green-400 hover:bg-green-900/50 rounded-md text-xs font-semibold transition-colors disabled:opacity-40"
                                  >
                                    Izinkan
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateStatus(email, 'rejected')}
                                    disabled={userLog.status === 'rejected'}
                                    className="px-2.5 py-1 bg-red-950/40 border border-red-800/50 text-red-400 hover:bg-red-900/50 rounded-md text-xs font-semibold transition-colors disabled:opacity-40"
                                  >
                                    Tolak
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-white">Kustomisasi Tampilan Aplikasi</h2>
                <p className="text-sm text-gray-400">Ubah teks sambutan, judul aplikasi, dan tema warna utama dashboard</p>
              </div>

              <div className="bg-[#141414] border border-[#2d2d2d] rounded-2xl p-6 space-y-4 shadow-xl">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nama / Judul Aplikasi (AI Logo)</label>
                  <input 
                    type="text" 
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    className="w-full bg-[#222] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 text-sm transition-colors"
                    placeholder="Contoh: AI_GG"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Kalimat Sambutan Beranda</label>
                  <input 
                    type="text" 
                    value={welcomeText}
                    onChange={(e) => setWelcomeText(e.target.value)}
                    className="w-full bg-[#222] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 text-sm transition-colors"
                    placeholder="Contoh: Sistem apa yang ingin kamu bangun hari ini?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Warna Tema Utama Dashboard</label>
                  <div className="flex gap-4 items-center">
                    <input 
                      type="color" 
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border border-[#333]"
                    />
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-full bg-[#222] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 text-xs transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#222] flex justify-end gap-3">
                  <button 
                    onClick={handleSaveAppearance}
                    disabled={savingConfig}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors flex items-center gap-2 shadow-lg"
                  >
                    {savingConfig ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : saveSuccess ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {savingConfig ? 'Menyimpan...' : saveSuccess ? 'Tersimpan!' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-xl font-bold text-white">Ubah Password Pengaturan</h2>
                <p className="text-sm text-gray-400">Ubah sandi untuk masuk ke menu pengaturan ini secara berkala agar tetap aman</p>
              </div>

              <form onSubmit={handleChangePassword} className="bg-[#141414] border border-[#2d2d2d] rounded-2xl p-6 space-y-4 shadow-xl">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Password Lama</label>
                  <input 
                    type="password" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password lama..."
                    className="w-full bg-[#222] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 text-sm transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Password Baru</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 4 karakter..."
                      className="w-full bg-[#222] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 text-sm transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Konfirmasi Password Baru</label>
                    <input 
                      type="password" 
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Ketik ulang password..."
                      className="w-full bg-[#222] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 text-sm transition-colors"
                      required
                    />
                  </div>
                </div>

                {secMessage.text && (
                  <p className={`text-xs flex items-center gap-1.5 font-medium ${secMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {secMessage.type === 'success' ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    {secMessage.text}
                  </p>
                )}

                <div className="pt-4 border-t border-[#222] flex justify-end">
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-semibold text-white transition-colors flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Ubah Password
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Floating Admin Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c1c1c] border border-orange-500/40 shadow-2xl rounded-2xl p-4 flex items-center gap-3 max-w-sm animate-bounce text-left">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Masuk Pengaturan</h4>
            <p className="text-xs text-gray-400 leading-normal">Super Admin berhasil login ke dalam Dashboard Pengaturan.</p>
          </div>
          <button onClick={() => setShowNotification(false)} className="text-gray-500 hover:text-white ml-2 self-start p-1 hover:bg-[#2d2d2d] rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
