import React from 'react';
import { User, Settings, Download, Upload, LogOut, Trash2, X } from 'lucide-react';
import teoImage from '../../assets/teo.avif'; // Adjust this path if needed!

// 2. Avatars
export const TeoAvatar = () => (
  <img 
    src={teoImage} 
    alt="Teo AI" 
    className="w-8 h-8 min-w-[2rem] rounded-full object-cover shadow-md border border-gray-200"
  />
);
export const UserAvatar = () => <div className="w-8 h-8 min-w-[2rem] rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">Me</div>;

// --- SUB COMPONENTS ---
export const MobileTab = ({ icon: Icon, label, active, onClick }) => <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-plinng-purple' : 'text-gray-400'}`}><Icon size={20} /><span className="text-[10px] font-medium">{label}</span></button>;
export const HistoryContent = ({ history, loadFromHistory, clearHistory }) => (<div className="space-y-3">{history.length === 0 ? <p className="text-xs text-gray-400 text-center py-10">No history yet.</p> : history.map((item) => (<button key={item.id} onClick={() => loadFromHistory(item)} className="w-full text-left p-3 rounded-xl bg-white border border-gray-200 hover:border-[#60259f] hover:shadow-md transition-all group"><p className="text-xs font-bold text-gray-800 truncate mb-1">{item.prompt}</p><div className="flex justify-between items-center"><span className="text-[10px] text-gray-400">{item.timestamp}</span><span className="text-[10px] text-plinng-purple opacity-0 group-hover:opacity-100 transition-opacity font-bold">Restore</span></div></button>))}{history.length > 0 && <button onClick={clearHistory} className="w-full py-2 text-xs text-red-500 hover:text-red-600 flex items-center justify-center gap-2 mt-4"><Trash2 size={12} /> Clear History</button>}</div>);
export const AccountFooter = ({ username, showAccountMenu, setShowAccountMenu }) => (<div className="w-full"><button onClick={() => setShowAccountMenu(!showAccountMenu)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 text-left transition-colors group"><div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#60259f] to-indigo-600 p-[2px]"><div className="w-full h-full rounded-full bg-white flex items-center justify-center"><User size={16} className="text-[#60259f]" /></div></div><div className="flex-1"><p className="text-xs font-bold text-gray-900">{username}</p><p className="text-[10px] text-gray-500">Pro Plan</p></div><Settings size={16} className="text-gray-400 group-hover:text-[#60259f] transition-colors" /></button></div>);