const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const AdmZip = require('adm-zip');

// 1. Adjust path to point to "server/sites" (up one level)
const sitesDir = path.join(__dirname, '../sites');
if (!fs.existsSync(sitesDir)) fs.mkdirSync(sitesDir, { recursive: true });

// 2. The HTML Wrapper logic
const DEPLOY_WRAPPER = (code) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Site</title>
    
    <!-- 1. External Libraries (CDN) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <!-- 2. Dependencies (Pinned Versions) -->
    <script src="https://unpkg.com/lucide@0.263.1/dist/umd/lucide.min.js"></script>
    <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>

    <style>
        body { margin: 0; font-family: 'Inter', sans-serif; background-color: #000; color: #fff; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .shimmer::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); animation: shimmer 1.5s infinite; }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        // 3. Environment Shim (The Magic Fix)
        const { useState, useEffect, useRef } = React;
        const { createRoot } = ReactDOM;
        
        // Fix Framer Motion: Map global window.Motion to variable 'motion'
        const { motion, AnimatePresence } = window.Motion || {};
        
        // Fix Lucide Icons: Expose all icons to global scope
        if (window.lucide) {
            Object.assign(window, window.lucide);
        }

        // 4. SmartImage Shim (Production)
        const SmartImage = ({ src, alt, className, ...props }) => {
            const [loaded, setLoaded] = useState(false);
            return (
                <div className={\`relative overflow-hidden bg-gray-900 \${className || ''}\`}>
                    {!loaded && <div className="absolute inset-0 z-10 bg-gray-800 shimmer" />}
                    <img 
                        src={src} 
                        alt={alt}
                        className={\`block w-full h-full object-cover transition-opacity duration-700 \${loaded ? 'opacity-100' : 'opacity-0'}\`}
                        onLoad={() => setLoaded(true)}
                        {...props}
                    />
                </div>
            );
        };

        // 5. Inject & Clean Code
        // We strip imports because we just manually imported them above via Globals
        const rawCode = \`${code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
        
        // 6. Evaluate
    </script>
    
    <!-- Separate script to run the cleaned code -->
    <script type="text/babel">
        ${code
            .replace(/import\s+.*?from\s+['"].*?['"];?/g, '') // Remove all import lines
            .replace(/export default function App/, 'function App') // Normalize export
        }

        const root = createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
`;

// 3. Logic: Save to Disk
function saveSite(sessionId, rawCode) {
    const dir = path.join(sitesDir, sessionId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // Save raw code for downloading/restoring
    fs.writeFileSync(path.join(dir, 'app.jsx'), rawCode);
    
    // Save HTML for Surge Deployments
    fs.writeFileSync(path.join(dir, 'index.html'), DEPLOY_WRAPPER(rawCode));
}

// 4. Logic: Create ZIP for Download
function createDownloadArchive(sessionId) {
    const folderPath = path.join(sitesDir, sessionId);
    if (!fs.existsSync(folderPath)) throw new Error("Session not found");
    
    const zip = new AdmZip();
    zip.addLocalFile(path.join(folderPath, 'app.jsx'));
    if(fs.existsSync(path.join(folderPath, 'index.html'))) {
        zip.addLocalFile(path.join(folderPath, 'index.html'));
    }
    
    const packageJson = {
        name: "wflow-export",
        dependencies: { "react": "^18.2.0", "lucide-react": "latest", "framer-motion": "latest" }
    };
    zip.addFile("package.json", Buffer.from(JSON.stringify(packageJson, null, 2)));
    
    return zip.toBuffer();
}

// 5. Logic: Deploy to Surge
function deploySite(sessionId) {
    return new Promise((resolve, reject) => {
        const folderPath = path.join(sitesDir, sessionId);
        if (!fs.existsSync(folderPath)) return reject(new Error("Site not found"));
        if (!process.env.SURGE_TOKEN) return reject(new Error("Missing SURGE_TOKEN"));

        const randomName = 'wflow-' + Math.random().toString(36).substr(2, 6);
        const domain = `${randomName}.surge.sh`;
        
        // Find Surge Binary Logic
        let surgeScriptPath;
        try {
            const pkgJsonPath = require.resolve('surge/package.json');
            const pkgRoot = path.dirname(pkgJsonPath);
            const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
            let binRelativePath = (typeof pkgData.bin === 'string') ? pkgData.bin : pkgData.bin.surge || './lib/surge.js';
            surgeScriptPath = path.resolve(pkgRoot, binRelativePath);
        } catch (e) {
            return reject(new Error("Surge not installed: " + e.message));
        }

        const command = `"${process.execPath}" --dns-result-order=ipv4first "${surgeScriptPath}" --project "${folderPath}" --domain ${domain} --token ${process.env.SURGE_TOKEN}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                if (error.message.includes('ENOTFOUND') || error.message.includes('EAI_AGAIN')) {
                     return reject(new Error("Network Error: DNS Resolution failed."));
                }
                return reject(new Error("Deploy failed: " + (stderr || error.message)));
            }
            resolve(`https://${domain}`);
        });
    });
}

// 6. EXPORT EVERYTHING
module.exports = { saveSite, createDownloadArchive, deploySite };