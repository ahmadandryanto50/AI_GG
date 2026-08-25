import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Share, 
  Code2,
  Play,
  FileCode2,
  Copy,
  Check,
  Menu,
  ChevronDown,
  Sparkles,
  Send,
  Loader2,
  Monitor,
  Smartphone,
  Maximize2,
  X,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { CodeFile, Project } from '../types';
import Markdown from 'react-markdown';

const getSafePreviewHtml = (htmlContent: string) => {
  if (!htmlContent) return '';
  
  // Prevent "_top" base target which breaks out of iframes
  let processed = htmlContent
    .replace(/<base\s+target="_top">/gi, '<base target="_self">')
    .replace(/window\.top\.location/g, 'window._mockLocation')
    .replace(/window\.location/g, 'window._mockLocation')
    .replace(/document\.location/g, 'window._mockLocation');
  
  const interceptScript = `
    <script>
      // Mock location to prevent JS navigation
      window._mockLocation = {
        href: '',
        replace: function() { console.log('Mock location.replace'); },
        assign: function() { console.log('Mock location.assign'); },
        reload: function() { console.log('Mock location.reload'); },
        toString: function() { return 'about:srcdoc'; }
      };

      // Mock form submit to prevent manual form.submit() navigation
      HTMLFormElement.prototype.submit = function() {
        console.log('Prevented manual form.submit() in preview');
      };

      // Prevent link clicks that navigate away
      document.addEventListener('click', function(e) {
        const a = e.target.closest('a');
        if (a) {
          const href = a.getAttribute('href') || '';
          const target = a.getAttribute('target');
          
          // Izinkan link yang mengarah ke luar (tab baru)
          if (target === '_blank') return;
          
          // Izinkan link hash (karena tidak akan memuat ulang halaman, digunakan untuk routing SPA)
          if (href.startsWith('#')) return;
          
          // Izinkan javascript: protocol
          if (href.startsWith('javascript:')) return;

          // Blokir sisa navigasi agar tidak mereload iframe yang bisa menyebabkan crash/login ulang
          e.preventDefault();
          console.log('Blocked iframe navigation to:', href);
        }
      }, true); // use capture phase to catch it early
      
      // Prevent form submissions from reloading page
      document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form && form.getAttribute('target') === '_blank') return;
        
        e.preventDefault();
        console.log('Prevented form submission in preview to avoid reload');
      }, true);

      // Tangkap error JavaScript agar tidak diam saja
      window.addEventListener('error', function(e) {
         console.warn("Preview JS Error:", e.message);
      });

      // Override window.top to window so scripts trying to access parent don't crash
      try {
         if (window.top !== window.self) {
             // We can't actually redefine window.top, but we can catch basic errors
         }
      } catch (e) {}

      // Mencegah window.open yang menargetkan _top atau _self
      const originalWindowOpen = window.open;
      window.open = function(url, target, features) {
        if (target === '_top' || target === '_parent' || target === '_self' || !target) {
          console.log('Prevented window.open to ' + target);
          return null;
        }
        return originalWindowOpen(url, target, features);
      };

      // Mock google.script.run so UI doesn't crash
      if (typeof window.google === 'undefined') {
        window.google = {
          script: {
            run: new Proxy({}, {
              get: function(target, prop) {
                if (prop === 'withSuccessHandler') {
                  return function(cb) { 
                    window._successCb = cb;
                    return window.google.script.run; 
                  };
                }
                if (prop === 'withFailureHandler' || prop === 'withUserObject') {
                  return function(cb) { 
                    if (prop === 'withFailureHandler') window._failureCb = cb;
                    return window.google.script.run; 
                  };
                }
                return function() {
                  console.log('Mock backend call (preview mode): ' + prop, arguments);
                  setTimeout(() => {
                    if (window._successCb) {
                      // Coba kembalikan array jika nama fungsi terdengar seperti mengambil data banyak
                      if (prop.startsWith('get') || prop.includes('List') || prop.includes('Data')) {
                        window._successCb([]);
                      } else {
                         window._successCb({ success: true, message: "Aksi " + prop + " berhasil disimulasikan di Preview" });
                      }
                    }
                  }, 500);
                };
              }
            })
          }
        };
      }
    </script>
  `;
  
  if (processed.includes('</head>')) {
    processed = processed.replace('</head>', interceptScript + '</head>');
  } else if (processed.includes('<body>')) {
    processed = processed.replace('<body>', '<body>' + interceptScript);
  } else {
    processed += interceptScript;
  }
  
  return processed;
};

