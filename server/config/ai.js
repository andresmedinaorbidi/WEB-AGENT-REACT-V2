const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MAX_CONFIG = {
    maxOutputTokens: 16384,
    temperature: 0.7, // Creative but stable
};

// Export the specific model configurations
const creativeModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" }); 
const fastModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: MAX_CONFIG });

module.exports = { creativeModel, fastModel };