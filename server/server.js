const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const AdmZip = require('adm-zip');
const axios = require('axios');
const { generateWebsite, editWebsite } = require('./agent');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1. DETERMINE BASE URL
const IS_PRODUCTION = process.env.RENDER || false; 
const BASE_URL = IS_PRODUCTION ? '' : 'http://localhost:3000';

// 2. ENSURE SITES FOLDER EXISTS
const sitesDir = path.join(__dirname, 'sites');
if (!fs.existsSync(sitesDir)) {
    fs.mkdirSync(sitesDir, { recursive: true });
}

// 3. SERVE GENERATED SITES
app.use('/sites', express.static(sitesDir));

// --- HELPER FUNCTIONS ---

// Robustly clean code and ensure 'App' exists
function cleanReactCode(code) {
    let clean = code;
    clean = clean.replace(/```jsx/g, '').replace(/```/g, '');
    clean = clean.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
    clean = clean.replace(/<!DOCTYPE html>/gi, '').replace(/<html.*?>/gi, '').replace(/<\/html>/gi, '');
    clean = clean.replace(/<head>[\s\S]*?<\/head>/gi, '').replace(/<body.*?>/gi, '').replace(/<\/body>/gi, '');

    const funcMatch = clean.match(/export\s+default\s+function\s+(\w+)/);
    if (funcMatch && funcMatch[1]) {
        clean = clean.replace(/export\s+default\s+function/, 'function');
        if (funcMatch[1] !== 'App') clean += `\nconst App = ${funcMatch[1]};`;
    } else {
        const defaultMatch = clean.match(/export\s+default\s+(\w+);?/);
        if (defaultMatch && defaultMatch[1]) {
            clean = clean.replace(/export\s+default\s+.*?;?/g, '');
            if (defaultMatch[1] !== 'App') clean += `\nconst App = ${defaultMatch[1]};`;
        } else {
            clean = clean.replace(/export\s+default\s+/, 'const App = ');
        }
    }
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
    <style>
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 0px; background: transparent; }
        #root:empty::before { content: 'Building...'; display: flex; height: 100vh; justify-content: center; align-items: center; color: #888; }
    </style>
    <script>
        document.addEventListener('error', function(e) {
            if (e.target.tagName === 'IMG') {
                if (e.target.src.includes('placehold.co')) return;
                e.target.src = 'https://placehold.co/600x400/1a1a1a/666?text=Image+Unavailable';
                e.target.style.opacity = '0.7';
                e.target.style.borderRadius = '8px';
            }
        }, true);
    </script>
</head>
<body class="bg-black text-white">
    <div id="root"></div>
    <script type="text/babel">
        try {
            const { useState, useEffect, useRef } = React;
            ${code}
            if (typeof App === 'undefined') throw new Error("Component 'App' not found");
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<App />);
        } catch (err) {
            document.body.innerHTML = '<div style="color:#ff5555; padding:20px;">Render Error: ' + err.message + '</div>';
        }
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
        const { prompt, sessionId, style } = req.body;
        console.log("Gemini generating...");
        const result = await generateWebsite(prompt, style);
        saveSite(sessionId, result.code);
        res.json({ 
            url: `${BASE_URL}/sites/${sessionId}/index.html?t=${Date.now()}`,
            code: result.code 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Generation failed" });
    }
});

// FIX: This route was missing the file reading part in your previous error
app.post('/api/edit', async (req, res) => {
    try {
        const { instruction, sessionId } = req.body;
        const dir = path.join(sitesDir, sessionId);
        
        // 1. Check if file exists
        if (!fs.existsSync(path.join(dir, 'app.jsx'))) {
            return res.status(404).json({ error: "Session not found" });
        }

        // 2. READ THE FILE (This was missing!)
        const currentCode = fs.readFileSync(path.join(dir, 'app.jsx'), 'utf-8');
        
        console.log("Gemini editing...");
        const result = await editWebsite(currentCode, instruction);
        saveSite(sessionId, result.code);
        
        res.json({ 
            url: `${BASE_URL}/sites/${sessionId}/index.html?t=${Date.now()}`,
            code: result.code 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Edit failed" });
    }
});

app.post('/api/restore', async (req, res) => {
    try {
        const { sessionId, code } = req.body;
        saveSite(sessionId, code);
        res.json({ 
            url: `${BASE_URL}/sites/${sessionId}/index.html?t=${Date.now()}`,
            code: code 
        });
    } catch (error) {
        res.status(500).json({ error: "Restore failed" });
    }
});

app.post('/api/deploy', async (req, res) => {
    const { sessionId } = req.body;
    const folderPath = path.join(sitesDir, sessionId);
    if (!fs.existsSync(folderPath)) return res.status(400).json({ error: "Site not found" });

    // SURGE DEPLOYMENT (Cross-Platform)
    const randomName = 'wflow-' + Math.random().toString(36).substr(2, 6);
    const domain = `${randomName}.surge.sh`;
    
    // Check if token exists
    if (!process.env.SURGE_TOKEN) {
        return res.status(500).json({ error: "Missing SURGE_TOKEN in server env" });
    }

    // Use local binary
    const isWindows = process.platform === "win32";
    const surgeExec = isWindows ? 'surge.cmd' : 'surge';
    const surgePath = path.join(__dirname, 'node_modules', '.bin', surgeExec);

    const command = `"${surgePath}" --project "${folderPath}" --domain ${domain} --token ${process.env.SURGE_TOKEN}`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("Surge Error:", stderr);
            return res.status(500).json({ error: "Deploy failed" });
        }
        res.json({ url: `https://${domain}` });
    });
});

app.get('/api/download/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const folderPath = path.join(sitesDir, sessionId);

    if (!fs.existsSync(folderPath)) return res.status(404).send("Session not found");

    const zip = new AdmZip();
    // Add the specific files we want the user to have
    zip.addLocalFile(path.join(folderPath, 'app.jsx'));
    zip.addLocalFile(path.join(folderPath, 'index.html'));
    
    // Create a dummy package.json so they can run it easily
    const packageJson = {
        name: "wflow-export",
        version: "1.0.0",
        dependencies: { "react": "^18.2.0", "react-dom": "^18.2.0" }
    };
    zip.addFile("package.json", Buffer.from(JSON.stringify(packageJson, null, 2)));

    const downloadName = `wflow-${sessionId}.zip`;
    const data = zip.toBuffer();

    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename=${downloadName}`);
    res.set('Content-Length', data.length);
    res.send(data);
});

// --- SERVE FRONTEND (Production Only) ---
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/sites/') || req.path.startsWith('/api/')) {
        return res.status(404).send('404 Not Found');
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));