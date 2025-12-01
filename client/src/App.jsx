import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Sparkles, Send, Globe, Loader2, Code, Zap, 
  LayoutTemplate, Layers, Settings, ChevronRight, Command,
  Smartphone, Monitor, Tablet, Copy, Trash2, History, User,
  Download, Upload, LogOut, X, Eye, Edit3, Palette
} from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// --- LOGIN SCREEN ---
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { onLogin(email || 'Guest'); }, 1500);
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#beff50]/5 via-transparent to-transparent animate-pulse duration-[5000ms]"></div>
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#beff50] rounded-2xl shadow-[0_0_40px_rgba(190,255,80,0.2)] mb-6"><Zap size={32} className="text-black fill-current" /></div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">wflow</h1>
          <p className="text-neutral-500">By Plinng</p>
        </div>
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div><label className="text-xs font-bold text-[#beff50] uppercase tracking-wider ml-1 mb-2 block">Access ID</label><input type="email" placeholder="enter@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-700 focus:border-[#beff50] focus:ring-1 focus:ring-[#beff50] outline-none transition-all" required /></div>
            <div><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1 mb-2 block">Passkey</label><input type="password" placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-700 focus:border-[#beff50] focus:ring-1 focus:ring-[#beff50] outline-none transition-all" /></div>
            <button type="submit" disabled={loading} className="w-full py-4 bg-[#beff50] hover:bg-[#a8e640] text-black font-bold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-4">{loading ? <Loader2 className="animate-spin" /> : 'Initialize Workspace'}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- BOOT SCREEN ---
