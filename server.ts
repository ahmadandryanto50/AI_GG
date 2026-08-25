import express from "express";

import fs from 'fs';

import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const fallbackHTML = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AsetKu - Inventory & Aset Sekolah</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gray-50">
    <div class="bg-[#115e59] text-white">
        <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div class="flex items-center gap-2 font-bold text-xl">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                AsetKu
                <span class="text-xs font-normal opacity-70 block -mt-1">INVENTORY SEKOLAH</span>
            </div>
            <nav class="flex items-center gap-6 text-sm">
                <a href="#" class="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-md"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg> Beranda</a>
                <a href="#" class="flex items-center gap-2 opacity-70 hover:opacity-100"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> Dashboard</a>
                <a href="#" class="flex items-center gap-2 opacity-70 hover:opacity-100"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Input Aset</a>
                <a href="#" class="flex items-center gap-2 opacity-70 hover:opacity-100"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg> Daftar Aset</a>
            </nav>
        </div>
        
        <div class="max-w-6xl mx-auto px-4 py-16">
            <span class="text-teal-200 text-sm font-semibold tracking-wider mb-2 block uppercase">O Inventory & Aset Sekolah</span>
            <h1 class="text-5xl font-bold mb-4 leading-tight max-w-2xl">Kelola Aset Sekolah dengan Mudah & Terstruktur</h1>
            <p class="text-teal-100 text-lg mb-8 max-w-2xl leading-relaxed">Catat, monitor, dan laporkan seluruh inventaris sekolah — mulai dari kursi, meja, papan tulis, hingga peralatan laboratorium — dalam satu platform terintegrasi.</p>
            <div class="flex gap-4">
                <button class="bg-white text-[#115e59] px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-100 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg> Buka Dashboard</button>
                <button class="bg-teal-700/50 text-white px-6 py-3 rounded-lg font-semibold border border-teal-600 flex items-center gap-2 hover:bg-teal-700 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Mulai Input Data</button>
            </div>
        </div>
    </div>
    
    <div class="max-w-6xl mx-auto px-4 -mt-10 mb-20">
        <div class="grid grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div class="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 mb-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                </div>
                <h3 class="font-bold text-gray-800 mb-2">Pencatatan Aset</h3>
                <p class="text-sm text-gray-500">Catat kursi, meja, papan tulis, dan seluruh inventaris dengan mudah.</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div class="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 mb-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                </div>
                <h3 class="font-bold text-gray-800 mb-2">Dashboard Real-time</h3>
                <p class="text-sm text-gray-500">Pantau total nilai aset, jumlah barang rusak, dan distribusi per lokasi.</p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div class="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 mb-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                </div>
                <h3 class="font-bold text-gray-800 mb-2">Grafik & Laporan</h3>
                <p class="text-sm text-gray-500">Visualisasi distribusi barang per kondisi dengan chart interaktif.</p>
            </div>
        </div>
    </div>
