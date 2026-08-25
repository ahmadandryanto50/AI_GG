import { Folder, Clock, Code, ChevronRight, Trash2, X, AlertTriangle, Lock, Menu } from 'lucide-react';
import { Project } from '../types';
import { useState } from 'react';

interface Props {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  isRejected?: boolean;
  onMenuToggle?: () => void;
}

export default function AllProjectsView({ projects, onSelectProject, onDeleteProject, isRejected = false, onMenuToggle }: Props) {
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const confirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="flex-1 bg-[#1a1a1a] h-screen overflow-y-auto text-white p-6 md:p-12 relative selection:bg-orange-500/30">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-orange-900/10 via-[#1a1a1a] to-[#1a1a1a]"></div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center gap-3 mb-8 border-b border-[#333] pb-6 flex-wrap">
          {onMenuToggle && (
            <button 
              onClick={onMenuToggle}
              className="md:hidden p-2 bg-[#222] border border-[#333] hover:bg-[#2a2a2a] rounded-xl text-gray-300 transition-colors mr-1"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Folder className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl md:text-3xl font-bold">Semua Proyek</h1>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 bg-[#222] border border-[#333] rounded-2xl">
            <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">Belum ada proyek</h3>
            <p className="text-gray-500">Mulai buat aplikasi pertama Anda dari menu utama.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(p => {
              if (isRejected) {
                return (
                  <div 
                    key={p.id} 
                    className="bg-[#222]/60 border border-[#333]/50 p-5 rounded-2xl cursor-not-allowed opacity-50 flex flex-col h-full shadow-lg relative select-none"
                    title="Proyek terkunci oleh admin"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-[#2a2a2a] text-gray-500">
                        <Lock className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-400 text-lg mb-2 line-clamp-2">{p.title}</h3>
                    
                    <div className="mt-auto pt-5 flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-600 gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" /> 
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div 
                  key={p.id} 
                  onClick={() => onSelectProject(p.id)} 
                  className="bg-[#222] border border-[#333] p-5 rounded-2xl hover:border-orange-500/50 cursor-pointer transition-all hover:bg-[#282828] group flex flex-col h-full shadow-lg relative"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-[#2a2a2a] text-orange-400 group-hover:text-orange-500 group-hover:bg-orange-500/10 transition-colors">
                      <Code className="w-5 h-5" />
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(p.id);
                      }}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Hapus Proyek"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-gray-100 text-lg mb-2 line-clamp-2">{p.title}</h3>
                  
                  <div className="mt-auto pt-5 flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500 gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" /> 
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-orange-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Hapus Proyek?</h2>
              <p className="text-gray-400 text-sm mb-6">Proyek ini akan dihapus permanen dan tidak dapat dipulihkan. Anda yakin?</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 px-4 py-2 bg-[#222] hover:bg-[#333] text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
