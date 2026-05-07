import React, { useRef } from 'react';
import { Plus, Upload, Image as ImageIcon, FileType2, CloudUpload } from 'lucide-react';

interface FileUploaderProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  processFiles: (files: File[]) => void;
}

export const FileUploader = React.memo(({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  processFiles
}: FileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div 
      className={`glass-card rounded-2xl p-4 text-center transition-all duration-300 border-colorful-3d ${
        isDragging 
          ? 'bg-[#8B5CF6]/10 scale-[1.02] shadow-[0_0_30px_rgba(139,92,246,0.2)]' 
          : 'bg-[#1A0B2E]/40 hover:bg-[#1A0B2E]/60'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input 
        type="file" 
        multiple 
        className="hidden" 
        ref={fileInputRef}
        onChange={e => e.target.files && processFiles(Array.from(e.target.files))}
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-[#8B5CF6]/20' : 'bg-[#1A0B2E]'}`}>
          <CloudUpload className={`w-10 h-10 transition-colors duration-300 ${isDragging ? 'text-[#22D3EE]' : 'text-[#8B5CF6]'}`} />
        </div>
        
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[#F8FAFC]">Drag & Drop Files</h3>
          <p className="text-sm text-[#94A3B8]">or click to browse your computer</p>
        </div>

        <button 
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = ".jpg,.jpeg,.png,.eps,.svg,.ai";
              fileInputRef.current.click();
            }
          }}
          className="btn-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 mt-2 border-colorful-3d"
        >
          <Upload className="w-4 h-4" /> Browse Files
        </button>
        
        <div className="flex flex-wrap justify-center gap-3 mt-6 pt-6 border-t border-[#8B5CF6]/10 w-full max-w-md">
          <button 
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = ".jpg,.jpeg";
                fileInputRef.current.click();
              }
            }}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-2 py-1 rounded-full transition-all hover:scale-105 border-colorful-3d"
          >
            <ImageIcon className="w-3.5 h-3.5" /> JPG
          </button>
          <button 
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = ".png";
                fileInputRef.current.click();
              }
            }}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 px-2 py-1 rounded-full transition-all hover:scale-105 border-colorful-3d"
          >
            <ImageIcon className="w-3.5 h-3.5" /> PNG
          </button>
          <button 
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = ".eps";
                fileInputRef.current.click();
              }
            }}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-2 py-1 rounded-full transition-all hover:scale-105 border-colorful-3d"
          >
            <FileType2 className="w-3.5 h-3.5" /> EPS
          </button>
          <button 
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = ".ai";
                fileInputRef.current.click();
              }
            }}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-orange-400 bg-orange-400/10 hover:bg-orange-400/20 px-2 py-1 rounded-full transition-all hover:scale-105 border-colorful-3d"
          >
            <FileType2 className="w-3.5 h-3.5" /> AI
          </button>
          <button 
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = ".svg";
                fileInputRef.current.click();
              }
            }}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 px-2 py-1 rounded-full transition-all hover:scale-105 border-colorful-3d"
          >
            <FileType2 className="w-3.5 h-3.5" /> SVG
          </button>
        </div>
      </div>
    </div>
  );
});
