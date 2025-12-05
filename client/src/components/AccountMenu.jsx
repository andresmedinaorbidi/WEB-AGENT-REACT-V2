import React from 'react';
import { X, Download, Upload, LogOut } from 'lucide-react';

const AccountMenu = ({
    username,
    handleNameChange,
    exportData,
    importData,
    factoryReset,
    fileInputRef,
    setShowAccountMenu
}) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center md:absolute md:inset-auto md:bottom-20 md:left-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setShowAccountMenu(false)}></div>
            <div className="relative w-[90%] md:w-72 bg-white p-1 rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 md:slide-in-from-bottom-2">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center"><span className="text-xs font-bold text-[#60259f] uppercase tracking-wider">Settings</span><button onClick={() => setShowAccountMenu(false)}><X size={16} className="text-gray-400 hover:text-gray-900" /></button></div>
                <div className="p-4 space-y-4">
                    <div><label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1 block">Name</label><input value={username} onChange={handleNameChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-[#60259f] outline-none" /></div>
                    <div className="grid grid-cols-2 gap-2"><button onClick={exportData} className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#beff50] hover:bg-green-50 transition-colors"><Download size={16} className="text-gray-500" /><span className="text-[10px] text-gray-500 font-medium">Backup</span></button><button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#60259f] hover:bg-purple-50 transition-colors"><Upload size={16} className="text-gray-500" /><span className="text-[10px] text-gray-500 font-medium">Restore</span></button></div>
                    <button onClick={factoryReset} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"><LogOut size={14} /> Reset App</button>
                </div>
            </div>
        </div>
    );
};

export default AccountMenu;
