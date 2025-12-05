import React from 'react';

export const TeoAvatar = () => <div className="w-8 h-8 min-w-[2rem] rounded-full bg-plinng-purple flex items-center justify-center text-white font-bold text-xs shadow-md">T</div>;
export const UserAvatar = () => <div className="w-8 h-8 min-w-[2rem] rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">Me</div>;
export const MobileTab = ({ icon, label, active, onClick }) => { const Icon = icon; return <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-plinng-purple' : 'text-gray-400'}`}><Icon size={20} /><span className="text-[10px] font-medium">{label}</span></button>; };
