import { useState, useEffect } from 'react';
import { AppState, CodeFile, Project, Attachment } from './types';
import Sidebar from './components/Sidebar';
import HomeView from './components/HomeView';
import BuildingView from './components/BuildingView';
import WorkspaceView from './components/WorkspaceView';
import LoginView from './components/LoginView';
import AllProjectsView from './components/AllProjectsView';
import SettingsView from './components/SettingsView';
import { initAuth, logout, db } from './lib/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState | 'settings'>('home');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentAttachments, setCurrentAttachments] = useState<Attachment[]>([]);
  
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userStatus, setUserStatus] = useState<'allowed' | 'rejected' | 'pending' | 'checking'>('checking');
  
  const [appConfig, setAppConfig] = useState({
    title: 'AI_GG',
    welcome: 'Sistem apa yang ingin kamu bangun hari ini',
    color: '#3460e4'
  });

  const loadAppConfig = () => {
    const savedTitle = localStorage.getItem('cfg_app_title') || 'AI_GG';
    const savedWelcome = localStorage.getItem('cfg_welcome_text') || 'Sistem apa yang ingin kamu bangun hari ini';
    const savedColor = localStorage.getItem('cfg_theme_color') || '#3460e4';
    setAppConfig({ title: savedTitle, welcome: savedWelcome, color: savedColor });
  };

  useEffect(() => {
    loadAppConfig();
  }, []);

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('appscript_projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('appscript_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setToken(token);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkAndLogUser = async () => {
      if (!user || !user.email) {
        setUserStatus('allowed');
        return;
      }
      
      setUserStatus('checking');
      const emailLower = user.email.toLowerCase();
      
      try {
        // Try Firestore database first (synchronized across all devices/browsers in real time)
        const userDocRef = doc(db, 'users', emailLower);
        const userDoc = await getDoc(userDocRef);
        const isAdmin = emailLower === "ahmad.andryanto50@admin.smp.belajar.id";
        
        let finalStatus: 'allowed' | 'rejected' | 'pending' = isAdmin ? 'allowed' : 'pending';
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          finalStatus = data.status || (isAdmin ? 'allowed' : 'pending');
          
          // Update last login
          await updateDoc(userDocRef, {
            lastLogin: new Date().toISOString(),
            name: user.displayName || user.email.split('@')[0]
          });
        } else {
          // Document doesn't exist, create it
          const newUserPayload = {
            name: user.displayName || user.email.split('@')[0],
            status: finalStatus,
            firstLogin: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          
          await setDoc(userDocRef, newUserPayload);
        }
        
        setUserStatus(finalStatus);
        
        // If allowed, fetch projects from Firestore in the background
        if (finalStatus === 'allowed') {
          try {
            const projectsColRef = collection(db, 'users', emailLower, 'projects');
            const querySnapshot = await getDocs(projectsColRef);
            const cloudProjects: Project[] = [];
            querySnapshot.forEach((docSnap) => {
              const data = docSnap.data();
              cloudProjects.push({
                id: docSnap.id,
                title: data.title || 'Untitled Project',
                files: data.files || [],
                history: data.history || [],
                updatedAt: data.updatedAt || Date.now()
              });
            });
            
            // Sort by updatedAt descending
            cloudProjects.sort((a, b) => b.updatedAt - a.updatedAt);
            
            if (cloudProjects.length > 0) {
              setProjects(cloudProjects);
              localStorage.setItem('appscript_projects', JSON.stringify(cloudProjects));
            }
          } catch (projErr) {
            console.error("Gagal memuat proyek dari Firestore:", projErr);
          }
        }
        
        // Also call Express backend API in background for relational/local logging if available
        fetch('/api/settings/log-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: emailLower, 
            displayName: user.displayName || user.email.split('@')[0] 
          })
        }).catch(() => {});
        
      } catch (err) {
        console.error("Gagal memeriksa hak akses user via Firestore, mencoba backend/local storage...", err);
        
        // Fallback to Server API if Firestore fails
        try {
          const response = await fetch('/api/settings/log-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: emailLower, 
              displayName: user.displayName || user.email.split('@')[0] 
            })
          });
          const data = await response.json();
          if (data.success) {
            const currentStatus = data.status || 'pending';
            setUserStatus(currentStatus);
            return;
          }
        } catch (apiErr) {
          console.error("Gagal memeriksa via API:", apiErr);
        }
        
        // Final fallback: Local storage (Offline / Client-only)
        const isClientAdmin = emailLower === "ahmad.andryanto50@admin.smp.belajar.id";
        if (isClientAdmin) {
          setUserStatus('allowed');
        } else {
          const localUsersList = JSON.parse(localStorage.getItem('cfg_users_list') || '{}');
          if (localUsersList[emailLower]) {
            setUserStatus(localUsersList[emailLower].status);
          } else {
            localUsersList[emailLower] = {
              name: user.displayName || user.email.split('@')[0],
              status: 'pending',
              firstLogin: new Date().toISOString()
            };
            localStorage.setItem('cfg_users_list', JSON.stringify(localUsersList));
            setUserStatus('pending');
          }
        }
      }
    };

    checkAndLogUser();
  }, [user]);

  const handleBuildStart = (prompt: string, attachments: Attachment[]) => {
    if (userStatus === 'rejected') return;
    setCurrentPrompt(prompt);
    setCurrentAttachments(attachments);
    setAppState('building');
  };

  const handleBuildComplete = (files: CodeFile[], prompt: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
      files,
      history: [
        { id: Date.now().toString(), role: 'user', content: prompt },
        { id: (Date.now() + 1).toString(), role: 'ai', content: "Seluruh kode aplikasi (index.html & Code.gs) telah selesai dibuat 100%! Tampilan Web App sudah ter-render secara otomatis dan siap Anda gunakan di panel preview kanan.\n\n🚀 **Cara Deploy ke Google Apps Script:**\n1. Buka **Google Sheets** baru → klik **Extensions → Apps Script**\n2. Buat file **index.html** → paste kode HTML di panel kanan\n3. Buat file **Code.gs** (default) → paste kode JavaScript backend\n4. Klik **Deploy → New deployment → Web app**\n5. Set **Execute as**: Me, **Who has access**: Anyone\n6. Copy URL Web App dan buka di browser 🚀" }
      ],
      updatedAt: Date.now()
    };
    
    setProjects(prev => {
      const updated = [newProject, ...prev];
      localStorage.setItem('appscript_projects', JSON.stringify(updated));
      return updated;
    });

    // Save to Firestore in background if authenticated
    if (user && user.email) {
      const emailLower = user.email.toLowerCase();
      const projDocRef = doc(db, 'users', emailLower, 'projects', newProject.id);
      setDoc(projDocRef, newProject).catch(err => {
        console.error("Gagal menyimpan proyek baru ke Firestore:", err);
      });
    }

    setCurrentProjectId(newProject.id);
    setAppState('workspace');
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => {
      const updated = prev.map(p => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem('appscript_projects', JSON.stringify(updated));
      return updated;
    });

    // Update in Firestore in background if authenticated
    if (user && user.email) {
      const emailLower = user.email.toLowerCase();
      const projDocRef = doc(db, 'users', emailLower, 'projects', updatedProject.id);
      setDoc(projDocRef, updatedProject).catch(err => {
        console.error("Gagal mengupdate proyek ke Firestore:", err);
      });
    }
  };
  
  const handleSelectProject = (projectId: string) => {
    if (userStatus === 'rejected') return;
    setCurrentProjectId(projectId);
    setAppState('workspace');
    setSidebarOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('appscript_projects', JSON.stringify(updated));
      return updated;
    });

    // Delete in Firestore in background if authenticated
    if (user && user.email) {
      const emailLower = user.email.toLowerCase();
      const projDocRef = doc(db, 'users', emailLower, 'projects', id);
      deleteDoc(projDocRef).catch(err => {
        console.error("Gagal menghapus proyek dari Firestore:", err);
      });
    }

    if (currentProjectId === id) {
      setCurrentProjectId(null);
      setAppState('home');
    }
  };

  const handleBackToHome = () => {
    setAppState('home');
    setCurrentProjectId(null);
    setCurrentPrompt('');
  };
  
  const handleLogout = async () => {
    await logout();
    setNeedsAuth(true);
  };

  if (needsAuth) {
    return <LoginView onSuccess={(user, token) => {
      setUser(user);
      setToken(token);
      setNeedsAuth(false);
    }} />;
  }

  if (userStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400 font-medium">Memverifikasi hak akses pengguna...</p>
        </div>
      </div>
    );
  }

  if (userStatus === 'pending' || userStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-[#181818] border border-[#2d2d2d] rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Akses Memerlukan Otorisasi</h2>
            <p className="text-sm text-gray-400">
              Aplikasi ini berada dalam mode publik aman. Hanya pengguna dengan otorisasi resmi yang dapat mengakses sistem ini.
            </p>
          </div>

          <div className="bg-[#222] border border-[#333] rounded-xl p-4 text-left space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Masuk</label>
              <div className="text-sm font-semibold text-white break-all">{user?.email}</div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status Akun</label>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                {userStatus === 'pending' ? 'Menunggu Aktivasi Admin' : 'Akses Ditangguhkan / Ditolak'}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 leading-relaxed">
            Permintaan akses telah dikirimkan secara otomatis. Silakan hubungi Super Admin untuk menyetujui akun Anda melalui tab <strong>Dashboard Pengaturan Admin</strong>.
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleLogout}
              className="flex-1 py-3 bg-[#222] hover:bg-[#2d2d2d] border border-[#333] rounded-xl text-sm font-medium text-gray-300 transition-all"
            >
              Keluar Sesi
            </button>
            <button 
              onClick={async () => {
                if (user && user.email) {
                  setUserStatus('checking');
                  const emailLower = user.email.toLowerCase();
                  
                  try {
                    // Try Firestore database first (synchronized across all devices/browsers in real time)
                    const userDocRef = doc(db, 'users', emailLower);
                    const userDoc = await getDoc(userDocRef);
                    const isAdmin = emailLower === "ahmad.andryanto50@admin.smp.belajar.id";
                    
                    if (userDoc.exists()) {
                      const data = userDoc.data();
                      const liveStatus = data.status || (isAdmin ? 'allowed' : 'pending');
                      setUserStatus(liveStatus);
                    } else {
                      // Document doesn't exist, create it as pending (or allowed if Super Admin)
                      const defaultStatus = isAdmin ? 'allowed' : 'pending';
                      const newUserPayload = {
                        name: user.displayName || user.email.split('@')[0],
                        status: defaultStatus,
                        firstLogin: new Date().toISOString(),
                        lastLogin: new Date().toISOString()
                      };
                      await setDoc(userDocRef, newUserPayload);
                      setUserStatus(defaultStatus);
                    }
                  } catch (err) {
                    console.error("Gagal memeriksa hak akses user via Firestore, mencoba backend/local storage...", err);
                    
                    // Fallback to Express API
                    try {
                      const response = await fetch('/api/settings/log-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          email: emailLower, 
                          displayName: user.displayName || user.email.split('@')[0] 
                        })
                      });
                      const data = await response.json();
                      if (data.success) {
                        setUserStatus(data.status || 'pending');
                        return;
                      }
                    } catch (apiErr) {
                      console.error("Gagal memeriksa via API:", apiErr);
                    }
                    
                    // Final fallback: Local storage (Offline / Client-only)
                    const isClientAdmin = emailLower === "ahmad.andryanto50@admin.smp.belajar.id";
                    if (isClientAdmin) {
                      setUserStatus('allowed');
                    } else {
                      const localUsersList = JSON.parse(localStorage.getItem('cfg_users_list') || '{}');
                      if (localUsersList[emailLower]) {
                        setUserStatus(localUsersList[emailLower].status);
                      } else {
                        setUserStatus('pending');
                      }
                    }
                  }
                }
              }}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-amber-600/10"
            >
              Cek Status Baru
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const currentProject = projects.find(p => p.id === currentProjectId);

  return (
    <div className="flex h-screen w-full bg-[#111111] overflow-hidden font-sans">
      {(appState === 'home' || appState === 'all-projects') && (
        <Sidebar 
          user={user} 
          onLogout={handleLogout} 
          projects={projects} 
          onSelectProject={handleSelectProject} 
          onViewAllProjects={() => { setAppState('all-projects'); setSidebarOpen(false); }}
          onHome={() => { setAppState('home'); setSidebarOpen(false); }}
          onSettings={() => { setAppState('settings'); setSidebarOpen(false); }}
          appTitle={appConfig.title}
          isRejected={false}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}
      
      {appState === 'home' && (
        <HomeView 
          onBuild={handleBuildStart} 
          userName={user?.displayName || user?.email?.split('@')[0] || 'Teman'} 
          welcomeText={appConfig.welcome}
          themeColor={appConfig.color}
          isRejected={false}
          appTitle={appConfig.title}
          onMenuToggle={() => setSidebarOpen(true)}
        />
      )}
      
      {appState === 'all-projects' && (
        <AllProjectsView 
          projects={projects} 
          onSelectProject={handleSelectProject} 
          onDeleteProject={handleDeleteProject}
          isRejected={false}
          onMenuToggle={() => setSidebarOpen(true)}
        />
      )}
      
      {appState === 'building' && (
        <BuildingView 
          onComplete={handleBuildComplete} 
          prompt={currentPrompt} 
          attachments={currentAttachments} 
          appTitle={appConfig.title}
        />
      )}
      
      {appState === 'workspace' && currentProject && (
        <WorkspaceView 
          onBack={handleBackToHome} 
          project={currentProject} 
          onUpdateProject={handleUpdateProject} 
          token={token} 
          isRejected={false}
        />
      )}

      {appState === 'settings' && (
        <SettingsView 
          onBack={() => setAppState('home')} 
          onUpdateConfig={loadAppConfig} 
        />
      )}
    </div>
  );
}
