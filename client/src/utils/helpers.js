// client/src/utils/helpers.js

export const extractUrl = (text) => {
    if (!text) return null;

    // Regex Breakdown:
    // 1. (https?:\/\/[^\s]+)       -> Matches http://site.com
    // 2. (www\.[^\s]+)             -> Matches www.site.com
    // 3. ([a-zA-Z0-9-]+\.[a-z]{2,}[^\s]*) -> Matches site.com, app.io (naked domains)
    const match = text.match(/(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-z]{2,}[^\s]*)/i);
    
    if (!match) return null;
    
    let url = match[0];

    // Cleanup: Remove trailing punctuation often typed by users (e.g., "Check google.com.")
    url = url.replace(/[.,!?;:]$/, '');
    
    // Auto-fix: If it's missing the protocol (http/https), add it.
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }
    
    return url;
};