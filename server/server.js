const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const AdmZip = require('adm-zip');
const axios = require('axios');
const cheerio = require('cheerio');
const { generateWebsite, editWebsite, chatWithArchitect, generateImage } = require('./agent');
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
        @keyframes image-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        .animate-image-shimmer {
            background: linear-gradient(110deg, #e5e7eb 8%, #f3f4f6 18%, #e5e7eb 33%);
            background-size: 200% 100%;
            animation: image-shimmer 1.5s linear infinite;
        }
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

            // --- 💉 INJECTED SMART COMPONENT ---
            // We define it here globally so the AI doesn't have to write it.
            const SmartImage = ({ src, alt, className, ...props }) => {
                const [isLoading, setIsLoading] = useState(true);
                return (
                    <div className={\`relative overflow-hidden \${className || ''}\`}>
                        {isLoading && (
                            <div className="absolute inset-0 z-10 animate-image-shimmer h-full w-full" />
                        )}
                        <img 
                            src={src} 
                            alt={alt}
                            className={\`transition-opacity duration-500 \${isLoading ? 'opacity-0' : 'opacity-100'} \${className || ''}\`}
                            onLoad={() => setIsLoading(false)}
                            {...props}
                        />
                    </div>
                );
            };
            
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

// --- WEBSITE CREATION: Handles the website generation, calls the main Designer AGENT-PROMPT uses Gemini 3.0 Pro
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

// --- WEBSITE EDIT: Handles the website edition, uses a simple EDIT AGENT, with a cheap Gemini 2.0 model
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

// --- WEBSITE RESTORE: Handles the local website restoration, allows user to go back to previous version
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

// --- WEBSITE DEPLOY: Uses Surge API to post websites to the internet
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

// --- WEBSITE DOWNLOAD: Developer friendly, allows the user to download the website generated code in zip file
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

// --- AGENT CHAT: Starter chat, ets information from the user, uses cheap Gemini 2.0 
app.post('/api/chat', async (req, res) => {
    console.log("--------------------------------");
    console.log("📩 Chat Request Received");
    
    // 1. Check if the body arrived correctly
    console.log("Payload:", JSON.stringify(req.body, null, 2));
    const { history, message, currentBrief } = req.body;

    try {
        // 2. Check if the function exists (Common import error)
        if (typeof chatWithArchitect !== 'function') {
            throw new Error("chatWithArchitect is NOT defined. Check your imports at the top of server.js!");
        }

        console.log("🤖 Asking Agent...");
        const result = await chatWithArchitect(history || [], message, currentBrief);
        
        console.log("✅ Agent Replied:", JSON.stringify(result, null, 2));
        res.json(result);

    } catch (error) {
        // 3. Log the EXACT error
        console.error("❌ CHAT ERROR:", error);
        
        // Send details to frontend so you can see it in the browser too
        res.status(500).json({ 
            error: "Chat failed", 
            details: error.message,
            stack: error.stack
        });
    }
});

// NEW ENDPOINT: Analyze URL
app.post('/api/analyze', async (req, res) => {
    try {
        const { url } = req.body;
        console.log(`🔍 Analyzing URL: ${url}`);

        // 1. Fetch HTML
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const html = response.data;

        // 2. Parse Text with Cheerio
        const $ = cheerio.load(html);
        
        // Remove scripts, styles, and SVGs to save tokens
        $('script').remove();
        $('style').remove();
        $('svg').remove();
        $('noscript').remove();

        // Extract key elements
        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || '';
        const h1 = $('h1').map((i, el) => $(el).text().trim()).get().join('; ');
        
        // Get generic body text (first 1000 chars to avoid overload)
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 1500);

        const rawData = `
        Title: ${title}
        Description: ${description}
        Main Headings: ${h1}
        Content Snippet: ${bodyText}
        `;

        res.json({ rawData });

    } catch (error) {
        console.error("Scrape Error:", error.message);
        res.json({ rawData: "Could not fetch website. The site might block bots." });
    }
});

// NEW ENDPOINT: Image Proxy
// Usage in HTML: <img src="/api/image?prompt=A+cyberpunk+city" />
app.get('/api/image', async (req, res) => {
    const prompt = req.query.prompt;
    if (!prompt) return res.status(400).send("Prompt required");

    // Simple In-Memory Cache to save money/quota
    // (In production, use Redis or save files to disk)
    const cacheKey = prompt.toLowerCase().trim();
    if (global.imageCache && global.imageCache[cacheKey]) {
        res.set('Content-Type', 'image/png');
        return res.send(global.imageCache[cacheKey]);
    }

    try {
        const imageBuffer = await generateImage(prompt);
        
        // Save to cache
        if (!global.imageCache) global.imageCache = {};
        global.imageCache[cacheKey] = imageBuffer;

        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        console.error("Image Generation Failed:", error.message);
        // Fallback to a placeholder if Gemini fails or refuses (Safety filter)
        res.redirect(`https://placehold.co/600x400/000/FFF?text=Image+Error`);
    }
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