</body>
</html>`;

const fallbackGS = `function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Inventory & Aset Sekolah')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getData() {
  return [
    { id: 'A001', nama: 'Meja Guru', kondisi: 'Baik', lokasi: 'Ruang Kelas 1' },
    { id: 'A002', nama: 'Papan Tulis', kondisi: 'Rusak', lokasi: 'Ruang Kelas 2' }
  ];
}`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  
  // --- Admin & Settings API ---
  const dbPath = path.join(process.cwd(), 'data', 'db.json');

  const getDb = () => {
    try {
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        fs.writeFileSync(dbPath, JSON.stringify({ adminPassword: "gg123", users: {}, theme: {} }));
      }
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      console.error("Error reading DB", e);
      return { adminPassword: "gg123", users: {}, theme: {} };
    }
  };

  const saveDb = (data) => {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Error writing DB", e);
    }
  };

  app.post("/api/settings/login", (req, res) => {
    const { password } = req.body;
    const db = getDb();
    if (password === db.adminPassword) {
      res.json({ success: true, token: "admin-token-123" });
    } else {
      res.status(401).json({ success: false, message: "Password salah" });
    }
  });

  app.post("/api/settings/change-password", (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const db = getDb();
    if (oldPassword === db.adminPassword) {
      db.adminPassword = newPassword;
      saveDb(db);
      res.json({ success: true, message: "Password berhasil diubah" });
    } else {
      res.status(401).json({ success: false, message: "Password lama salah" });
    }
  });

  app.get("/api/settings/users", (req, res) => {
    const db = getDb();
    res.json({ success: true, users: db.users });
  });

  app.post("/api/settings/users/:email/status", (req, res) => {
    let { status } = req.body; // 'allowed' or 'rejected'
    const email = req.params.email;
    const db = getDb();
    
    // Explicit safeguard: Admin account can NEVER be rejected
    if (email === "ahmad.andryanto50@admin.smp.belajar.id") {
      status = "allowed";
    }

    if (db.users[email]) {
      db.users[email].status = status;
    } else {
      db.users[email] = { status, firstLogin: new Date().toISOString() };
    }
    saveDb(db);
    res.json({ success: true, users: db.users });
  });

  app.post("/api/settings/request-access", (req, res) => {
    const { email, name } = req.body;
    if (!email) return res.json({ success: false, message: "Email required" });
    
    const db = getDb();
    db.users[email] = {
      status: 'pending',
      name: name || email.split('@')[0],
      firstLogin: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    saveDb(db);
    res.json({ success: true });
  });

  app.post("/api/settings/log-user", (req, res) => {
    const { email, displayName } = req.body;
    if (!email) return res.json({ success: false });
    
    const db = getDb();
    
    // Check if running in production mode
    const isProd = process.env.NODE_ENV === "production";
    
    // In production, superadmin must also have an explicitly registered account in the JSON database.
    // In development/preview mode, we keep the auto-allow safeguard for testing convenience.
    const isAdmin = email === "ahmad.andryanto50@admin.smp.belajar.id";

    if (!db.users[email]) {
      const defaultStatus = isAdmin ? 'allowed' : 'pending';
      db.users[email] = { 
        status: defaultStatus, 
        name: displayName || email.split('@')[0], 
        firstLogin: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      saveDb(db);
    } else {
      db.users[email].lastLogin = new Date().toISOString();
      db.users[email].name = displayName || db.users[email].name;
      if (isAdmin) {
        db.users[email].status = 'allowed';
      }
      saveDb(db);
    }
    
    res.json({ success: true, status: db.users[email].status });
  });
  // --- End Admin & Settings API ---

  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, isUpdate, currentFiles, attachments } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        console.warn("Using fallback due to missing/default API key");
        return res.json({ html: fallbackHTML, gs: fallbackGS });
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are an expert Google Apps Script developer. 
The user wants to build a web application using Apps Script.
Return the code exactly in the following format, using these exact delimiters:

===FILE_INDEX_HTML_START===
[Insert index.html content here, including CSS/Tailwind and client-side JS]
===FILE_INDEX_HTML_END===

===FILE_CODE_GS_START===
[Insert Code.gs content here, containing doGet() and all backend functions]
===FILE_CODE_GS_END===

Do not include any other text or markdown formatting around the delimiters.`;

      let textContents = prompt;
      if (isUpdate && currentFiles) {
        const currentHtml = currentFiles.find((f: any) => f.name === 'index.html')?.content || '';
        const currentGs = currentFiles.find((f: any) => f.name === 'Code.gs')?.content || '';
        
        textContents = `Here is the current state of the application code:

=== index.html ===
${currentHtml}

=== Code.gs ===
${currentGs}

USER UPDATE REQUEST: ${prompt}

Please update the application according to the user's request. 
Return the full replacement code using the requested delimiters.`;
      }

      const contentParts: any[] = [];
      if (attachments && attachments.length > 0) {
        attachments.forEach((att: any) => {
          contentParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data
            }
          });
        });
      }
      contentParts.push({ text: textContents });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contentParts,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      let responseText = response.text || "";
      let generatedHtml = fallbackHTML;
      let generatedGs = fallbackGS;

      const htmlMatch = responseText.match(/===FILE_INDEX_HTML_START===([\s\S]*?)===FILE_INDEX_HTML_END===/);
      if (htmlMatch) {
        generatedHtml = htmlMatch[1].trim();
      }

      const gsMatch = responseText.match(/===FILE_CODE_GS_START===([\s\S]*?)===FILE_CODE_GS_END===/);
      if (gsMatch) {
        generatedGs = gsMatch[1].trim();
      }

      if (!htmlMatch && !gsMatch) {
         try {
             const result = JSON.parse(responseText.replace(/^```(json)?\n?/g, '').replace(/\n?```$/g, '').trim());
             if (result.html) generatedHtml = result.html;
             if (result.gs) generatedGs = result.gs;
         } catch(e) {
             console.error("Failed to parse fallback JSON:", e);
         }
      }

      res.json({ html: generatedHtml, gs: generatedGs });
    } catch (error) {
      console.error("Gemini Error:", error);
      // Fallback instead of failing
      res.json({ html: fallbackHTML, gs: fallbackGS });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
