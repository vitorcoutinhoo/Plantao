import React from 'react';

interface ToolCardProps {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void; 
}

export function ToolCard({ label, icon, onClick }: ToolCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col items-center justify-center gap-5 group cursor-pointer border border-gray-100 outline-none rounded-2xl py-10 px-6 shadow-md bg-gradient-to-br from-white to-gray-50 hover:from-[#B5071A] hover:to-[#8a0514] hover:border-[#B5071A] hover:shadow-xl active:scale-95 transition-all duration-150"
    >
      <div className="text-[#B5071A] group-hover:text-white transition-colors duration-100">
        {icon}
      </div>
      <span className="text-[#1E1E1E] font-inter font-medium text-lg group-hover:text-white transition-colors duration-100 text-center w-full">
        {label}
      </span>
    </button>
  );
}