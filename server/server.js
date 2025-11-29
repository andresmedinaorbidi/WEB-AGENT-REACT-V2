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
// If on Render, use relative path. If Local, use localhost:3000
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
        const { prompt, sessionId } = req.body;
        console.log("Generating...");
        const result = await generateWebsite(prompt);
        saveSite(sessionId, result.code);
        // FIX: Use BASE_URL to handle localhost vs production
        res.json({ url: `${BASE_URL}/sites/${sessionId}/index.html` });
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
        console.log("Editing...");
        const result = await editWebsite(currentCode, instruction);
        saveSite(sessionId, result.code);
        // FIX: Use BASE_URL here too
        res.json({ url: `${BASE_URL}/sites/${sessionId}/index.html?t=${Date.now()}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Edit failed" });
    }
});

app.post('/api/deploy', async (req, res) => {
    const { sessionId } = req.body;
    const folderPath = path.join(sitesDir, sessionId);

    console.log(`[Deploy] Starting deploy for session: ${sessionId}`);

    // 1. Validation
    if (!process.env.SURGE_TOKEN) {
        console.error("[Deploy] Error: SURGE_TOKEN is missing in .env file");
        return res.status(500).json({ error: "Server config error: Missing Deployment Token" });
    }

    if (!fs.existsSync(folderPath)) {
        return res.status(400).json({ error: "Site not found. Please click Generate first." });
    }

    // 2. Prepare Command
    const randomName = 'wflow-' + Math.random().toString(36).substr(2, 6);
    const domain = `${randomName}.surge.sh`;
    
    // USE NPX: This works on Windows, Mac, and Linux automatically
    const command = `npx surge --project "${folderPath}" --domain ${domain} --token ${process.env.SURGE_TOKEN}`;

    console.log(`[Deploy] Executing: npx surge --domain ${domain}...`);

    // 3. Execute
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[Deploy] FAILED.`);
            console.error(`[Deploy] Error Code: ${error.code}`);
            console.error(`[Deploy] Error Message: ${error.message}`);
            console.error(`[Deploy] Stderr (Surge Output): ${stderr}`);
            
            return res.status(500).json({ 
                error: "Deployment failed. Check terminal for details.",
                details: stderr || error.message
            });
        }
        
        console.log(`[Deploy] Success!`);
        console.log(stdout); // Log the success message
        
        res.json({ url: `https://${domain}` });
    });
});

// --- SERVE FRONTEND (Production Only) ---
app.use(express.static(path.join(__dirname, '../client/dist')));

// FIX: Catch-All Route with 404 Protection
app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/sites/') || req.path.startsWith('/api/')) {
        return res.status(404).send('404 Not Found');
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));