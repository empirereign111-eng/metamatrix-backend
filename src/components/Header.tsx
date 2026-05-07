import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Eye } from 'lucide-react';

interface HeaderProps {
  onLogout?: () => void;
}

export const Header = React.memo(({ onLogout }: HeaderProps) => {
  const { isNavMinimized, setIsNavMinimized } = useAuth();
  
  return (
    <div className="sticky top-0 z-50 flex justify-center items-center py-4 mb-6 bg-[#0B0314]/80 backdrop-blur-xl border-b border-[#8B5CF6]/10 shadow-lg shadow-black/20 relative">
      <div className="flex items-center gap-4">
        <div className="border-colorful-3d rounded-xl px-8 py-2.5 bg-[#0F051D]/90 shadow-inner">
          <h1 className="text-2xl font-black text-gradient-animate whitespace-nowrap tracking-tight">
            MetaMatrix
          </h1>
        </div>
        
        {isNavMinimized && (
          <button 
            onClick={() => setIsNavMinimized(false)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-all font-bold text-[10px] shadow-[0_0_10px_rgba(139,92,246,0.2)] uppercase tracking-wider h-[44px]"
            title="Show Navigation Menu"
          >
            <Eye className="w-3 h-3" />
            Show Menu
          </button>
        )}
      </div>
    </div>
  );
});

