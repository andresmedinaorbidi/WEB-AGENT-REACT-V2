// server/services/architect.js
const { fastModel } = require('../config/ai');

// ============================================================
//  PART 1: THE ARCHITECT (Smart Data Extractor)
// ============================================================

const ARCHITECT_PROMPT = `
You are a Data Extraction Engine.
Your goal is to fill the brief based on User Input and Research Data.

### 🧠 INTELLIGENCE RULES:
1. **INFER IF OBVIOUS:** If the user says "Coffee Shop", you MAY infer { "industry": "Coffee", "sections": "Home, Menu, Location" }.
2. **USE RESEARCH:** If [RESEARCH_SUMMARY] is present, use it to fill missing fields (Name, Vibe, Context).
3. **DO NOT HALLUCINATE:** If you truly don't know the Name or Vibe, leave it null.

### OUTPUT JSON:
{
  "brief": {
    "name": "...", 
    "industry": "...", 
    "audience": "...", 
    "vibe": "...", 
    "sections": "...", 
    "context": "...", 
    "reference": "..." 
  }
}
`;

async function chatWithArchitect(history, userMessage, currentBrief = {}) {
    const chat = fastModel.startChat({
        history: [{ role: "user", parts: [{ text: ARCHITECT_PROMPT }] }]
    });

    const messageWithContext = `
    CURRENT BRIEF: ${JSON.stringify(currentBrief)}
    USER MESSAGE: "${userMessage}"
    `;

    try {
        // 🔍 LOGGING INPUT (Check this to see Scraper Injection!)
        console.log("\n🟦 [ARCHITECT INPUT (What the AI sees)]:");
        console.log(messageWithContext);
        console.log("--------------------------------------------------\n");

        const result = await chat.sendMessage(messageWithContext);
        const text = result.response.text();
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiOutput = JSON.parse(cleanText);

        // 🔍 DEBUG LOGGING (X-RAY)
        console.log("\n🟦 [ARCHITECT OUTPUT]:");
        console.log(JSON.stringify(aiOutput, null, 2));
        console.log("--------------------------------------------------\n");

        const clean = (val) => {
            if (!val) return null;
            if (Array.isArray(val)) return val.join(', ');
            if (typeof val !== 'string') return String(val);
            const lower = val.toLowerCase().trim();
            if (['null', 'unknown', 'tbd', 'n/a', 'undefined'].includes(lower)) return null;
            return val;
        };

        const safeBrief = {
            name: clean(aiOutput.brief?.name) || currentBrief.name,
            industry: clean(aiOutput.brief?.industry) || currentBrief.industry,
            audience: clean(aiOutput.brief?.audience) || currentBrief.audience,
            vibe: clean(aiOutput.brief?.vibe) || currentBrief.vibe,
            sections: clean(aiOutput.brief?.sections) || currentBrief.sections,
            context: clean(aiOutput.brief?.context) || currentBrief.context,
            reference: clean(aiOutput.brief?.reference) || currentBrief.reference,
        };

        // Decision Logic
        let nextReply = "";
        let isComplete = false;

        if (!safeBrief.industry) nextReply = "What industry is this for?";
        else if (!safeBrief.name) nextReply = "What is the name of the project?";
        // We are lenient with Vibe/Sections. If missing, we let the user proceed anyway if they want.
        else {
            isComplete = true;
            nextReply = "I have drafted a plan based on our conversation. Please review the brief below, edit if needed, and click Build.";
        }

        // 🛑 CRITICAL CHANGE: 
        // We NEVER return "BUILD". We only return "REVIEW".
        // This forces the frontend to stop and show the card.
        return { 
            reply: nextReply, 
            brief: safeBrief, 
            is_complete: isComplete, 
            action: "REVIEW" // <--- The AI cannot force a build anymore.
        };

    } catch (error) {
        console.error("Architect Error:", error);
        return { reply: "Could you repeat that?", brief: currentBrief, is_complete: false };
    }
}

module.exports = { chatWithArchitect };