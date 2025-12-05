import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Sparkles, Send, Globe, Loader2, Code, Zap, 
  LayoutTemplate, Layers, Settings, ChevronRight, Command,
  Smartphone, Monitor, Tablet, Copy, Trash2, History, User,
  Download, Upload, LogOut, X, MessageSquare, Palette, CheckCircle2, Circle, ArrowRight
} from 'lucide-react';

// 1. Importar arriba con los otros imports
import teoImage from './assets/teo.avif'; // Asegúrate que la ruta sea correcta

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// --- ASSETS ---
// 2. Usar en el componente
const TeoAvatar = () => (
  <img 
    src={teoImage} 
    alt="Teo AI" 
    className="w-8 h-8 min-w-[2rem] rounded-full object-cover shadow-md border border-gray-200"
  />
);
const UserAvatar = () => <div className="w-8 h-8 min-w-[2rem] rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">Me</div>;

// --- EXTRACT URL ---
const extractUrl = (text) => {
    const match = text.match(/(https?:\/\/[^\s]+)/);
    return match ? match[0] : null;
};

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
             <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-gray-900">plinng<span className="text-[#60259f]">.flow</span></h1>
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

// --- PROCESSING SCREEN (Con efecto Shimmer Diagonal Suave + Pulse) ---
const ProcessingScreen = ({ initialPrompt, onAnalysisComplete }) => {
  const [status, setStatus] = useState('Inicializando motores...');
  
  useEffect(() => {
    const processPrompt = async () => {
        try {
            // 1. URL Analysis
            setStatus('Detectando referencias...');
            let scrapedContext = "";
            const urlMatch = initialPrompt.match(/(https?:\/\/[^\s]+)/);
            
            if (urlMatch) {
                setStatus(`Analizando estructura de ${new URL(urlMatch[0]).hostname}...`);
                try {
                    const scrapeRes = await axios.post(`${API_URL}/analyze`, { url: urlMatch[0] });
                    scrapedContext = `
                    --- START OF SYSTEM INJECTION ---
                    SOURCE: ${urlMatch[0]}
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
  const handleStart = (prompt) => {
      setInitialPrompt(prompt);
      setAppState('processing'); // Pasamos a la pantalla de carga inteligente
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
         if (action === "BUILD") {
             setMessages(prev => [...prev, { role: 'ai', text: "On it. Initializing Plinng Builder..." }]);
             startBuild(); 
         } else {
             setMessages(prev => [...prev, { role: 'ai', text: reply }]);
         }
      }
    } catch (e) { 
        console.error(e);
        setMessages(prev => [...prev, { role: 'ai', text: "Connection error. Teo is offline." }]); 
    }
    
    setIsTyping(false);
  };

  const startBuild = async () => {
    // 1. CHANGE VIEW IMMEDIATELY
    setAppState('builder'); 
    setLoading(true); 
    setLoadingText('Teo is architecting...');
    
    // --- ⏱️ START TIMER ---
    const startTime = Date.now();

    const texts = ['Drafting Layout...', 'Applying Plinng Styles...', 'Compiling React...', 'Finalizing...'];
    let idx = 0; 
    const interval = setInterval(() => { setLoadingText(texts[idx++ % texts.length]); }, 2000);
    
    // If we have a reference URL, we explicitly label it
    const refString = liveBrief.reference ? `Reference Site: ${liveBrief.reference}` : '';

    // Construct Prompt
    const prompt = `Business: ${liveBrief.name}. Industry: ${liveBrief.industry}. Audience: ${liveBrief.audience}. Sections: ${liveBrief.sections}. Vibe: ${liveBrief.vibe}. Context: ${liveBrief.context || 'None'}.`;

    try {
      // Call API
      const res = await axios.post(`${API_URL}/create`, { 
        prompt, 
        sessionId, 
        style: liveBrief.vibe || 'Modern' 
      });
      
      clearInterval(interval);
      setSiteUrl(res.data.url);
      setRawCode(res.data.code);
      saveToHistory(prompt, res.data.code);
      
      // --- ⏱️ STOP TIMER & CALCULATE ---
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1); // Calculate seconds with 1 decimal

      // --- SEND SUCCESS MESSAGE WITH TIME ---
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: `Done! Your website took ${duration} seconds to complete. You just saved hours of work! ⚡ Let me know if you want to refine anything.` 
      }]);
      
      if (window.innerWidth < 768) setMobileTab('preview');

    } catch (e) { 
      clearInterval(interval);
      
      // If error, go back to chat to explain
      setAppState('architect'); 
      setMessages(prev => [...prev, { role: 'ai', text: "I encountered an error during construction. Let's try again." }]); 
    }
    
    setLoading(false);
  };

  const deploy = async () => { setLoading(true); setLoadingText('Publishing to Web...'); try { const res = await axios.post(`${API_URL}/deploy`, { sessionId }); setDeployUrl(res.data.url); setMessages(prev => [...prev, { role: 'ai', text: `Site is live! ${res.data.url}` }]); } catch (e) { alert("Deploy failed"); } setLoading(false); };

  // RENDER CONDICIONAL ACTUALIZADO
  if (appState === 'landing') return <LandingScreen onStart={handleStart} />;
  if (appState === 'processing') return <ProcessingScreen initialPrompt={initialPrompt} onAnalysisComplete={handleAnalysisComplete} />;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#f8f9fc] text-gray-900 font-sans overflow-hidden selection:bg-[#beff50]/50 relative">
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
                        <span className="font-bold tracking-tight text-gray-400 text-sm">plinng.flow</span>
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
                    
                    {/* CONFIRMATION CARD */}
                    {isBriefComplete && (
                       <div className="mx-auto w-full max-w-sm bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-[#beff50] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.05)] animate-in zoom-in slide-in-from-bottom-6 mb-10">
                          <div className="flex items-center gap-3 mb-5 text-[#60259f]">
                             <div className="p-2 bg-[#60259f]/10 rounded-full"><CheckCircle2 size={18} /></div>
                             <span className="font-bold tracking-widest uppercase text-xs">Brief listo</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-6">¿Tenemos la información correcta?</h3>
                          <div className="space-y-3 mb-8">
                             {Object.entries(liveBrief).map(([key, val]) => val && (
                                <div key={key} className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                                   <span className="text-gray-400 capitalize font-medium">{key}</span>
                                   <span className="text-gray-900 font-bold text-right truncate max-w-[180px]">{val}</span>
                                </div>
                             ))}
                          </div>
                          <button onClick={startBuild} disabled={loading} className="w-full py-4 bg-[#beff50] hover:bg-[#b0ef40] text-black font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-[#beff50]/20 hover:scale-[1.02] flex items-center justify-center gap-2">
                             {loading ? <Loader2 className="animate-spin"/> : <><Zap size={18} fill="currentColor" /> Crea mi sitio web</>}
                          </button>
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

           {/* LIVE BRIEF SIDEBAR */}
           <div className="hidden lg:flex w-96 border-l border-white/40 bg-white/40 backdrop-blur-xl p-8 flex-col justify-center shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.02)] relative z-20">
              <div className="mb-10">
                 <div className="h-1.5 w-12 bg-[#beff50] rounded-full mb-4"></div>
                 <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Sobre tu web</h2>
                 <p className="text-xs text-gray-500 font-medium leading-relaxed">Estoy organizando la información de tu web.</p>
              </div>
              <div className="space-y-8">
                 {['name', 'industry', 'audience', 'vibe', 'sections', 'context'].map((field) => (
                    <div key={field} className={`transition-all duration-700 ${liveBrief[field] ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4 grayscale'}`}>
                       <div className="flex items-center gap-2 mb-2">
                          {liveBrief[field] ? <CheckCircle2 size={16} className="text-[#beff50] fill-green-900" /> : <Circle size={16} className="text-gray-300" />}
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{field}</span>
                       </div>
                       <p className="text-sm text-gray-900 font-bold pl-6 border-l-2 border-gray-100 min-h-[20px] transition-all">
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
                <div className="flex flex-col"><h1 className="text-xl font-bold tracking-tight leading-none text-gray-900">wflow</h1><span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Builder</span></div>
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
             <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 z-20 shadow-sm shrink-0">
                <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">{['100%', '768px', '375px'].map((w, i) => (<button key={w} onClick={() => setPreviewWidth(w)} className={`p-1.5 rounded-md transition-all ${previewWidth === w ? 'bg-white text-[#60259f] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{i === 0 ? <Monitor size={16}/> : i === 1 ? <Tablet size={16}/> : <Smartphone size={16}/>}</button>))}</div>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-[10px] text-gray-500 font-mono mx-auto md:mx-0 shadow-inner"><div className={`w-2 h-2 rounded-full ${loading ? 'bg-[#60259f] animate-ping' : 'bg-green-500'} `} />preview.wflow.app</div>
                <button onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')} className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold transition-colors ${viewMode === 'code' ? 'bg-[#60259f] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Code size={14} /> {viewMode === 'preview' ? 'Code' : 'Preview'}</button>
             </div>
             <div className="flex-1 overflow-hidden relative flex justify-center bg-gray-100 p-2 md:p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                {loading && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md transition-all duration-700">
                     <div className="flex flex-col items-center gap-6 relative z-10"><div className="relative"><div className="absolute inset-0 bg-[#beff50] blur-2xl opacity-60 animate-pulse rounded-full"></div><Loader2 size={64} className="text-[#60259f] animate-spin relative z-10" /></div><div className="text-center space-y-2"><h3 className="text-lg font-bold text-gray-900 tracking-widest uppercase animate-pulse">{loadingText}</h3><p className="text-xs text-gray-500 font-mono">Teo is coding...</p></div></div>
                  </div>
                )}
                {viewMode === 'preview' ? (
                  <div className={`relative transition-all duration-500 ease-in-out group w-full md:w-auto ${loading ? 'scale-95 opacity-50 blur-sm grayscale' : 'scale-100 opacity-100'}`} style={{ width: window.innerWidth < 768 ? '100%' : previewWidth, height: '100%' }}>
                    <div className="relative h-full w-full bg-white shadow-2xl overflow-hidden md:rounded-2xl border border-gray-200">
                      {siteUrl ? <iframe src={siteUrl} className="w-full h-full border-none" title="Preview" /> : <div className="flex flex-col items-center justify-center h-full bg-white text-gray-400 gap-6"><div className="w-24 h-24 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shadow-inner"><Sparkles size={32} className="text-gray-300" /></div><p className="text-sm font-medium">Ready to build your vision.</p></div>}
                    </div>
                  </div>
                ) : (
                   <div className="w-full h-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col"><pre className="flex-1 p-6 overflow-auto text-xs font-mono text-gray-700 bg-gray-50">{rawCode}</pre></div>
                )}
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

// --- SUB COMPONENTS ---
const MobileTab = ({ icon: Icon, label, active, onClick }) => <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-plinng-purple' : 'text-gray-400'}`}><Icon size={20} /><span className="text-[10px] font-medium">{label}</span></button>;
const HistoryContent = ({ history, loadFromHistory, clearHistory }) => (<div className="space-y-3">{history.length === 0 ? <p className="text-xs text-gray-400 text-center py-10">No history yet.</p> : history.map((item) => (<button key={item.id} onClick={() => loadFromHistory(item)} className="w-full text-left p-3 rounded-xl bg-white border border-gray-200 hover:border-[#60259f] hover:shadow-md transition-all group"><p className="text-xs font-bold text-gray-800 truncate mb-1">{item.prompt}</p><div className="flex justify-between items-center"><span className="text-[10px] text-gray-400">{item.timestamp}</span><span className="text-[10px] text-plinng-purple opacity-0 group-hover:opacity-100 transition-opacity font-bold">Restore</span></div></button>))}{history.length > 0 && <button onClick={clearHistory} className="w-full py-2 text-xs text-red-500 hover:text-red-600 flex items-center justify-center gap-2 mt-4"><Trash2 size={12} /> Clear History</button>}</div>);
const AccountFooter = ({ username, showAccountMenu, setShowAccountMenu }) => (<div className="w-full"><button onClick={() => setShowAccountMenu(!showAccountMenu)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 text-left transition-colors group"><div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#60259f] to-indigo-600 p-[2px]"><div className="w-full h-full rounded-full bg-white flex items-center justify-center"><User size={16} className="text-[#60259f]" /></div></div><div className="flex-1"><p className="text-xs font-bold text-gray-900">{username}</p><p className="text-[10px] text-gray-500">Pro Plan</p></div><Settings size={16} className="text-gray-400 group-hover:text-[#60259f] transition-colors" /></button></div>);