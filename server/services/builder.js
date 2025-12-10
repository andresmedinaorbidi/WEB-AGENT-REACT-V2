const { creativeModel, fastModel } = require('../config/ai');
const { cleanAndExtractCode, fixImageTags } = require('../utils/codeCleaner');

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
    
    **🚨 CRITICAL STABILITY RULES (DO NOT IGNORE):**
    1. **NO COMPLEX THEME OBJECTS:** Do NOT create nested objects like \`const theme = { colors: { ... } }\`. 
       - Instead, use **Direct Tailwind Classes** directly in the className strings.
       - *Reason:* Complex objects often lead to "undefined" errors at runtime.
    2. You MUST use the \`<SmartImage />\` component for ALL images.
    3. **FORBIDDEN:** Do NOT use standard \`<img>\` tags.
    4. **Syntax:** \`<SmartImage src="/api/image?prompt=URI_ENCODED_PROMPT" alt="..." className="..." />\`
    5. **Source:** Always use the local API \`/api/image?prompt=...\`. Do not use placeholders or external URLs.
    
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
        
        // 🔍 DEBUG LOGGING (X-RAY)
        console.log("\n🟧 [BUILDER PROMPT]:");
        console.log(finalPrompt);
        console.log("--------------------------------------------------\n");
        console.log(`Agent: Building Sandpack Site (${style})...`);

        const result = await chat.sendMessage(finalPrompt);
        const rawResult = cleanAndExtractCode(result.response.text());
        return { code: fixImageTags(rawResult.code) };
    } catch (error) {
        console.error("Builder Error:", error);
        throw error;
    }
}

async function editWebsite(currentCode, instruction) {
    const EDIT_SYSTEM_PROMPT = `
    You are a React Expert in a Sandpack environment.
    1. **NO TRUNCATION:** You MUST return the ENTIRE file content, even if it is 1000 lines long. Do NOT stop halfway.
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

        // 🔍 LOGGING EDITOR ACTION
        console.log("\n🟧 [EDITOR INSTRUCTION]:");
        console.log(`User asked: "${instruction}"`);
        console.log(`Context: Editing file (Size: ${currentCode.length} chars)`);
        console.log("--------------------------------------------------\n");

        const result = await chat.sendMessage(`Refactor based on: "${instruction}". Return FULL code.`);
        return cleanAndExtractCode(result.response.text());
    } catch (e) { throw e; }
}

module.exports = { generateWebsite, editWebsite };