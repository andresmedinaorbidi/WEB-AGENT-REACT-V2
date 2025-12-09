const scraper = require('../services/scraper');
const architect = require('../services/architect');
const builder = require('../services/builder');
const imageGen = require('../services/imageGen');
const siteManager = require('../services/siteManager');

// 1. ANALYZE ROUTE
exports.handleAnalyze = async (req, res) => {
    try {
        const { url } = req.body;
        const rawData = await scraper.analyzeUrl(url);
        res.json({ rawData });
    } catch (error) {
        res.status(500).json({ error: "Analysis failed" });
    }
};

// 2. CHAT ROUTE (The Architect)
exports.handleChat = async (req, res) => {
    try {
        const { history, message, currentBrief } = req.body;
        const result = await architect.chatWithArchitect(history || [], message, currentBrief);
        res.json(result);
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Chat failed" });
    }
};

// 3. CREATE ROUTE (The Builder)
exports.handleCreate = async (req, res) => {
    try {
        const { prompt, sessionId, style } = req.body;

        // 🚨 MOCK TRAP (Kept from original code for testing)
        if (prompt && (prompt.includes("DEPLOY_TEST") || prompt.includes("test:deploy"))) {
            return res.json({ code: "// Test Mode Code Already Injected by Frontend" });
        }

        console.log("Gemini generating...");
        const result = await builder.generateWebsite(prompt, style);
        
        // Save to disk immediately
        siteManager.saveSite(sessionId, result.code);
        
        res.json({ code: result.code });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Generation failed" });
    }
};

// 4. EDIT ROUTE
exports.handleEdit = async (req, res) => {
    try {
        const { instruction, sessionId } = req.body;
        // In a real app, we might read the current code from disk first,
        // but for now, the frontend sends the history or we rely on the builder to know context.
        // *Correction based on original code:* The original code read from disk.
        // Let's rely on the frontend passing context or just read the file if needed.
        // For simplicity based on your original flow:
        
        const fs = require('fs');
        const path = require('path');
        const dir = path.join(__dirname, '../sites', sessionId); // Reconstruct path safely
        
        let currentCode = "";
        if (fs.existsSync(path.join(dir, 'app.jsx'))) {
             currentCode = fs.readFileSync(path.join(dir, 'app.jsx'), 'utf-8');
        } else {
             return res.status(404).json({ error: "Session not found" });
        }

        console.log("Gemini editing...");
        const result = await builder.editWebsite(currentCode, instruction);
        
        siteManager.saveSite(sessionId, result.code);
        res.json({ code: result.code });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Edit failed" });
    }
};

// 5. RESTORE ROUTE
exports.handleRestore = async (req, res) => {
    try {
        const { sessionId, code } = req.body;
        siteManager.saveSite(sessionId, code);
        res.json({ code });
    } catch (error) {
        res.status(500).json({ error: "Restore failed" });
    }
};

// 6. DEPLOY ROUTE (Surge)
exports.handleDeploy = async (req, res) => {
    try {
        const { sessionId } = req.body;
        console.log(`🚀 Preparing deploy for session: ${sessionId}...`);
        
        const url = await siteManager.deploySite(sessionId);
        
        console.log("✅ Deploy Success:", url);
        res.json({ url });
    } catch (error) {
        console.error("❌ Deploy Controller Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// 7. DOWNLOAD ROUTE
exports.handleDownload = (req, res) => {
    try {
        const { sessionId } = req.params;
        const zipBuffer = siteManager.createDownloadArchive(sessionId);
        
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename=wflow-${sessionId}.zip`);
        res.send(zipBuffer);
    } catch (error) {
        console.error("Download Error:", error.message);
        res.status(404).send("Session not found or error zipping.");
    }
};

// 8. IMAGE ROUTE (With In-Memory Cache)
// Global cache for the lifetime of the process
const imageCache = {}; 

exports.handleImage = async (req, res) => {
    const prompt = req.query.prompt;
    if (!prompt) return res.status(400).send("Prompt required");
    
    const cacheKey = prompt.toLowerCase().trim();
    
    // Check Cache
    if (imageCache[cacheKey]) {
        res.set('Content-Type', 'image/png');
        return res.send(imageCache[cacheKey]);
    }

    try {
        const imageBuffer = await imageGen.generateImage(prompt);
        
        // Save to Cache
        imageCache[cacheKey] = imageBuffer;
        
        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        // Fallback Redirect
        res.redirect(`https://placehold.co/600x400/000/FFF?text=Image+Error`);
    }
};