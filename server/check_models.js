const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function checkAccountAndModels() {
    if (!API_KEY) {
        console.error("❌ No API Key found in .env");
        return;
    }

    console.log("🔑 Checking API Key permissions and Model Capabilities...\n");

    try {
        // 1. FETCH ALL MODELS
        const response = await axios.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
        );

        const models = response.data.models;
        const imageGenCandidates = [];

        console.log("---------------------------------------------------------------");
        console.log(`| ${"MODEL NAME".padEnd(45)} | ${"SUPPORTED METHODS"} |`);
        console.log("---------------------------------------------------------------");

        models.forEach(m => {
            const name = m.name.replace('models/', '');
            const methods = m.supportedGenerationMethods.join(', ');
            
            // Highlight potential image generation models
            if (name.includes('image') || name.includes('imagen') || methods.includes('predict')) {
                console.log(`| \x1b[32m${name.padEnd(45)}\x1b[0m | \x1b[33m${methods}\x1b[0m |`); // Green & Yellow
                imageGenCandidates.push(m);
            } else {
                console.log(`| ${name.padEnd(45)} | ${methods} |`);
            }
        });
        console.log("---------------------------------------------------------------\n");

        // 2. CHECK FOR 'PREDICT' CAPABILITY
        // The error you got suggests we need a model that supports 'predict', NOT 'generateContent'
        const predictModels = imageGenCandidates.filter(m => m.supportedGenerationMethods.includes('predict'));
        
        if (predictModels.length > 0) {
            console.log(`✅ FOUND ${predictModels.length} MODELS SUPPORTING 'predict' (Required for Image Gen):`);
            predictModels.forEach(m => console.log(`   - ${m.name}`));
            
            // 3. PROBE TEST (Check if we actually have access)
            console.log("\n🧪 RUNNING PROBE TEST on 'imagen-4.0-fast-generate-001 '...");
            try {
                // Try a dummy request to see if we get 403/404 or actual processing
                // We use a safe prompt
                const targetModel = "imagen-4.0-fast-generate-001 "; 
                await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:predict?key=${API_KEY}`,
                    {
                        instances: [{ prompt: "Test" }],
                        parameters: { sampleCount: 1 }
                    }
                );
                console.log(`\x1b[32m✅ SUCCESS! Your API Key has FULL ACCESS to ${targetModel}.\x1b[0m`);
                console.log("👉 You can use the 'generateImage' function using the ':predict' endpoint.");
            } catch (err) {
                if (err.response) {
                    if (err.response.status === 404) {
                        console.log(`❌ FAILED: Model found in list, but endpoint returned 404.`);
                        console.log("   Reason: Use 'generateContent' endpoint instead? or Model is deprecated.");
                    } else if (err.response.status === 403) {
                        console.log(`❌ FAILED: 403 Forbidden.`);
                        console.log("   Reason: Your API Key is likely Free Tier or lacks Billing enabled for this specific feature.");
                    } else if (err.response.status === 400) {
                        console.log(`⚠️ RECEIVED 400 (Bad Request).`);
                        console.log("   This is actually GOOD NEWS. It means the endpoint exists and accepts the key, we just sent bad data.");
                        console.log("   Error details:", err.response.data.error.message);
                    } else {
                        console.log(`❌ ERROR ${err.response.status}:`, err.response.data.error.message);
                    }
                }
            }

        } else {
            console.log("❌ NO MODELS support the 'predict' method.");
            console.log("   This usually means your API Key is strictly for Chat/Text (Free Tier).");
        }

    } catch (error) {
        console.error("CRITICAL ERROR:", error.message);
    }
}

checkAccountAndModels();