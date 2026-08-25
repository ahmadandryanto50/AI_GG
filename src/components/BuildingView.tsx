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

    const generateCodeClientSide = (promptStr: string): { html: string, gs: string } => {
      const normalized = promptStr.toLowerCase();
      let title = "Sistem Inventaris Sekolah";
      let primaryColorClass = "bg-teal-700 hover:bg-teal-800";
      let htmlContent = "";
      let gsContent = "";

      if (normalized.includes("absen") || normalized.includes("hadir") || normalized.includes("kehadiran") || normalized.includes("presensi")) {
        title = "Sistem Presensi & Kehadiran Digital";
        primaryColorClass = "bg-sky-600 hover:bg-sky-700";
        
        htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-gray-50 text-gray-800">
    <div class="min-h-screen flex flex-col">
        <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-lg">📝</div>
                    <div>
                        <h1 class="font-bold text-lg text-gray-900">${title}</h1>
                        <p class="text-xs text-gray-500">PRESENSI & KEHADIRAN SEKOLAH</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span id="currentTime" class="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">00:00:00</span>
                </div>
            </div>
        </header>

        <main class="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-fit">
                    <h2 class="text-lg font-bold text-gray-900 mb-1">Form Absensi Harian</h2>
                    <p class="text-xs text-gray-500 mb-6">Silakan isi data kehadiran Anda di bawah ini secara akurat.</p>
                    
                    <form id="attendanceForm" onsubmit="handleAttendanceSubmit(event)" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Nama Lengkap</label>
                            <input type="text" id="studentName" required class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition" placeholder="Masukkan nama lengkap">
                        </div>
                        
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Nomor Induk / Kelas</label>
                            <input type="text" id="studentId" required class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition" placeholder="Contoh: XII-IPA-1">
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Status Kehadiran</label>
                            <select id="attendanceStatus" required class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition bg-white">
                                <option value="Hadir">🟢 Hadir (Masuk Kelas)</option>
                                <option value="Izin">🟡 Izin (Keperluan Penting)</option>
                                <option value="Sakit">🔵 Sakit (Membutuhkan Istirahat)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Keterangan / Alasan</label>
                            <textarea id="attendanceNotes" class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition h-20 resize-none" placeholder="Isi jika berstatus Izin/Sakit"></textarea>
                        </div>

                        <button type="submit" class="w-full py-3 px-4 ${primaryColorClass} text-white font-semibold rounded-xl active:scale-[0.98] transition shadow-lg text-sm">
                            Kirim Kehadiran
                        </button>
                    </form>
                </div>

                <div class="lg:col-span-2 space-y-6">
                    <div class="grid grid-cols-3 gap-4">
                        <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
                            <span class="text-2xl mb-1 block">🟢</span>
                            <span class="text-2xl font-bold text-gray-900" id="statHadir">0</span>
                            <span class="text-[11px] font-medium text-gray-400 block uppercase">Hadir</span>
                        </div>
                        <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
                            <span class="text-2xl mb-1 block">🟡</span>
                            <span class="text-2xl font-bold text-gray-900" id="statIzin">0</span>
                            <span class="text-[11px] font-medium text-gray-400 block uppercase">Izin</span>
                        </div>
                        <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
                            <span class="text-2xl mb-1 block">🔵</span>
                            <span class="text-2xl font-bold text-gray-900" id="statSakit">0</span>
                            <span class="text-[11px] font-medium text-gray-400 block uppercase">Sakit</span>
                        </div>
                    </div>

                    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 class="font-bold text-gray-900">Log Kehadiran Hari Ini</h3>
                            <button onclick="refreshLogs()" class="text-xs font-semibold text-sky-600 hover:underline">Segarkan Data</button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-gray-50/50 text-gray-400 text-xs font-semibold border-b border-gray-100 uppercase">
                                    <tr>
                                        <th class="px-6 py-3">Nama</th>
                                        <th class="px-6 py-3">ID / Kelas</th>
                                        <th class="px-6 py-3">Status</th>
                                        <th class="px-6 py-3">Waktu</th>
                                        <th class="px-6 py-3">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody id="logsTableBody" class="divide-y divide-gray-100 text-gray-600">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        setInterval(() => {
            const now = new Date();
            document.getElementById('currentTime').textContent = now.toLocaleTimeString('id-ID');
        }, 1000);

        let localDb = JSON.parse(localStorage.getItem('gas_db_attendance') || '[]');

        function updateStats() {
            const hadir = localDb.filter(x => x.status === 'Hadir').length;
            const izin = localDb.filter(x => x.status === 'Izin').length;
            const sakit = localDb.filter(x => x.status === 'Sakit').length;
            
            document.getElementById('statHadir').textContent = hadir;
            document.getElementById('statIzin').textContent = izin;
            document.getElementById('statSakit').textContent = sakit;
        }

        function renderLogs() {
            const body = document.getElementById('logsTableBody');
            body.innerHTML = '';
            
            if (localDb.length === 0) {
                body.innerHTML = \`<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400 text-xs">Belum ada riwayat kehadiran hari ini.</td></tr>\`;
                return;
            }

            localDb.forEach((item, index) => {
                let statusBadge = '';
                if (item.status === 'Hadir') statusBadge = '<span class="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">Hadir</span>';
                else if (item.status === 'Izin') statusBadge = '<span class="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium">Izin</span>';
                else if (item.status === 'Sakit') statusBadge = '<span class="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">Sakit</span>';

                const tr = document.createElement('tr');
                tr.innerHTML = \`
                    <td class="px-6 py-4 font-semibold text-gray-800">\${item.name}</td>
                    <td class="px-6 py-4 text-gray-500">\${item.id}</td>
                    <td class="px-6 py-4">\${statusBadge}</td>
                    <td class="px-6 py-4 text-gray-400 text-xs">\${item.time}</td>
                    <td class="px-6 py-4 text-gray-500 max-w-[150px] truncate">\${item.notes || '-'}</td>
                \`;
                body.appendChild(tr);
            });
        }

        function handleAttendanceSubmit(e) {
            e.preventDefault();
            const name = document.getElementById('studentName').value;
            const id = document.getElementById('studentId').value;
            const status = document.getElementById('attendanceStatus').value;
            const notes = document.getElementById('attendanceNotes').value;

            const newRecord = {
                name,
                id,
                status,
                notes,
                time: new Date().toLocaleTimeString('id-ID') + ' ' + new Date().toLocaleDateString('id-ID')
            };

            localDb.unshift(newRecord);
            localStorage.setItem('gas_db_attendance', JSON.stringify(localDb));
            
            document.getElementById('studentName').value = '';
            document.getElementById('studentId').value = '';
            document.getElementById('attendanceNotes').value = '';
            
            updateStats();
            renderLogs();
            alert('Kehadiran berhasil dicatat!');
        }

        function refreshLogs() {
            localDb = JSON.parse(localStorage.getItem('gas_db_attendance') || '[]');
            updateStats();
            renderLogs();
        }

        updateStats();
        renderLogs();
    </script>
</body>
</html>`;

        gsContent = `/**
 * Google Apps Script Backend for Presensi Digital
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('${title}')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function recordAttendance(data) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Tanggal & Waktu", "Nama Lengkap", "ID / Kelas", "Status Kehadiran", "Keterangan"]);
    }
    sheet.appendRow([new Date(), data.name, data.id, data.status, data.notes || ""]);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}`;

      } else if (normalized.includes("nilai") || normalized.includes("rapor") || normalized.includes("siswa") || normalized.includes("ujian") || normalized.includes("sekolah")) {
        title = "Sistem Rapor & Nilai Siswa Digital";
        primaryColorClass = "bg-indigo-600 hover:bg-indigo-700";
        
        htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-gray-50 text-gray-800">
    <div class="min-h-screen flex flex-col">
        <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">🎓</div>
                    <div>
                        <h1 class="font-bold text-lg text-gray-900">${title}</h1>
                        <p class="text-xs text-gray-500">MANAJEMEN & MONITORING NILAI AKADEMIK</p>
                    </div>
                </div>
            </div>
        </header>

        <main class="flex-1 max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-fit">
                <h2 class="text-lg font-bold text-gray-900 mb-1">Input Nilai Baru</h2>
                <p class="text-xs text-gray-500 mb-6">Tambahkan entri pencapaian akademik siswa.</p>
                
                <form id="gradeForm" onsubmit="handleGradeSubmit(event)" class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Nama Siswa</label>
                        <input type="text" id="studentName" required class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition" placeholder="Contoh: Ahmad Andryanto">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Kelas</label>
                            <input type="text" id="studentClass" required class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition" placeholder="Contoh: XII-A">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Mata Pelajaran</label>
                            <select id="subject" class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition bg-white">
                                <option value="Matematika">Matematika</option>
                                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                                <option value="Bahasa Inggris">Bahasa Inggris</option>
                                <option value="Fisika">Fisika</option>
                                <option value="Kimia">Kimia</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Nilai Tugas</label>
                            <input type="number" min="0" max="100" id="gradeTugas" required class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition" placeholder="0-100">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Nilai Ujian</label>
                            <input type="number" min="0" max="100" id="gradeUjian" required class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition" placeholder="0-100">
                        </div>
                    </div>

                    <button type="submit" class="w-full py-3 px-4 ${primaryColorClass} text-white font-semibold rounded-xl active:scale-[0.98] transition shadow-lg text-sm">
                        Simpan Nilai Siswa
                    </button>
                </form>
            </div>

            <div class="lg:col-span-2 space-y-6">
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
                        <span class="text-2xl mb-1 block">🏆</span>
                        <span class="text-2xl font-bold text-gray-900" id="statAvg">0.0</span>
                        <span class="text-[11px] font-medium text-gray-400 block uppercase">Rata-Rata Nilai</span>
                    </div>
                    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
                        <span class="text-2xl mb-1 block">📈</span>
                        <span class="text-2xl font-bold text-gray-900" id="statMax">0</span>
                        <span class="text-[11px] font-medium text-gray-400 block uppercase">Nilai Tertinggi</span>
                    </div>
                    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
                        <span class="text-2xl mb-1 block">👥</span>
                        <span class="text-2xl font-bold text-gray-900" id="statTotal">0</span>
                        <span class="text-[11px] font-medium text-gray-400 block uppercase">Total Siswa</span>
                    </div>
                </div>

                <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 class="font-bold text-gray-900">Histori Catatan Akademik</h3>
                        <button onclick="clearGrades()" class="text-xs font-semibold text-red-600 hover:underline">Hapus Semua</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-gray-50/50 text-gray-400 text-xs font-semibold border-b border-gray-100 uppercase">
                                <tr>
                                    <th class="px-6 py-3">Nama</th>
                                    <th class="px-6 py-3">Kelas</th>
                                    <th class="px-6 py-3">Mapel</th>
                                    <th class="px-6 py-3">Tugas</th>
                                    <th class="px-6 py-3">Ujian</th>
                                    <th class="px-6 py-3">Rata-Rata</th>
                                </tr>
                            </thead>
                            <tbody id="gradeTableBody" class="divide-y divide-gray-100 text-gray-600">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        let grades = JSON.parse(localStorage.getItem('gas_db_grades') || '[]');

        function calculateStats() {
            if (grades.length === 0) {
                document.getElementById('statAvg').textContent = '0.0';
                document.getElementById('statMax').textContent = '0';
                document.getElementById('statTotal').textContent = '0';
                return;
            }
            
            const total = grades.length;
            const avg = grades.reduce((acc, x) => acc + x.average, 0) / total;
            const maxVal = Math.max(...grades.map(x => x.average));

            document.getElementById('statAvg').textContent = avg.toFixed(1);
            document.getElementById('statMax').textContent = maxVal.toFixed(0);
            document.getElementById('statTotal').textContent = total;
        }

        function renderGrades() {
            const body = document.getElementById('gradeTableBody');
            body.innerHTML = '';
            
            if (grades.length === 0) {
                body.innerHTML = \`<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400 text-xs">Belum ada nilai terdaftar.</td></tr>\`;
                return;
            }

            grades.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = \`
                    <td class="px-6 py-4 font-semibold text-gray-800">\${item.name}</td>
                    <td class="px-6 py-4 text-gray-500">\${item.className}</td>
                    <td class="px-6 py-4 font-medium text-indigo-600">\${item.subject}</td>
                    <td class="px-6 py-4 text-gray-500">\${item.tugas}</td>
                    <td class="px-6 py-4 text-gray-500">\${item.ujian}</td>
                    <td class="px-6 py-4 font-bold text-gray-900">\${item.average.toFixed(1)}</td>
                \`;
                body.appendChild(tr);
            });
        }

        function handleGradeSubmit(e) {
            e.preventDefault();
            const name = document.getElementById('studentName').value;
            const className = document.getElementById('studentClass').value;
            const subject = document.getElementById('subject').value;
            const tugas = parseFloat(document.getElementById('gradeTugas').value);
            const ujian = parseFloat(document.getElementById('gradeUjian').value);
            const average = (tugas + ujian) / 2;

            const record = { name, className, subject, tugas, ujian, average };
            grades.unshift(record);
            localStorage.setItem('gas_db_grades', JSON.stringify(grades));

            document.getElementById('studentName').value = '';
            document.getElementById('studentClass').value = '';
            document.getElementById('gradeTugas').value = '';
            document.getElementById('gradeUjian').value = '';

            calculateStats();
            renderGrades();
            alert('Nilai siswa berhasil disimpan!');
        }

        function clearGrades() {
            if (confirm('Apakah Anda yakin ingin menghapus seluruh nilai?')) {
                grades = [];
                localStorage.setItem('gas_db_grades', JSON.stringify([]));
                calculateStats();
                renderGrades();
            }
        }

        calculateStats();
        renderGrades();
    </script>
</body>
</html>`;

        gsContent = `/**
 * Google Apps Script Backend for Nilai Siswa
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('${title}')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function saveGrade(data) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Tanggal", "Nama Siswa", "Kelas", "Mata Pelajaran", "Nilai Tugas", "Nilai Ujian", "Rata-Rata"]);
    }
    sheet.appendRow([new Date(), data.name, data.className, data.subject, data.tugas, data.ujian, data.average]);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}`;

      } else {
        // Default Inventory & Asset
        title = "Sistem Inventaris & Aset Sekolah";
        primaryColorClass = "bg-teal-700 hover:bg-teal-800";
        
        htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-gray-50 text-gray-800">
    <div class="min-h-screen flex flex-col">
        <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">📦</div>
                    <div>
                        <h1 class="font-bold text-lg text-gray-900">${title}</h1>
                        <p class="text-xs text-gray-500">ADMINISTRASI & PENDATAAN DIGITAL</p>
                    </div>
                </div>
            </div>
        </header>

        <main class="flex-1 max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-fit">
                <h2 class="text-lg font-bold text-gray-900 mb-1">Form Input Data</h2>
                <p class="text-xs text-gray-500 mb-6">Tambahkan pencatatan entri aset/inventaris baru.</p>
                
                <form id="assetForm" onsubmit="handleAssetSubmit(event)" class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Nama Barang / Aset</label>
                        <input type="text" id="itemName" required class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition" placeholder="Contoh: Laptop Core i5">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Jumlah (Qty)</label>
                            <input type="number" min="1" id="itemQty" required class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition" placeholder="1">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Kondisi</label>
                            <select id="itemCondition" class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition bg-white">
                                <option value="Sangat Baik">🟢 Sangat Baik</option>
                                <option value="Rusak Ringan">🟡 Rusak Ringan</option>
                                <option value="Rusak Berat">🔴 Rusak Berat</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Kategori / Lokasi Ruang</label>
                        <input type="text" id="itemLocation" required class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition" placeholder="Contoh: Laboratorium Komputer">
                    </div>

                    <button type="submit" class="w-full py-3 px-4 ${primaryColorClass} text-white font-semibold rounded-xl active:scale-[0.98] transition shadow-lg text-sm">
                        Simpan Catatan Baru
                    </button>
                </form>
            </div>

            <div class="lg:col-span-2 space-y-6">
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
                        <span class="text-2xl mb-1 block">📦</span>
                        <span class="text-2xl font-bold text-gray-900" id="statItems">0</span>
                        <span class="text-[11px] font-medium text-gray-400 block uppercase">Jumlah Barang</span>
                    </div>
                    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
                        <span class="text-2xl mb-1 block">🛠️</span>
                        <span class="text-2xl font-bold text-gray-900" id="statGood">0</span>
                        <span class="text-[11px] font-medium text-gray-400 block uppercase">Kondisi Baik</span>
                    </div>
                    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
                        <span class="text-2xl mb-1 block">⚠️</span>
                        <span class="text-2xl font-bold text-gray-900" id="statBroken">0</span>
                        <span class="text-[11px] font-medium text-gray-400 block uppercase">Rusak</span>
                    </div>
                </div>

                <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 class="font-bold text-gray-900">Database Inventaris Aktif</h3>
                        <button onclick="clearAssets()" class="text-xs font-semibold text-red-600 hover:underline">Hapus Semua</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-gray-50/50 text-gray-400 text-xs font-semibold border-b border-gray-100 uppercase">
                                <tr>
                                    <th class="px-6 py-3">Nama Barang</th>
                                    <th class="px-6 py-3">Jumlah (Qty)</th>
                                    <th class="px-6 py-3">Kondisi</th>
                                    <th class="px-6 py-3">Lokasi / Ruang</th>
                                    <th class="px-6 py-3">Waktu Input</th>
                                </tr>
                            </thead>
                            <tbody id="assetTableBody" class="divide-y divide-gray-100 text-gray-600">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        let assets = JSON.parse(localStorage.getItem('gas_db_assets') || '[]');

        function calculateStats() {
            if (assets.length === 0) {
                document.getElementById('statItems').textContent = '0';
                document.getElementById('statGood').textContent = '0';
                document.getElementById('statBroken').textContent = '0';
                return;
            }
            
            const totalQty = assets.reduce((acc, x) => acc + x.qty, 0);
            const goodQty = assets.filter(x => x.condition === 'Sangat Baik').reduce((acc, x) => acc + x.qty, 0);
            const brokenQty = assets.filter(x => x.condition.includes('Rusak')).reduce((acc, x) => acc + x.qty, 0);

            document.getElementById('statItems').textContent = totalQty;
            document.getElementById('statGood').textContent = goodQty;
            document.getElementById('statBroken').textContent = brokenQty;
        }

        function renderAssets() {
            const body = document.getElementById('assetTableBody');
            body.innerHTML = '';
            
            if (assets.length === 0) {
                body.innerHTML = \`<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400 text-xs">Belum ada barang terdaftar.</td></tr>\`;
                return;
            }

            assets.forEach((item, index) => {
                let badge = '';
                if (item.condition === 'Sangat Baik') badge = '<span class="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full text-xs font-medium">Sangat Baik</span>';
                else if (item.condition === 'Rusak Ringan') badge = '<span class="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium">Rusak Ringan</span>';
                else badge = '<span class="bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium">Rusak Berat</span>';

                const tr = document.createElement('tr');
                tr.innerHTML = \`
                    <td class="px-6 py-4 font-semibold text-gray-800">\${item.name}</td>
                    <td class="px-6 py-4 text-gray-500">\${item.qty} pcs</td>
                    <td class="px-6 py-4">\${badge}</td>
                    <td class="px-6 py-4 text-gray-500 font-medium">\${item.location}</td>
                    <td class="px-6 py-4 text-gray-400 text-xs">\${item.time}</td>
                \`;
                body.appendChild(tr);
            });
        }

        function handleAssetSubmit(e) {
            e.preventDefault();
            const name = document.getElementById('itemName').value;
            const qty = parseInt(document.getElementById('itemQty').value);
            const condition = document.getElementById('itemCondition').value;
            const location = document.getElementById('itemLocation').value;
            const time = new Date().toLocaleDateString('id-ID');

            const record = { name, qty, condition, location, time };
            assets.unshift(record);
            localStorage.setItem('gas_db_assets', JSON.stringify(assets));

            document.getElementById('itemName').value = '';
            document.getElementById('itemQty').value = '';
            document.getElementById('itemLocation').value = '';

            calculateStats();
            renderAssets();
            alert('Catatan inventaris berhasil disimpan!');
        }

        function clearAssets() {
            if (confirm('Apakah Anda yakin ingin menghapus seluruh data inventaris?')) {
                assets = [];
                localStorage.setItem('gas_db_assets', JSON.stringify([]));
                calculateStats();
                renderAssets();
            }
        }

        calculateStats();
        renderAssets();
    </script>
</body>
</html>`;

        gsContent = `/**
 * Google Apps Script Backend for Inventaris & Aset
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('${title}')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function addAsset(data) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Tanggal", "Nama Barang", "Jumlah", "Kondisi", "Lokasi/Ruang"]);
    }
    sheet.appendRow([new Date(), data.name, data.qty, data.condition, data.location]);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}`;
      }

      return { html: htmlContent, gs: gsContent };
    };

    const generateCode = async () => {
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, attachments })
        });
        
        let data;
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
          // Fallback immediately on API failure or HTML response on static host
          data = generateCodeClientSide(prompt);
        } else {
          data = await response.json();
        }
        
        const files: CodeFile[] = [
          { name: 'index.html', language: 'html', content: data.html || '<!-- Gagal generate HTML -->' },
          { name: 'Code.gs', language: 'javascript', content: data.gs || '// Gagal generate GS' }
        ];
        
        setCurrentStep(4);
        setTimeout(() => onComplete(files, prompt), 1000);
      } catch (err: any) {
        // Fallback on complete network failure
        console.warn('Network API failed, generating client-side fallback...', err);
        const data = generateCodeClientSide(prompt);
        const files: CodeFile[] = [
          { name: 'index.html', language: 'html', content: data.html || '<!-- Gagal generate HTML -->' },
          { name: 'Code.gs', language: 'javascript', content: data.gs || '// Gagal generate GS' }
        ];
        setCurrentStep(4);
        setTimeout(() => onComplete(files, prompt), 1000);
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
