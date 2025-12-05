const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Safety check
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing from .env file!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- ARCHITECTURE STRATEGY ---
// 1. CREATIVE MODEL (The Architect): Uses the most powerful model for initial design.
const creativeModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" }); 
// Note: "gemini-3-pro-preview" is experimental. If it fails, use "gemini-1.5-pro".

// 2. FAST MODEL (The Intern): Uses the cheapest model for edits/tweaks.
const fastModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite", generationConfig: { responseMimeType: "application/json"} });

// --- MOCK DATA FOR TESTING (Type "TEST" in prompt) ---
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
             <div className="text-neutral-500">Image Placeholder</div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// 1. DEFINE VIBES (Hidden instructions)
const STYLES = {
    "Minimal": "Use a monochromatic palette, lots of whitespace, Helvetica/Inter fonts, subtle borders, no shadows.",
    "Neon": "Use a Cyberpunk aesthetic, black background, neon green/pink accents, glitch effects, tech-mono fonts.",
    "Corporate": "Use a trustworthy blue/gray palette, structured grids, clean cards, professional serif/sans-serif pairing.",
    "Brutalist": "Use raw outlines, high contrast, neo-brutalist shadows, bold typography, varying border thicknesses.",
    "Pastel": "Use a soft, airy palette (cream, mint, peach), rounded corners, playful layout, bubble-like elements."
};

const SYSTEM_PROMPT = `
You are a Senior React Developer & UI/UX Designer.

### DESIGN PERSONALITY:
- **Aesthetic:** High-End Editorial, "Awwwards" style, Bento Grids.
- **Visuals:** Visual-heavy. Use large background images and image grids.
- **Typography:** Bold, clean sans-serif fonts via Tailwind.

### CRITICAL TECHNICAL RULES:
1. **Images (CRITICAL):** 
   - Use **Pollinations AI** for real-time generated images.
   - **URL Format:** \`https://image.pollinations.ai/prompt/{DESCRIPTION}?width={width}&height={height}&nologo=true\`
   - Always URI-encode the description.

2. **Navigation:** Use React State (\`const [view, setView] = useState('home')\`), NOT <a> tags.
3. **Styling:** Use **Tailwind CSS** for everything.
4. **Icons:** Use **Raw SVGs** with Tailwind classes.
5. **Structure:** Export a single default component named \`App\`.

### OUTPUT FORMAT:
- Return raw JSX wrapped in a markdown block (\`\`\`jsx ... \`\`\`).
- Do NOT output JSON.
`;


// New architect prompt that talks to user and creates a brief

// ==========================================
//  PART 1: THE ARCHITECT (Server-Driven Logic)
// ==========================================

