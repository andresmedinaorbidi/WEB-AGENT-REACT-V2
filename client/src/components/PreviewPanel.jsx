import React from 'react';
import { Monitor, Tablet, Smartphone, Code, Loader2, Sparkles } from 'lucide-react';

const PreviewPanel = ({
    mobileTab,
    previewWidth,
    setPreviewWidth,
    loading,
    loadingText,
    viewMode,
    setViewMode,
    siteUrl,
    rawCode
}) => {
    return (
        <div className={`flex-1 bg-[#f3f4f6] relative flex flex-col h-full ${mobileTab === 'chat' ? 'hidden md:flex' : 'flex'}`}>
            <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 z-20 shadow-sm shrink-0">
                <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">{['100%', '768px', '375px'].map((w, i) => (<button key={w} onClick={() => setPreviewWidth(w)} className={`p-1.5 rounded-md transition-all ${previewWidth === w ? 'bg-white text-[#60259f] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{i === 0 ? <Monitor size={16} /> : i === 1 ? <Tablet size={16} /> : <Smartphone size={16} />}</button>))}</div>
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
    );
};

export default PreviewPanel;
