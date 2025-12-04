// server/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const AdmZip = require('adm-zip');
const { exec } = require('child_process');
require('dotenv').config();

// Services
const { chatWithArchitect, generateWebsite, editWebsite } = require('./services/ai');
const { saveSite, getSiteCode, getSitePath } = require('./services/fileSystem');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const IS_PRODUCTION = process.env.RENDER || false;
const BASE_URL = IS_PRODUCTION ? '' : 'http://localhost:3000';

// Serve Sites
app.use('/sites', express.static(path.join(__dirname, 'sites')));

// --- ROUTES ---

app.post('/api/chat', async (req, res) => {
    const { history, message, currentBrief } = req.body;
    try {
        const result = await chatWithArchitect(history, message, currentBrief);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/create', async (req, res) => {
    try {
        const { prompt, sessionId, style } = req.body;
        const result = await generateWebsite(prompt, style);
        saveSite(sessionId, result.code);
        res.json({ url: `${BASE_URL}/sites/${sessionId}/index.html?t=${Date.now()}`, code: result.code });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/edit', async (req, res) => {
    try {
        const { instruction, sessionId } = req.body;
        const currentCode = getSiteCode(sessionId);
        if (!currentCode) return res.status(404).json({ error: "Session not found" });
        
        const result = await editWebsite(currentCode, instruction);
        saveSite(sessionId, result.code);
        res.json({ url: `${BASE_URL}/sites/${sessionId}/index.html?t=${Date.now()}`, code: result.code });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/restore', async (req, res) => {
    const { sessionId, code } = req.body;
    saveSite(sessionId, code);
    res.json({ url: `${BASE_URL}/sites/${sessionId}/index.html?t=${Date.now()}` });
});

app.get('/api/download/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const folderPath = getSitePath(sessionId);
    if (!require('fs').existsSync(folderPath)) return res.status(404).send("Not found");
    
    const zip = new AdmZip();
    zip.addLocalFile(path.join(folderPath, 'app.jsx'));
    zip.addLocalFile(path.join(folderPath, 'index.html'));
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename=wflow-${sessionId}.zip`);
    res.send(zip.toBuffer());
});

app.post('/api/deploy', async (req, res) => {
    const { sessionId } = req.body;
    const folderPath = getSitePath(sessionId);
    if (!require('fs').existsSync(folderPath) || !process.env.SURGE_TOKEN) return res.status(400).json({ error: "Deploy failed" });

    const domain = `wflow-${Math.random().toString(36).substr(2, 6)}.surge.sh`;
    const isWindows = process.platform === "win32";
    const surgeExec = isWindows ? 'surge.cmd' : 'surge';
    const surgePath = path.join(__dirname, 'node_modules', '.bin', surgeExec);
    
    exec(`"${surgePath}" --project "${folderPath}" --domain ${domain} --token ${process.env.SURGE_TOKEN}`, (error, stdout) => {
        if (error) return res.status(500).json({ error: "Deploy failed" });
        res.json({ url: `https://${domain}` });
    });
});

// Serve React App
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/sites/') || req.path.startsWith('/api/')) return res.status(404).send('404 Not Found');
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));