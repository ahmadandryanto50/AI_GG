const fs = require('fs');

const serverContent = fs.readFileSync('server.ts', 'utf8');

const additionalImports = `
import fs from 'fs';
`;

const settingsApi = `
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
    const { status } = req.body; // 'allowed' or 'rejected'
    const email = req.params.email;
    const db = getDb();
    if (db.users[email]) {
      db.users[email].status = status;
    } else {
      db.users[email] = { status, firstLogin: new Date().toISOString() };
    }
    saveDb(db);
    res.json({ success: true, users: db.users });
  });

  app.post("/api/settings/log-user", (req, res) => {
    const { email, displayName } = req.body;
    if (!email) return res.json({ success: false });
    
    const db = getDb();
    if (!db.users[email]) {
      // Default to allowed for now, or could be 'pending'/'rejected'
      db.users[email] = { 
        status: 'allowed', 
        name: displayName || email.split('@')[0], 
        firstLogin: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      saveDb(db);
    } else {
      db.users[email].lastLogin = new Date().toISOString();
      db.users[email].name = displayName || db.users[email].name;
      saveDb(db);
    }
    
    res.json({ success: true, status: db.users[email].status });
  });
  // --- End Admin & Settings API ---
`;

let newContent = serverContent.replace('import express from "express";', 'import express from "express";\n' + additionalImports);
newContent = newContent.replace('app.post("/api/generate", async (req, res) => {', settingsApi + '\n  app.post("/api/generate", async (req, res) => {');

fs.writeFileSync('server.ts', newContent);
