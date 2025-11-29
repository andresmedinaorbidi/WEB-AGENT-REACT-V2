const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const AdmZip = require('adm-zip');
const axios = require('axios');
const { generateWebsite, editWebsite } = require('./agent');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1. ENSURE SITES FOLDER EXISTS ON BOOT (Crucial for Render)
const sitesDir = path.join(__dirname, 'sites');
if (!fs.existsSync(sitesDir)) {
    fs.mkdirSync(sitesDir, { recursive: true });
    console.log("Created sites directory");
}

// 2. Serve Generated Sites
app.use('/sites', express.static(sitesDir));

// --- HELPER FUNCTIONS (Clean Code & Wrappers) ---
function cleanReactCode(code) {
    let clean = code;
    clean = clean.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
    clean = clean.replace(/export\s+default\s+App;?/g, '');
    clean = clean.replace(/export\s+default\s+function/g, 'function');
    return clean;
}

const HTML_WRAPPER = (code) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>#root:empty::before { content: 'Loading...'; display: block; padding: 20px; color: #666; }</style>
</head>
<body class="bg-gray-50">
    <div id="root"></div>
    <script>window.onerror = function(m){document.body.innerHTML='<div style="color:red;padding:20px;">Preview Error: '+m+'</div>';}</script>
    <script type="text/babel">
        try {
            const { useState, useEffect, useRef } = React;
            ${code}
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<App />);
        } catch (err) { document.body.innerHTML='<div style="color:red;padding:20px;">Render Error: '+err.message+'</div>'; }
    </script>
</body>
</html>
`;

function saveSite(sessionId, rawCode) {
    const dir = path.join(sitesDir, sessionId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(path.join(dir, 'app.jsx'), rawCode);
    const cleanedCode = cleanReactCode(rawCode);
    fs.writeFileSync(path.join(dir, 'index.html'), HTML_WRAPPER(cleanedCode));
}

// --- API ROUTES ---

app.post('/api/create', async (req, res) => {
    try {
        const { prompt, sessionId } = req.body;
        console.log("Gemini generating...");
        const result = await generateWebsite(prompt);
        saveSite(sessionId, result.code);
        
        // FIX: Return RELATIVE URL (Works on localhost AND Render)
        res.json({ url: `/sites/${sessionId}/index.html` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Generation failed" });
    }
});

app.post('/api/edit', async (req, res) => {
    try {
        const { instruction, sessionId } = req.body;
        const dir = path.join(sitesDir, sessionId);
        if (!fs.existsSync(path.join(dir, 'app.jsx'))) return res.status(404).json({ error: "Session not found" });

        const currentCode = fs.readFileSync(path.join(dir, 'app.jsx'), 'utf-8');
        console.log("Gemini editing...");
        const result = await editWebsite(currentCode, instruction);
        saveSite(sessionId, result.code);
        
        // FIX: Return RELATIVE URL
        res.json({ url: `/sites/${sessionId}/index.html?t=${Date.now()}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Edit failed" });
    }
});

app.post('/api/deploy', async (req, res) => {
    const { sessionId } = req.body;
    const folderPath = path.join(sitesDir, sessionId);
    if (!fs.existsSync(folderPath)) return res.status(400).json({ error: "Site not found. Generate first." });

    try {
        const zip = new AdmZip();
        zip.addLocalFolder(folderPath);
        const response = await axios.post('https://api.netlify.com/api/v1/sites', zip.toBuffer(), {
            headers: { 'Content-Type': 'application/zip', 'Authorization': `Bearer ${process.env.NETLIFY_TOKEN}` }
        });
        const liveUrl = response.data.ssl_url || response.data.url || response.data.deploy_url;
        res.json({ url: liveUrl });
    } catch (e) { res.status(500).json({ error: "Deploy failed" }); }
});

// --- SERVE FRONTEND (Express 5 Regex Fix) ---
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));