const ARCHITECT_PROMPT = `
You are a Data Extraction Engine.
Your ONLY job is to extract website requirements into a JSON object.

### FIELDS TO EXTRACT:
1. **name** (Business Name)
2. **industry** (Niche/Category)
3. **audience** (Target Customers)
4. **vibe** (Design Aesthetic - encourage adjectives + colors)
5. **sections** (Pages requested - e.g., Home, About, Contact)
6. **context** (Specific details, history, constraints, or unique value props)
7. **reference** (URL provided)

### INPUT DATA SOURCE:
1. **Current Brief:** Data we already have.
2. **User Message:** The user's latest chat.
3. **System Injection:** (Optional) Analyzed text from a reference URL.

### 🧠 PARSING LOGIC (THE PRIORITY CHAIN):

**PRIORITY 1: USER SPEECH (Highest - The Boss)**
- If the user explicitly says "Change name to X" or "Make it pink", this OVERRIDES everything.
- If the user mentions multiple things (e.g., "A Bakery for kids"), fill multiple fields.
- If the user shares a story (e.g., "Founded in 1990"), put it in **context**.

**PRIORITY 2: SYSTEM INJECTION (Medium - The Researcher)**
- *Trigger:* Only if the message contains "\`--- START OF SYSTEM INJECTION ---\`".
- **Action:** You MUST use this data to fill **AS MANY FIELDS AS POSSIBLE** immediately.
  - **Name:** Extract from 'SOURCE TITLE' or 'H1'.
  - **Industry:** Infer from the content description.
  - **Sections:** Look for navigation keywords (Home, About, Contact, Pricing, Menu) in the content snippet.
  - **Vibe:** Infer from the writing style (e.g., Professional vs. Playful, Luxury vs. Budget).
  - **Context:** Summarize the unique value prop (e.g. "Uses organic flour"). **DO NOT** dump the raw text block here.

**PRIORITY 3: PRESERVATION (Lowest - The Memory)**
- If the User says nothing new about a field, and there is no new Reference, KEEP the value from the **Current Brief**.

### 🚫 OUTPUT RULES:
1. **JSON ONLY.** No chatter.
2. Do NOT dump raw HTML or huge text blocks into 'context'. Summarize facts only.

### JSON FORMAT:
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
    console.log("🔹 [Architect] Incoming State:", JSON.stringify(currentBrief));

    const chat = fastModel.startChat({
        history: [
            { role: "user", parts: [{ text: ARCHITECT_PROMPT }] }
            // Note: We don't need full chat history for the extraction task, 
            // just the current state and the new message. This reduces confusion.
        ]
    });

    const messageWithContext = `
    CURRENT BRIEF: ${JSON.stringify(currentBrief)}
    USER MESSAGE: "${userMessage}"
    `;

    try {
        const result = await chat.sendMessage(messageWithContext);
        const responseText = result.response.text();
        const aiOutput = JSON.parse(responseText);

        // 1. SAFE MERGE (Ensure we have all 7 keys)
        // We force the structure so the code below never crashes
        const safeBrief = {
            name: aiOutput.brief?.name || currentBrief.name || null,
            industry: aiOutput.brief?.industry || currentBrief.industry || null,
            audience: aiOutput.brief?.audience || currentBrief.audience || null,
            vibe: aiOutput.brief?.vibe || currentBrief.vibe || null,
            sections: aiOutput.brief?.sections || currentBrief.sections || null,
            context: aiOutput.brief?.context || currentBrief.context || null,
            reference: aiOutput.brief?.reference || currentBrief.reference || null,
        };

        console.log("🔸 [Architect] Extracted Data:", JSON.stringify(safeBrief));

        // 2. SERVER-SIDE LOGIC (The "Manager")
        // The code decides the next move, not the AI.
        
        let nextReply = "";
        let isComplete = false;

        // CHECK SEQUENCE
        if (!safeBrief.industry) {
            nextReply = "¡Hola! Soy Teo. Para empezar, ¿a qué industria pertenece tu proyecto (ej: Restaurante, Portafolio)?";
        } else if (!safeBrief.name) {
            nextReply = `Entendido, un proyecto de ${safeBrief.industry}. ¿Cuál es el nombre de la marca?`;
        } else if (!safeBrief.audience) {
            nextReply = `Genial, ${safeBrief.name}. ¿A qué público objetivo nos dirigimos?`;
        } else if (!safeBrief.vibe) {
            nextReply = "¿Qué estilo visual o 'vibe' buscas? (ej: Minimalista, Cyberpunk, Elegante)";
        } else if (!safeBrief.sections) {
            nextReply = "¿Qué secciones necesitas? (ej: Inicio, Servicios, Contacto)";
        } else {
            // ALL FILLED
            isComplete = true;
            nextReply = "¡Perfecto! He creado el plan. Revísalo aquí abajo para comenzar la construcción.";
        }

        return {
            reply: nextReply,
            brief: safeBrief,
            is_complete: isComplete,
            action: isComplete ? "CHAT" : "CHAT" // UI handles the build button
        };

    } catch (error) {
        console.error("Architect Error:", error);
        return { 
            reply: "No te entendí bien. ¿Podrías repetirlo?", 
            brief: currentBrief, 
            is_complete: false,
            action: "CHAT"
        };
    }
}

// END OF ARCHITECT FUNCTION


// --- HELPER FUNCTION (This was missing!) ---
function cleanAndExtractCode(text) {
    try {
        let code = text.trim();
        
        // 1. Markdown Strategy
        const markdownMatch = text.match(/```(?:jsx|javascript|js|tsx)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
            return { code: markdownMatch[1].trim() };
        }
        
        // 2. JSON Strategy (Fallback)
        if (code.startsWith("{") && code.endsWith("}")) {
            try {
                const parsed = JSON.parse(code);
                if (parsed.code) return { code: parsed.code };
            } catch (e) {}
        }
        
        // 3. Raw Code Strategy
        if (text.includes("function App") || text.includes("export default")) {
            return { code: text.replace(/^json\s*/, "").replace(/^code\s*/, "").trim() };
        }
        
        throw new Error("No code block found");
    } catch (e) {
        console.error("Extraction Error:", text.substring(0, 100) + "...");
        throw new Error("Failed to extract code");
    }
}

