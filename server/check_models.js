const axios = require('axios');
require('dotenv').config();

const key = process.env.GEMINI_API_KEY;

if (!key) {
    console.error("❌ Error: No API Key found in .env");
    process.exit(1);
}

console.log("Checking available models for your key...");

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

axios.get(url)
    .then(res => {
        console.log("\n✅ SUCCESS! You have access to these models:");
        console.log("---------------------------------------------");
        // Filter for models that support 'generateContent'
        const chatModels = res.data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        
        chatModels.forEach(m => {
            // We strip 'models/' from the name so you can copy-paste it
            console.log(`"${m.name.replace('models/', '')}"`);
        });
        console.log("---------------------------------------------\n");
        console.log("👉 Please copy one of the names above into your agent.js file.");
    })
    .catch(err => {
        console.error("\n❌ CONNECTION FAILED:");
        if (err.response) {
            console.error(`Status: ${err.response.status}`);
            console.error("Reason:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
    });