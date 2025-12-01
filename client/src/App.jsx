import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Sparkles, Send, Globe, Loader2, Code, Zap, 
  LayoutTemplate, Layers, Settings, ChevronRight, Command,
  Smartphone, Monitor, Tablet, Copy, Trash2, History, User,
  Download, Upload, LogOut, X, MessageSquare, Palette, CheckCircle2, Circle
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
    setTimeout(() => { onLogin(email || 'Guest Architect'); }, 1500);
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#beff50]/5 via-transparent to-transparent animate-pulse duration-[5000ms]"></div>
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#beff50] rounded-2xl shadow-[0_0_40px_rgba(190,255,80,0.2)] mb-6"><Zap size={32} className="text-black fill-current" /></div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">wflow</h1>
          <p className="text-neutral-500">The AI Architect for Modern Web</p>
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
    <div className="h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans">
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
  
  // Data
  const [messages, setMessages] = useState([{ role: 'ai', text: "Hola, soy Teo tu ayudante virtual, ¿Que pagina web crearemos hoy?" }]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([]);
  const [username, setUsername] = useState('Guest');
  
  // ARCHITECT STATE (Live Brief)
  const [liveBrief, setLiveBrief] = useState({});
  const [isBriefComplete, setIsBriefComplete] = useState(false);

  // Builder Logic
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing...');
  const [siteUrl, setSiteUrl] = useState(null);
  const [rawCode, setRawCode] = useState('');
  const [sessionId] = useState(() => 'wflow-' + Math.random().toString(36).substr(2, 9));
  const [deployUrl, setDeployUrl] = useState(null);

  // UI
  const [activeSidebarTab, setActiveSidebarTab] = useState('chat');
  const [mobileTab, setMobileTab] = useState('chat');
  const [previewWidth, setPreviewWidth] = useState('100%');
  const [viewMode, setViewMode] = useState('preview');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const styles = ['Minimal', 'Neon', 'Corporate', 'Brutalist', 'Pastel'];
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Effects
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const savedHistory = localStorage.getItem('wflow_history');
    const savedName = localStorage.getItem('wflow_username');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedName) setUsername(savedName);
  }, []);

  // Handlers (Login, History, etc. same as before)
  const handleLogin = (name) => { setUsername(name); localStorage.setItem('wflow_username', name); setAppState('boot'); };
  const handleNameChange = (e) => { setUsername(e.target.value); localStorage.setItem('wflow_username', e.target.value); };
  const exportData = () => { const dataStr = JSON.stringify({ username, history }, null, 2); const blob = new Blob([dataStr], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.download = `wflow-backup-${new Date().toISOString().slice(0,10)}.json`; link.href = url; document.body.appendChild(link); link.click(); document.body.removeChild(link); setShowAccountMenu(false); };
  const importData = (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const data = JSON.parse(e.target.result); if (data.history) { setHistory(data.history); localStorage.setItem('wflow_history', JSON.stringify(data.history)); } if (data.username) { setUsername(data.username); localStorage.setItem('wflow_username', data.username); } alert('Data restored!'); setShowAccountMenu(false); } catch (err) { alert('Invalid backup'); } }; reader.readAsText(file); };
  const factoryReset = () => { if(confirm('Reset App?')) { localStorage.clear(); window.location.reload(); }};
  const saveToHistory = (prompt, code) => { const newItem = { id: Date.now(), prompt: prompt.substring(0, 40) + '...', fullPrompt: prompt, code, timestamp: new Date().toLocaleDateString() }; const newHistory = [newItem, ...history].slice(0, 20); setHistory(newHistory); localStorage.setItem('wflow_history', JSON.stringify(newHistory)); };
  const loadFromHistory = async (item) => { setLoading(true); setLoadingText('Restoring Session...'); if (appState === 'architect') setAppState('builder'); setActiveSidebarTab('chat'); setMobileTab('preview'); setRawCode(item.code); setMessages(prev => [...prev, { role: 'user', text: `Restoring: ${item.prompt}` }, { role: 'ai', text: "Restoring previous session version." }]); try { const res = await axios.post(`${API_URL}/restore`, { sessionId, code: item.code }); setSiteUrl(res.data.url); } catch (e) { alert("Restore failed"); } setLoading(false); };
  const clearHistory = () => { if(confirm('Clear all?')) { setHistory([]); localStorage.removeItem('wflow_history'); }};
  const downloadCode = () => { window.location.href = `${API_URL}/download/${sessionId}`; };

  // --- CORE AI LOGIC (UPDATED) ---
  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setIsTyping(true);

    try {
      if (appState === 'builder') {
         // --- EDIT MODE (Builder) ---
         setLoading(true); setLoadingText('Refining Code...');
         const res = await axios.post(`${API_URL}/edit`, { instruction: userText, sessionId });
         setSiteUrl(res.data.url); setRawCode(res.data.code);
         setMessages(prev => [...prev, { role: 'ai', text: "Updated the design." }]);
         setLoading(false);
         if (window.innerWidth < 768) setMobileTab('preview');
      } else {
         // --- ARCHITECT MODE (Conversation) ---
         // Use the history array but filter it to just text for the API if needed, 
         // OR send the full structure if your backend expects it.
         // Current backend expects { role, parts: [{ text }] }
         const apiHistory = messages.map(m => ({ 
             role: m.role === 'ai' ? 'model' : 'user', 
             parts: [{ text: m.text }] 
         }));

         const res = await axios.post(`${API_URL}/chat`, { history: apiHistory, message: userText });
         
         // 1. Extract 'action' as well
         const { reply, brief, is_complete, action } = res.data; 

         // 2. ROBUST MERGE: Only update fields that are not null/empty
         // This fixes the issue where the sidebar wasn't filling up
         if (brief) {
             setLiveBrief(prev => {
                 const newBrief = { ...prev };
                 if (brief.name) newBrief.name = brief.name;
                 if (brief.industry) newBrief.industry = brief.industry;
                 if (brief.audience) newBrief.audience = brief.audience;
                 if (brief.vibe) newBrief.vibe = brief.vibe;
                 if (brief.sections) newBrief.sections = brief.sections;
                 return newBrief;
             });
         }
         
         setIsBriefComplete(is_complete);

         // 3. Handle AI auto-triggering build (if user typed "Yes")
         if (action === "BUILD") {
             setMessages(prev => [...prev, { role: 'ai', text: "Understood. Starting build..." }]);
             startBuild(); // This will now use the liveBrief state correctly
         } else {
             setMessages(prev => [...prev, { role: 'ai', text: reply }]);
         }
      }
    } catch (e) { setMessages(prev => [...prev, { role: 'ai', text: "Connection error. Please retry." }]); }
    setIsTyping(false);
  };

  const startBuild = async () => {
    // 1. Force Transition Immediately (Stops the loop)
    setAppState('builder'); 
    setLoading(true);
    setLoadingText('Architecting your vision...');
    
    // 2. Add system message to chat so it looks nice in history
    setMessages(prev => [...prev, { role: 'ai', text: "Initializing construction sequence..." }]);

    const texts = ['Drafting Layout...', 'Compiling React...', 'Applying Tailwind...', 'Polishing Assets...'];
    let idx = 0; 
    const interval = setInterval(() => { setLoadingText(texts[idx++ % texts.length]); }, 2000);
    
    // 3. Construct a Robust Prompt from the Live Brief
    // Fallback to "Portfolio" if industry is missing to prevent crashes
    const fullPrompt = `
      Create a website for a ${liveBrief.industry || 'Business'}.
      Name: ${liveBrief.name || 'My Brand'}.
      Target Audience: ${liveBrief.audience || 'General'}.
      Design Vibe: ${liveBrief.vibe || 'Modern'}.
      Sections: ${liveBrief.sections || 'Home, About, Contact'}.
    `;

    try {
      // 4. Send to Builder Agent
      const res = await axios.post(`${API_URL}/create`, { 
        prompt: fullPrompt, 
        sessionId, 
        style: liveBrief.vibe || 'Minimal' 
      });
      
      clearInterval(interval);
      setSiteUrl(res.data.url);
      setRawCode(res.data.code);
      saveToHistory(fullPrompt, res.data.code);
      
      if (window.innerWidth < 768) setMobileTab('preview');
    } catch (e) {
      clearInterval(interval);
      alert("Generation failed. Please try again.");
      setAppState('architect'); // Go back if it fails
    }
    setLoading(false);
  };

  const deploy = async () => { setLoading(true); setLoadingText('Deploying to Surge...'); try { const res = await axios.post(`${API_URL}/deploy`, { sessionId }); setDeployUrl(res.data.url); setMessages(prev => [...prev, { role: 'ai', text: `Deployed successfully: ${res.data.url}` }]); } catch (e) { alert("Deploy failed"); } setLoading(false); };

  // --- RENDER ---
  if (appState === 'login') return <LoginScreen onLogin={handleLogin} />;
  if (appState === 'boot') return <BootScreen onComplete={() => setAppState('architect')} />;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#050505] text-white font-sans overflow-hidden selection:bg-[#beff50]/30 relative">
      <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />

      {/* 
        ====================================================
        MODE 1: ARCHITECT VIEW (Fullscreen Conversational)
        ====================================================
      */}
      {appState === 'architect' && (
        <div className="flex w-full h-full relative">
           
           {/* CHAT CONTAINER (No Borders, Airy) */}
           <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              <div className="w-full max-w-2xl flex flex-col h-full p-6">
                 
                 {/* Header */}
                 <div className="flex items-center justify-center gap-2 mb-8 opacity-50">
                    <div className="w-6 h-6 bg-[#beff50] rounded flex items-center justify-center"><Zap size={14} className="text-black fill-current"/></div>
                    <span className="font-bold tracking-tight">wflow architect</span>
                 </div>

                 {/* Messages */}
                 <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pb-6">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[85%] p-4 text-base leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#beff50] text-black rounded-2xl rounded-tr-sm' : 'text-neutral-200'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    
                    {/* TYPING INDICATOR */}
                    {isTyping && <div className="flex justify-start"><div className="text-neutral-500 text-sm animate-pulse">Thinking...</div></div>}
                    
                    {/* CONFIRMATION CARD (Shows when Brief is Complete) */}
                    {isBriefComplete && !loading && (
                       <div className="mx-auto w-full max-w-md glass-panel p-6 rounded-2xl border border-[#beff50]/30 animate-in zoom-in slide-in-from-bottom-4 shadow-[0_0_30px_rgba(190,255,80,0.1)]">
                          <div className="flex items-center gap-2 mb-4 text-[#beff50]">
                             <CheckCircle2 size={20} />
                             <span className="font-bold tracking-widest uppercase text-xs">Blueprint Ready</span>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-4">Ready to build?</h3>
                          <div className="space-y-3 mb-6">
                             {Object.entries(liveBrief).map(([key, val]) => (
                                val && (
                                  <div key={key} className="flex justify-between text-sm border-b border-white/5 pb-2">
                                     <span className="text-neutral-500 capitalize">{key}</span>
                                     <span className="text-white font-medium text-right">{val}</span>
                                  </div>
                                )
                             ))}
                          </div>
                          <button onClick={startBuild} className="w-full py-4 bg-[#beff50] hover:bg-[#a8e640] text-black font-bold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                             <Zap size={16} fill="currentColor" /> Initialize Construction
                          </button>
                       </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                 </div>

                 {/* Input (Floating) */}
                 <div className="w-full max-w-xl mx-auto pt-4">
                    <div className="glass-panel p-2 rounded-full flex items-center gap-3 border border-white/10 bg-black/50 backdrop-blur-xl focus-within:border-[#beff50]/50 transition-colors shadow-2xl">
                       <input 
                         value={chatInput}
                         onChange={(e) => setChatInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                         placeholder="Type your reply..."
                         className="flex-1 bg-transparent border-none text-white px-6 py-3 text-base focus:ring-0 outline-none placeholder-neutral-600"
                         autoFocus
                       />
                       <button onClick={sendMessage} disabled={!chatInput.trim()} className="p-3 bg-[#beff50] rounded-full text-black hover:bg-[#a8e640] transition-colors disabled:opacity-50"><Send size={18} /></button>
                    </div>
                 </div>
              </div>
           </div>

           {/* LIVE BRIEF SIDEBAR (Fills up as you talk) */}
           <div className="hidden lg:flex w-80 border-l border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm p-6 flex-col justify-center">
              <div className="mb-8">
                 <h2 className="text-xs font-bold text-[#beff50] uppercase tracking-wider mb-2">Live Brief</h2>
                 <p className="text-xs text-neutral-500">Data gathered from conversation.</p>
              </div>
              <div className="space-y-6">
                 {['name', 'industry', 'audience', 'vibe', 'sections'].map((field) => (
                    <div key={field} className={`transition-all duration-500 ${liveBrief[field] ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'}`}>
                       <div className="flex items-center gap-2 mb-1">
                          {liveBrief[field] ? <CheckCircle2 size={12} className="text-[#beff50]" /> : <Circle size={12} className="text-neutral-600" />}
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{field}</span>
                       </div>
                       <p className="text-sm text-white font-medium pl-5 border-l border-white/10 min-h-[20px]">
                          {liveBrief[field] || '...'}
                       </p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* 
        ====================================================
        MODE 2: BUILDER VIEW (Sidebar + Preview)
        ====================================================
      */}
      {appState === 'builder' && (
        <>
          {/* DESKTOP SIDEBAR */}
          <div className="hidden md:flex w-80 flex-col border-r border-white/5 bg-[#0a0a0a] z-30 shadow-2xl relative">
            <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#beff50] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(190,255,80,0.3)]"><Zap size={18} className="text-black fill-current" /></div><div className="flex flex-col"><h1 className="text-xl font-bold tracking-tight leading-none">wflow</h1><span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">Builder</span></div></div>
            </div>
            
            <div className="px-4 py-4"><div className="flex gap-1 p-1 bg-neutral-900 rounded-xl border border-white/5">
              <button onClick={() => setActiveSidebarTab('chat')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${activeSidebarTab === 'chat' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-white'}`}><MessageSquare size={14} /> Architect</button>
              <button onClick={() => setActiveSidebarTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${activeSidebarTab === 'history' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-white'}`}><History size={14} /> History</button>
            </div></div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
              {activeSidebarTab === 'chat' && (
                <div className="flex flex-col h-full">
                   <div className="flex-1 space-y-6 py-4">
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-[#beff50] text-black' : 'bg-neutral-900 text-neutral-300'}`}>{msg.text}</div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                   </div>
                   <div className="pt-2">
                      <div className="glass-panel p-2 rounded-xl flex items-center gap-2 border border-white/10 bg-black/50">
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type edit instructions..." className="flex-1 bg-transparent border-none text-white px-3 py-2 text-xs focus:ring-0 outline-none" />
                        <button onClick={sendMessage} disabled={!chatInput.trim()} className="p-2 bg-[#beff50] rounded-lg text-black hover:bg-[#a8e640]"><Send size={14} /></button>
                      </div>
                   </div>
                   
                   {/* Generator Tools */}
                   <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                      <div className="flex items-center gap-2 mb-2"><Palette size={12} className="text-[#beff50]"/><span className="text-[10px] font-bold text-neutral-500 uppercase">Style</span></div>
                      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">{styles.map(s => (<button key={s} onClick={() => { setSelectedStyle(s); setChatInput(`Change style to ${s}`); sendMessage(); }} className="px-2 py-1 text-[10px] border border-white/10 rounded-md hover:border-[#beff50] hover:text-white transition-all text-neutral-500">{s}</button>))}</div>
                      
                      <div className="grid grid-cols-4 gap-2">
                        <button onClick={deploy} className="col-span-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all"><Globe size={14} /> Publish</button>
                        <button onClick={downloadCode} className="col-span-1 py-2 bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white rounded-lg flex items-center justify-center transition-all"><Download size={14} /></button>
                      </div>
                      {deployUrl && <a href={deployUrl} target="_blank" className="block text-center text-[10px] text-[#beff50] underline">{deployUrl}</a>}
                   </div>
                </div>
              )}
              {activeSidebarTab === 'history' && <HistoryContent history={history} loadFromHistory={loadFromHistory} clearHistory={clearHistory} />}
            </div>
            
            <div className="p-4 border-t border-white/5"><AccountFooter username={username} showAccountMenu={showAccountMenu} setShowAccountMenu={setShowAccountMenu} /></div>
          </div>

          {/* RIGHT PANEL (Preview) */}
          <div className={`flex-1 bg-[#050505] relative flex flex-col h-full ${mobileTab === 'chat' ? 'hidden md:flex' : 'flex'}`}>
             <div className="h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-4 z-20">
                <div className="hidden md:flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-white/5">{['100%', '768px', '375px'].map((w, i) => (<button key={w} onClick={() => setPreviewWidth(w)} className={`p-1.5 rounded-md transition-all ${previewWidth === w ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-white'}`}>{i === 0 ? <Monitor size={16}/> : i === 1 ? <Tablet size={16}/> : <Smartphone size={16}/>}</button>))}</div>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-neutral-900/50 border border-white/5 rounded-full text-[10px] text-neutral-500 font-mono mx-auto md:mx-0"><div className={`w-2 h-2 rounded-full ${loading ? 'bg-[#beff50] animate-ping' : 'bg-[#beff50] animate-pulse'}`} />preview.wflow.app</div>
                <button onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')} className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 text-xs font-medium transition-colors ${viewMode === 'code' ? 'bg-[#beff50] text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}><Code size={14} /> {viewMode === 'preview' ? 'Code' : 'Preview'}</button>
             </div>
             <div className="flex-1 overflow-hidden relative flex justify-center bg-[#050505] p-2 md:p-6">
                {loading && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050505]/90 backdrop-blur-sm transition-all duration-700">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#beff50]/10 via-transparent to-transparent animate-pulse duration-[3000ms]"></div>
                     <div className="flex flex-col items-center gap-6 relative z-10"><div className="relative"><div className="absolute inset-0 bg-[#beff50] blur-2xl opacity-30 animate-pulse rounded-full"></div><Loader2 size={64} className="text-[#beff50] animate-spin relative z-10" /></div><div className="text-center space-y-2"><h3 className="text-lg font-bold text-white tracking-[0.2em] uppercase animate-pulse">{loadingText}</h3><p className="text-xs text-neutral-500 font-mono">Generative Process Active...</p></div></div>
                  </div>
                )}
                {viewMode === 'preview' ? (
                  <div className={`relative transition-all duration-500 ease-in-out group w-full md:w-auto ${loading ? 'scale-95 opacity-50 blur-sm grayscale' : 'scale-100 opacity-100'}`} style={{ width: window.innerWidth < 768 ? '100%' : previewWidth, height: '100%' }}>
                    <div className={`hidden md:block absolute -inset-1 bg-gradient-to-tr from-[#beff50] to-emerald-600 rounded-[20px] blur opacity-20 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${loading ? 'opacity-60 animate-pulse' : ''}`}></div>
                    <div className="relative h-full w-full bg-white shadow-2xl overflow-hidden md:ring-1 md:ring-white/10" style={{ borderRadius: window.innerWidth < 768 ? '8px' : (previewWidth === '100%' ? '12px' : '16px') }}>
                      {siteUrl ? <iframe src={siteUrl} className="w-full h-full border-none" title="Preview" /> : <div className="flex flex-col items-center justify-center h-full bg-[#080808] text-neutral-600 gap-6"><Sparkles size={28} className="text-neutral-700" /><p className="text-sm">Initializing...</p></div>}
                    </div>
                  </div>
                ) : (
                   <div className="w-full h-full max-w-4xl glass-panel rounded-xl overflow-hidden flex flex-col"><pre className="flex-1 p-4 overflow-auto text-xs font-mono text-neutral-300 bg-[#0a0a0a]">{rawCode}</pre></div>
                )}
             </div>
          </div>

          {/* MOBILE NAV */}
          <div className="md:hidden h-16 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-around px-2 z-50">
            <MobileTab icon={MessageSquare} label="Architect" active={mobileTab === 'chat'} onClick={() => setMobileTab('chat')} />
            <MobileTab icon={Globe} label="Preview" active={mobileTab === 'preview'} onClick={() => setMobileTab('preview')} />
            <MobileTab icon={History} label="History" active={mobileTab === 'history'} onClick={() => { setMobileTab('chat'); setActiveSidebarTab('history'); }} />
          </div>

          {/* ACCOUNT MENU */}
          {showAccountMenu && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center md:absolute md:inset-auto md:bottom-20 md:left-4">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setShowAccountMenu(false)}></div>
               <div className="relative w-[90%] md:w-72 glass-panel p-1 rounded-xl shadow-2xl border border-white/10 bg-[#0a0a0a] animate-in fade-in zoom-in-95 md:slide-in-from-bottom-2">
                  <div className="p-3 border-b border-white/5 flex justify-between items-center"><span className="text-xs font-bold text-[#beff50]">User Settings</span><button onClick={() => setShowAccountMenu(false)}><X size={14} className="text-neutral-500 hover:text-white"/></button></div>
                  <div className="p-3 space-y-4">
                     <div><label className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-1 block">Display Name</label><input value={username} onChange={handleNameChange} className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#beff50] outline-none" /></div>
                     <div className="grid grid-cols-2 gap-2"><button onClick={exportData} className="flex flex-col items-center justify-center gap-2 p-3 bg-neutral-900 rounded-lg hover:bg-neutral-800 border border-white/5 transition-colors"><Download size={16} className="text-neutral-400" /><span className="text-[10px] text-neutral-400">Backup</span></button><button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center justify-center gap-2 p-3 bg-neutral-900 rounded-lg hover:bg-neutral-800 border border-white/5 transition-colors"><Upload size={16} className="text-neutral-400" /><span className="text-[10px] text-neutral-400">Restore</span></button><input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" /></div>
                     <button onClick={factoryReset} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"><LogOut size={14} /> Reset App Data</button>
                  </div>
               </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---
const MobileTab = ({ icon: Icon, label, active, onClick }) => <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-[#beff50]' : 'text-neutral-500'}`}><Icon size={20} /><span className="text-[10px] font-medium">{label}</span></button>;
const HistoryContent = ({ history, loadFromHistory, clearHistory }) => (<div className="space-y-3">{history.length === 0 ? <p className="text-xs text-neutral-500 text-center py-10">No history yet.</p> : history.map((item) => (<button key={item.id} onClick={() => loadFromHistory(item)} className="w-full text-left p-3 rounded-xl bg-neutral-900/50 border border-white/5 hover:border-[#beff50]/50 hover:bg-neutral-800 transition-all group"><p className="text-xs font-medium text-white truncate mb-1">{item.prompt}</p><div className="flex justify-between items-center"><span className="text-[10px] text-neutral-500">{item.timestamp}</span><span className="text-[10px] text-[#beff50] opacity-0 group-hover:opacity-100 transition-opacity">Restore</span></div></button>))}{history.length > 0 && <button onClick={clearHistory} className="w-full py-2 text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-2 mt-4"><Trash2 size={12} /> Clear History</button>}</div>);
const AccountFooter = ({ username, showAccountMenu, setShowAccountMenu }) => (<div className="p-4 border-t border-white/5"><button onClick={() => setShowAccountMenu(!showAccountMenu)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-left transition-colors group"><div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-[#beff50] transition-colors"><User size={14} className="text-neutral-400 group-hover:text-black" /></div><div className="flex-1"><p className="text-xs font-medium text-white">{username}</p><p className="text-[10px] text-neutral-500">Free Plan</p></div><Settings size={14} className="text-neutral-500" /></button></div>);