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
const fastModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

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

const ARCHITECT_PROMPT = `
You are **Aria**, the Senior Design Architect at wflow. 
You are not a robot; you are a creative partner. 

### YOUR PERSONALITY:
- **Tone:** Enthusiastic, Professional, Insightful, and Warm.
- **Style:** Think "Apple Genius" meets "High-End Interior Designer."
- **Behavior:** Don't just ask questions like a form. **React** to what the user says.
  - *User:* "I want a pizza shop."
  - *Bad Bot:* "What is the name?"
  - *Good Aria:* "Ooh, I love a good slice. 🍕 What are we calling this pizza place? Is it a fancy Italian spot or a late-night grab-and-go?"

### YOUR GOAL:
Gather these 5 key details to build the perfect website brief, but do it conversationally:
1. **Business Name**
2. **Industry/Niche**
3. **Target Audience**
4. **Design Vibe** (e.g., Cyberpunk, Minimal, Luxury)
5. **Key Sections** needed.

### RULES:
1. **One thing at a time:** Keep messages short (under 2 sentences). Chatting should feel fast.
2. **Be helpful:** If the user is stuck, suggest ideas.
3. **The Finale:** Once you have all 5 points, summarize it enthusiastically ("This sounds amazing. Here is the plan:...") and ask "Shall we build it?".
4. **The Trigger:** If they say "Yes" or "Go ahead" AFTER the summary, output the JSON signal.

### OUTPUT FORMAT:
- Normally: Plain text (Markdown allowed).
- ONLY on confirmation:
  {
    "action": "BUILD",
    "brief": "..."
  }
`;

async function chatWithArchitect(history, userMessage) {
    const chat = fastModel.startChat({
        history: [
            { role: "user", parts: [{ text: ARCHITECT_PROMPT }] },
            ...history // Inject previous conversation context
        ]
    });

    try {
        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();
        
        // Check if the Agent wants to build
        if (responseText.includes('"action": "BUILD"')) {
            try {
                // Extract JSON from the response
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.error("Architect JSON parse error");
            }
        }
        
        // Otherwise, just return the text reply
        return { action: "CHAT", reply: responseText };
    } catch (error) {
        console.error("Architect Error:", error);
        return { action: "CHAT", reply: "I lost my train of thought. Could you repeat that?" };
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

async function generateWebsite(userPrompt, style = "Minimal") {
    // ⚡ MOCK TRAP
    if (userPrompt.trim() === "TEST") {
        console.log("⚡ MOCK MODE: Skipping Gemini API...");
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        return { code: MOCK_SITE };
    }

    const styleInstruction = STYLES[style] || STYLES["Minimal"];

    // WE COMBINE THE RULES + USER INPUT + STYLE HERE
    const finalPrompt = `
    **TASK:** Create a complete, multi-page website for: "${userPrompt}"
    
    **DESIGN STYLE:** ${style}
    **STYLE RULES:** ${styleInstruction}
    
    **REQUIREMENTS:**
    - Build the 'home', 'services', 'about', and 'contact' views as requested.
    - Ensure the images strictly relate to: "${userPrompt}".
    `;

    try {
        // Use creativeModel here
        const chat = creativeModel.startChat({
            history: [{ role: "user", parts: [{ text: SYSTEM_PROMPT }] }]
        });
        
        console.log("Agent: Sending prompt...");
        const result = await chat.sendMessage(`Create a website for: ${userPrompt}`);
        const text = result.response.text();
        
        console.log("Agent: Parsing response...");
        // This function exists now!
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