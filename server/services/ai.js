const { GoogleGenerativeAI } = require("@google/generative-ai");
const { ARCHITECT_PROMPT, BUILDER_PROMPT, MOCK_SITE } = require("../config/prompts");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Models
const chatModel = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-lite",
    generationConfig: { responseMimeType: "application/json" }
});
const textModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
const codeModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

// Helper: Code Extractor
function cleanAndExtractCode(text) {
    try {
        let code = text.trim();
        const markdownMatch = text.match(/```(?:jsx|javascript|js|tsx)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) return { code: markdownMatch[1].trim() };
        if (code.startsWith("{")) { try { return { code: JSON.parse(code).code }; } catch(e){} }
        return { code: text.replace(/^json\s*/, "").replace(/^code\s*/, "").trim() };
    } catch (e) { throw new Error("Failed to extract code"); }
}

// --- LOGIC: ARCHITECT ---
async function generateTeoReply(missingField, currentBrief, userMessage) {
    // 1. FIRST MESSAGE EXCEPTION: If it's the start, we DO want "Hola"
    if (missingField === 'industry' && (!currentBrief.industry && !userMessage)) {
        return "¡Hola! Soy Teo, tu arquitecto de diseño. ¿Para qué tipo de negocio o proyecto vamos a crear un sitio hoy?";
    }

    // 2. ONGOING CONVERSATION: Forbid greetings
    const prompt = `
    You are **Teo** (Spain Spanish).
    We are in the **MIDDLE** of a conversation.
    
    ### CONTEXT:
    - User just said: "${userMessage}"
    - We need to know: **"${missingField}"**
    
    ### TASK:
    Ask for the missing field naturally. Connect it to what the user just said if possible.
    
    ### CRITICAL RULES:
    1. **NO GREETINGS:** Do NOT say "Hola", "Buenos días", or "Saludos".
    2. **NO ROBOTIC CONFIRMATIONS:** Do not say "Entendido" or "Anotado" every time.
    3. **BE CONCISE:** Max 1-2 sentences.
    4. **TONE:** Professional, warm, fluid.
    `;
    
    try {
        const result = await textModel.generateContent(prompt);
        return result.response.text();
    } catch (e) { return `¿Cuál es el ${missingField}?`; }
}

async function chatWithArchitect(history, userMessage, currentBrief = {}) {
    // 🔍 LOG INPUT
    console.log("----------------------------------------------");
    console.log("🔹 [Architect] User Said:", userMessage);
    console.log("🔹 [Architect] Current State:", JSON.stringify(currentBrief));

    const chat = chatModel.startChat({
        history: [{ role: "user", parts: [{ text: ARCHITECT_PROMPT }] }]
    });

    // We pass the Previous State + New Message to the Extractor
    const messageWithContext = `CURRENT BRIEF: ${JSON.stringify(currentBrief)}\nUSER MESSAGE: "${userMessage}"`;

    try {
        const result = await chat.sendMessage(messageWithContext);
        const aiOutput = JSON.parse(result.response.text());

        // 🔍 LOG AI OUTPUT
        console.log("🔸 [Architect] Extracted:", JSON.stringify(aiOutput.brief));

        // Safe Merge (Double protection against nulling)
        const safeBrief = {
            name: aiOutput.brief?.name || currentBrief.name || null,
            industry: aiOutput.brief?.industry || currentBrief.industry || null,
            audience: aiOutput.brief?.audience || currentBrief.audience || null,
            vibe: aiOutput.brief?.vibe || currentBrief.vibe || null,
            sections: aiOutput.brief?.sections || currentBrief.sections || null,
        };

        // Logic Check (The Manager)
        let missingField = null;
        if (!safeBrief.industry) missingField = 'industry';
        else if (!safeBrief.name) missingField = 'name';
        else if (!safeBrief.audience) missingField = 'audience';
        else if (!safeBrief.vibe) missingField = 'vibe';
        else if (!safeBrief.sections) missingField = 'sections';

        let nextReply = "";
        let isComplete = false;

        if (missingField) {
            console.log("🔸 [Architect] Missing Field:", missingField);
            nextReply = await generateTeoReply(missingField, safeBrief, userMessage);
        } else {
            console.log("✅ [Architect] Brief Complete!");
            isComplete = true;
            nextReply = "¡Fantástico! Tengo todo lo necesario para el plano. Revisa los detalles y confírmame para iniciar.";
        }

        return { reply: nextReply, brief: safeBrief, is_complete: isComplete, action: "CHAT" };
    } catch (error) {
        console.error("❌ [Architect] Error:", error);
        return { reply: "Hubo un error de conexión.", brief: currentBrief, is_complete: false };
    }
}

// --- LOGIC: BUILDER ---
async function generateWebsite(userPrompt, style = "Minimal") {
    if (userPrompt.trim() === "TEST") return { code: MOCK_SITE };

    const finalPrompt = `**TASK:** Create a website for: "${userPrompt}"\n**STYLE:** ${style}\n**REQ:** Build 'home', 'services', 'about', 'contact' views.`;
    
    const chat = codeModel.startChat({ history: [{ role: "user", parts: [{ text: BUILDER_PROMPT }] }] });
    const result = await chat.sendMessage(finalPrompt);
    return cleanAndExtractCode(result.response.text());
}

async function editWebsite(currentCode, instruction) {
    const chat = codeModel.startChat({
        history: [
            { role: "user", parts: [{ text: BUILDER_PROMPT }] },
            { role: "model", parts: [{ text: `\`\`\`jsx\n${currentCode}\n\`\`\`` }] }
        ]
    });
    const result = await chat.sendMessage(`Edit instruction: ${instruction}`);
    return cleanAndExtractCode(result.response.text());
}

module.exports = { chatWithArchitect, generateWebsite, editWebsite };