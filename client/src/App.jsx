import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Zap, Send, Globe, Code, MessageSquare, 
  Monitor, Tablet, Smartphone, Download, Settings, ArrowRight, History, Upload, LogOut
} from 'lucide-react';
import { useDataManager } from './hooks/useDataManager';
import { extractUrl } from './utils/helpers';

// --- IMPORTS FROM SLICED FILES ---
import LandingScreen from './components/screens/LandingScreen';
import ProcessingScreen from './components/screens/ProcessingScreen';
import HoloBriefCard from './components/architect/BriefCard';
import PreviewEngine from './components/builder/PreviewEngine';
import { TeoAvatar, UserAvatar, MobileTab, HistoryContent, AccountFooter } from './components/shared/UIComponents';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

export default function App() {
  // STATE: Flow
  const [appState, setAppState] = useState('landing'); // landing | processing | architect | builder
  const [initialPrompt, setInitialPrompt] = useState('');
  
  // STATE: Chat & Data
  const [messages, setMessages] = useState([]); 
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([]);
  const [username, setUsername] = useState('Guest');
  
  // STATE: Architect
  const [liveBrief, setLiveBrief] = useState({});
  const [isBriefComplete, setIsBriefComplete] = useState(false);

  // STATE: Builder
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing...');
  const [rawCode, setRawCode] = useState('');
  const [sessionId] = useState(() => 'plinng-' + Math.random().toString(36).substr(2, 9));
  const [deployUrl, setDeployUrl] = useState(null);

  // STATE: UI
  const [activeSidebarTab, setActiveSidebarTab] = useState('chat');
  const [mobileTab, setMobileTab] = useState('chat');
  const [previewWidth, setPreviewWidth] = useState('100%');
  const [viewMode, setViewMode] = useState('preview');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  
  // RESTORED: Data Management Hook
  const { fileInputRef, exportData, importData, factoryReset } = useDataManager(
      username, history, setHistory, setUsername, setShowAccountMenu
  );

  const messagesEndRef = useRef(null);
  
  // --- EFFECTS ---
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); 
  }, [messages, isTyping]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('wflow_history');
    const savedName = localStorage.getItem('wflow_username');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedName) setUsername(savedName);
  }, []);

  // --- ACTIONS ---
  const handleNameChange = (e) => { setUsername(e.target.value); localStorage.setItem('wflow_username', e.target.value); };
  
  const saveToHistory = (prompt, code) => { 
      const newItem = { id: Date.now(), prompt: prompt.substring(0, 40) + '...', fullPrompt: prompt, code, timestamp: new Date().toLocaleDateString() }; 
      const newHistory = [newItem, ...history].slice(0, 20); 
      setHistory(newHistory); 
      localStorage.setItem('wflow_history', JSON.stringify(newHistory)); 
  };

  const loadFromHistory = async (item) => { 
      setLoading(true); setLoadingText('Restoring...'); 
      if (appState === 'architect') setAppState('builder'); 
      setActiveSidebarTab('chat'); setMobileTab('preview'); 
      
      setRawCode(item.code); 
      setMessages(prev => [...prev, { role: 'user', text: `Restoring: ${item.prompt}` }, { role: 'ai', text: "Restoring session." }]); 
      
      try { await axios.post(`${API_URL}/restore`, { sessionId, code: item.code }); } catch (e) { alert("Restore failed"); } 
      setLoading(false); 
  };
  
  const clearHistory = () => { if(confirm('Clear all?')) { setHistory([]); localStorage.removeItem('wflow_history'); }};
  const downloadCode = () => { window.location.href = `${API_URL}/download/${sessionId}`; };

  // --- CORE LOGIC ---
  const handleStart = (prompt) => {
    if (prompt.trim() === "test:deploy") {
        setAppState('builder');
        setLoading(true);
        // ... (Mock logic can be simplified or removed for production)
        setLoading(false);
        return;
    }
    setInitialPrompt(prompt);
    setAppState('processing');
  };

  const handleAnalysisComplete = (data) => {
      const { initialResponse, extractedBrief, isComplete } = data;
      setLiveBrief(prev => ({ ...prev, ...extractedBrief }));
      setIsBriefComplete(isComplete);
      setMessages([{ role: 'user', text: initialPrompt }, { role: 'ai', text: initialResponse }]);
      setAppState('architect');
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    
    // UI Update
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setIsTyping(true);

    try {
      if (appState === 'builder') {
        // ... Builder Edit Logic (Keep as is) ...
        setLoading(true); setLoadingText('Refining Code...');
        const res = await axios.post(`${API_URL}/edit`, { instruction: userText, sessionId });
        setRawCode(res.data.code);
        setMessages(prev => [...prev, { role: 'ai', text: "I've updated the design based on your feedback." }]);
        setLoading(false);
        if (window.innerWidth < 768) setMobileTab('preview');
      } else {
        // RESTORED: URL Scraping Logic
        let scrapedContext = "";
        const foundUrl = extractUrl(userText);
        
        if (foundUrl) {
            setMessages(prev => [...prev, { role: 'ai', text: `👀 I see a link (${foundUrl}). analyzing its structure...` }]);
            try {
                const scrapeRes = await axios.post(`${API_URL}/analyze`, { url: foundUrl });
                scrapedContext = `\n\n[SYSTEM INJECTION: Reference Link Data from ${foundUrl}]:\n${scrapeRes.data.rawData}\n\n[INSTRUCTION: Use this data to fill context/reference fields.]`;
            } catch (e) {
                console.error("Scraping failed", e);
            }
        }

        const apiHistory = messages.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.text }] }));
        
        // Send with context
        const res = await axios.post(`${API_URL}/chat`, { 
            history: apiHistory, 
            message: userText + scrapedContext, 
            currentBrief: liveBrief 
        });
        
        const { reply, brief, is_complete } = res.data; 
        
        if (brief) setLiveBrief(prev => ({ ...prev, ...brief }));
        setIsBriefComplete(is_complete);
        setMessages(prev => [...prev, { role: 'ai', text: reply }]);
      }
    } catch (e) { console.error(e); setMessages(prev => [...prev, { role: 'ai', text: "Connection error. Teo is offline." }]); }
    setIsTyping(false);
  };

  const startBuild = async () => {
    setAppState('builder'); 
    setLoading(true); 
    setLoadingText('Architecting & Coding...');
    
    const prompt = `Business: ${liveBrief.name}. Industry: ${liveBrief.industry}. Sections: ${liveBrief.sections}. Vibe: ${liveBrief.vibe}. Context: ${liveBrief.context || 'None'}.`;

    try {
      setRawCode("// Initializing environment...");
      
      // RESTORED: Simple JSON handling (Backend does the cleaning now!)
      const response = await axios.post(`${API_URL}/create`, { 
          prompt, 
          sessionId, 
          style: liveBrief.vibe || 'Modern' 
      });

      const finalCode = response.data.code;
      setRawCode(finalCode);
      saveToHistory(prompt, finalCode);
      
      setMessages(prev => [...prev, { role: 'ai', text: "Done! Website generated. ⚡" }]);
    } catch (e) { 
      console.error(e); 
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${e.message}` }]); 
    }
    setLoading(false);
  };

  const deploy = async () => { 
      setLoading(true); setLoadingText('Publishing to Web...'); 
      try { 
          const res = await axios.post(`${API_URL}/deploy`, { sessionId }); 
          setDeployUrl(res.data.url); 
          setMessages(prev => [...prev, { role: 'ai', text: `Site is live! ${res.data.url}` }]); 
      } catch (e) { alert("Deploy failed"); } 
      setLoading(false); 
  };

  // --- RENDER ---
  if (appState === 'landing') return <LandingScreen onStart={handleStart} />;
  if (appState === 'processing') return <ProcessingScreen initialPrompt={initialPrompt} onAnalysisComplete={handleAnalysisComplete} />;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#f8f9fc] text-gray-900 font-sans overflow-hidden selection:bg-[#beff50]/50 relative">
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" />
      
      {/* Background Atmosphere */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#60259f]/5 blur-[150px] pointer-events-none"></div>
      
      {/* --- ARCHITECT VIEW --- */}
      {appState === 'architect' && (
        <div className="flex w-full h-full relative z-10">
           {/* Chat Panel */}
           <div className="flex-1 flex flex-col relative h-full">
              <div className="flex-1 overflow-y-auto space-y-8 no-scrollbar px-4 md:px-0">
                 <div className="w-full max-w-3xl mx-auto flex flex-col pt-8 pb-4">
                    <div className="flex flex-col items-center justify-center gap-2 mb-10 opacity-80">
                        <div className="w-10 h-10 bg-[#beff50] rounded-xl flex items-center justify-center shadow-lg transform -rotate-3"><Zap size={20} className="text-black fill-current"/></div>
                    </div>
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 mb-6`}>
                        {msg.role === 'ai' && <TeoAvatar />}
                        <div className={`max-w-[80%] p-5 text-[15px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#60259f] text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-700 rounded-2xl rounded-tl-sm'}`}>{msg.text}</div>
                        {msg.role === 'user' && <UserAvatar />}
                      </div>
                    ))}
                    {isTyping && <div className="flex gap-4 animate-in fade-in mb-6"><TeoAvatar /><div className="bg-white border border-gray-100 p-5 rounded-2xl rounded-tl-sm flex gap-1.5 items-center shadow-sm"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"/><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"/><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"/></div></div>}
                    <div ref={messagesEndRef} />
                 </div>
              </div>
              {/* Input */}
              <div className="w-full bg-gradient-to-t from-[#f8f9fc] via-[#f8f9fc] to-transparent pt-6 pb-6 shrink-0 z-20">
                 <div className="w-full max-w-2xl mx-auto px-4">
                    <div className="p-2 rounded-full flex items-center gap-3 bg-white/70 backdrop-blur-2xl border border-white/50 shadow-lg focus-within:border-[#60259f]/30 transition-all">
                       <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Describe tu visión..." className="flex-1 bg-transparent border-none text-gray-900 px-6 py-3 text-base focus:ring-0 outline-none" autoFocus />
                       <button onClick={sendMessage} disabled={!chatInput.trim()} className="p-3 bg-[#60259f] rounded-full text-white hover:bg-[#4c1d7a] transition-all disabled:opacity-50"><ArrowRight size={20} /></button>
                    </div>
                 </div>
              </div>
           </div>
           {/* Sidebar */}
           <div className="hidden lg:flex w-[400px] p-6 flex-col justify-center relative z-20">
              <HoloBriefCard brief={liveBrief} isComplete={isBriefComplete} onBuild={startBuild} loading={loading} />
           </div>
        </div>
      )}

      {/* --- BUILDER VIEW --- */}
      {appState === 'builder' && (
        <>
          {/* Sidebar */}
          <div className="hidden md:flex w-96 flex-col border-r border-gray-200 bg-white z-30 shadow-2xl relative">
            <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#beff50] rounded-lg flex items-center justify-center"><Zap size={18} className="text-black fill-current" /></div><span className="font-bold text-gray-900">Builder</span></div>
              <button onClick={() => setShowAccountMenu(!showAccountMenu)} className="md:hidden p-2 text-gray-400"><Settings size={18}/></button>
            </div>
            
            <div className="px-4 py-4"><div className="flex gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button onClick={() => setActiveSidebarTab('chat')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSidebarTab === 'chat' ? 'bg-white text-[#60259f] shadow-sm' : 'text-gray-500'}`}><MessageSquare size={14} className="inline mr-2"/>Chat</button>
              <button onClick={() => setActiveSidebarTab('history')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSidebarTab === 'history' ? 'bg-white text-[#60259f] shadow-sm' : 'text-gray-500'}`}><History size={14} className="inline mr-2"/>History</button>
            </div></div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
              {activeSidebarTab === 'chat' && (
                <div className="flex flex-col h-full">
                   <div className="flex-1 space-y-6 py-6">
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'ai' && <TeoAvatar />}
                          <div className={`max-w-[85%] p-4 text-xs leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#60259f] text-white rounded-2xl rounded-tr-sm' : 'bg-gray-50 border border-gray-100 text-gray-700 rounded-2xl rounded-tl-sm'}`}>{msg.text}</div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                   </div>
                   <div className="pt-2 sticky bottom-0 bg-white pb-2">
                      <div className="bg-gray-50 p-2 rounded-2xl flex items-center gap-2 border border-gray-200">
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Edit instructions..." className="flex-1 bg-transparent border-none text-gray-900 px-3 py-2 text-xs focus:ring-0 outline-none" />
                        <button onClick={sendMessage} disabled={!chatInput.trim()} className="p-2 bg-[#beff50] rounded-xl text-black hover:bg-[#a8e640]"><Send size={14} /></button>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                          <div className="grid grid-cols-4 gap-2">
                            <button onClick={deploy} className="col-span-3 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"><Globe size={14} /> Publish Live</button>
                            <button onClick={downloadCode} className="col-span-1 py-2.5 bg-white border border-gray-200 text-gray-600 hover:text-[#60259f] hover:border-[#60259f] rounded-xl flex items-center justify-center transition-all shadow-sm"><Download size={14} /></button>
                          </div>
                          {deployUrl && <a href={deployUrl} target="_blank" rel="noreferrer" className="block text-center text-[10px] text-[#60259f] underline font-bold">{deployUrl}</a>}
                      </div>
                   </div>
                </div>
              )}
              {activeSidebarTab === 'history' && <HistoryContent history={history} loadFromHistory={loadFromHistory} clearHistory={clearHistory} />}
            </div>
            <div className="p-4 border-t border-gray-200"><AccountFooter username={username} showAccountMenu={showAccountMenu} setShowAccountMenu={setShowAccountMenu} /></div>
          </div>

          {/* Right Panel (Preview Engine) */}
          <div className={`flex-1 bg-[#f3f4f6] relative flex flex-col h-full ${mobileTab === 'chat' ? 'hidden md:flex' : 'flex'}`}>
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
             
             {/* THE NEW ENGINE */}
             <PreviewEngine 
                rawCode={rawCode} 
                viewMode={viewMode} 
                previewWidth={previewWidth} 
                loading={loading} 
                loadingText={loadingText} 
             />
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50">
            <MobileTab icon={MessageSquare} label="Architect" active={mobileTab === 'chat'} onClick={() => setMobileTab('chat')} />
            <MobileTab icon={Globe} label="Preview" active={mobileTab === 'preview'} onClick={() => setMobileTab('preview')} />
            <MobileTab icon={History} label="History" active={mobileTab === 'history'} onClick={() => { setMobileTab('chat'); setActiveSidebarTab('history'); }} />
          </div>
        </>
      )}

      {/* Account Modal */}
        {showAccountMenu && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center md:absolute md:inset-auto md:bottom-20 md:left-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setShowAccountMenu(false)}></div>
            <div className="relative w-[90%] md:w-72 bg-white p-1 rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 md:slide-in-from-bottom-2">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#60259f] uppercase tracking-wider">Settings</span>
                    <button onClick={() => setShowAccountMenu(false)}><Zap size={16} className="text-gray-400 rotate-45"/></button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1 block">Name</label>
                      <input value={username} onChange={handleNameChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-[#60259f] outline-none" />
                  </div>
                  
                  {/* RESTORED: Backup & Restore Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={exportData} className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#beff50] hover:bg-green-50 transition-colors">
                          <Download size={16} className="text-gray-500" />
                          <span className="text-[10px] text-gray-500 font-medium">Backup</span>
                      </button>
                      <button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#60259f] hover:bg-purple-50 transition-colors">
                          <Upload size={16} className="text-gray-500" />
                          <span className="text-[10px] text-gray-500 font-medium">Restore</span>
                      </button>
                  </div>
                  
                  {/* RESTORED: Factory Reset */}
                  <button onClick={factoryReset} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                      <LogOut size={14} /> Reset App
                  </button>
                </div>
            </div>
          </div>
        )}
    </div>
  );
}