// --- agent.js ---

async function generateWebsite(userPrompt, style = "Modern") {
    // ⚡ MOCK TRAP
    if (userPrompt.trim() === "TEST") {
        console.log("⚡ MOCK MODE: Skipping Gemini API...");
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        return { code: MOCK_SITE };
    }

    const vibe = style || "Modern";

    // --- THE NEW "CONTEXT-AWARE" PROMPT ---
    const finalPrompt = `
    **TASK:** Create a complete, multi-page website based on the structured Brief below.

    **THE BRIEF:**
    ${userPrompt}

    **1. 🏗️ DYNAMIC ARCHITECTURE (Sections):**
    - Analyze the **"Sections"** requested in the Brief (e.g., "Menu, Booking, Contact").
    - **Rule:** You MUST create a view/page for EVERY section listed. 
    - Do not just make generic "Home/About/Services". If they asked for "Portfolio" or "Pricing", build those specific views.
    - Use \`const [view, setView] = useState('Home')\` to handle navigation.

    **2. 🔗 REFERENCE WEBSITE ANALYSIS (Important):**
    - Look for "REFERENCE SITE DATA" in the Brief above.
    - If present, analyze the text content, headings, and description extracted from that URL.
    - **Mimic the writing style** found in that data.
    - **Mimic the structure** (e.g., if they have a 'Features' section in the extracted text, include it).

    **3. ✍️ COPYWRITING & TONE (Audience-Driven):**
    - Analyze the **"Audience"** and **"Industry"** fields.
    - **Rule:** Adapt the writing style (Microcopy, Headlines, CTAs) to match this specific audience.
    - **CRITICAL:** Check the **"Context"** field. If the user provided specific details (e.g., "Founded in 1990", "We sell organic cookies"), you MUST weave these facts into the generated text.
    - *Scenario A:* If Audience is "Gen Z skaters", use slang, lowercase, edgy tone.
    - *Scenario B:* If Audience is "Medical Professionals", use precise, formal, trustworthy tone.
    - *Scenario C:* If Audience is "Children", use simple words and enthusiastic tone.
    
    **4. 🎨 PROCEDURAL STYLING (Vibe-Driven):**
    - The user wants a **"${vibe}"** aesthetic.
    - Interpret this vibe into a custom Tailwind Design System (Colors, Fonts, Spacing, Border Radius).
    - **Images:** Generate Pollinations AI images that strictly match the Industry + Vibe.

    **REQUIREMENTS:**
    - Export a single component \`App\`.
    - Use **Raw SVGs** for icons (do not assume lucide-react is installed).
    - Ensure the site feels complete, not like a template.
    `;

    try {
        const chat = creativeModel.startChat({
            history: [{ role: "user", parts: [{ text: SYSTEM_PROMPT }] }]
        });
        
        console.log(`Agent: Generating for "${vibe}" with Dynamic Copy...`);
        const result = await chat.sendMessage(finalPrompt);
        return cleanAndExtractCode(result.response.text());
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
        let edited = MOCK_SITE.replace('MOCK MODE', 'EDITED MODE');
        edited = edited.replace(/#beff50/g, '#a855f7');
        return { code: edited };
    }

    try {
        // Use fastModel here
        // We modify the prompt slightly to emphasize keeping the existing structure
        const chat = fastModel.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: `\`\`\`jsx\n${currentCode}\n\`\`\`` }] }
            ]
        });
        
        console.log("Agent: Editing with Fast Model (Flash)...");
        const result = await chat.sendMessage(`
        You are an intelligent code editor.
        Refactor the code above based on this instruction: "${instruction}"
        
        RULES:
        1. Keep the existing design consistency.
        2. Only change what is asked.
        3. Return the FULL updated file.
        `);
        
        const text = result.response.text();
        return cleanAndExtractCode(text);
    } catch (error) {
        console.error("Gemini Edit Error:", error);
        throw error;
    }
}

module.exports = { generateWebsite, editWebsite, chatWithArchitect };