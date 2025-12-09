import React, { useState, useEffect, useRef } from 'react';
import { Zap, Sparkles, Loader2, CheckCircle2, Circle } from 'lucide-react';

// --- HOLO UI COMPONENTS ---

const BriefRow = ({ label, value }) => {
  const [animating, setAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    // Trigger animation ONLY if value changes and is not empty
    if (value && value !== prevValue.current) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 1000); // 1s matches CSS animation
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div className={`relative p-3 rounded-xl transition-all duration-500 border border-transparent ${value ? 'bg-white/50 border-white/60' : 'opacity-50'}`}>
      {/* Shimmer Overlay */}
      {animating && <div className="absolute inset-0 rounded-xl field-shimmer pointer-events-none" />}
      
      <div className="flex items-center gap-2 mb-1">
         {value ? <CheckCircle2 size={14} className="text-[#60259f]" /> : <Circle size={14} className="text-gray-400" />}
         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-sm font-medium pl-6 transition-colors ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
        {value || 'Pending...'}
      </p>
    </div>
  );
};

const HoloBriefCard = ({ brief, isComplete, onBuild, loading }) => {
  return (
    <div className="w-full relative group">
       {/* Rotating Gradient Border Effect */}
       {isComplete && <div className="holo-gradient-border absolute inset-0 rounded-3xl" />}
       
       <div className={`relative w-full rounded-3xl p-6 transition-all duration-500 ${isComplete ? 'bg-white/90 m-[2px]' : 'holo-card'}`}>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#beff50] to-[#60259f] p-[2px]">
                 <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                   <Zap size={18} className="text-[#60259f] fill-current" />
                 </div>
               </div>
               <div>
                 <h3 className="font-bold text-gray-900 leading-tight">Project Brief</h3>
                 <p className="text-[10px] text-gray-500 font-mono">LIVE MEMORY</p>
               </div>
             </div>
             {isComplete && <span className="px-2 py-1 bg-[#beff50] text-[#4a1d7a] text-[10px] font-bold rounded-full animate-pulse">READY</span>}
          </div>

          {/* Fields */}
          <div className="space-y-3 mb-6">
             <BriefRow label="Industry" value={brief.industry} />
             <BriefRow label="Name" value={brief.name} />
             <BriefRow label="Vibe" value={brief.vibe} />
             <BriefRow label="Sections" value={brief.sections} />
             {brief.context && <BriefRow label="Context" value={brief.context.length > 50 ? brief.context.substring(0,50)+'...' : brief.context} />}
          </div>

          {/* Action Area */}
          <div className={`transition-all duration-700 overflow-hidden ${isComplete ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
             <button 
                onClick={onBuild} 
                disabled={loading}
                className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
             >
                {loading ? <Loader2 className="animate-spin" size={18}/> : <><Sparkles size={18} /> Generate Website</>}
             </button>
             <p className="text-center text-[10px] text-gray-400 mt-2">Click to confirm & build</p>
          </div>
          
          {!isComplete && (
            <div className="text-center pt-2 border-t border-gray-100/50">
               <p className="text-[10px] text-gray-400 animate-pulse">Teo is gathering requirements...</p>
            </div>
          )}
       </div>
    </div>
  );
};

export default HoloBriefCard;