interface WorkspaceViewProps {
  onBack: () => void;
  project: Project;
  onUpdateProject: (project: Project) => void;
  token: string | null;
  isRejected?: boolean;
}

export default function WorkspaceView({ onBack, project, onUpdateProject, token, isRejected = false }: WorkspaceViewProps) {
  const [activeFile, setActiveFile] = useState<string>('index.html');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [previewScreen, setPreviewScreen] = useState<'desktop' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isIterating, setIsIterating] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');

  const currentFileContent = project.files.find(f => f.name === activeFile)?.content || '';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [project.history, isIterating]);

  const handleCopyFile = async (filename: string) => {
    const file = project.files.find(f => f.name === filename);
    if (file) {
      await navigator.clipboard.writeText(file.content);
      setCopiedFile(filename);
      setTimeout(() => setCopiedFile(null), 2000);
    }
  };

  const handleSubmit = async () => {
    if (isRejected) return;
    if (!chatInput.trim() || isIterating) return;
    
    const userPrompt = chatInput.trim();
    setChatInput('');
    setIsIterating(true);
    
    const newHistory = [
      ...project.history, 
      { id: Date.now().toString(), role: 'user' as const, content: userPrompt }
    ];
    
    // Optimistic update
    onUpdateProject({ ...project, history: newHistory });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userPrompt, 
          isUpdate: true, 
          currentFiles: project.files 
        })
      });
      
      if (!response.ok) throw new Error('Gagal update kode');
      
      const data = await response.json();
      const updatedFiles: CodeFile[] = [
        { name: 'index.html', language: 'html', content: data.html || project.files.find(f => f.name === 'index.html')?.content || '' },
        { name: 'Code.gs', language: 'javascript', content: data.gs || project.files.find(f => f.name === 'Code.gs')?.content || '' }
      ];
      
      onUpdateProject({
        ...project,
        files: updatedFiles,
        history: [
          ...newHistory,
          { id: (Date.now() + 1).toString(), role: 'ai', content: "Pembaruan selesai! Anda dapat melihat perubahan kode pada panel sebelah kanan. Ada bagian lain yang ingin disesuaikan?" }
        ],
        updatedAt: Date.now()
      });
      
    } catch (err: any) {
      onUpdateProject({
        ...project,
        history: [
          ...newHistory,
          { id: (Date.now() + 1).toString(), role: 'ai', content: `[Error] ${err.message}` }
        ]
      });
    } finally {
      setIsIterating(false);
    }
  };

  const handlePublish = async () => {
    if (!token) {
      alert("Sesi Anda belum login ke Google atau sesi telah berakhir. Silakan muat ulang halaman untuk login kembali jika ingin mempublikasikan aplikasi ini.");
      return;
    }
    
    setIsPublishing(true);
    try {
      const createRes = await fetch('https://script.googleapis.com/v1/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Generated App: ' + project.title })
      });
      
      if (!createRes.ok) throw new Error('Gagal membuat proyek. Pastikan API Apps Script diaktifkan.');
      const projectData = await createRes.json();
      const scriptId = projectData.scriptId;
      
      const filesToUpload = [
        {
          name: 'appsscript',
          type: 'JSON',
          source: '{"timeZone":"Asia/Jakarta","dependencies":{},"webapp":{"executeAs":"USER_DEPLOYING","access":"ANYONE_ANONYMOUS"}}'
        },
        {
          name: 'Code',
          type: 'SERVER_JS',
          source: project.files.find(f => f.name === 'Code.gs')?.content || ''
        },
        {
          name: 'index',
          type: 'HTML',
          source: project.files.find(f => f.name === 'index.html')?.content || ''
        }
      ];

      const updateRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: filesToUpload })
      });

      if (!updateRes.ok) throw new Error('Gagal mengunggah kode');
      
      const url = `https://script.google.com/d/${scriptId}/edit`;
      window.open(url, '_blank');
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex-1 flex h-screen bg-[#0e0e0e] text-gray-300 font-sans">
      
      {/* FULLSCREEN PREVIEW OVERLAY */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="h-14 bg-[#141414] flex items-center justify-between px-6 shrink-0 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-white">{project.title} - Full Preview</span>
            </div>
            <button onClick={() => setIsFullscreen(false)} className="p-2 hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1">
            <iframe 
              srcDoc={getSafePreviewHtml(project.files.find(f => f.name === 'index.html')?.content || '')} 
              sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
              className="w-full h-full border-0"
              title="Fullscreen Preview"
            />
          </div>
        </div>
      )}

      {/* LEFT PANEL - CHAT INTERFACE */}
      <div className={`w-full md:w-[45%] md:max-w-[600px] border-r border-[#2a2a2a] flex flex-col bg-[#141414] relative h-full ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}`}>
        {/* Chat Header */}
        <div className="h-14 border-b border-[#2a2a2a] flex items-center px-4 justify-between bg-[#141414] shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1 hover:bg-[#2a2a2a] rounded-md transition-colors mr-2">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-[#2a2a2a] px-2 py-1 rounded-md transition-colors">
              <span className="text-sm font-medium text-gray-200 truncate max-w-[200px]">{project.title}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
          </div>
          <button className="p-1 hover:bg-[#2a2a2a] rounded-md transition-colors">
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-40 md:pb-24">
          
          {project.history.map(msg => (
            msg.role === 'user' ? (
              <div key={msg.id} className="flex justify-end">
                <div className="bg-[#2a2a2a] text-gray-200 p-4 rounded-2xl rounded-tr-sm max-w-[85%] text-sm leading-relaxed shadow-sm whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex gap-4 max-w-[95%]">
                <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-600/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="space-y-4 text-sm text-gray-300 leading-relaxed markdown-body">
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            )
          ))}

          {isIterating && (
            <div className="flex gap-4 max-w-[95%]">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-600/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                <span>Memperbarui aplikasi...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="absolute bottom-16 md:bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#141414] via-[#141414] to-transparent space-y-2 z-20">
          {isRejected && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-400 text-xs">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <span>Akses Ditolak: Anda hanya bisa melihat tampilan ini. Hubungi admin untuk akses penuh.</span>
            </div>
          )}
          <div 
            className="bg-[#1e1e1e] border rounded-2xl p-2 flex items-center transition-colors shadow-lg"
            style={{ borderColor: isRejected ? '#ef444433' : '#333' }}
          >
            <input 
              type="text" 
              placeholder={isRejected ? "Fungsi pembaruan dinonaktifkan..." : "Ketik permintaan perubahan Anda..."} 
              className="flex-1 bg-transparent text-sm px-3 py-2 outline-none text-white placeholder-gray-500 disabled:opacity-50"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isIterating || isRejected}
            />
            <button 
              onClick={handleSubmit}
              disabled={!chatInput.trim() || isIterating || isRejected}
              className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-colors shrink-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 px-2 text-[10px] text-gray-500">
            <span>28/40 credits today (30/150 monthly)</span>
            <span className="text-orange-500 font-medium cursor-pointer">Upgrade Now ↗</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - PREVIEW & CODE */}
      <div className={`flex-1 flex flex-col bg-[#0e0e0e] min-w-0 h-full ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'} pb-16 md:pb-0`}>
        {/* Right Header */}
        <div className="h-14 border-b border-[#2a2a2a] flex items-center justify-between px-4 shrink-0 bg-[#141414]">
          <div className="flex items-center gap-4">
            {/* Toggle View Mode */}
            <div className="flex bg-[#222] rounded-full p-1 border border-[#333]">
              <button 
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'preview' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Play className="w-3.5 h-3.5" /> Preview
              </button>
              <button 
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'code' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Code2 className="w-3.5 h-3.5" /> Code
              </button>
            </div>
            
            {/* Preview Devices - Only show if in preview mode */}
            {viewMode === 'preview' && (
              <>
                <div className="h-4 w-[1px] bg-[#333]"></div>
                <div className="flex bg-[#222] rounded-full p-1 border border-[#333]">
                  <button 
                    onClick={() => setPreviewScreen('desktop')}
                    className={`p-1.5 rounded-full transition-all ${previewScreen === 'desktop' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Mode Desktop"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setPreviewScreen('mobile')}
                    className={`p-1.5 rounded-full transition-all ${previewScreen === 'mobile' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Mode HP"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <button 
                  onClick={() => setIsFullscreen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#333] border border-[#333] rounded-full text-xs font-medium text-gray-400 hover:text-gray-200 transition-all"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Lihat Full Aplikasi
                </button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick Copy Buttons */}
            <div className="flex items-center gap-2 mr-2">
              <button 
                onClick={() => handleCopyFile('index.html')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#333] border border-[#333] rounded-full text-xs font-medium text-gray-300 transition-colors"
                title="Salin kode HTML"
              >
                {copiedFile === 'index.html' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedFile === 'index.html' ? <span className="text-green-400">Tersalin</span> : <span>Salin index.html</span>}
              </button>
              <button 
                onClick={() => handleCopyFile('Code.gs')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#333] border border-[#333] rounded-full text-xs font-medium text-gray-300 transition-colors"
                title="Salin kode JavaScript Apps Script"
              >
                {copiedFile === 'Code.gs' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedFile === 'Code.gs' ? <span className="text-green-400">Tersalin</span> : <span>Salin Code.gs</span>}
              </button>
            </div>

            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-full shadow-lg transition-colors disabled:opacity-50"
            >
              {isPublishing ? "Memproses..." : "Publikasi ke Google Apps Script"}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          
          {viewMode === 'preview' ? (
            <div className={`w-full h-full bg-[#111111] flex ${previewScreen === 'mobile' ? 'items-center justify-center p-8' : ''}`}>
              <div className={`${previewScreen === 'mobile' ? 'w-[375px] h-[812px] bg-white rounded-[3rem] border-[14px] border-[#222] overflow-hidden shadow-2xl relative shadow-black/50' : 'w-full h-full bg-white'}`}>
                {previewScreen === 'mobile' && (
                  <div className="absolute top-0 inset-x-0 h-6 bg-[#222] z-10 flex justify-center rounded-b-xl w-[120px] mx-auto"></div>
                )}
                <iframe 
                  srcDoc={getSafePreviewHtml(project.files.find(f => f.name === 'index.html')?.content || '')} 
                  sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
                  className="w-full h-full border-0"
                  title="Preview"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full bg-[#1e1e1e]">
              {/* Code File Tabs & Copy Button */}
              <div className="flex items-center justify-between bg-[#141414] border-b border-[#2a2a2a] px-2 h-12">
                <div className="flex items-center gap-1">
                  {project.files.map(file => (
                    <button
                      key={file.name}
                      onClick={() => setActiveFile(file.name)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-lg transition-colors ${
                        activeFile === file.name 
                          ? 'bg-[#3460e4] text-white' 
                          : 'text-gray-400 hover:bg-[#222] hover:text-gray-200'
                      }`}
                    >
                      <FileCode2 className="w-4 h-4" />
                      {file.name}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => handleCopyFile(activeFile)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-[#3460e4] hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors mr-2 shadow-sm"
                >
                  {copiedFile === activeFile ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedFile === activeFile ? "Tersalin!" : `Copy All ${activeFile}`}
                </button>
              </div>
              
              {/* Code Editor Area with Line Numbers */}
              <div className="flex-1 overflow-auto flex bg-[#1e1e1e] text-sm">
                {/* Line Numbers */}
                <div className="py-4 px-3 text-right text-gray-600 select-none border-r border-[#2a2a2a] font-mono text-[13px] bg-[#1a1a1a]">
                  {currentFileContent.split('\\n').map((_, i) => (
                    <div key={i} className="leading-[21px]">{i + 1}</div>
                  ))}
                </div>
                {/* Code Content */}
                <div className="flex-1 p-4 overflow-auto">
                  <pre className="font-mono text-[13px] leading-[21px] text-[#d4d4d4] whitespace-pre">
                    <code>{currentFileContent}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#141414] border-t border-[#2a2a2a] flex items-center justify-around z-30">
        <button 
          onClick={() => setMobileTab('chat')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${mobileTab === 'chat' ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Asisten</span>
        </button>
        <button 
          onClick={() => setMobileTab('preview')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${mobileTab === 'preview' ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}
        >
          <Play className="w-5 h-5" />
          <span className="text-[10px]">Hasil & Code</span>
        </button>
      </div>

    </div>
  );
}
