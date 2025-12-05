import React from 'react';
import { Zap, Settings, MessageSquare, History, Send, Globe, Download, User, Trash2 } from 'lucide-react';
import { TeoAvatar } from './common';

const Sidebar = ({
    activeSidebarTab,
    setActiveSidebarTab,
    messages,
    chatInput,
    setChatInput,
    sendMessage,
    deploy,
    downloadCode,
    deployUrl,
    history,
    loadFromHistory,
    clearHistory,
    username,
    showAccountMenu,
    setShowAccountMenu,
    messagesEndRef
}) => {
    return (
        <div className="hidden md:flex w-96 flex-col border-r border-gray-200 bg-white z-30 shadow-2xl relative">
            <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#beff50] rounded-lg flex items-center justify-center shadow-lg shadow-[#beff50]/20"><Zap size={18} className="text-black fill-current" /></div>
                    <div className="flex flex-col"><h1 className="text-xl font-bold tracking-tight leading-none text-gray-900">wflow</h1><span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Builder</span></div>
                </div>
                <button onClick={() => setShowAccountMenu(!showAccountMenu)} className="md:hidden p-2 text-gray-400"><Settings size={18} /></button>
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
    );
};

const HistoryContent = ({ history, loadFromHistory, clearHistory }) => (<div className="space-y-3">{history.length === 0 ? <p className="text-xs text-gray-400 text-center py-10">No history yet.</p> : history.map((item) => (<button key={item.id} onClick={() => loadFromHistory(item)} className="w-full text-left p-3 rounded-xl bg-white border border-gray-200 hover:border-[#60259f] hover:shadow-md transition-all group"><p className="text-xs font-bold text-gray-800 truncate mb-1">{item.prompt}</p><div className="flex justify-between items-center"><span className="text-[10px] text-gray-400">{item.timestamp}</span><span className="text-[10px] text-plinng-purple opacity-0 group-hover:opacity-100 transition-opacity font-bold">Restore</span></div></button>))}{history.length > 0 && <button onClick={clearHistory} className="w-full py-2 text-xs text-red-500 hover:text-red-600 flex items-center justify-center gap-2 mt-4"><Trash2 size={12} /> Clear History</button>}</div>);
const AccountFooter = ({ username, showAccountMenu, setShowAccountMenu }) => (<div className="w-full"><button onClick={() => setShowAccountMenu(!showAccountMenu)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 text-left transition-colors group"><div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#60259f] to-indigo-600 p-[2px]"><div className="w-full h-full rounded-full bg-white flex items-center justify-center"><User size={16} className="text-[#60259f]" /></div></div><div className="flex-1"><p className="text-xs font-bold text-gray-900">{username}</p><p className="text-[10px] text-gray-500">Pro Plan</p></div><Settings size={16} className="text-gray-400 group-hover:text-[#60259f] transition-colors" /></button></div>);

export default Sidebar;
