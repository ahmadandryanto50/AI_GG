import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

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
                AsetKu - INVENTORY SEKOLAH
            </div>
        </div>
        <div class="max-w-6xl mx-auto px-4 py-16">
            <h1 class="text-4xl font-bold mb-4">Kelola Aset Sekolah dengan Mudah & Terstruktur</h1>
            <p class="text-teal-100 text-lg mb-8">Catat, monitor, dan laporkan seluruh inventaris sekolah.</p>
        </div>
    </div>
</body>
</html>`;

const fallbackGS = `function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Inventory & Aset Sekolah')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}`;

// --- Admin & Settings API ---
let memoryUsersList: Record<string, any> = {};

app.post('/api/settings/log-user', (req, res) => {
  const { email, displayName } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const emailLower = email.toLowerCase();
  const isAdmin = emailLower === "ahmad.andryanto50@admin.smp.belajar.id";

  if (!memoryUsersList[emailLower]) {
    memoryUsersList[emailLower] = {
      name: displayName || email.split('@')[0],
      status: isAdmin ? 'allowed' : 'pending',
      firstLogin: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
  } else {
    memoryUsersList[emailLower].lastLogin = new Date().toISOString();
    if (isAdmin) memoryUsersList[emailLower].status = 'allowed';
  }

  res.json({
    success: true,
    user: memoryUsersList[emailLower],
    status: memoryUsersList[emailLower].status
  });
});

app.get('/api/settings/users', (req, res) => {
  res.json({ success: true, users: memoryUsersList });
});

app.post('/api/settings/users/:email/status', (req, res) => {
  const email = decodeURIComponent(req.params.email).toLowerCase();
  const { status } = req.body;

  if (memoryUsersList[email]) {
    memoryUsersList[email].status = status;
  } else {
    memoryUsersList[email] = {
      name: email.split('@')[0],
      status,
      firstLogin: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
  }

  res.json({ success: true, users: memoryUsersList });
});

// AI Generation Route via Gemini API
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json({ html: fallbackHTML, gs: fallbackGS });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Buatkan aplikasi web berbasis Google AppScript (HTML & GS) untuk permintaan berikut: "${prompt}".
Tolong berikan dua bagian file persis dalam format berikut:

===FILE_INDEX_HTML_START===
<!DOCTYPE html>
... (kode html lengkap) ...
===FILE_INDEX_HTML_END===

===FILE_CODE_GS_START===
function doGet(e) { ... }
... (kode gs lengkap) ...
===FILE_CODE_GS_END===`
    });

    let responseText = response.text || "";
    let generatedHtml = fallbackHTML;
    let generatedGs = fallbackGS;

    const htmlMatch = responseText.match(/===FILE_INDEX_HTML_START===([\s\S]*?)===FILE_INDEX_HTML_END===/);
    if (htmlMatch) generatedHtml = htmlMatch[1].trim();

    const gsMatch = responseText.match(/===FILE_CODE_GS_START===([\s\S]*?)===FILE_CODE_GS_END===/);
    if (gsMatch) generatedGs = gsMatch[1].trim();

    res.json({ html: generatedHtml, gs: generatedGs });
  } catch (error) {
    console.error("Gemini Vercel Error:", error);
    res.json({ html: fallbackHTML, gs: fallbackGS });
  }
});

export default app;
