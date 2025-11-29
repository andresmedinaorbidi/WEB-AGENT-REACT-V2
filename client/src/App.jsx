import { useState } from 'react';
import axios from 'axios';
import { 
  Sparkles, Send, Globe, Loader2, Code, Zap, 
  LayoutTemplate, Layers, Settings, ChevronRight, Command 
} from 'lucide-react';

// Smart API URL switching
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteUrl, setSiteUrl] = useState(null);
  const [sessionId] = useState(() => 'wflow-' + Math.random().toString(36).substr(2, 9));
  const [deployUrl, setDeployUrl] = useState(null);

  const handleRequest = async (endpoint) => {
    if (!prompt) return;
    setLoading(true);
    try {
      const payload = endpoint === '/edit' ? { instruction: prompt, sessionId } : { prompt, sessionId };
      const res = await axios.post(API_URL + endpoint, payload);
      setSiteUrl(res.data.url);
      if (endpoint === '/edit') setPrompt('');
    } catch (e) { alert("Error: " + e.message); }
    setLoading(false);
  };

  const deploy = async () => {
    setLoading(true);
    try {
      const res = await axios.post(API_URL + '/deploy', { sessionId });
      setDeployUrl(res.data.url);
    } catch (e) { alert("Deploy failed"); }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-neon/30">
      
      {/* --- SIDEBAR (Control Center) --- */}
      <div className="w-80 flex flex-col border-r border-white/5 bg-[#0a0a0a] z-20 shadow-2xl">
        
        {/* Header / Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            {/* LOGO BOX: Now Green with Black Icon */}
            <div className="w-8 h-8 bg-neon rounded-lg flex items-center justify-center shadow-lg shadow-neon/20">
              <Zap size={18} className="text-black fill-current" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              wflow
            </h1>
          </div>
          <p className="text-xs text-neutral-500 font-medium ml-11">By Plinng</p>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 mb-6">
          <div className="flex gap-1 p-1 bg-neutral-900 rounded-xl border border-white/5">
            <button className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium bg-neutral-800 text-white rounded-lg shadow-sm">
              <LayoutTemplate size={14} /> Generator
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-neutral-500 hover:text-white transition-colors">
              <Layers size={14} /> History
            </button>
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="flex-1 px-4 flex flex-col gap-4 overflow-y-auto">
          
          <div className="glass-panel p-4 rounded-2xl relative group transition-all hover:border-neon/30">
            <div className="flex justify-between items-center mb-3">
              {/* LABEL: Now Green */}
              <label className="text-xs font-bold text-neon uppercase tracking-wider flex items-center gap-1">
                <Command size={10} />
                {siteUrl ? "Refine Design" : "New Project"}
              </label>
              {loading && <Loader2 size={14} className="animate-spin text-neutral-500" />}
            </div>
            
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleRequest(siteUrl ? '/edit' : '/create');
                }
              }}
              className="w-full h-32 bg-transparent border-none text-sm text-neutral-200 placeholder-neutral-600 focus:ring-0 resize-none leading-relaxed"
              placeholder={siteUrl ? "Example: Make the buttons rounder..." : "Describe a modern landing page for..."}
            />
            
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
              <span className="text-[10px] text-neutral-600">Enter to generate</span>
              
              {/* BUTTON: White by default, Green on Hover */}
              <button 
                onClick={() => handleRequest(siteUrl ? '/edit' : '/create')}
                disabled={loading || !prompt}
                className="bg-white text-black p-2 rounded-lg hover:bg-neon hover:text-black hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>

          {/* DEPLOY SECTION */}
          {siteUrl && (
            <div className="glass-panel p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 mb-3 text-neon">
                <Globe size={14} />
                <span className="text-xs font-bold uppercase tracking-wide">Deployment</span>
              </div>
              
              <button 
                onClick={deploy}
                disabled={loading}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-white/5 text-neutral-200 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 group"
              >
                Publish to Netlify
                <ChevronRight size={12} className="opacity-50 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {deployUrl && (
                <a 
                  href={deployUrl} 
                  target="_blank" 
                  className="mt-3 block text-center text-[10px] text-neutral-500 hover:text-neon truncate border-t border-white/5 pt-2 transition-colors"
                >
                  {deployUrl}
                </a>
              )}
            </div>
          )}

          {/* TIPS */}
          {!siteUrl && (
            <div className="mt-4 px-2">
              <p className="text-[10px] text-neutral-600 font-medium mb-2 uppercase tracking-widest">Pro Tips</p>
              <ul className="space-y-2">
                {["Describe the color palette", "Mention specific sections", "Ask for 'modern' or 'minimal'"].map((tip, i) => (
                  <li key={i} className="text-xs text-neutral-500 flex items-center gap-2">
                    <div className="w-1 h-1 bg-neutral-700 rounded-full" /> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-left transition-colors">
            {/* AVATAR: Green Gradient */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neon to-emerald-600" />
            <div className="flex-1">
              <p className="text-xs font-medium text-white">Guest User</p>
              <p className="text-[10px] text-neutral-500">Free Plan</p>
            </div>
            <Settings size={14} className="text-neutral-500" />
          </button>
        </div>
      </div>

      {/* --- PREVIEW AREA --- */}
      <div className="flex-1 bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-[#050505] to-[#050505] relative p-6 flex flex-col">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/50 backdrop-blur-md border border-white/5 rounded-full">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
            <div className="w-px h-3 bg-white/10 mx-1" />
            <span className="text-[10px] text-neutral-500 font-mono">preview.wflow.app</span>
          </div>
          
          <div className="flex gap-2">
             <button className="p-2 text-neutral-500 hover:text-white transition-colors bg-neutral-900/50 rounded-lg border border-white/5">
                <Code size={14} />
             </button>
          </div>
        </div>

        {/* Iframe Container */}
        <div className="flex-1 relative group">
          {/* GLOW EFFECT: Now Green */}
          <div className={`absolute -inset-0.5 bg-gradient-to-r from-neon to-emerald-600 rounded-2xl opacity-20 blur transition duration-1000 group-hover:duration-200 ${loading ? 'opacity-50 animate-pulse' : ''}`}></div>
          
          <div className="relative h-full w-full bg-white rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            {siteUrl ? (
              <iframe 
                src={siteUrl} 
                className="w-full h-full border-none"
                title="Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-[#080808] text-neutral-600 gap-6">
                <div className="w-24 h-24 rounded-full bg-neutral-900/50 border border-white/5 flex items-center justify-center animate-pulse">
                   <Sparkles size={32} className="text-neutral-700" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium text-neutral-300">Ready to build</h3>
                  <p className="text-sm text-neutral-600 max-w-xs mx-auto">
                    Enter a prompt in the sidebar to generate your first website using Gemini AI.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}