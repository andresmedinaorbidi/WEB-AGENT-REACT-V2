const axios = require('axios');
const cheerio = require('cheerio');

// 1. ANALYZE (Semantic Scraper)
async function analyzeUrl(url) {
    try {
        console.log(`🔍 Analyzing URL: ${url}`);

        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        const $ = cheerio.load(response.data);
        
        // Cleanup
        $('script, style, svg, noscript, iframe, footer').remove();

        // Semantic Extraction
        const title = $('title').text().trim();
        const desc = $('meta[name="description"]').attr('content') || '';
        
        // Guess Offerings from Nav/Lists
        const offerings = [];
        $('nav a, li, h3').each((i, el) => {
            const t = $(el).text().trim();
            if (t.length > 3 && t.length < 30 && !offerings.includes(t)) offerings.push(t);
        });
        
        // Guess Vibe from classes
        const htmlStr = $.html();
        let vibe = "Neutral";
        if (htmlStr.includes('font-serif')) vibe += ", Serif/Classic";
        if (htmlStr.includes('dark') || htmlStr.includes('bg-black')) vibe += ", Dark Mode";
        if (htmlStr.includes('tracking-tighter')) vibe += ", Modern/Tight";

        const bodyText = $('p').map((i, el) => {
            const t = $(el).text().trim();
            return t.length > 60 ? t : null;
        }).get().slice(0, 6).join('\n\n');

        const rawData = `
        [RESEARCH_SUMMARY]
        - **Source:** ${title}
        - **Intro:** ${desc}
        - **Detected Offerings:** ${offerings.slice(0, 15).join(', ')}
        - **Implied Vibe:** ${vibe}
        - **Content Snippets:** ${bodyText}
        `;

        // 🔍 LOGGING THE SCRAPE RESULT
        console.log("\n🟪 [SCRAPER OUTPUT]:");
        console.log(rawData);
        console.log("--------------------------------------------------\n");

        return rawData;

    } catch (error) {
        console.error("Scrape Error:", error.message);
        return `(Could not scrape ${url}: ${error.message})`;
    }
};

module.exports = { analyzeUrl };