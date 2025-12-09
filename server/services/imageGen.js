const axios = require('axios');
require('dotenv').config();

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

module.exports = { generateImage };