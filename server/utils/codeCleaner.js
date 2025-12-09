// 1. Helper to extract code from Markdown ```json or ```jsx blocks
function cleanAndExtractCode(text) {
    let clean = text.replace(/```(jsx|javascript|js|tsx)?/g, '').replace(/```/g, '').trim();
    if (clean.startsWith('{') && clean.includes('code":')) {
        try { clean = JSON.parse(clean).code; } catch(e){}
    }
    const firstImport = clean.indexOf('import');
    const firstFunc = clean.indexOf('function');
    const firstExport = clean.indexOf('export');
    let start = 0;
    if (firstImport > -1) start = firstImport;
    else if (firstExport > -1 && (firstExport < firstFunc || firstFunc === -1)) start = firstExport;
    else if (firstFunc > -1) start = firstFunc;
    
    if (start > 0) clean = clean.substring(start);
    return { code: clean };
}

// 🛡️ ROBUST AUTO-CORRECTOR
function fixImageTags(code) {
    let fixed = code;

    // 1. Replace <img> with <SmartImage>
    if (fixed.includes('<img')) {
        console.log("⚠️ Auto-correcting <img> tags to <SmartImage>...");
        fixed = fixed.replace(/<img([\s\S]*?)\/?>/gi, (match, attributes) => {
            let cleanAttrs = attributes.trim();
            // Remove closing slash if present to avoid double />
            if (cleanAttrs.endsWith('/')) cleanAttrs = cleanAttrs.slice(0, -1);
            return `<SmartImage ${cleanAttrs} />`;
        });
    }

    // 2. Helper to auto-fix <img> tags to <SmartImage>
    if (fixed.includes('<SmartImage') && !/import\s+.*?SmartImage/.test(fixed)) {
        console.log("⚠️ Injecting missing SmartImage import...");
        
        // Strategy: Insert AFTER the first import line to be safe
        const firstImportIdx = fixed.indexOf('import');
        
        if (firstImportIdx !== -1) {
            // Find the end of the first import line
            const endOfLine = fixed.indexOf('\n', firstImportIdx);
            const part1 = fixed.slice(0, endOfLine + 1); // keep the newline
            const part2 = fixed.slice(endOfLine + 1);
            
            fixed = part1 + "import SmartImage from './SmartImage';\n" + part2;
        } else {
            // No imports? Add to extremely top
            fixed = "import SmartImage from './SmartImage';\n" + fixed;
        }
    }

    return fixed;
}

module.exports = { cleanAndExtractCode, fixImageTags };