const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const AdmZip = require('adm-zip');
const axios = require('axios');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const { generateWebsite, editWebsite, chatWithArchitect, generateImage } = require('./agent');
require('dotenv').config();

const app = express();
// 🔧 FIX: Allow Sandpack (Public) to hit Localhost (Private)
app.use(cors({
    origin: true, // Allow ALL origins (reflects the request origin)
    credentials: true, // Allow cookies/headers
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🔧 FIX: Handle Private Network Access Preflight
app.use((req, res, next) => {
    // This tells Chrome: "Yes, I allow public websites to hit this local server"
    res.header("Access-Control-Allow-Private-Network", "true");
    next();
});
app.use(bodyParser.json({ limit: '10mb' }));

const IS_PRODUCTION = process.env.RENDER || false; 
const BASE_URL = IS_PRODUCTION ? '' : 'http://localhost:3000';
const sitesDir = path.join(__dirname, 'sites');
if (!fs.existsSync(sitesDir)) fs.mkdirSync(sitesDir, { recursive: true });

// Serve generated sites (for deployment reference)
app.use('/sites', express.static(sitesDir));

// --- HELPER: DEPLOY WRAPPER (For Surge Only) ---
// This uses ES Modules so the deployed site runs without a bundler
const DEPLOY_WRAPPER = (code) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/lucide-static@0.344.0/font/lucide.min.css" rel="stylesheet">
    <!-- Import Map for Modern Browsers -->
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18",
        "react-dom/client": "https://esm.sh/react-dom@18/client",
        "lucide-react": "https://esm.sh/lucide-react",
        "framer-motion": "https://esm.sh/framer-motion",
        "clsx": "https://esm.sh/clsx",
        "tailwind-merge": "https://esm.sh/tailwind-merge"
      }
    }
    </script>
    <style>
        body { font-family: sans-serif; }
        /* Shimmer for images */
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .animate-image-shimmer { background: linear-gradient(110deg, #1f2937 8%, #374151 18%, #1f2937 33%); background-size: 200% 100%; animation: shimmer 1.5s linear infinite; }
    </style>
</head>
<body class="bg-black text-white">
    <div id="root"></div>
    <script type="module">
        import React, { useState, useEffect, useRef } from 'react';
        import { createRoot } from 'react-dom/client';
        import * as Lucide from 'lucide-react';
        
        // 1. Inject SmartImage (Simple version for deploy)
        const SmartImage = ({ src, alt, className, ...props }) => {
            const [loaded, setLoaded] = useState(false);
            return React.createElement('div', { className: \`relative overflow-hidden \${className || ''}\` },
                !loaded && React.createElement('div', { className: 'absolute inset-0 z-10 animate-image-shimmer h-full w-full' }),
                React.createElement('img', { 
                    src, alt, 
                    className: \`transition-opacity duration-500 block w-full h-full object-cover \${loaded ? 'opacity-100' : 'opacity-0'}\`,
                    onLoad: () => setLoaded(true),
                    ...props
                })
            );
        };

        // 2. INJECTED CODE
        // We strip the default export to make it a standard variable
        ${code.replace('export default function App', 'function App')}

        // 3. MOUNT
        const root = createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
    </script>
</body>
</html>
`;

function saveSite(sessionId, rawCode) {
    const dir = path.join(sitesDir, sessionId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // Save raw code for downloading/restoring
    fs.writeFileSync(path.join(dir, 'app.jsx'), rawCode);
    
    // Save HTML for Surge Deployments
    fs.writeFileSync(path.join(dir, 'index.html'), DEPLOY_WRAPPER(rawCode));
}

// --- API ROUTES ---

// 1. ANALYZE (Semantic Scraper)
app.post('/api/analyze', async (req, res) => {
    try {
        const { url } = req.body;
        console.log(`🔍 Analyzing URL: ${url}`);

        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        const $ = cheerio.load(response.data);
        
        // Cleanup
        $('script, style, svg, noscript, iframe, footer').remove();

        // Semantic Extraction
        const title = $('title').text().trim();
        const desc = $('meta[name="description"]').attr('content') || '';
        
        // Guess Offerings from Nav/Lists
        const offerings = [];
        $('nav a, li, h3').each((i, el) => {
            const t = $(el).text().trim();
            if (t.length > 3 && t.length < 30 && !offerings.includes(t)) offerings.push(t);
        });
        
        // Guess Vibe from classes
        const htmlStr = $.html();
        let vibe = "Neutral";
        if (htmlStr.includes('font-serif')) vibe += ", Serif/Classic";
        if (htmlStr.includes('dark') || htmlStr.includes('bg-black')) vibe += ", Dark Mode";
        if (htmlStr.includes('tracking-tighter')) vibe += ", Modern/Tight";

        const bodyText = $('p').map((i, el) => {
            const t = $(el).text().trim();
            return t.length > 60 ? t : null;
        }).get().slice(0, 6).join('\n\n');

        const rawData = `
        [RESEARCH_SUMMARY]
        - **Source:** ${title}
        - **Intro:** ${desc}
        - **Detected Offerings:** ${offerings.slice(0, 15).join(', ')}
        - **Implied Vibe:** ${vibe}
        - **Content Snippets:** ${bodyText}
        `;

        res.json({ rawData });

    } catch (error) {
        console.error("Scrape Error:", error.message);
        res.json({ rawData: "Could not fetch website." });
    }
});

// 2. CREATE (Returns Raw Code)
app.post('/api/create', async (req, res) => {
    try {
        const { prompt, sessionId, style } = req.body;

        // MOCK TRAP
        if (prompt && (prompt.includes("DEPLOY_TEST") || prompt.includes("test:deploy"))) {
            return res.json({ code: "// Test Mode Code Already Injected by Frontend" });
        }

        console.log("Gemini generating...");
        const result = await generateWebsite(prompt, style);
        saveSite(sessionId, result.code);
        res.json({ code: result.code });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Generation failed" });
    }
});

// 3. EDIT (Returns Raw Code)
app.post('/api/edit', async (req, res) => {
    try {
        const { instruction, sessionId } = req.body;
        const dir = path.join(sitesDir, sessionId);
        
        if (!fs.existsSync(path.join(dir, 'app.jsx'))) {
            return res.status(404).json({ error: "Session not found" });
        }

        const currentCode = fs.readFileSync(path.join(dir, 'app.jsx'), 'utf-8');
        console.log("Gemini editing...");
        const result = await editWebsite(currentCode, instruction);
        saveSite(sessionId, result.code);
        res.json({ code: result.code });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Edit failed" });
    }
});

// 4. RESTORE
app.post('/api/restore', async (req, res) => {
    try {
        const { sessionId, code } = req.body;
        saveSite(sessionId, code);
        res.json({ code });
    } catch (error) {
        res.status(500).json({ error: "Restore failed" });
    }
});

// 5. DEPLOY (The Fixed Logic)
app.post('/api/deploy', async (req, res) => {
    const { sessionId } = req.body;
    const folderPath = path.join(sitesDir, sessionId);
    
    if (!fs.existsSync(folderPath)) return res.status(400).json({ error: "Site not found" });
    if (!process.env.SURGE_TOKEN) return res.status(500).json({ error: "Missing SURGE_TOKEN" });

    const randomName = 'wflow-' + Math.random().toString(36).substr(2, 6);
    const domain = `${randomName}.surge.sh`;
    console.log(`🚀 Preparing deploy for ${domain}...`);

    let surgeScriptPath;
    try {
        // Find Surge Package via package.json
        const pkgJsonPath = require.resolve('surge/package.json');
        const pkgRoot = path.dirname(pkgJsonPath);
        const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        
        let binRelativePath;
        if (typeof pkgData.bin === 'string') binRelativePath = pkgData.bin;
        else if (typeof pkgData.bin === 'object' && pkgData.bin.surge) binRelativePath = pkgData.bin.surge;
        else binRelativePath = './lib/surge.js';

        surgeScriptPath = path.resolve(pkgRoot, binRelativePath);
        
    } catch (e) {
        console.error("❌ Path Error:", e.message);
        return res.status(500).json({ error: "Surge not installed." });
    }

    const command = `"${process.execPath}" --dns-result-order=ipv4first "${surgeScriptPath}" --project "${folderPath}" --domain ${domain} --token ${process.env.SURGE_TOKEN}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ Deploy Error:", stderr || error.message);
            if (error.message.includes('ENOTFOUND') || error.message.includes('EAI_AGAIN')) {
                return res.status(500).json({ error: "Network Error: DNS Resolution failed." });
            }
            return res.status(500).json({ error: "Deploy failed." });
        }
        console.log("✅ Success:", domain);
        res.json({ url: `https://${domain}` });
    });
});

// 6. CHAT
app.post('/api/chat', async (req, res) => {
    const { history, message, currentBrief } = req.body;
    try {
        const result = await chatWithArchitect(history || [], message, currentBrief);
        res.json(result);
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Chat failed" });
    }
});

// 7. IMAGE PROXY
app.get('/api/image', async (req, res) => {
    const prompt = req.query.prompt;
    if (!prompt) return res.status(400).send("Prompt required");
    const cacheKey = prompt.toLowerCase().trim();
    if (global.imageCache && global.imageCache[cacheKey]) {
        res.set('Content-Type', 'image/png');
        return res.send(global.imageCache[cacheKey]);
    }
    try {
        const imageBuffer = await generateImage(prompt);
        if (!global.imageCache) global.imageCache = {};
        global.imageCache[cacheKey] = imageBuffer;
        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        res.redirect(`https://placehold.co/600x400/000/FFF?text=Image+Error`);
    }
});

// 8. DOWNLOAD
app.get('/api/download/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const folderPath = path.join(sitesDir, sessionId);
    if (!fs.existsSync(folderPath)) return res.status(404).send("Session not found");
    
    const zip = new AdmZip();
    zip.addLocalFile(path.join(folderPath, 'app.jsx'));
    // We add index.html for convenient deployment
    if(fs.existsSync(path.join(folderPath, 'index.html'))) {
        zip.addLocalFile(path.join(folderPath, 'index.html'));
    }
    const packageJson = {
        name: "wflow-export",
        dependencies: { "react": "^18.2.0", "lucide-react": "latest", "framer-motion": "latest" }
    };
    zip.addFile("package.json", Buffer.from(JSON.stringify(packageJson, null, 2)));
    const data = zip.toBuffer();
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename=wflow-${sessionId}.zip`);
    res.send(data);
});

// ============================================================
//  SERVE FRONTEND (Production Logic)
// ============================================================
// 1. Define where the React build files live
const clientBuildPath = path.join(__dirname, '../client/dist');

// 2. Check if the build exists (It will on Render if configured correctly)
if (fs.existsSync(clientBuildPath)) {
    console.log("📂 Serving React App from:", clientBuildPath);
    
    // Serve static files (JS, CSS, Images)
    app.use(express.static(clientBuildPath));

    // Handle React Routing (Catch-all)
    // If the user goes to /whatever, send index.html and let React handle it
    app.get(/.*/, (req, res) => {
        // Ignore API calls so we don't accidentally return HTML for an API error
        if (req.path.startsWith('/api') || req.path.startsWith('/sites')) {
            return res.status(404).json({ error: "Not Found" });
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
} else {
    // Fallback for local dev if you didn't build the client
    console.log("⚠️ No client build found at:", clientBuildPath);
    app.get('/', (req, res) => {
        res.send('<h1>Backend is running!</h1><p>To see the app, run <code>npm run build</code> in the client folder.</p>');
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));