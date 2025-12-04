const fs = require('fs');
const path = require('path');

const SITES_DIR = path.join(__dirname, '../sites');
if (!fs.existsSync(SITES_DIR)) fs.mkdirSync(SITES_DIR, { recursive: true });

// --- FIXED CLEANER FUNCTION ---
function cleanReactCode(code) {
    let clean = code;

    // 1. Remove Markdown & Imports
    clean = clean.replace(/```jsx/g, '').replace(/```/g, '');
    clean = clean.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
    
    // 2. Remove HTML Wrappers (Inception Fix)
    clean = clean.replace(/<!DOCTYPE html>/gi, '').replace(/<html.*?>/gi, '').replace(/<\/html>/gi, '');
    clean = clean.replace(/<head>[\s\S]*?<\/head>/gi, '').replace(/<body.*?>/gi, '').replace(/<\/body>/gi, '');

    // 3. Handle "export default function App" -> "function App"
    if (clean.includes("export default function App")) {
        clean = clean.replace("export default function App", "function App");
        return clean;
    }

    // 4. Handle "export default App;" at the bottom
    // FIX: If App is already defined above, we just delete this line.
    // We don't want "const App = App;" (That causes the crash)
    if (clean.match(/export\s+default\s+App;?/)) {
        clean = clean.replace(/export\s+default\s+App;?/g, '');
        return clean;
    }

    // 5. Handle "export default function Name" (Renaming case)
    const funcMatch = clean.match(/export\s+default\s+function\s+(\w+)/);
    if (funcMatch && funcMatch[1]) {
        const name = funcMatch[1];
        clean = clean.replace(/export\s+default\s+function/, 'function');
        clean += `\nconst App = ${name};`; // Alias it to App
        return clean;
    }

    // 6. Fallback: "export default () =>"
    clean = clean.replace(/export\s+default\s+/, 'const App = ');
    
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
    <style>html{scroll-behavior:smooth}::-webkit-scrollbar{width:0;background:transparent}#root:empty::before{content:'Loading...';display:flex;height:100vh;justify-content:center;align-items:center;color:#888}</style>
    <script>document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){e.target.src='https://placehold.co/600x400/1a1a1a/666?text=Image+Unavailable';}},true);</script>
</head>
<body class="bg-white text-black"><div id="root"></div><script type="text/babel">try{const{useState,useEffect,useRef}=React;${code};const root=ReactDOM.createRoot(document.getElementById('root'));root.render(<App/>);}catch(err){document.body.innerHTML='<div style="color:red;padding:20px;">Runtime Error: '+err.message+'</div>';}</script></body></html>`;

function saveSite(sessionId, rawCode) {
    const dir = path.join(SITES_DIR, sessionId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'app.jsx'), rawCode);
    fs.writeFileSync(path.join(dir, 'index.html'), HTML_WRAPPER(cleanReactCode(rawCode)));
}

function getSiteCode(sessionId) {
    const filePath = path.join(SITES_DIR, sessionId, 'app.jsx');
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
}

function getSitePath(sessionId) {
    return path.join(SITES_DIR, sessionId);
}

module.exports = { saveSite, getSiteCode, getSitePath, SITES_DIR };