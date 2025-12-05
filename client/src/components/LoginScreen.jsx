import { useState } from 'react';
import { Loader2, Zap, ArrowRight } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => { onLogin(email || 'Guest'); }, 1500);
    };

    return (
        <div className="h-[100dvh] w-full bg-[#f8f9fc] flex items-center justify-center p-6 relative overflow-hidden font-sans text-gray-900">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#60259f]/5 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#beff50]/20 blur-[120px] animate-pulse delay-1000"></div>
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-700">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#beff50] rounded-2xl shadow-[0_10px_30px_-10px_rgba(190,255,80,0.5)] mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-500 cursor-pointer"><Zap size={32} className="text-black fill-current" /></div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900">plinng<span className="text-[#60259f]">.flow</span></h1>
                    <p className="text-gray-500 font-medium">Crea tu página web en menos de 5 minutos</p>
                </div>
                <div className="p-8 rounded-3xl border border-white/40 bg-white/60 backdrop-blur-2xl shadow-2xl shadow-gray-200/50">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div><label className="text-[10px] font-bold text-[#60259f] uppercase tracking-widest ml-1 mb-2 block">Tu correo</label><input type="email" placeholder="miempresa@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/50 border border-gray-200/80 rounded-xl px-4 py-3.5 text-gray-900 focus:border-[#60259f] focus:ring-4 focus:ring-[#60259f]/5 outline-none transition-all placeholder-gray-400 font-medium" required /></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Tu contraseña</label><input type="password" placeholder="••••••••" className="w-full bg-white/50 border border-gray-200/80 rounded-xl px-4 py-3.5 text-gray-900 focus:border-[#60259f] focus:ring-4 focus:ring-[#60259f]/5 outline-none transition-all placeholder-gray-400 font-medium" /></div>
                        <button type="submit" disabled={loading} className="w-full py-4 bg-[#beff50] hover:bg-[#b0ef40] text-black font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-[#beff50]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-4">{loading ? <Loader2 className="animate-spin" /> : <>Empieza ahora <ArrowRight size={16} /></>}</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
