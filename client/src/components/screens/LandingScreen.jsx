import React, { useState } from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import teoImage from '../../assets/teo.avif'; // Adjust path if needed

// --- LANDING SCREEN (Input Inicial) ---
const LandingScreen = ({ onStart }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onStart(input);
  };

  return (
    <div className="h-[100dvh] w-full bg-[#f8f9fc] flex items-center justify-center p-6 relative overflow-hidden font-sans text-gray-900">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#60259f]/5 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#beff50]/20 blur-[120px] animate-pulse delay-1000"></div>
      
      <div className="w-full max-w-2xl z-10 animate-in fade-in zoom-in duration-700 flex flex-col items-center">
        
        {/* Logo / Brand */}
        <div className="mb-10 text-center">
             <div className="inline-flex items-center justify-center w-16 h-16 bg-[#beff50] rounded-2xl shadow-[0_10px_30px_-10px_rgba(190,255,80,0.5)] mb-6 transform -rotate-3"><Zap size={32} className="text-black fill-current" /></div>
             <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-gray-900">plinng<span className="text-[#60259f]">.wflow</span></h1>
             <p className="text-xl text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
                Describe tu sitio web ideal y deja que 
                
                {/* INICIO DE LA CÁPSULA */}
                <span className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-2 py-1 mx-1.5 align-middle shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] -translate-y-[2px]">
                  <img 
                    src={teoImage} 
                    alt="Teo" 
                    className="w-5 h-5 rounded-full object-cover" 
                  />
                  <span className="text-[#60259f] font-bold text-xl pr-1">Teo</span>
                </span>
                {/* FIN DE LA CÁPSULA */}

                lo construya en segundos.
              </p>
        </div>

        {/* Hero Input */}
        <form onSubmit={handleSubmit} className="w-full relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#beff50] to-[#60259f] rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-200/50 p-2 flex items-center gap-2 border border-gray-100 focus-within:border-[#60259f]/30 transition-all">
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    placeholder="Ej: Una pizzería llamada Luigi's con estilo cyberpunk y delivery..."
                    className="flex-1 bg-transparent border-none text-lg px-4 py-4 focus:ring-0 outline-none placeholder-gray-300 min-h-[60px] max-h-[120px] resize-none text-gray-800 font-medium"
                    autoFocus
                />
                <button 
                    type="submit" 
                    disabled={!input.trim()}
                    className="h-14 w-14 rounded-xl bg-[#60259f] hover:bg-[#4c1d7a] text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:scale-95 shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95 shrink-0"
                >
                    <ArrowRight size={24} />
                </button>
            </div>
        </form>

        {/* Suggestions */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 opacity-60">
            {["Portafolio minimalista", "Landing page para SaaS", "Tienda de café vintage"].map(tag => (
                <button key={tag} onClick={() => setInput(tag)} className="px-4 py-2 bg-white rounded-full text-xs font-bold text-gray-500 border border-gray-200 hover:border-[#60259f] hover:text-[#60259f] transition-colors">
                    {tag}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LandingScreen;