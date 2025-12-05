import { useEffect } from 'react';
import { Zap } from 'lucide-react';

const BootScreen = ({ onComplete }) => {
    useEffect(() => { const timer = setTimeout(onComplete, 3500); return () => clearTimeout(timer); }, []);
    return (
        <div className="h-[100dvh] w-full bg-[#f8f9fc] flex flex-col items-center justify-center relative overflow-hidden font-sans text-gray-900">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#60259f]/5 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#beff50]/20 blur-[120px] animate-pulse delay-1000"></div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-12"><div className="absolute inset-0 bg-[#beff50] blur-3xl opacity-40 animate-pulse rounded-full"></div><div className="relative w-24 h-24 bg-[#beff50] rounded-3xl flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(190,255,80,0.5)] animate-bounce"><Zap size={48} className="text-black fill-current" /></div></div>
                <div className="w-64 h-2 bg-gray-200/80 rounded-full overflow-hidden shadow-inner backdrop-blur-sm"><div className="h-full bg-[#60259f] animate-[width_3s_ease-in-out_forwards]" style={{ width: '0%' }}></div></div>
                <div className="mt-8 font-medium text-sm text-gray-400 space-y-2 text-center font-mono tracking-tight"><p className="animate-[fadeIn_0.5s_ease-out_0.5s_forwards] opacity-0 flex items-center justify-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Initializing Plinng Cloud...</p><p className="animate-[fadeIn_0.5s_ease-out_1.5s_forwards] opacity-0 flex items-center justify-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#60259f]"></span> Syncing with Teo AI...</p><p className="animate-[fadeIn_0.5s_ease-out_2.5s_forwards] opacity-0 text-[#60259f] font-bold tracking-widest uppercase text-xs pt-2">System Ready</p></div>
            </div>
        </div>
    );
};

export default BootScreen;
