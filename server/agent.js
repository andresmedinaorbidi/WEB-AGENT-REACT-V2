const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Debug: Check if key is loaded
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing from .env file!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

// A static, instant website for testing purposes
const MOCK_SITE = `
export default function App() {
  const [count, setCount] = React.useState(0);
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-full max-w-2xl text-center space-y-8">
        <div className="inline-block p-4 rounded-full bg-[#beff50]/10 border border-[#beff50]/20 mb-4">
           <svg className="w-12 h-12 text-[#beff50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        </div>
        <h1 className="text-5xl font-bold tracking-tighter">
          <span className="text-[#beff50]">MOCK MODE</span> ACTIVE
        </h1>
        <p className="text-neutral-400 text-lg">
          This is a static response. No AI credits were used.
          Use this to test the UI flow, History, and Deployment.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-neutral-900 border border-white/10">
            <h3 className="text-xl font-bold mb-2">Interactive Test</h3>
            <button 
              onClick={() => setCount(c => c + 1)}
              className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:scale-105 transition-transform"
            >
              Count: {count}
            </button>
          </div>
          <div className="p-6 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center">
             <img src="https://placehold.co/600x400/111/FFF?text=Image+Test" className="rounded-lg opacity-50 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
}
`;

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
    // ⚡ MOCK TRAP: If prompt is "TEST", return static code instantly
    if (userPrompt.trim() === "TEST") {
        console.log("⚡ MOCK MODE: Skipping Gemini API...");
        // Return a fake delay to simulate loading UI (optional)
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        return { code: MOCK_SITE };
    }

    try {
        const chat = model.startChat({
            history: [{ role: "user", parts: [{ text: SYSTEM_PROMPT }] }]
        });
        
        console.log("Agent: Sending prompt...");
        const result = await chat.sendMessage(`Create a website for: ${userPrompt}`);
        const text = result.response.text();
        
        console.log("Agent: Parsing response...");
        return cleanAndExtractCode(text);
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

async function editWebsite(currentCode, instruction) {
    // ⚡ MOCK TRAP FOR EDIT
    if (instruction.trim() === "TEST") {
        console.log("⚡ MOCK EDIT: Skipping Gemini API...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // VISUALLY CHANGE THE MOCK SITE TO PROVE IT UPDATED
        // We change "MOCK MODE" to "EDITED MODE" and change colors to Purple
        let edited = MOCK_SITE.replace('MOCK MODE', 'EDITED MODE');
        edited = edited.replace(/#beff50/g, '#a855f7'); // Change Green to Purple
        
        return { code: edited };
    }

    try {
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: `\`\`\`jsx\n${currentCode}\n\`\`\`` }] }
            ]
        });
        
        console.log("Agent: Sending edit...");
        const result = await chat.sendMessage(`Edit this code. Instruction: ${instruction}`);
        const text = result.response.text();
        
        return cleanAndExtractCode(text);
    } catch (error) {
        console.error("Gemini Edit Error:", error);
        throw error;
    }
}

module.exports = { generateWebsite, editWebsite };