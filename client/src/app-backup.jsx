import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Sparkles, Send, Globe, Loader2, Code, Zap, 
  LayoutTemplate, Layers, Settings, ChevronRight, Command,
  Smartphone, Monitor, Tablet, Copy, Trash2, History, User,
  Download, Upload, LogOut, X, MessageSquare, Palette, CheckCircle2, Circle, ArrowRight
} from 'lucide-react';
import teoImage from './assets/teo.avif'; // Teo Avatar
import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackCodeEditor } from "@codesandbox/sandpack-react";

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// --- EXTRACT URL ---
const extractUrl = (text) => {
    const match = text.match(/(https?:\/\/[^\s]+)/);
    return match ? match[0] : null;
};

// --- MAIN APP ---
export default function App() {
  const [appState, setAppState] = useState('landing'); // Cambiado de 'login' a 'landing'
  const [initialPrompt, setInitialPrompt] = useState(''); // Nuevo estado para guardar el primer mensaje
  
  // Data
  // Inicializamos messages vacíos, los llenaremos tras el procesamiento
  const [messages, setMessages] = useState([]); 
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([]);
  const [username, setUsername] = useState('Guest');
  
  // ARCHITECT STATE
  const [liveBrief, setLiveBrief] = useState({});
  const [isBriefComplete, setIsBriefComplete] = useState(false);

  // Builder Logic
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing...');
  const [siteUrl, setSiteUrl] = useState(null);
  const [rawCode, setRawCode] = useState('');
  const [sessionId] = useState(() => 'plinng-' + Math.random().toString(36).substr(2, 9));
  const [deployUrl, setDeployUrl] = useState(null);

  // UI
  const [activeSidebarTab, setActiveSidebarTab] = useState('chat');
  const [mobileTab, setMobileTab] = useState('chat');
  const [previewWidth, setPreviewWidth] = useState('100%');
  const [viewMode, setViewMode] = useState('preview');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // ==========================================
  // 🔧 BACKEND CONNECTION LOGIC
  // ==========================================

  // SCROLL FIX: Use 'nearest' to avoid whole page jumping
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); 
  }, [messages, isTyping]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('wflow_history');
    const savedName = localStorage.getItem('wflow_username');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedName) setUsername(savedName);
  }, []);

  // Handlers
  const handleLogin = (name) => { setUsername(name); localStorage.setItem('wflow_username', name); setAppState('boot'); };
  const handleNameChange = (e) => { setUsername(e.target.value); localStorage.setItem('wflow_username', e.target.value); };
  const exportData = () => { const dataStr = JSON.stringify({ username, history }, null, 2); const blob = new Blob([dataStr], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.download = `plinng-backup.json`; link.href = url; document.body.appendChild(link); link.click(); document.body.removeChild(link); setShowAccountMenu(false); };
  const importData = (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const data = JSON.parse(e.target.result); if (data.history) { setHistory(data.history); localStorage.setItem('wflow_history', JSON.stringify(data.history)); } if (data.username) { setUsername(data.username); localStorage.setItem('wflow_username', data.username); } alert('Data restored!'); setShowAccountMenu(false); } catch (err) { alert('Invalid backup'); } }; reader.readAsText(file); };
  const factoryReset = () => { if(confirm('Reset App?')) { localStorage.clear(); window.location.reload(); }};
  const saveToHistory = (prompt, code) => { const newItem = { id: Date.now(), prompt: prompt.substring(0, 40) + '...', fullPrompt: prompt, code, timestamp: new Date().toLocaleDateString() }; const newHistory = [newItem, ...history].slice(0, 20); setHistory(newHistory); localStorage.setItem('wflow_history', JSON.stringify(newHistory)); };
  const loadFromHistory = async (item) => { setLoading(true); setLoadingText('Restoring...'); if (appState === 'architect') setAppState('builder'); setActiveSidebarTab('chat'); setMobileTab('preview'); setRawCode(item.code); setMessages(prev => [...prev, { role: 'user', text: `Restoring: ${item.prompt}` }, { role: 'ai', text: "Restoring session." }]); try { const res = await axios.post(`${API_URL}/restore`, { sessionId, code: item.code }); setSiteUrl(res.data.url); } catch (e) { alert("Restore failed"); } setLoading(false); };
  const clearHistory = () => { if(confirm('Clear all?')) { setHistory([]); localStorage.removeItem('wflow_history'); }};
  const downloadCode = () => { window.location.href = `${API_URL}/download/${sessionId}`; };

  // HANDLERS DEL NUEVO FLUJO
  
  // 1. Usuario envía el prompt en el Landing
  const handleStart = async (prompt) => {
    // 🚨 CHEAT CODE: Type "test:deploy" to skip AI and test the server
    if (prompt.trim() === "test:deploy") {
        setAppState('builder');
        setLoading(true);
        setLoadingText('Injecting Mock Site...');

        const mockCode = `
        import React from 'react';
        import { Rocket } from 'lucide-react';
        
        export default function App() {
          return (
            <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4">
              <div className="bg-green-500/20 p-8 rounded-full mb-6 ring-1 ring-green-500">
                <Rocket size={48} className="text-green-500" />
              </div>
              <h1 className="text-4xl font-bold mb-2">Deploy Test Mode</h1>
              <p className="text-neutral-400 mb-8">Ready to publish to Surge.</p>
              <div className="p-4 bg-black rounded-lg font-mono text-xs text-neutral-500">
                ID: ${sessionId}
              </div>
            </div>
          );
        }`;

        try {
            // We use the /restore endpoint because it simply saves code to disk 
            // without calling Gemini. Perfect for setting up the folder.
            await axios.post(`${API_URL}/restore`, { 
                sessionId: sessionId, 
                code: mockCode 
            });

            setRawCode(mockCode);
            setSiteUrl(`${API_URL}/sites/${sessionId}/index.html`);
            setMessages([{ role: 'ai', text: "⚡ Test Mode Active. Click the Globe icon to test deployment." }]);
        } catch (e) {
            console.error("Mock injection failed", e);
            alert("Server not running?");
        }
        
        setLoading(false);
        return; // Stop here, don't do the normal flow
    }

    // --- NORMAL FLOW BELOW ---
    setInitialPrompt(prompt);
    setAppState('processing');
};

  // 2. Procesamiento completado (viene de ProcessingScreen)
  const handleAnalysisComplete = (data) => {
      const { initialResponse, extractedBrief, isComplete } = data;
      
      // A. Establecer el Brief extraído
      setLiveBrief(prev => ({ ...prev, ...extractedBrief }));
      setIsBriefComplete(isComplete);

      // B. Construir el historial del chat
      // Mensaje 1: El usuario (su prompt inicial)
      // Mensaje 2: La IA (su respuesta inicial analizada)
      setMessages([
          { role: 'user', text: initialPrompt },
          { role: 'ai', text: initialResponse }
      ]);

      // C. Entrar al modo Arquitecto
      setAppState('architect');
  };

  // Core AI Logic
  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userText = chatInput;
    // 1. Add User Message to UI immediately
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setIsTyping(true);

    try {
      // ====================================================
      // BUILDER MODE (Code Refinement)
      // ====================================================
      if (appState === 'builder') {
         setLoading(true); 
         setLoadingText('Refining Code...');
         
         const res = await axios.post(`${API_URL}/edit`, { 
             instruction: userText, 
             sessionId 
         });
         
         setSiteUrl(res.data.url); 
         setRawCode(res.data.code);
         setMessages(prev => [...prev, { role: 'ai', text: "I've updated the design based on your feedback." }]);
         setLoading(false);
         
         if (window.innerWidth < 768) setMobileTab('preview');
      
      // ====================================================
      // ARCHITECT MODE (Requirements Gathering)
      // ====================================================
      } else {
         // A. URL ANALYSIS LOGIC
         let scrapedContext = "";
         const foundUrl = extractUrl(userText);
         
         if (foundUrl) {
             // Show a temporary system message to let user know we are working
             setMessages(prev => [...prev, { role: 'ai', text: `👀 I see a link (${foundUrl}). analyzing its structure...` }]);
             
             try {
                 const scrapeRes = await axios.post(`${API_URL}/analyze`, { url: foundUrl });
                 
                 // We format this as a "System Note" so the AI knows it's data, not user chatter
                 scrapedContext = `\n\n[SYSTEM INJECTION: The user provided a reference link. Here is the analyzed content from ${foundUrl}]:\n${scrapeRes.data.rawData}\n\n[INSTRUCTION: Use this data to fill the 'reference' and 'context' fields in the brief.]`;
                 
             } catch (e) {
                 console.error("Scraping failed", e);
                 // We don't block the chat if scraping fails, just continue
             }
         }

         // B. PREPARE HISTORY FOR API
         // Map our UI messages to the format Gemini expects (user/model)
         const apiHistory = messages.map(m => ({ 
             role: m.role === 'ai' ? 'model' : 'user', 
             parts: [{ text: m.text }] 
         }));

         // C. SEND TO ARCHITECT
         // We append the scrapedContext (if any) to the user's message invisibly
         const res = await axios.post(`${API_URL}/chat`, { 
             history: apiHistory, 
             message: userText + scrapedContext, 
             currentBrief: liveBrief 
         });
         
         const { reply, brief, is_complete, action } = res.data; 
         
         // D. UPDATE LIVE BRIEF
         if (brief) {
             setLiveBrief(prev => {
                 const newBrief = { ...prev };
                 // We merge the new fields safely
                 if (brief.name) newBrief.name = brief.name;
                 if (brief.industry) newBrief.industry = brief.industry;
                 if (brief.audience) newBrief.audience = brief.audience;
                 if (brief.vibe) newBrief.vibe = brief.vibe;
                 if (brief.sections) newBrief.sections = brief.sections;
                 if (brief.context) newBrief.context = brief.context;     // Captured from extra chatter
                 if (brief.reference) newBrief.reference = brief.reference; // Captured from URL
                 return newBrief;
             });
         }
         setIsBriefComplete(is_complete);

         // E. HANDLE ACTIONS
         setMessages(prev => [...prev, { role: 'ai', text: reply }]);
      }
    } catch (e) { 
        console.error(e);
        setMessages(prev => [...prev, { role: 'ai', text: "Connection error. Teo is offline." }]); 
    }
    
    setIsTyping(false);
  };

  const startBuild = async () => {
    console.log("🚀 START BUILD INITIATED"); // DEBUG
    setAppState('builder'); 
    setLoading(true); 
    setLoadingText('Connecting to stream...');
    
    const prompt = `Business: ${liveBrief.name}. Industry: ${liveBrief.industry}. Sections: ${liveBrief.sections}. Vibe: ${liveBrief.vibe}. Context: ${liveBrief.context || 'None'}.`;

    try {
      // 1. Set initial state to force Sandpack to mount
      setRawCode("// Initializing connection...");
      console.log("🔹 setRawCode set to placeholder");

      const response = await fetch(`${API_URL}/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt, 
            sessionId, 
            style: liveBrief.vibe || 'Modern' 
          })
      });

      console.log("🔹 Response Status:", response.status); // DEBUG

      if (!response.ok) throw new Error("Stream failed");
      if (!response.body) throw new Error("No response body (Not readable)");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedCode = "";
      let chunkCount = 0;

      console.log("🔹 Starting Stream Reader..."); // DEBUG

      while (true) {
          const { done, value } = await reader.read();
          if (done) {
              console.log("✅ Stream Complete"); // DEBUG
              break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          accumulatedCode += chunk;
          chunkCount++;
          
          // Log first few chunks to ensure data is real
          if (chunkCount < 3) console.log("🔹 Received Chunk:", chunk.substring(0, 50) + "...");
          
          setRawCode(accumulatedCode);
          
          // Force loader off as soon as we have data
          setLoading(false); 
      }

      console.log("🔹 Total Code Length Received:", accumulatedCode.length); // DEBUG

      // Cleanup
      let finalCode = cleanCode(accumulatedCode);
      
      // LOG IF CODE IS EMPTY
      if (!finalCode || finalCode.trim().length === 0) {
          console.error("❌ ERROR: Final code is empty!", accumulatedCode);
          // Fallback so screen isn't blank
          finalCode = "// Error: Server returned empty code."; 
      }

      finalCode = fixImageTags(finalCode);
      
      setRawCode(finalCode);
      setSiteUrl('SANDPACK_MODE');
      saveToHistory(prompt, finalCode);
      
      setMessages(prev => [...prev, { role: 'ai', text: "Done! ⚡" }]);

    } catch (e) { 
      console.error("❌ BUILD ERROR:", e);
      // Don't switch back to architect immediately so we can see the error state
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${e.message}` }]); 
    }
    
    setLoading(false);
  };

  const deploy = async () => { setLoading(true); setLoadingText('Publishing to Web...'); try { const res = await axios.post(`${API_URL}/deploy`, { sessionId }); setDeployUrl(res.data.url); setMessages(prev => [...prev, { role: 'ai', text: `Site is live! ${res.data.url}` }]); } catch (e) { alert("Deploy failed"); } setLoading(false); };

  // RENDER CONDICIONAL ACTUALIZADO
  if (appState === 'landing') return <LandingScreen onStart={handleStart} />;
  if (appState === 'processing') return <ProcessingScreen initialPrompt={initialPrompt} onAnalysisComplete={handleAnalysisComplete} />;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#f8f9fc] text-gray-900 font-sans overflow-hidden selection:bg-[#beff50]/50 relative">

      {/* ⚡ START OF FIX: Force Sandpack Height ⚡ */}
      <style>{`


        /* HOLO CARD STYLES */
          @keyframes border-rotate {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes field-update-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          .holo-card {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 
              0 4px 30px rgba(0, 0, 0, 0.05),
              inset 0 0 20px rgba(255, 255, 255, 0.8);
          }

          .holo-gradient-border {
            position: relative;
            background: white;
            z-index: 1;
          }

          .holo-gradient-border::before {
            content: "";
            position: absolute;
            inset: -2px;
            z-index: -1;
            background: linear-gradient(
              60deg,
              #beff50,
              #60259f,
              #beff50,
              #60259f
            );
            background-size: 300% 300%;
            animation: border-rotate 4s ease infinite;
            border-radius: 1.5rem; /* Matches rounded-3xl */
            opacity: 0.5;
            filter: blur(8px);
          }

          .field-shimmer {
            background: linear-gradient(
              90deg, 
              transparent 0%, 
              rgba(190, 255, 80, 0.4) 50%, 
              transparent 100%
            );
            background-size: 200% 100%;
            animation: field-update-shimmer 1s ease-out forwards;
          }

      `}</style>
      {/* ⚡ END OF FIX ⚡ */}

      <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />

      {/* BACKGROUND */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#60259f]/5 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#beff50]/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* 
        ====================================================
        MODE 1: ARCHITECT VIEW (Seamless Chat)
        ====================================================
      */}
      {appState === 'architect' && (
        <div className="flex w-full h-full relative z-10">
           
           {/* CENTER CHAT CONTAINER - STABILIZED */}
           <div className="flex-1 flex flex-col relative h-full">
              
              {/* Messages Area - FLEX GROW (Takes all space between header and input) */}
              <div className="flex-1 overflow-y-auto space-y-8 no-scrollbar px-4 md:px-0">
                 <div className="w-full max-w-3xl mx-auto flex flex-col pt-8 pb-4">
                    
                    {/* Header (Scrolls with messages now to avoid fixed overlap) */}
                    <div className="flex flex-col items-center justify-center gap-2 mb-10 opacity-80">
                        <div className="w-10 h-10 bg-[#beff50] rounded-xl flex items-center justify-center shadow-lg shadow-[#beff50]/30 transform -rotate-3"><Zap size={20} className="text-black fill-current"/></div>
                        <span className="font-bold tracking-tight text-gray-400 text-sm">plinng.wflow</span>
                    </div>

                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6`}>
                        {msg.role === 'ai' && <TeoAvatar />}
                        <div className={`max-w-[80%] p-5 text-[15px] leading-relaxed shadow-sm ${
                           msg.role === 'user' 
                             ? 'bg-[#60259f] text-white rounded-2xl rounded-tr-sm shadow-md shadow-purple-900/10' 
                             : 'bg-white border border-gray-100 text-gray-700 rounded-2xl rounded-tl-sm shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                        {msg.role === 'user' && <UserAvatar />}
                      </div>
                    ))}
                    
                    {isTyping && (
                       <div className="flex gap-4 animate-in fade-in mb-6">
                          <TeoAvatar />
                          <div className="bg-white border border-gray-100 p-5 rounded-2xl rounded-tl-sm flex gap-1.5 items-center shadow-sm">
                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"/> 
                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"/>
                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"/>
                          </div>
                       </div>
                    )}
                    
                    
                    <div ref={messagesEndRef} />
                 </div>
              </div>

              {/* INPUT AREA - FIXED HEIGHT & PINNED */}
              <div className="w-full bg-gradient-to-t from-[#f8f9fc] via-[#f8f9fc] to-transparent pt-6 pb-6 shrink-0 z-20">
                 <div className="w-full max-w-2xl mx-auto px-4">
                    <div className="p-2 rounded-full flex items-center gap-3 bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:shadow-[0_8px_30px_rgba(96,37,159,0.12)] focus-within:border-[#60259f]/30 transition-all duration-300">
                       <input 
                         value={chatInput}
                         onChange={(e) => setChatInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                         placeholder="Describe tu visión..."
                         className="flex-1 bg-transparent border-none text-gray-900 px-6 py-3 text-base focus:ring-0 outline-none placeholder-gray-400 font-medium"
                         autoFocus
                       />
                       <button 
                          onClick={sendMessage} 
                          disabled={!chatInput.trim()} 
                          className="p-3 bg-[#60259f] rounded-full text-white hover:bg-[#4c1d7a] transition-all disabled:opacity-50 disabled:bg-gray-200 shadow-md hover:scale-105"
                       >
                          <ArrowRight size={20} />
                       </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-400 mt-4 font-medium tracking-wide">Presiona Enter para chatear</p>
                 </div>
              </div>
           </div>

           {/* LIVE BRIEF SIDEBAR (NEW) */}
           <div className="hidden lg:flex w-[400px] p-6 flex-col justify-center relative z-20">
              {/* Floating blobs for atmosphere */}
              <div className="absolute top-1/4 right-0 w-64 h-64 bg-[#60259f]/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-[#beff50]/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative">
                 <HoloBriefCard 
                    brief={liveBrief} 
                    isComplete={isBriefComplete} 
                    onBuild={startBuild}
                    loading={loading}
                 />
              </div>
           </div>
        </div>
      )}

      {/* 
        ====================================================
        MODE 2: BUILDER VIEW (Existing Logic)
        ====================================================
      */}
      {appState === 'builder' && (
        <>
          {/* DESKTOP SIDEBAR */}
          <div className="hidden md:flex w-96 flex-col border-r border-gray-200 bg-white z-30 shadow-2xl relative">
            <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#beff50] rounded-lg flex items-center justify-center shadow-lg shadow-[#beff50]/20"><Zap size={18} className="text-black fill-current" /></div>
                <div className="flex flex-col"><h1 className="text-xl font-bold tracking-tight leading-none text-gray-900">plinng.wflow</h1><span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Builder</span></div>
              </div>
              <button onClick={() => setShowAccountMenu(!showAccountMenu)} className="md:hidden p-2 text-gray-400"><Settings size={18}/></button>
            </div>
            
            <div className="px-4 py-4"><div className="flex gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button onClick={() => setActiveSidebarTab('chat')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeSidebarTab === 'chat' ? 'bg-white text-[#60259f] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}><MessageSquare size={14} /> Architect</button>
              <button onClick={() => setActiveSidebarTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeSidebarTab === 'history' ? 'bg-white text-[#60259f] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}><History size={14} /> History</button>
            </div></div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
              {activeSidebarTab === 'chat' && (
                <div className="flex flex-col h-full">
                   <div className="flex-1 space-y-6 py-6">
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                          {msg.role === 'ai' && <TeoAvatar />}
                          <div className={`max-w-[85%] p-4 text-xs leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#60259f] text-white rounded-2xl rounded-tr-sm' : 'bg-gray-50 border border-gray-100 text-gray-700 rounded-2xl rounded-tl-sm'}`}>{msg.text}</div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                   </div>
                   <div className="pt-2 sticky bottom-0 bg-white pb-2">
                      <div className="bg-gray-50 p-2 rounded-2xl flex items-center gap-2 border border-gray-200 focus-within:border-[#60259f] focus-within:ring-1 focus-within:ring-[#60259f]/10 transition-all">
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type edit instructions..." className="flex-1 bg-transparent border-none text-gray-900 px-3 py-2 text-xs focus:ring-0 outline-none" />
                        <button onClick={sendMessage} disabled={!chatInput.trim()} className="p-2 bg-[#beff50] rounded-xl text-black hover:bg-[#a8e640]"><Send size={14} /></button>
                      </div>
                      
                      {/* Generator Tools */}
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                          <div className="grid grid-cols-4 gap-2">
                            <button onClick={deploy} className="col-span-3 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"><Globe size={14} /> Publish Live</button>
                            <button onClick={downloadCode} className="col-span-1 py-2.5 bg-white border border-gray-200 text-gray-600 hover:text-[#60259f] hover:border-[#60259f] rounded-xl flex items-center justify-center transition-all shadow-sm"><Download size={14} /></button>
                          </div>
                          {deployUrl && <a href={deployUrl} target="_blank" className="block text-center text-[10px] text-[#60259f] underline font-bold">{deployUrl}</a>}
                      </div>
                   </div>
                </div>
              )}
              {activeSidebarTab === 'history' && <HistoryContent history={history} loadFromHistory={loadFromHistory} clearHistory={clearHistory} />}
            </div>
            
            <div className="p-4 border-t border-gray-200"><AccountFooter username={username} showAccountMenu={showAccountMenu} setShowAccountMenu={setShowAccountMenu} /></div>
          </div>

          {/* RIGHT PANEL (Preview) */}
          <div className={`flex-1 bg-[#f3f4f6] relative flex flex-col h-full ${mobileTab === 'chat' ? 'hidden md:flex' : 'flex'}`}>
             
             {/* Header */}
             <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 z-20 shadow-sm shrink-0">
                <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                    {['100%', '768px', '375px'].map((w, i) => (
                        <button key={w} onClick={() => setPreviewWidth(w)} className={`p-1.5 rounded-md transition-all ${previewWidth === w ? 'bg-white text-[#60259f] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            {i === 0 ? <Monitor size={16}/> : i === 1 ? <Tablet size={16}/> : <Smartphone size={16}/>}
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-[10px] text-gray-500 font-mono mx-auto md:mx-0 shadow-inner">
                    <div className={`w-2 h-2 rounded-full ${loading ? 'bg-[#60259f] animate-ping' : 'bg-green-500'} `} />
                    preview.wflow.app
                </div>
                
                <button onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')} className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold transition-colors ${viewMode === 'code' ? 'bg-[#60259f] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    <Code size={14} /> {viewMode === 'preview' ? 'Editor' : 'Preview'}
                </button>
             </div>

             
          </div>

          {/* MOBILE BOTTOM NAV */}
          <div className="md:hidden h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50">
            <MobileTab icon={MessageSquare} label="Architect" active={mobileTab === 'chat'} onClick={() => setMobileTab('chat')} />
            <MobileTab icon={Globe} label="Preview" active={mobileTab === 'preview'} onClick={() => setMobileTab('preview')} />
            <MobileTab icon={History} label="History" active={mobileTab === 'history'} onClick={() => { setMobileTab('chat'); setActiveSidebarTab('history'); }} />
          </div>
        </>
      )}

      {/* ACCOUNT MENU */}
      {showAccountMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center md:absolute md:inset-auto md:bottom-20 md:left-4">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setShowAccountMenu(false)}></div>
           <div className="relative w-[90%] md:w-72 bg-white p-1 rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 md:slide-in-from-bottom-2">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center"><span className="text-xs font-bold text-[#60259f] uppercase tracking-wider">Settings</span><button onClick={() => setShowAccountMenu(false)}><X size={16} className="text-gray-400 hover:text-gray-900"/></button></div>
              <div className="p-4 space-y-4">
                 <div><label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1 block">Name</label><input value={username} onChange={handleNameChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-[#60259f] outline-none" /></div>
                 <div className="grid grid-cols-2 gap-2"><button onClick={exportData} className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#beff50] hover:bg-green-50 transition-colors"><Download size={16} className="text-gray-500" /><span className="text-[10px] text-gray-500 font-medium">Backup</span></button><button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#60259f] hover:bg-purple-50 transition-colors"><Upload size={16} className="text-gray-500" /><span className="text-[10px] text-gray-500 font-medium">Restore</span></button></div>
                 <button onClick={factoryReset} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"><LogOut size={14} /> Reset App</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