const BootScreen = ({ onComplete }) => {
  useEffect(() => { const timer = setTimeout(onComplete, 3000); return () => clearTimeout(timer); }, []);
  return (
    <div className="h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[#beff50]/5 animate-pulse"></div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative"><div className="absolute inset-0 bg-[#beff50] blur-2xl opacity-20 animate-ping"></div><Zap size={64} className="text-[#beff50] fill-current animate-bounce" /></div>
        <div className="mt-8 w-64 h-1 bg-neutral-900 rounded-full overflow-hidden"><div className="h-full bg-[#beff50] animate-[width_3s_ease-in-out_forwards]" style={{ width: '0%' }}></div></div>
        <div className="mt-4 font-mono text-xs text-[#beff50] space-y-1 text-center">
           <p className="animate-[fadeIn_0.5s_ease-out_0.5s_forwards] opacity-0">Loading Modules...</p>
           <p className="animate-[fadeIn_0.5s_ease-out_1.5s_forwards] opacity-0">Connecting to Neural Net...</p>
           <p className="animate-[fadeIn_0.5s_ease-out_2.5s_forwards] opacity-0">Welcome, Architect.</p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [appState, setAppState] = useState('login');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteUrl, setSiteUrl] = useState(null);
  const [rawCode, setRawCode] = useState('');
  const [sessionId] = useState(() => 'wflow-' + Math.random().toString(36).substr(2, 9));
  const [deployUrl, setDeployUrl] = useState(null);
  
  // UI States
  const [activeTab, setActiveTab] = useState('generator');
  const [mobileTab, setMobileTab] = useState('editor');
  const [previewWidth, setPreviewWidth] = useState('100%');
  const [viewMode, setViewMode] = useState('preview');
  const [history, setHistory] = useState([]);
  const [loadingText, setLoadingText] = useState('Initializing AI...');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [username, setUsername] = useState('Guest');
  
  // 🎨 STYLE STATE: Default to NULL (Optional)
  const [selectedStyle, setSelectedStyle] = useState(null); 
  const styles = ['Minimal', 'Neon', 'Corporate', 'Brutalist', 'Pastel'];

  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('wflow_history');
    const savedName = localStorage.getItem('wflow_username');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedName) setUsername(savedName);
  }, []);

  const handleLogin = (name) => { setUsername(name); localStorage.setItem('wflow_username', name); setAppState('boot'); };
  const handleNameChange = (e) => { setUsername(e.target.value); localStorage.setItem('wflow_username', e.target.value); };
  
  const exportData = () => {
    const dataStr = JSON.stringify({ username, history }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.download = `wflow-backup-${new Date().toISOString().slice(0,10)}.json`; link.href = url; document.body.appendChild(link); link.click(); document.body.removeChild(link); setShowAccountMenu(false);
  };
  
  const importData = (event) => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { try { const data = JSON.parse(e.target.result); if (data.history) { setHistory(data.history); localStorage.setItem('wflow_history', JSON.stringify(data.history)); } if (data.username) { setUsername(data.username); localStorage.setItem('wflow_username', data.username); } alert('Data restored successfully!'); setShowAccountMenu(false); } catch (err) { alert('Invalid backup file'); } }; reader.readAsText(file);
  };
  
  const factoryReset = () => { if (confirm('⚠️ Are you sure?')) { localStorage.clear(); window.location.reload(); } };
  
  const saveToHistory = (prompt, code) => { const newItem = { id: Date.now(), prompt: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''), fullPrompt: prompt, code: code, timestamp: new Date().toLocaleDateString() }; const newHistory = [newItem, ...history].slice(0, 20); setHistory(newHistory); localStorage.setItem('wflow_history', JSON.stringify(newHistory)); };
  
  const loadFromHistory = async (item) => { setLoading(true); setLoadingText('Restoring Session...'); setActiveTab('generator'); setMobileTab('preview'); setRawCode(item.code); setPrompt(item.fullPrompt); try { const res = await axios.post(`${API_URL}/restore`, { sessionId, code: item.code }); setSiteUrl(res.data.url); } catch (e) { alert("Could not restore session."); } setLoading(false); };
  
  const handleRequest = async (endpoint) => { 
    if (!prompt) return; 
    setLoading(true); 
    setLoadingText(endpoint === '/create' ? 'Architecting Layout...' : 'Refining Code...'); 
    const texts = ['Generating Components...', 'Applying Tailwind...', 'Optimizing Assets...', 'Finalizing Build...']; 
    let textIdx = 0; 
    const interval = setInterval(() => { setLoadingText(texts[textIdx % texts.length]); textIdx++; }, 2500); 
    try { 
      // Send selectedStyle only if it exists
      const payload = endpoint === '/edit' ? { instruction: prompt, sessionId } : { prompt, sessionId, style: selectedStyle || 'Minimal' }; 
      const res = await axios.post(API_URL + endpoint, payload); 
      clearInterval(interval); setSiteUrl(res.data.url); setRawCode(res.data.code); saveToHistory(prompt, res.data.code); 
      if (endpoint === '/edit') setPrompt(''); 
      setMobileTab('preview'); 
    } catch (e) { clearInterval(interval); alert("Error: " + e.message); } 
    setLoading(false); 
  };
  
  const deploy = async () => { setLoading(true); setLoadingText('Deploying to Surge.sh...'); try { const res = await axios.post(API_URL + '/deploy', { sessionId }); setDeployUrl(res.data.url); } catch (e) { alert("Deploy failed"); } setLoading(false); };
  
  const downloadCode = () => {
    window.location.href = `${API_URL}/download/${sessionId}`;
  };

  if (appState === 'login') return <LoginScreen onLogin={handleLogin} />;
  if (appState === 'boot') return <BootScreen onComplete={() => setAppState('app')} />;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#050505] text-white font-sans overflow-hidden selection:bg-[#beff50]/30 relative">
      
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-80 flex-col border-r border-white/5 bg-[#0a0a0a] z-20 shadow-2xl relative">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-1"><div className="w-8 h-8 bg-[#beff50] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(190,255,80,0.3)]"><Zap size={18} className="text-black fill-current" /></div><h1 className="text-xl font-bold tracking-tight">wflow</h1></div>
          <p className="text-xs text-neutral-500 font-medium ml-11">By Plinng</p>
        </div>
        <div className="px-4 mb-6">
          <div className="flex gap-1 p-1 bg-neutral-900 rounded-xl border border-white/5">
            <button onClick={() => setActiveTab('generator')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'generator' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-white'}`}><LayoutTemplate size={14} /> Generator</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'history' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-white'}`}><History size={14} /> History</button>
          </div>
        </div>
        <div className="flex-1 px-4 flex flex-col gap-4 overflow-y-auto">
          {activeTab === 'generator' ? (
             <GeneratorContent 
                prompt={prompt} setPrompt={setPrompt} loading={loading} siteUrl={siteUrl} 
                handleRequest={handleRequest} deploy={deploy} deployUrl={deployUrl} 
                selectedStyle={selectedStyle} setSelectedStyle={setSelectedStyle} styles={styles}
                downloadCode={downloadCode}
             />
          ) : (
             <HistoryContent history={history} loadFromHistory={loadFromHistory} clearHistory={() => { if(confirm('Clear history?')) { setHistory([]); localStorage.removeItem('wflow_history'); }}} />
          )}
        </div>
        <AccountFooter username={username} showAccountMenu={showAccountMenu} setShowAccountMenu={setShowAccountMenu} />
      </div>

      {/* --- SETTINGS POPUP MENU --- */}
      {showAccountMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center md:absolute md:inset-auto md:bottom-20 md:left-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setShowAccountMenu(false)}></div>
           <div className="relative w-[90%] md:w-72 glass-panel p-1 rounded-xl shadow-2xl border border-white/10 bg-[#0a0a0a] animate-in fade-in zoom-in-95 md:slide-in-from-bottom-2">
              <div className="p-3 border-b border-white/5 flex justify-between items-center"><span className="text-xs font-bold text-[#beff50]">User Settings</span><button onClick={() => setShowAccountMenu(false)}><X size={14} className="text-neutral-500 hover:text-white"/></button></div>
              <div className="p-3 space-y-4">
                 <div><label className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-1 block">Display Name</label><input value={username} onChange={handleNameChange} className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#beff50] outline-none" /></div>
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={exportData} className="flex flex-col items-center justify-center gap-2 p-3 bg-neutral-900 rounded-lg hover:bg-neutral-800 border border-white/5 transition-colors"><Download size={16} className="text-neutral-400" /><span className="text-[10px] text-neutral-400">Backup</span></button>
                    <button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center justify-center gap-2 p-3 bg-neutral-900 rounded-lg hover:bg-neutral-800 border border-white/5 transition-colors"><Upload size={16} className="text-neutral-400" /><span className="text-[10px] text-neutral-400">Restore</span></button>
                    <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
                 </div>
                 <button onClick={factoryReset} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"><LogOut size={14} /> Reset App Data</button>
              </div>
           </div>
        </div>
      )}

      {/* MOBILE LAYOUT & PREVIEW AREA */}
      <div className={`flex-1 bg-[#050505] relative flex flex-col h-full ${mobileTab === 'editor' && 'md:flex'}`}>
        <div className="md:hidden h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-4 z-30">
             <div className="flex items-center gap-2"><Zap size={18} className="text-[#beff50] fill-current" /><span className="font-bold">wflow</span></div>
             <button onClick={() => setShowAccountMenu(!showAccountMenu)} className="p-2"><Settings size={18} className="text-neutral-400"/></button>
        </div>

        <div className={`flex-1 flex flex-col p-4 gap-4 overflow-y-auto md:hidden ${mobileTab === 'editor' ? 'block' : 'hidden'}`}>
             <h2 className="text-xs font-bold text-[#beff50] uppercase tracking-wider">Generator</h2>
             <GeneratorContent 
                prompt={prompt} setPrompt={setPrompt} loading={loading} siteUrl={siteUrl} 
                handleRequest={handleRequest} deploy={deploy} deployUrl={deployUrl} 
                selectedStyle={selectedStyle} setSelectedStyle={setSelectedStyle} styles={styles}
                downloadCode={downloadCode}
             />
        </div>
        <div className={`flex-1 flex flex-col p-4 gap-4 overflow-y-auto md:hidden ${mobileTab === 'history' ? 'block' : 'hidden'}`}>
             <h2 className="text-xs font-bold text-[#beff50] uppercase tracking-wider">History</h2>
             <HistoryContent history={history} loadFromHistory={loadFromHistory} clearHistory={() => { if(confirm('Clear history?')) { setHistory([]); localStorage.removeItem('wflow_history'); }}} />
        </div>

        {/* PREVIEW CANVAS */}
        <div className={`flex-1 flex-col h-full relative ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
           <div className="h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-4 z-20">
              <div className="hidden md:flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-white/5">{['100%', '768px', '375px'].map((w, i) => (<button key={w} onClick={() => setPreviewWidth(w)} className={`p-1.5 rounded-md transition-all ${previewWidth === w ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-white'}`}>{i === 0 ? <Monitor size={16}/> : i === 1 ? <Tablet size={16}/> : <Smartphone size={16}/>}</button>))}</div>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-neutral-900/50 border border-white/5 rounded-full text-[10px] text-neutral-500 font-mono mx-auto md:mx-0"><div className={`w-2 h-2 rounded-full ${loading ? 'bg-[#beff50] animate-ping' : 'bg-emerald-500'} `} />preview.wflow.app</div>
              <button onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')} className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 text-xs font-medium transition-colors ${viewMode === 'code' ? 'bg-[#beff50] text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}><Code size={14} /> {viewMode === 'preview' ? 'Code' : 'Preview'}</button>
           </div>
           
           <div className="flex-1 overflow-hidden relative flex justify-center bg-[#050505] p-2 md:p-6">
              {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050505]/90 backdrop-blur-sm transition-all duration-700">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#beff50]/10 via-transparent to-transparent animate-pulse duration-[3000ms]"></div>
                   <div className="flex flex-col items-center gap-6 relative z-10"><div className="relative"><div className="absolute inset-0 bg-[#beff50] blur-2xl opacity-30 animate-pulse rounded-full"></div><Loader2 size={64} className="text-[#beff50] animate-spin relative z-10" /></div><div className="text-center space-y-2"><h3 className="text-lg font-bold text-white tracking-[0.2em] uppercase animate-pulse">{loadingText}</h3><p className="text-xs text-neutral-500 font-mono">Building on Cloud...</p></div></div>
                </div>
              )}
              {viewMode === 'preview' ? (
                <div className={`relative transition-all duration-500 ease-in-out group w-full md:w-auto ${loading ? 'scale-95 opacity-50 blur-sm grayscale' : 'scale-100 opacity-100'}`} style={{ width: window.innerWidth < 768 ? '100%' : previewWidth, height: '100%' }}>
                  <div className={`hidden md:block absolute -inset-1 bg-gradient-to-tr from-[#beff50] to-emerald-600 rounded-[20px] blur opacity-20 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${loading ? 'opacity-60 animate-pulse' : ''}`}></div>
                  <div className="relative h-full w-full bg-white shadow-2xl overflow-hidden md:ring-1 md:ring-white/10" style={{ borderRadius: window.innerWidth < 768 ? '8px' : (previewWidth === '100%' ? '12px' : '16px') }}>
                    {siteUrl ? <iframe src={siteUrl} className="w-full h-full border-none" title="Preview" /> : <div className="flex flex-col items-center justify-center h-full bg-[#080808] text-neutral-600 gap-6"><div className="w-20 h-20 rounded-full bg-neutral-900/50 border border-white/5 flex items-center justify-center"><Sparkles size={28} className="text-neutral-700" /></div><p className="text-sm">Ready to generate</p></div>}
                  </div>
                </div>
              ) : (
                 <div className="w-full h-full max-w-4xl glass-panel rounded-xl overflow-hidden flex flex-col"><pre className="flex-1 p-4 overflow-auto text-xs font-mono text-neutral-300 bg-[#0a0a0a]">{rawCode}</pre></div>
              )}
           </div>
        </div>
      </div>

      {/* --- MOBILE BOTTOM NAV --- */}
      <div className="md:hidden h-16 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-around px-2 z-50">
        <MobileTab icon={Edit3} label="Editor" active={mobileTab === 'editor'} onClick={() => setMobileTab('editor')} />
        <MobileTab icon={Eye} label="Preview" active={mobileTab === 'preview'} onClick={() => setMobileTab('preview')} />
        <MobileTab icon={History} label="History" active={mobileTab === 'history'} onClick={() => setMobileTab('history')} />
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS (With Vibe Layout Updates) ---

const MobileTab = ({ icon: Icon, label, active, onClick }) => <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-[#beff50]' : 'text-neutral-500'}`}><Icon size={20} /><span className="text-[10px] font-medium">{label}</span></button>;

// 🆕 UPDATED LAYOUT FOR VIBE SELECTOR
const GeneratorContent = ({ prompt, setPrompt, loading, siteUrl, handleRequest, deploy, deployUrl, selectedStyle, setSelectedStyle, styles, downloadCode }) => (
  <>
    <div className="glass-panel p-4 rounded-2xl relative group transition-all hover:border-[#beff50]/30">
      
      {/* 1. Prompt Textarea FIRST */}
      <div className="flex justify-between items-center mb-3">
        <label className="text-xs font-bold text-[#beff50] uppercase tracking-wider flex items-center gap-1">
          <Command size={10} /> {siteUrl ? "Refine design" : "New project"}
        </label>
        {loading && <Loader2 size={14} className="animate-spin text-neutral-500" />}
      </div>
      <textarea 
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full h-24 bg-transparent border-none text-sm text-neutral-200 placeholder-neutral-600 focus:ring-0 resize-none leading-relaxed"
        placeholder={siteUrl ? "Make buttons larger..." : `Create a ${selectedStyle ? selectedStyle.toLowerCase() : 'modern'} portfolio...`}
      />
      
      {/* 2. Vibe Selector BELOW Textarea */}
      <div className="mt-3 mb-2 pt-3 border-t border-white/5">
         <div className="flex items-center gap-2 mb-2">
            <Palette size={12} className="text-[#beff50]" />
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Vibe (Optional)</span>
         </div>
         <div className="flex flex-wrap gap-2">
            {styles.map(style => (
               <button 
                  key={style}
                  onClick={() => setSelectedStyle(selectedStyle === style ? null : style)}
                  className={`px-3 py-1 text-[10px] uppercase font-bold rounded-full border transition-all ${selectedStyle === style ? 'bg-[#beff50] text-black border-[#beff50]' : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600 hover:text-neutral-300'}`}
               >
                  {style}
               </button>
            ))}
         </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
        <span className="text-[10px] text-neutral-600">Enter to generate</span>
        <button onClick={() => handleRequest(siteUrl ? '/edit' : '/create')} disabled={loading || !prompt} className="bg-white text-black p-2 rounded-lg hover:bg-[#beff50] hover:scale-105 transition-all disabled:opacity-50">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>

    {siteUrl && (
      <div className="glass-panel p-4 rounded-2xl animate-in fade-in space-y-3">
        <div className="flex items-center gap-2 text-[#beff50]"><Globe size={14} /><span className="text-xs font-bold uppercase tracking-wide">Deployment</span></div>
        <div className="grid grid-cols-4 gap-2">
           <button onClick={deploy} disabled={loading} className="col-span-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-white/5 text-neutral-200 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2">Publish to Surge</button>
           <button onClick={downloadCode} className="col-span-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-neutral-400 hover:text-white rounded-lg flex items-center justify-center transition-all" title="Download Code"><Download size={16} /></button>
        </div>
        {deployUrl && <a href={deployUrl} target="_blank" className="block text-center text-[10px] text-[#beff50] truncate border-t border-white/5 pt-2 hover:underline">{deployUrl}</a>}
      </div>
    )}
  </>
);

const HistoryContent = ({ history, loadFromHistory, clearHistory }) => (
  <div className="space-y-3">
    {history.length === 0 ? <p className="text-xs text-neutral-500 text-center py-10">No history yet.</p> : history.map((item) => (
      <button key={item.id} onClick={() => loadFromHistory(item)} className="w-full text-left p-3 rounded-xl bg-neutral-900/50 border border-white/5 hover:border-[#beff50]/50 hover:bg-neutral-800 transition-all group">
        <p className="text-xs font-medium text-white truncate mb-1">{item.prompt}</p>
        <div className="flex justify-between items-center"><span className="text-[10px] text-neutral-500">{item.timestamp}</span><span className="text-[10px] text-[#beff50] opacity-0 group-hover:opacity-100 transition-opacity">Restore</span></div>
      </button>
    ))}
    {history.length > 0 && <button onClick={clearHistory} className="w-full py-2 text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-2 mt-4"><Trash2 size={12} /> Clear History</button>}
  </div>
);

const AccountFooter = ({ username, showAccountMenu, setShowAccountMenu }) => (
  <div className="p-4 border-t border-white/5">
    <button onClick={() => setShowAccountMenu(!showAccountMenu)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-left transition-colors group">
      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-[#beff50] transition-colors"><User size={14} className="text-neutral-400 group-hover:text-black" /></div>
      <div className="flex-1"><p className="text-xs font-medium text-white">{username}</p><p className="text-[10px] text-neutral-500">Free Plan</p></div>
      <Settings size={14} className="text-neutral-500" />
    </button>
  </div>
);