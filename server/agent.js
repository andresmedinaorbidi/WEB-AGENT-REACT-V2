const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Debug: Check if key is loaded
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing from .env file!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

const SYSTEM_PROMPT = `
You are an expert React Developer.
Your goal is to generate a SINGLE-FILE React component using Tailwind CSS.

### TECHNICAL RULES:
1. Output JSON ONLY. Format: { "code": "..." }
2. Do NOT write import statements.
3. Component name must be "App".
4. **ICONS:** Do NOT use external icon libraries (like Lucide or React-Icons). 
   - Use standard Emojis (e.g., 🚀, 🍔) for simplicity.
   - OR use raw <svg> tags with Tailwind classes for professional icons.
5. NO Markdown blocks. Just raw JSON.
`;

// HELPER: Extract JSON from messy AI output
function parseGeminiOutput(text) {
    try {
        // 1. Try simple parse
        return JSON.parse(text);
    } catch (e) {
        // 2. If that fails, extract everything between the first { and last }
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');
        
        if (firstOpen !== -1 && lastClose !== -1) {
            const jsonString = text.substring(firstOpen, lastClose + 1);
            try {
                return JSON.parse(jsonString);
            } catch (innerE) {
                console.error("JSON Parse Failed on string:", jsonString);
                throw new Error("AI generated invalid JSON");
            }
        }
        throw new Error("No JSON found in AI response");
    }
}

async function generateWebsite(userPrompt) {
    try {
        const chat = model.startChat({
            history: [{ role: "user", parts: [{ text: SYSTEM_PROMPT }] }]
        });
        
        console.log("Agent: Sending prompt to Gemini...");
        const result = await chat.sendMessage(`Create a website for: ${userPrompt}`);
        const text = result.response.text();
        
        console.log("Agent: Received response. Parsing...");
        return parseGeminiOutput(text);
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

async function editWebsite(currentCode, instruction) {
    try {
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: JSON.stringify({ code: currentCode }) }] }
            ]
        });
        
        console.log("Agent: Sending edit instruction...");
        const result = await chat.sendMessage(`Edit this code. Instruction: ${instruction}`);
        const text = result.response.text();
        
        return parseGeminiOutput(text);
    } catch (error) {
        console.error("Gemini Edit Error:", error);
        throw error;
    }
}

module.exports = { generateWebsite, editWebsite };