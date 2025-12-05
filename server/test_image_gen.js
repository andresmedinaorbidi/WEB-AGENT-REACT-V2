const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testGenerators() {
    console.log("🧪 STARTING IMAGE GENERATION TESTS...\n");

    // --- TEST 1: GEMINI 2.0 FLASH IMAGE GEN (generateContent) ---
    console.log("1️⃣ Testing: gemini-2.0-flash-exp-image-generation");
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${API_KEY}`;
        
        // Note: WE REMOVED 'generationConfig'. We let the model decide to return an image.
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Generate a photorealistic image of a futuristic neon city." }] }]
        });

        const part = response.data.candidates?.[0]?.content?.parts?.[0];
        
        if (part && part.inlineData) {
            console.log("   ✅ SUCCESS! Received Base64 Image Data.");
            console.log("   👉 USE THIS MODEL IN AGENT.JS");
            return; // Stop here if this works
        } else {
            console.log("   ❌ FAILED. Response was text only:", JSON.stringify(part));
        }
    } catch (error) {
        console.log("   ❌ ERROR:", error.response?.data?.error?.message || error.message);
    }

    console.log("\n--------------------------------------------------\n");

    // --- TEST 2: IMAGEN 4.0 FAST (predict) ---
    console.log("2️⃣ Testing: imagen-4.0-fast-generate-001");
    try {
        // Note: Trying 'v1beta' first. If this fails, try changing URL to 'v1alpha'
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${API_KEY}`;
        
        const response = await axios.post(url, {
            instances: [{ prompt: "A futuristic neon city" }],
            parameters: { sampleCount: 1, aspectRatio: "16:9" }
        });

        if (response.data.predictions && response.data.predictions[0]) {
            console.log("   ✅ SUCCESS! Received Prediction Data.");
            console.log("   👉 USE THIS MODEL IN AGENT.JS");
        } else {
            console.log("   ❌ FAILED. No predictions.");
        }
    } catch (error) {
        console.log("   ❌ ERROR:", error.response?.data?.error?.message || error.message);
    }
}

testGenerators();