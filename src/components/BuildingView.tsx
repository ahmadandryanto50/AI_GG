import { useEffect, useState } from 'react';
import { Loader2, Code, Database, Sparkles, Layout } from 'lucide-react';
import { CodeFile, Attachment } from '../types';

interface BuildingViewProps {
  onComplete: (files: CodeFile[], prompt: string) => void;
  prompt: string;
  attachments?: Attachment[];
  appTitle?: string;
}

export default function BuildingView({ onComplete, prompt, attachments = [], appTitle = 'AI_GG' }: BuildingViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');

  const steps = [
    { icon: <Sparkles className="w-5 h-5" />, label: 'Menganalisis permintaan...', desc: prompt },
    { icon: <Database className="w-5 h-5" />, label: 'Merancang struktur database', desc: 'Menyiapkan tabel dan relasi...' },
    { icon: <Code className="w-5 h-5" />, label: 'Menulis Code.gs backend', desc: 'Mengintegrasikan fungsi AppScript...' },
    { icon: <Layout className="w-5 h-5" />, label: 'Membuat antarmuka UI/UX', desc: 'Menyusun index.html dan styling...' },
    { icon: <Loader2 className="w-5 h-5 animate-spin" />, label: 'Menyelesaikan integrasi', desc: 'Menyiapkan pratinjau...' }
  ];

  useEffect(() => {
    let timeoutIds: NodeJS.Timeout[] = [];
    
    // Simulate initial steps for UX
    for (let i = 0; i < 4; i++) {
      timeoutIds.push(setTimeout(() => setCurrentStep(i), i * 1500));
    }

    const generateCode = async () => {
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, attachments })
        });
        
        if (!response.ok) {
          throw new Error('Gagal membuat kode aplikasi');
        }
        
        const data = await response.json();
        const files: CodeFile[] = [
          { name: 'index.html', language: 'html', content: data.html || '<!-- Gagal generate HTML -->' },
          { name: 'Code.gs', language: 'javascript', content: data.gs || '// Gagal generate GS' }
        ];
        
        setCurrentStep(4);
        setTimeout(() => onComplete(files, prompt), 1000);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan');
      }
    };

    generateCode();

    return () => timeoutIds.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  return (
    <div className="flex-1 bg-[#1a1a1a] h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/10 via-[#1a1a1a] to-[#1a1a1a]"></div>
      
      <div className="max-w-md w-full relative z-10 bg-[#222222] border border-[#333] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Membangun Aplikasi</h2>
          <p className="text-gray-400 text-sm">{appTitle} sedang bekerja</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`flex items-start gap-4 p-3 rounded-lg transition-all duration-500 ${
                index === currentStep 
                  ? 'bg-orange-500/10 border border-orange-500/20 opacity-100 translate-y-0' 
                  : index < currentStep 
                    ? 'opacity-60 translate-y-0' 
                    : 'opacity-0 translate-y-4 hidden'
              }`}
            >
              <div className={`mt-0.5 ${index === currentStep ? 'text-orange-500' : 'text-green-500'}`}>
                {index < currentStep ? <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-xs font-bold">✓</div> : step.icon}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-medium ${index === currentStep ? 'text-orange-400' : 'text-gray-300'}`}>
                  {step.label}
                </h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
