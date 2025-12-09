// server/utils/codeCleaner.js

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

function fixImageTags(code) {
    let fixed = code;

    // 1. Replace <img> with <SmartImage>
    if (fixed.includes('<img')) {
        fixed = fixed.replace(/<img([\s\S]*?)\/?>/gi, (match, attributes) => {
            let cleanAttrs = attributes.trim();
            if (cleanAttrs.endsWith('/')) cleanAttrs = cleanAttrs.slice(0, -1);
            return `<SmartImage ${cleanAttrs} />`;
        });
    }

    // 2. Inject Import if missing
    // We only add the import if it's not already there
    if (fixed.includes('<SmartImage') && !/import\s+.*?SmartImage/.test(fixed)) {
        const firstImportIdx = fixed.indexOf('import');
        if (firstImportIdx !== -1) {
            const endOfLine = fixed.indexOf('\n', firstImportIdx);
            const part1 = fixed.slice(0, endOfLine + 1);
            const part2 = fixed.slice(endOfLine + 1);
            fixed = part1 + "import SmartImage from './SmartImage';\n" + part2;
        } else {
            fixed = "import SmartImage from './SmartImage';\n" + fixed;
        }
    }

    // 3. [NEW] REMOVE INLINE DEFINITIONS (The Fix)
    // If the AI defined 'const SmartImage = ...' or 'function SmartImage', we remove it
    // because it clashes with the import we injected/requested.
    
    // Pattern: Matches "const SmartImage = ... };" or "function SmartImage ... }"
    // We use a non-greedy match that looks for the closing bracket/semicolon of the component
    const duplicateDefRegex = /(?:\/\/[^\n]*\n)?(?:const|function)\s+SmartImage\s*=?\s*(\([^)]*\)|props)\s*=>?\s*{[\s\S]*?return\s*\([\s\S]*?};\s*/g;
    
    if (duplicateDefRegex.test(fixed)) {
        // console.log("⚠️ Removing duplicate SmartImage definition...");
        fixed = fixed.replace(duplicateDefRegex, '');
    }

    return fixed;
}

module.exports = { cleanAndExtractCode, fixImageTags };