const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
require('dotenv').config();

if (!process.env.GEMINI_API_KEY) console.error("❌ ERROR: GEMINI_API_KEY is missing!");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const creativeModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" }); 
const fastModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ============================================================
//  PART 1: THE ARCHITECT (Negotiator)
// ============================================================

const ARCHITECT_PROMPT = `
You are a Senior Product Manager defining a website brief.
Your goal is **SYNTHESIS**: Create a cohesive plan by negotiating between User Intent and Research Data.

### INPUTS:
1. **User Message:** Explicit instructions.
2. **Current Brief:** Known facts.
3. **Research Data:** (Optional) Scraped insights [RESEARCH_SUMMARY].

### 🧠 NEGOTIATION LOGIC:
1. **CONFLICT RESOLUTION:**
   - If User says "Blue" but Research says "Red" -> **USER WINS**.
   - If User is vague ("Make a site") but Research is specific -> **RESEARCH WINS**.

2. **FIELD FILLING:**
   - **Context:** COMBINE User's story with "Content Snippets" from Research.
   - **Sections:** If undefined, infer from "Detected Offerings" (e.g., if offerings are "Burgers", sections = "Hero, Menu, Location").
   - **Vibe:** If undefined, use "Implied Vibe" from Research.

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
        const result = await chat.sendMessage(messageWithContext);
        const text = result.response.text();
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiOutput = JSON.parse(cleanText);

        // 🔧 FIX: Robust Cleaner
        // This handles Strings, Arrays, and Nulls without crashing
        const clean = (val) => {
            if (!val) return null;
            if (Array.isArray(val)) return val.join(', '); // Convert ["A","B"] to "A, B"
            if (typeof val !== 'string') return String(val); // Convert numbers to string
            
            // Check for placeholder words
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

        let nextReply = "";
        let isComplete = false;

        if (!safeBrief.industry) nextReply = "What industry or niche is this for?";
        else if (!safeBrief.name) nextReply = `Got it, a ${safeBrief.industry} project. What is the name?`;
        else if (!safeBrief.vibe) nextReply = "What is the visual vibe? (e.g. Minimal, Colorful, Corporate)";
        else if (!safeBrief.sections) nextReply = "Any specific sections needed? (e.g. Services, Pricing)";
        else {
            isComplete = true;
            nextReply = "Perfect. I have a plan. Check the brief below and let's build.";
        }

        return { reply: nextReply, brief: safeBrief, is_complete: isComplete, action: isComplete ? "BUILD" : "CHAT" };

    } catch (error) {
        console.error("Architect Error:", error);
        // Fallback to prevent app freeze
        return { reply: "I'm thinking... could you say that again?", brief: currentBrief, is_complete: false };
    }
}

// ============================================================
//  PART 2: THE BUILDER (Strict SmartImage)
// ============================================================

async function generateWebsite(userPrompt, style = "Modern") {
    
    // PROCEDURAL LAYOUT
    const LAYOUT_ALGORITHM = `
    **PROCEDURAL LAYOUT ENGINE:**
    Maximize engagement by creating a "High-Depth" scrolling experience.
    
    **STEP 1: Archetype Detection:**
    - **E-Commerce/Food:** Menu Grids, Featured Items, Mood Images, Location.
    - **SaaS/Tech:** Feature Grids (Bento), Interactive Demos, Trust Logos, Pricing.
    - **Portfolio:** Masonry Galleries, Case Studies, Services.
    - **Corporate:** "Why Us", Process Steps, Testimonials, FAQ.

    **STEP 2: Section Stack (Mandatory 6-8 Sections):**
    Compose each  page using **6 to 8 distinct vertical sections**. 
    *Do not output a short page.*
    `;

    const finalPrompt = `
    **TASK:** Create a complete, multi-page website based on the structured Brief below.
    
    **THE BRIEF:**
    ${userPrompt}

    ${LAYOUT_ALGORITHM}

    **TECHNICAL ENVIRONMENT (Sandpack):**
    - **Imports:** You MUST use standard ES imports.
      - \`import React, { useState, useEffect } from 'react';\`
      - \`import { Zap, Menu, X, ArrowRight } from 'lucide-react';\`
      - \`import { motion, AnimatePresence } from 'framer-motion';\`
      - \`import SmartImage from './SmartImage';\`  <-- CRITICAL IMPORT
    
    **🔴 CRITICAL IMAGE RULES (STRICT):**
    1. You MUST use the \`<SmartImage />\` component for ALL images.
    2. **DO NOT USE THE STANDARD \`<img>\` TAG. EVER.**
    3. **Syntax:** \`<SmartImage src="/api/image?prompt=URI_ENCODED_PROMPT" alt="..." className="..." />\`
    4. **Source:** Always use the local API \`/api/image?prompt=...\`. Do not use placeholders or external URLs.
    
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
    - The user wants a **"${style}"** aesthetic.
    - Interpret this vibe into a custom Tailwind Design System (Colors, Fonts, Spacing, Border Radius).

    **STYLING:**
    - Tailwind CSS. Use generous padding (py-24).
    - Vibe: ${style}
    - \`export default function App() { ... }\`
    `;

    try {
        const chat = creativeModel.startChat({ history: [] });
        console.log(`Agent: Building Sandpack Site (${style})...`);
        const result = await chat.sendMessage(finalPrompt);
        return cleanAndExtractCode(result.response.text());
    } catch (error) {
        console.error("Builder Error:", error);
        throw error;
    }
}

async function editWebsite(currentCode, instruction) {
    const EDIT_SYSTEM_PROMPT = `
    You are a React Expert in a Sandpack environment.
    - Imports: lucide-react, framer-motion, ./SmartImage are available.
    - RULE: ALWAYS return the FULL file content. No placeholders.
    - REMINDER: Use <SmartImage />, never <img>.
    `;

    try {
        const chat = fastModel.startChat({
            history: [
                { role: "user", parts: [{ text: EDIT_SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "Ready for code." }] },
                { role: "user", parts: [{ text: `CODE:\n\`\`\`jsx\n${currentCode}\n\`\`\`` }] }
            ]
        });
        const result = await chat.sendMessage(`Refactor based on: "${instruction}". Return FULL code.`);
        return cleanAndExtractCode(result.response.text());
    } catch (e) { throw e; }
}

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

async function generateImage(prompt) {
     const API_KEY = process.env.GEMINI_API_KEY;
     const MODEL_NAME = "imagen-4.0-generate-preview-06-06";
     try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:predict?key=${API_KEY}`;
        const response = await axios.post(url, {
            instances: [{ prompt: prompt }],
            parameters: { sampleCount: 1, aspectRatio: "16:9" }
        });
        const base64Data = response.data.predictions[0].bytesBase64Encoded;
        return Buffer.from(base64Data, "base64");
     } catch (e) {
         console.error("Imagen Error:", e.message);
         // Return 1x1 transparent pixel on error
         return Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
     }
}

module.exports = { generateWebsite, editWebsite, chatWithArchitect, generateImage };