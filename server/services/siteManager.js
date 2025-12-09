// server/services/siteManager.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const AdmZip = require('adm-zip');

const sitesDir = path.join(__dirname, '../sites');
if (!fs.existsSync(sitesDir)) fs.mkdirSync(sitesDir, { recursive: true });

// --- FINAL "SAFETY PROXY" WRAPPER ---
const DEPLOY_WRAPPER = (code) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Site</title>
    
    <!-- 1. CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- 2. REACT (Standard Browser Build) -->
    <script crossorigin src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
    
    <!-- 3. BABEL -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <!-- 4. DEPENDENCIES -->
    <!-- Framer Motion -->
    <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
    <!-- Lucide Icons (Stable Version) -->
    <script src="https://unpkg.com/lucide-react@0.263.1/dist/umd/lucide-react.min.js"></script>

    <style>
        body { margin: 0; font-family: 'Inter', sans-serif; background-color: #000; color: #fff; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .shimmer::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); animation: shimmer 1.5s infinite; }
    </style>
</head>
<body>
    <div id="root"></div>

    <!-- 5. SAFETY ARCHITECTURE -->
    <script>
        // A. Prepare the Icon Library
        // lucide-react 0.263.1 exports to 'window.lucide'
        const rawIcons = window.lucide || {};

        // B. Create the Safety Proxy
        // This intercepts every request for an icon.
        window.SafeLucide = new Proxy(rawIcons, {
            get: (target, prop) => {
                // 1. If the icon exists, return it.
                if (target[prop]) return target[prop];

                // 2. If the icon is MISSING (or undefined), return a Safe Fallback Component.
                // This prevents React Error #130 ("Element type is invalid: got undefined")
                return (props) => React.createElement(
                    'svg', 
                    { ...props, width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 },
                    React.createElement('rect', { x: 2, y: 2, width: 20, height: 20, rx: 2 }),
                    React.createElement('path', { d: "M12 8v8" }),
                    React.createElement('path', { d: "M8 12h8" })
                );
            }
        });

        // C. Capture Framer Motion
        window.SafeMotion = window.Motion || { motion: 'div', AnimatePresence: ({children}) => children };
    </script>

    <!-- 6. APPLICATION LOGIC -->
    <script type="text/babel">
        // ------------------------------------------------------------------
        // A. REACT SETUP
        // ------------------------------------------------------------------
        const { 
            useState, useEffect, useRef, useMemo, useCallback, 
            useContext, useReducer, useLayoutEffect 
        } = React;
        const { createRoot } = ReactDOM;

        // ------------------------------------------------------------------
        // B. SMART IMAGE
        // ------------------------------------------------------------------
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

        // ------------------------------------------------------------------
        // C. INJECTED CODE
        // ------------------------------------------------------------------
        ${code
            // 1. SAFE ICONS: import { Map, Zap } -> const { Map, Zap } = window.SafeLucide;
            // Because 'SafeLucide' is a proxy, it will NEVER return undefined.
            .replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g, 'const { $1 } = window.SafeLucide;')
            
            // 2. SAFE FRAMER
            .replace(/import\s+\{([^}]+)\}\s+from\s+['"]framer-motion['"];?/g, 'const { $1 } = window.SafeMotion;')
            
            // 3. DELETE REACT IMPORTS
            .replace(/import\s+.*?from\s+['"]react['"];?/g, '')
            .replace(/import\s+.*?from\s+['"]react-dom.*?['"];?/g, '')

            // 4. CLEANUP
            .replace(/import\s+.*?from\s+['"].*?['"];?/g, '// import removed')
            .replace(/export default function App/, 'function App')
            .replace(/export default/, '') 
        }
        
        // ------------------------------------------------------------------
        // D. MOUNTING
        // ------------------------------------------------------------------
        const root = createRoot(document.getElementById('root'));
        
        let MainComponent = null;
        if (typeof App !== 'undefined') MainComponent = App;
        
        if (MainComponent) {
            try {
                root.render(<MainComponent />);
            } catch (e) {
                console.error("Runtime Render Error:", e);
                document.body.innerHTML = '<h2 style="color:red; padding:20px">Runtime Error</h2>';
            }
        } else {
            console.error("Mounting Error: 'App' component is undefined.");
            document.body.innerHTML = '<div style="color:white; background:#ef4444; padding:20px; font-family:sans-serif;"><h1>Render Error</h1><p>The App component could not be loaded.</p></div>';
        }
    </script>
</body>
</html>
`;

function saveSite(sessionId, rawCode) {
    const dir = path.join(sitesDir, sessionId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(path.join(dir, 'app.jsx'), rawCode);
    fs.writeFileSync(path.join(dir, 'index.html'), DEPLOY_WRAPPER(rawCode));
}

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

function deploySite(sessionId) {
    return new Promise((resolve, reject) => {
        const folderPath = path.join(sitesDir, sessionId);
        if (!fs.existsSync(folderPath)) return reject(new Error("Site not found"));
        if (!process.env.SURGE_TOKEN) return reject(new Error("Missing SURGE_TOKEN"));

        const randomName = 'wflow-' + Math.random().toString(36).substr(2, 6);
        const domain = `${randomName}.surge.sh`;
        
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

module.exports = { saveSite, createDownloadArchive, deploySite };