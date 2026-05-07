import React from 'react';
import { FileType2, FileSpreadsheet, FileJson, FileCode, CheckCircle, Upload } from 'lucide-react';

interface ExportPanelProps {
  exportFormat: 'csv' | 'xlsx' | 'json' | 'xmp';
  setExportFormat: (format: 'csv' | 'xlsx' | 'json' | 'xmp') => void;
  selectedPlatform: string;
  setSelectedPlatform: (platform: string) => void;
  handleExport: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  exportFormat,
  setExportFormat,
  selectedPlatform,
  setSelectedPlatform,
  handleExport
}) => {
  return (
    <div className="bg-[#1A0B2E]/50 border-colorful-3d rounded-xl p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#F1F5F9] mb-1">Export Options</h2>
          <p className="text-xs text-[#94A3B8]">Choose platforms and format to export your metadata</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'csv', name: 'CSV', icon: <FileType2 className="w-4 h-4" /> },
            { id: 'xlsx', name: 'XLSX', icon: <FileSpreadsheet className="w-4 h-4" /> },
            { id: 'json', name: 'JSON', icon: <FileJson className="w-4 h-4" /> },
            { id: 'xmp', name: 'XMP', icon: <FileCode className="w-4 h-4" /> },
          ].map(format => (
            <button
              key={format.id}
              onClick={() => setExportFormat(format.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${
                exportFormat === format.id
                  ? 'bg-[#22D3EE]/20 border-[#22D3EE] text-[#22D3EE]'
                  : 'bg-[#0F051D] border-[#8B5CF6]/20 text-[#94A3B8] hover:border-[#22D3EE]/50'
              }`}
            >
              {format.icon}
              {format.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {[
          { id: 'adobe', name: 'Adobe', icon: 'St', color: 'bg-black' },
          { id: 'shutterstock', name: 'Shutter', icon: 'S', color: 'bg-red-500 text-white' },
          { id: 'freepik', name: 'Freepik', icon: 'F', color: 'bg-blue-500' },
          { id: 'dreamstime', name: 'Dreamstime', icon: 'D', color: 'bg-blue-600 text-white' },
          { id: 'vecteezy', name: 'Vecteezy', icon: 'v', color: 'bg-rose-500' },
          { id: 'istock', name: 'iStock', icon: 'iS', color: 'bg-black' },
          { id: 'pond5', name: 'Pond5', icon: 'P5', color: 'bg-slate-900' },
          { id: 'depositphotos', name: 'Deposti', icon: 'd', color: 'bg-white text-black' },
          { id: '123rf', name: '123RF', icon: '123', color: 'bg-yellow-500 text-black' },
        ].map(platform => (
          <button 
            key={platform.id} 
            onClick={() => setSelectedPlatform(platform.id)}
            className={`bg-[#0F051D] border-colorful-3d rounded-lg p-2 flex flex-col items-center justify-center gap-1.5 transition-all group relative h-20`}
          >
            {selectedPlatform === platform.id && (
              <div className="absolute top-1 right-1">
                <CheckCircle className="w-3 h-3 text-[#22D3EE]" />
              </div>
            )}
            <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${platform.color}`}>
              {platform.icon}
            </div>
            <span className={`text-[8px] font-bold text-center leading-tight ${selectedPlatform === platform.id ? 'text-[#22D3EE]' : 'text-[#CBD5F5] group-hover:text-[#22D3EE]'}`}>{platform.name}</span>
          </button>
        ))}
      </div>
      
      <button 
        onClick={handleExport}
        className="w-full bg-gradient-to-r from-[#22D3EE] to-[#6366F1] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity text-lg"
      >
        <Upload className="w-5 h-5" /> Export File
      </button>
    </div>
  );
};
