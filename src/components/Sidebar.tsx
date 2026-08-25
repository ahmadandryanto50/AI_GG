import { 
  LayoutDashboard, 
  Search, 
  LayoutTemplate, 
  Sparkles, 
  Star, 
  Folder, 
  Settings, 
  Menu,
  ChevronDown,
  LogOut,
  MessageSquare,
  X,
  Check,
  Lock
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Project } from '../types';
import { useState } from 'react';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
  projects?: Project[];
  onSelectProject?: (id: string) => void;
  onViewAllProjects?: () => void;
  onHome?: () => void;
  onSettings?: () => void;
  appTitle?: string;
  isRejected?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  userStatus?: string;
}

export default function Sidebar({ 
  user, 
  onLogout, 
  projects = [], 
  onSelectProject, 
  onViewAllProjects, 
  onHome, 
  onSettings, 
  appTitle = 'AI_GG', 
  isRejected = false,
  isOpen = false,
  onClose,
  userStatus = 'allowed'
}: SidebarProps) {
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro');

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 md:relative md:flex w-64 bg-[#141414] border-r border-[#2a2a2a] h-screen flex flex-col text-sm text-gray-300 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* User Profile */}
        <div className="p-4 flex items-center justify-between border-b border-[#2a2a2a] cursor-pointer hover:bg-[#1f1f1f] transition-colors group">
          <div className="flex items-center gap-3 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {user?.displayName ? user.displayName.charAt(0) : 'U'}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-white truncate leading-tight">{user?.displayName || 'User'}</span>
              {userStatus === 'pending' && (
                <span className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md mt-1 w-fit">
                  Menunggu Persetujuan
                </span>
              )}
              {userStatus === 'rejected' && (
                <span className="text-[10px] text-red-500 font-semibold bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-md mt-1 w-fit">
                  Akses Ditolak
                </span>
              )}
              {userStatus === 'allowed' && (
                <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md mt-1 w-fit">
                  Disetujui
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="text-gray-500 hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="w-4.5 h-4.5" />
            </button>
            {onClose && (
              <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="md:hidden p-1 text-gray-500 hover:text-white transition-colors" title="Close Menu">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Main Nav */}
          <div className="p-2 space-y-1 mt-2">
            <NavItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active onClick={onHome} />
            <NavItem icon={<Search className="w-4 h-4" />} label="Cari" />
            <NavItem icon={<LayoutTemplate className="w-4 h-4" />} label="Templat" />
            <NavItem icon={<Sparkles className="w-4 h-4 text-purple-400" />} label={appTitle} onClick={() => setShowAIModal(true)} />
          </div>

          {/* Projects */}
          <div className="mt-4">
            <div className="px-4 py-1 text-xs font-semibold text-gray-500 tracking-wider">PROYEK</div>
            <div className="p-2 space-y-1">
              <NavItem icon={<Star className="w-4 h-4" />} label="Ditandai" />
              <NavItem icon={<Folder className="w-4 h-4" />} label="Semua Proyek" onClick={onViewAllProjects} />
            </div>
          </div>

          {/* Recent */}
          <div className="mt-4">
            <div className="px-4 py-1 text-xs font-semibold text-gray-500 tracking-wider">Terbaru</div>
            <div className="p-2 space-y-1">
              {projects.length > 0 ? (
                projects.map(project => {
                  if (isRejected) {
                    return (
                      <div 
                        key={project.id}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-500 bg-transparent cursor-not-allowed opacity-50"
                        title="Proyek terkunci oleh admin"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span className="truncate">{project.title}</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <button 
                      key={project.id}
                      onClick={() => onSelectProject?.(project.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-400 hover:bg-[#1f1f1f] hover:text-gray-200 transition-colors text-left group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"></div>
                      <span className="truncate">{project.title}</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-2 text-xs text-gray-500 italic">Belum ada proyek</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a2a]">
          <button 
            onClick={onSettings}
            className="flex items-center justify-between w-full p-2 hover:bg-[#1f1f1f] rounded-lg transition-colors text-left text-gray-400"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Pengaturan</span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* AI Models Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-lg font-semibold text-white">Pilih Model {appTitle}</h2>
              </div>
              <button onClick={() => setShowAIModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <ModelOption 
                title="Gemini 1.5 Flash" 
                desc="Cepat & efisien untuk tugas harian (Aktif)"
                active={selectedModel === 'gemini-1.5-flash'}
                onClick={() => { setSelectedModel('gemini-1.5-flash'); setShowAIModal(false); }}
              />
              <ModelOption 
                title="Gemini 1.5 Pro" 
                desc="Tingkat lanjut, penalaran kompleks (Aktif)"
                active={selectedModel === 'gemini-1.5-pro'}
                onClick={() => { setSelectedModel('gemini-1.5-pro'); setShowAIModal(false); }}
              />
              <div className="pt-2 pb-1 px-1">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hanya Akun Pro</div>
              </div>
              <ModelOption 
                title="Gemini Advanced" 
                desc="Akses prioritas model tercanggih Google (Pro)"
                active={selectedModel === 'gemini-advanced'}
                isPro
                onClick={() => { setSelectedModel('gemini-advanced'); setShowAIModal(false); }}
              />
              <ModelOption 
                title="Gemini 3.6 Flash" 
                desc="Versi eksperimental kecepatan tinggi (Pro)"
                active={selectedModel === 'gemini-3.6-flash'}
                isPro
                onClick={() => { setSelectedModel('gemini-3.6-flash'); setShowAIModal(false); }}
              />
              <ModelOption 
                title="Gemini 3.1 Pro" 
                desc="Kreativitas & coding tingkat atas (Pro)"
                active={selectedModel === 'gemini-3.1-pro'}
                isPro
                onClick={() => { setSelectedModel('gemini-3.1-pro'); setShowAIModal(false); }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ModelOption({ title, desc, active, isPro, onClick }: { title: string, desc: string, active: boolean, isPro?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
        active 
          ? 'bg-purple-500/10 border-purple-500/50' 
          : 'bg-[#1a1a1a] border-transparent hover:border-[#333]'
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className={`font-medium ${active ? 'text-purple-400' : 'text-gray-200'}`}>{title}</span>
          {isPro && <span className="text-[9px] uppercase tracking-wide bg-gradient-to-r from-purple-600 to-orange-500 text-white px-1.5 py-0.5 rounded-sm font-bold">PRO</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      {active && <Check className="w-4 h-4 text-purple-400" />}
    </button>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
        active 
          ? 'bg-orange-500/10 text-orange-500 font-medium' 
          : 'hover:bg-[#1f1f1f] text-gray-400 hover:text-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function RecentItem({ label }: { label: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-[#1f1f1f] transition-colors text-left text-gray-400 hover:text-gray-200 text-sm">
      <div className="w-1 h-1 rounded-full bg-gray-500"></div>
      <span className="truncate">{label}</span>
    </button>
  );
}
