import { useState, useRef } from 'react';
import { 
  Lightbulb, 
  Plus, 
  Mic, 
  Code,
  Paperclip,
  X,
  File,
  Image as ImageIcon,
  ShieldAlert,
  Menu
} from 'lucide-react';
import { Attachment } from '../types';

interface HomeViewProps {
  onBuild: (prompt: string, attachments: Attachment[]) => void;
  userName?: string;
  welcomeText?: string;
  themeColor?: string;
  isRejected?: boolean;
  appTitle?: string;
  onMenuToggle?: () => void;
}

export default function HomeView({ 
  onBuild, 
  userName = 'Teman', 
  welcomeText = 'Sistem apa yang ingin kamu bangun hari ini', 
  themeColor = '#3460e4', 
  isRejected = false,
  appTitle = 'AI_GG',
  onMenuToggle
}: HomeViewProps) {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (isRejected) return;
    
    // If already listening, stop it
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung fitur Voice-to-Text. Silakan gunakan browser Google Chrome atau Safari.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'id-ID';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText) {
          setPrompt((prev) => prev ? prev + " " + resultText : resultText);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Failed to start speech recognition", err);
      setIsListening(false);
    }
  };

  const handleBuildClick = () => {
    if (isRejected) return;
    if (prompt.trim() || attachments.length > 0) {
      onBuild(prompt || "Buatkan aplikasi default", attachments);
    } else {
      onBuild("Buatkan aplikasi default", []);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRejected) return;
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Str = (event.target?.result as string).split(',')[1];
        setAttachments(prev => [...prev, { 
          name: file.name, 
          mimeType: file.type, 
          data: base64Str 
        }]);
      };
      reader.readAsDataURL(file);
    });
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    if (isRejected) return;
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="flex-1 bg-[#1a1a1a] h-screen overflow-y-auto relative text-white selection:bg-orange-500/30">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-orange-900/20 via-[#1a1a1a] to-[#1a1a1a]"></div>
      
      <div className="relative z-10 max-w-5xl mx-auto px-8 py-12 flex flex-col min-h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          {onMenuToggle ? (
            <button 
              onClick={onMenuToggle}
              className="md:hidden p-2 bg-[#222] border border-[#333] hover:bg-[#2a2a2a] rounded-xl text-gray-300 transition-colors"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          ) : <div />}
          <div className="flex items-center gap-2 text-gray-300 font-medium">
            <Code className="w-5 h-5 text-orange-500" style={{ color: themeColor }} />
            <span>{appTitle}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center max-w-3xl mx-auto w-full">
          {/* Main Titles */}
          <div className="text-center mb-10 space-y-4">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-sm font-medium border border-orange-500/20"
              style={{ color: themeColor, borderColor: `${themeColor}33`, backgroundColor: `${themeColor}15` }}
            >
              <Lightbulb className="w-4 h-4" />
              <span>Tips Pemilihan Mode (Plan vs Build)</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              {welcomeText}, {userName}?
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Buat website profil UMKM, sistem absensi sekolah, aplikasi kasir, atau portal internal kantormu hanya dengan perintah teks.
            </p>
          </div>

          {/* Rejected Warning Banner */}
          {isRejected && (
            <div className="w-full bg-red-950/40 border border-red-800/50 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm mb-6 shadow-lg">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <span className="font-bold">Akses Dibatasi oleh Admin:</span> Anda hanya diperbolehkan melihat-lihat tampilan aplikasi. Fitur membuat dan memperbarui proyek dinonaktifkan.
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div 
            className="w-full bg-[#222222] border border-[#333] rounded-2xl p-2 shadow-xl focus-within:ring-1 transition-all"
            style={{ 
              borderColor: isRejected ? '#ef444433' : '#333'
            }}
          >
            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 pb-0">
                {attachments.map((att, index) => (
                  <div key={index} className="flex items-center gap-2 bg-[#2d2d2d] border border-[#3d3d3d] px-3 py-1.5 rounded-lg text-sm group">
                    {att.mimeType.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-blue-400" /> : <File className="w-4 h-4 text-orange-400" />}
                    <span className="max-w-[150px] truncate text-gray-300">{att.name}</span>
                    <button 
                      onClick={() => removeAttachment(index)}
                      className="text-gray-500 hover:text-red-400 transition-colors ml-1"
                      disabled={isRejected}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-start gap-3 p-3">
              <button 
                onClick={() => !isRejected && fileInputRef.current?.click()}
                className="text-gray-400 hover:text-white transition-colors mt-1 disabled:opacity-30"
                disabled={isRejected}
                title="Upload Foto & Berkas"
              >
                <Plus className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                multiple
                onChange={handleFileUpload}
                disabled={isRejected}
              />
              <textarea
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none resize-none h-16 sm:h-24 py-1 text-lg disabled:opacity-55"
                placeholder={isRejected ? "Fungsi input dinonaktifkan oleh administrator..." : (isListening ? "Mendengarkan suara Anda... Silakan berbicara..." : "Ketik ide aplikasi Apps Script Anda atau upload berkas...")}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isRejected}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleBuildClick();
                  }
                }}
              />
            </div>
            
            <div className="flex items-center justify-between mt-2 px-2 pb-2">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => !isRejected && fileInputRef.current?.click()}
                  disabled={isRejected}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#2d2d2d] rounded-lg transition-colors border border-transparent hover:border-[#3d3d3d] disabled:opacity-40"
                  title="Upload Foto & Berkas"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={startListening}
                  disabled={isRejected}
                  className={`p-2 transition-all rounded-lg shrink-0 ${isListening ? 'text-red-500 bg-red-500/10 animate-pulse scale-110 border border-red-500/20' : 'text-gray-400 hover:text-white hover:bg-[#2d2d2d] border border-transparent'} disabled:opacity-40`}
                  title={isListening ? "Klik untuk selesai merekam" : "Input dengan Suara (Voice-to-Text)"}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleBuildClick}
                  disabled={isRejected || (!prompt.trim() && attachments.length === 0)}
                  className="px-6 py-2 text-white font-medium rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: themeColor,
                    boxShadow: `0 4px 14px ${themeColor}33`
                  }}
                >
                  Build
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
