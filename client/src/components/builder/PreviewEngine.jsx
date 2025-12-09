import React, { useMemo } from 'react';
import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackCodeEditor } from "@codesandbox/sandpack-react";
import { Sparkles, Loader2 } from 'lucide-react';
import { wflowTheme, SMART_IMAGE_CODE } from '../../utils/constants';

const PreviewEngine = ({ rawCode, viewMode, previewWidth, loading, loadingText }) => {
  
  // 1. Dynamic Backend URL Logic
  // We calculate this once per render to inject into the SmartImage code
  const finalSmartImageCode = useMemo(() => {
    const backendUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000' 
      : window.location.origin;
    
    return SMART_IMAGE_CODE.replaceAll('__BACKEND_URL__', backendUrl);
  }, []);

  return (
    <div className="flex-1 overflow-hidden relative bg-gray-100 p-2 md:p-4 flex flex-col h-full">
      
      {/* ⚡ FORCE HEIGHT FIX (Scoped to this component) ⚡ */}
      <style>{`
        .sp-wrapper, .sp-layout, .sp-stack { height: 100% !important; width: 100% !important; }
        .sp-preview-container { height: 100% !important; flex: 1; display: flex !important; flex-direction: column; }
        .sp-preview-iframe { height: 100% !important; flex-grow: 1; }
        .sp-layout > div { height: 100%; width: 100%; }
      `}</style>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md transition-all duration-700">
            <div className="flex flex-col items-center gap-6 relative z-10">
              <div className="relative">
                  <div className="absolute inset-0 bg-[#beff50] blur-2xl opacity-60 animate-pulse rounded-full"></div>
                  <Loader2 size={64} className="text-[#60259f] animate-spin relative z-10" />
              </div>
              <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 tracking-widest uppercase animate-pulse">{loadingText}</h3>
              </div>
            </div>
        </div>
      )}

      {/* Sandpack Container */}
      <div className="h-full w-full shadow-2xl rounded-2xl overflow-hidden border border-gray-200 bg-white relative transition-all duration-500" style={{ width: window.innerWidth < 768 ? '100%' : previewWidth, margin: '0 auto' }}>
          
          {rawCode ? (
              <SandpackProvider
              template="react"
              theme={wflowTheme}
              style={{ height: '100%', width: '100%' }} 
              files={{
                "/App.js": rawCode,
                "/SmartImage.js": finalSmartImageCode,
                "/public/index.html": `<!DOCTYPE html>
                  <html lang="en">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Preview</title>
                      <script src="https://cdn.tailwindcss.com"></script>
                      <style>html, body, #root { height: 100%; margin: 0; }</style>
                    </head>
                    <body>
                      <div id="root"></div>
                    </body>
                  </html>`
              }}
              customSetup={{
                dependencies: {
                  "lucide-react": "0.263.1",
                  "framer-motion": "10.16.4",
                  "clsx": "2.0.0",
                  "tailwind-merge": "1.14.0",
                  "react-router-dom": "6.15.0"
                }
              }}
              options={{
                  showNavigator: true, 
                  showTabs: false,
                  externalResources: ["https://cdn.tailwindcss.com"],
                  autorun: true,
                  showErrorScreen: false
              }}
            >
              <SandpackLayout style={{ height: "100%", border: "none" }}>
                  <div className="flex h-full w-full">
                      {viewMode === 'code' && <SandpackCodeEditor style={{ height: "100%", flex: 1 }} />}
                      <SandpackPreview 
                          style={{ height: "100%", flex: 1, display: viewMode === 'preview' ? 'block' : 'none' }} 
                          showOpenInCodeSandbox={false} 
                          showRefreshButton={true}
                      />
                  </div>
              </SandpackLayout>
            </SandpackProvider>
          ) : (
              <div className="flex flex-col items-center justify-center h-full bg-white text-gray-400 gap-6">
                  <div className="w-24 h-24 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shadow-inner">
                      <Sparkles size={32} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium">Ready to build your vision.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default PreviewEngine;