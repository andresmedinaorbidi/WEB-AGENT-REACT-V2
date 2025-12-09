// 1. Custom Theme to match your UI
export const wflowTheme = {
  colors: {
    surface1: '#ffffff',
    surface2: '#f9fafb',
    surface3: '#e5e7eb',
    clickable: '#808080',
    base: '#323232',
    disabled: '#C5C5C5',
    hover: '#4D4D4D',
    accent: '#60259f',
    error: '#ef4444',
    errorSurface: '#ffeceb',
  },
  syntax: {
    keyword: '#60259f',
    property: '#60259f',
    plain: '#111827',
    static: '#ab05f0',
    string: '#16a34a',
    definition: '#60259f',
    tag: '#84cc16',
  },
  font: {
    body: 'Inter, sans-serif',
    mono: 'Fira Code, monospace',
    size: '13px',
    lineHeight: '20px',
  },
};

// 2. The Hidden SmartImage Component
export const SMART_IMAGE_CODE = `
import React, { useState, useEffect } from 'react';

export default function SmartImage({ src, alt, className, ...props }) {
  const [status, setStatus] = useState('loading'); 
  const [objectUrl, setObjectUrl] = useState('');

  // 🧠 INJECTED URL (Placeholder)
  // If this still says "__BACKEND_URL__", the replacement failed in App.jsx
  const BACKEND_BASE = "__BACKEND_URL__";

  useEffect(() => {
    if (!src) return;
    let isMounted = true;
    
    // Construct target URL
    let targetUrl = src;
    if (src.startsWith('/api')) {
       // Strip trailing slash if base has one
       const base = BACKEND_BASE.endsWith('/') ? BACKEND_BASE.slice(0, -1) : BACKEND_BASE;
       targetUrl = base + src;
    }

    // DEBUG: Print to Sandpack Console
    // console.log("[SmartImage] Target:", targetUrl); 

    const fetchImage = async () => {
        try {
            setStatus('loading');
            
            // Fetch as Blob
            const response = await fetch(targetUrl);
            if (!response.ok) throw new Error("HTTP " + response.status);
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            if (isMounted) {
                setObjectUrl(url);
                setStatus('loaded');
            }
        } catch (err) {
            console.error("[SmartImage] Failed:", err);
            if (isMounted) {
                setObjectUrl('https://placehold.co/600x400/1f2937/666?text=Image+Unavailable');
                setStatus('error');
            }
        }
    };

    fetchImage();

    return () => {
        isMounted = false;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return (
    <div className={\`relative overflow-hidden bg-gray-900 \${className || ''}\`}>
      <style>{\`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .shimmer::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); animation: shimmer 1.5s infinite; }
      \`}</style>
      
      {status === 'loading' && (
        <div className="absolute inset-0 z-20 bg-gray-800 shimmer flex items-center justify-center">
             <span className="text-[10px] text-gray-400 font-mono animate-pulse tracking-widest">GENERATING...</span>
        </div>
      )}
      
      {objectUrl && (
          <img 
            src={objectUrl} 
            alt={alt}
            className={\`block w-full h-full object-cover transition-opacity duration-700 \${status === 'loaded' ? 'opacity-100' : 'opacity-0'}\`}
            {...props}
          />
      )}
    </div>
  );
}
`;