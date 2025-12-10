import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles } from 'lucide-react';
// 1. IMPORT THE HELPER
import { extractUrl } from '../../utils/helpers';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// --- PROCESSING SCREEN (Con efecto Shimmer Diagonal Suave + Pulse) ---
const ProcessingScreen = ({ initialPrompt, onAnalysisComplete }) => {
  const [status, setStatus] = useState('Inicializando motores...');
  
  useEffect(() => {
    const processPrompt = async () => {
        try {
            // 1. URL Analysis (Robust Logic)
            setStatus('Detectando referencias...');
            let scrapedContext = "";

            // 2. USE HELPER instead of manual regex
            const foundUrl = extractUrl(initialPrompt);
            
            if (foundUrl) {
                setStatus(`Analizando estructura de ${new URL(foundUrl).hostname}...`);
                try {
                    const scrapeRes = await axios.post(`${API_URL}/analyze`, { url: foundUrl });
                    scrapedContext = `
                    --- START OF SYSTEM INJECTION ---
                    SOURCE: ${foundUrl}
                    ${scrapeRes.data.rawData}
                    INSTRUCTION: Use data above to fill brief fields.
                    --- END OF SYSTEM INJECTION ---
                    `;
                } catch (e) {
                    console.error("Scrape failed", e);
                }
            }

            // 2. Architect Call
            setStatus('Teo está organizando tus ideas...');
            const res = await axios.post(`${API_URL}/chat`, { 
                history: [], 
                message: initialPrompt + scrapedContext, 
                currentBrief: {} 
            });

            const { reply, brief, is_complete } = res.data;

            // 3. Finalizing
            setStatus('Generando blueprint...');
            setTimeout(() => {
                onAnalysisComplete({
                    initialResponse: reply,
                    extractedBrief: brief,
                    isComplete: is_complete
                });
            }, 2500); 

        } catch (error) {
            console.error(error);
            onAnalysisComplete({
                initialResponse: "Hubo un error de conexión, pero podemos continuar.",
                extractedBrief: {},
                isComplete: false
            });
        }
    };

    processPrompt();
  }, [initialPrompt]);

  return (
    <div className="h-[100dvh] w-full bg-[#f8f9fc] flex flex-col items-center justify-center relative overflow-hidden font-sans text-gray-900">
      
      {/* DEFINICIÓN DE ANIMACIONES CSS */}
      <style>{`
        /* 1. Shimmer Diagonal */
        @keyframes text-shimmer-angled {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        /* 2. Respiración (Pulse) Sutil */
        @keyframes soft-breathe {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.02); opacity: 1; }
        }

        .animate-shimmer-slow {
          background-size: 300% auto; /* Aumentamos tamaño para suavizar bordes */
          animation: text-shimmer-angled 4s linear infinite; /* Mucho más lento (8s) */
        }

        .animate-breathe {
          animation: soft-breathe 4s ease-in-out infinite; /* Respiración orgánica */
        }
      `}</style>

      <div className="w-full max-w-4xl px-6 relative z-10 flex flex-col items-center text-center">
        
        {/* Animated Icon */}
        <div className="relative mb-12 animate-breathe">
            <div className="absolute inset-0 bg-[#beff50] blur-3xl opacity-40 animate-pulse rounded-full"></div>
            <div className="relative w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-gray-100">
                <Sparkles size={40} className="text-[#60259f]" />
            </div>
        </div>

        {/* 
            USER PROMPT MEJORADO 
            - animate-shimmer-slow: Mueve el gradiente diagonalmente.
            - animate-breathe: Hace que todo el bloque de texto pulse suavemente.
        */}
        <div className="mb-12 relative w-full animate-breathe">
             <h2 
                className="text-3xl md:text-5xl font-bold leading-tight bg-clip-text text-transparent animate-shimmer-slow pb-3"
                style={{
                  // Gradiente Diagonal (110deg)
                  // Separación amplia (35% -> 65%) para que no sea una línea dura
                  backgroundImage: 'linear-gradient(110deg, #111827 35%, #beff50 48%, #60259f 52%, #111827 65%)'
                }}
             >
                "{initialPrompt.length > 80 ? initialPrompt.substring(0, 80) + '...' : initialPrompt}"
             </h2>
             
             {/* Línea decorativa inferior */}
             <div className="h-1 w-24 bg-gradient-to-r from-[#beff50] to-[#60259f] rounded-full mx-auto mt-8 opacity-50"></div>
        </div>

        {/* Status Text */}
        <p className="text-sm font-mono text-[#60259f] uppercase tracking-widest animate-pulse font-bold">
            {status}
        </p>

      </div>
    </div>
  );
};

export default ProcessingScreen;