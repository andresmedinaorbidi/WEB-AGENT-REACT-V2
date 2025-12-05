import React from 'react';
import { Zap, CheckCircle2, Circle, Loader2, ArrowRight } from 'lucide-react';
import { TeoAvatar, UserAvatar } from './common';

const ChatInterface = ({
    messages,
    isTyping,
    isBriefComplete,
    liveBrief,
    startBuild,
    loading,
    chatInput,
    setChatInput,
    sendMessage,
    messagesEndRef
}) => {
    return (
        <div className="flex w-full h-full relative z-10">

            {/* CENTER CHAT CONTAINER - STABILIZED */}
            <div className="flex-1 flex flex-col relative h-full">

                {/* Messages Area - FLEX GROW (Takes all space between header and input) */}
                <div className="flex-1 overflow-y-auto space-y-8 no-scrollbar px-4 md:px-0">
                    <div className="w-full max-w-3xl mx-auto flex flex-col pt-8 pb-4">

                        {/* Header (Scrolls with messages now to avoid fixed overlap) */}
                        <div className="flex flex-col items-center justify-center gap-2 mb-10 opacity-80">
                            <div className="w-10 h-10 bg-[#beff50] rounded-xl flex items-center justify-center shadow-lg shadow-[#beff50]/30 transform -rotate-3"><Zap size={20} className="text-black fill-current" /></div>
                            <span className="font-bold tracking-tight text-gray-400 text-sm">plinng.flow</span>
                        </div>

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6`}>
                                {msg.role === 'ai' && <TeoAvatar />}
                                <div className={`max-w-[80%] p-5 text-[15px] leading-relaxed shadow-sm ${msg.role === 'user'
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
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        )}

                        {/* CONFIRMATION CARD */}
                        {isBriefComplete && (
                            <div className="mx-auto w-full max-w-sm bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-[#beff50] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.05)] animate-in zoom-in slide-in-from-bottom-6 mb-10">
                                <div className="flex items-center gap-3 mb-5 text-[#60259f]">
                                    <div className="p-2 bg-[#60259f]/10 rounded-full"><CheckCircle2 size={18} /></div>
                                    <span className="font-bold tracking-widest uppercase text-xs">Blueprint Ready</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Shall we build it?</h3>
                                <div className="space-y-3 mb-8">
                                    {Object.entries(liveBrief).map(([key, val]) => val && (
                                        <div key={key} className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                                            <span className="text-gray-400 capitalize font-medium">{key}</span>
                                            <span className="text-gray-900 font-bold text-right truncate max-w-[180px]">{val}</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={startBuild} disabled={loading} className="w-full py-4 bg-[#beff50] hover:bg-[#b0ef40] text-black font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-[#beff50]/20 hover:scale-[1.02] flex items-center justify-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" /> : <><Zap size={18} fill="currentColor" /> Initialize Construction</>}
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
                                placeholder="Describe your vision..."
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
                        <p className="text-center text-[10px] text-gray-400 mt-4 font-medium tracking-wide">Press Enter to chat</p>
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
                    {['name', 'industry', 'audience', 'vibe', 'sections'].map((field) => (
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
    );
};

export default ChatInterface;
