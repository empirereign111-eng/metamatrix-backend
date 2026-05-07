import React from 'react';
import { CheckCircle, FileType2, RefreshCw, Trash2, ChevronDown, ChevronUp, Copy, Clock, Wand2, CheckCircle2, Eraser, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FileGroup, Metadata } from '../types';
import { validateMetadata, ALLOWED_CATEGORIES } from '../utils/seoAnalyzer';

interface FileGroupCardProps {
  group: FileGroup;
  isSelected: boolean;
  viewMode: 'grid' | 'list';
  imageFilter: string;
  validationPlatform: string;
  toggleExpand: (id: string) => void;
  toggleSelection: (id: string, e: React.MouseEvent) => void;
  updateMetadata: (id: string, field: keyof Metadata, value: string) => void;
  handleRetry: (id: string) => void;
  handleRemoveGroup: (id: string) => void;
  handleCleanKeywords: (id: string) => void;
  handleUndo: (id: string) => void;
  titleFixState: { state: 'idle' | 'removed' | 'replaced' } | undefined;
  tagsFixState: { state: 'idle' | 'removed' | 'replaced' } | undefined;
  handleTitleFix: (id: string, currentTitle: string) => void;
  handleTagsFix: (id: string, currentTags: string) => void;
  handleSEOAnalysis: (id: string) => void;
}

const FileGroupCardComponent = ({
  group,
  isSelected,
  viewMode,
  imageFilter,
  validationPlatform,
  toggleExpand,
  toggleSelection,
  updateMetadata,
  handleRetry,
  handleRemoveGroup,
  handleCleanKeywords,
  handleUndo,
  titleFixState,
  tagsFixState,
  handleTitleFix,
  handleTagsFix,
  handleSEOAnalysis
}: FileGroupCardProps) => {
  const getFilterStyle = (filterType: string): React.CSSProperties => {
    switch (filterType) {
      case 'grayscale': return { filter: 'grayscale(100%)' };
      case 'sepia': return { filter: 'sepia(100%)' };
      case 'vintage': return { filter: 'sepia(50%) hue-rotate(-30deg) saturate(140%) contrast(110%)' };
      case 'warm': return { filter: 'sepia(30%) saturate(140%) hue-rotate(-10deg)' };
      case 'cool': return { filter: 'saturate(120%) hue-rotate(10deg) brightness(110%)' };
      case 'dramatic': return { filter: 'contrast(150%) saturate(120%) brightness(90%)' };
      case 'brightness': return { filter: 'brightness(120%)' };
      case 'contrast': return { filter: 'contrast(130%)' };
      case 'saturate': return { filter: 'saturate(150%)' };
      case 'fade': return { filter: 'contrast(80%) brightness(120%) saturate(80%)' };
      default: return {};
    }
  };

  return (
    <div 
      className={`glass-card rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${viewMode === 'grid' ? 'h-full' : ''} ${isSelected ? 'border-[#22D3EE]/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]' : ''}`}
    >
      {/* Group Header */}
      <div 
        onClick={() => toggleExpand(group.id)}
        className={`p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors border-b border-[#8B5CF6]/10 ${viewMode === 'grid' ? 'flex-wrap gap-2' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className={`flex items-center justify-center w-5 h-5 rounded border cursor-pointer transition-all shrink-0 ${isSelected ? 'bg-[#22D3EE]/20 border-[#22D3EE]' : 'border-[#8B5CF6]/40 hover:border-[#22D3EE]'}`}
            onClick={(e) => toggleSelection(group.id, e)}
          >
            {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[#22D3EE]" />}
          </div>
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#1A0B2E] border border-[#8B5CF6]/20 flex items-center justify-center shrink-0 shadow-inner">
            {group.previewUrl ? (
              <img src={group.previewUrl} alt={group.baseName} style={getFilterStyle(imageFilter)} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
            ) : (
              <FileType2 className="w-6 h-6 text-slate-500" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[#F8FAFC] truncate" title={group.baseName}>{group.baseName}</p>
              {group.isDuplicate && (
                <span className="bg-rose-500/10 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-rose-500/20 tracking-wider" title={group.duplicateReason}>
                  Duplicate
                </span>
              )}
            </div>
            <div className="flex gap-1.5 mt-1 overflow-hidden">
              {group.files.map(f => (
                <span key={f.id} className="text-[9px] font-medium bg-[#8B5CF6]/10 text-[#C4B5FD] px-1.5 py-0.5 rounded uppercase border border-[#8B5CF6]/20">{f.extension}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {group.isGenerating && (
            <div className="flex items-center gap-1.5 text-[#22D3EE] text-[11px] font-semibold bg-[#22D3EE]/10 px-2.5 py-1 rounded-full border border-[#22D3EE]/20">
              <RefreshCw className="w-3 h-3 animate-spin" /> Processing
            </div>
          )}
          {group.metadata && !group.isGenerating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                <CheckCircle className="w-3 h-3" /> Ready
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry(group.id);
                }}
                className="text-slate-400 hover:text-[#22D3EE] transition-colors p-1.5 rounded-md hover:bg-[#22D3EE]/10"
                title="Regenerate Metadata"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {group.error && !group.isGenerating && (
            <div className="flex items-center gap-2">
              <span className="text-rose-400 text-[11px] font-semibold bg-rose-400/10 px-2.5 py-1 rounded-full border border-rose-400/20">Failed</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry(group.id);
                }}
                className="flex items-center gap-1.5 bg-rose-400/10 text-rose-400 px-2.5 py-1 rounded-full text-[11px] font-semibold hover:bg-rose-400/20 transition-colors border border-rose-400/20"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}
          <div className="h-6 w-px bg-[#8B5CF6]/20 mx-1"></div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveGroup(group.id);
            }}
            className="text-slate-500 hover:text-rose-400 transition-colors p-1.5 rounded-md hover:bg-rose-400/10"
            title="Remove File"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="p-1 rounded-md hover:bg-white/5 transition-colors">
            {group.isExpanded === false ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
      </div>

      {/* Group Content */}
      <AnimatePresence>
        {(group.isExpanded !== false) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >
            <div className={`p-5 flex gap-5 flex-1 ${viewMode === 'grid' ? 'flex-col' : 'flex-row'} bg-[#1A0B2E]/20`}>
              <div className={`${viewMode === 'grid' ? 'w-full' : 'w-56'} shrink-0 space-y-3`}>
                <div className="aspect-video rounded-xl overflow-hidden bg-[#0B0314] border border-[#8B5CF6]/20 flex items-center justify-center relative shadow-inner">
                  {group.previewUrl ? (
                    <img src={group.previewUrl} alt={group.baseName} style={getFilterStyle(imageFilter)} className="w-full h-full object-contain" referrerPolicy="no-referrer" loading="lazy" />
                  ) : (
                    <FileType2 className="w-12 h-12 text-slate-600" />
                  )}
                </div>
                {group.error && (
                  <div className="text-xs text-rose-400 bg-rose-400/10 p-3 rounded-lg text-center border border-rose-400/20 font-medium">
                    {group.error}
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-5 min-w-0">
                {group.metadata ? (
                  <>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5 flex-1 mr-5">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Title <span className="text-slate-500 font-normal normal-case">({group.metadata.title.length} chars)</span></label>
                          <div className="flex items-center gap-2">
                            {titleFixState?.state === 'removed' ? (
                              <button 
                                onClick={() => handleTitleFix(group.id, group.metadata!.title)}
                                className="text-[10px] text-yellow-400 hover:text-yellow-300 flex items-center justify-center bg-yellow-400/10 p-1.5 rounded-md transition-colors border border-yellow-400/20"
                                title="Replace Weak Words"
                              >
                                <Wand2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleTitleFix(group.id, group.metadata!.title)}
                                className={`text-[10px] flex items-center justify-center p-1.5 rounded-md transition-colors border ${titleFixState?.state === 'replaced' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 cursor-default' : 'text-rose-400 bg-rose-400/10 border-rose-400/20 hover:bg-rose-400/20'}`}
                                title={titleFixState?.state === 'replaced' ? "Weak Words Replaced" : "Remove Weak Words"}
                                disabled={titleFixState?.state === 'replaced'}
                              >
                                {titleFixState?.state === 'replaced' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Eraser className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <button 
                              onClick={() => navigator.clipboard.writeText(group.metadata!.title)}
                              className="text-[10px] text-[#22D3EE] hover:text-white flex items-center justify-center bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 p-1.5 rounded-md transition-colors border border-[#22D3EE]/20"
                              title="Copy Title"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <textarea 
                          value={group.metadata.title}
                          onChange={e => updateMetadata(group.id, 'title', e.target.value)}
                          rows={2}
                          className="w-full bg-[#0B0314] border border-[#8B5CF6]/30 rounded-xl px-4 py-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] resize-none transition-all shadow-inner"
                        />
                      </div>
                      <div className="shrink-0 flex flex-col gap-3">
                        <div className="text-center bg-[#0B0314] border border-[#8B5CF6]/30 rounded-xl p-3 min-w-[90px] shadow-inner">
                          <div className="text-[10px] font-bold text-[#CBD5F5] mb-1.5 uppercase tracking-wider">SEO Score</div>
                          <div className={`text-2xl font-black ${group.metadata.seoScore >= 90 ? 'text-emerald-400' : group.metadata.seoScore >= 70 ? 'text-blue-400' : group.metadata.seoScore >= 50 ? 'text-yellow-400' : 'text-rose-400'}`}>
                            {group.metadata.seoScore}%
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSEOAnalysis(group.id);
                          }}
                          className="flex items-center justify-center w-full bg-[#0B0314] border border-[#8B5CF6]/30 hover:border-[#22D3EE] hover:text-[#22D3EE] text-slate-400 rounded-xl p-2.5 transition-all hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                          title="SEO Analysis"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Description <span className="text-slate-500 font-normal normal-case">({group.metadata.description.length} chars, {group.metadata.description.trim() ? group.metadata.description.trim().split(/\s+/).length : 0} words)</span></label>
                      <textarea 
                        value={group.metadata.description}
                        onChange={e => updateMetadata(group.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full bg-[#0B0314] border border-[#8B5CF6]/30 rounded-xl px-4 py-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] resize-none transition-all shadow-inner"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Tags <span className="text-slate-500 font-normal normal-case">({group.metadata.tags.split(',').filter(t=>t.trim()).length} tags)</span></label>
                        <div className="flex gap-2">
                          {tagsFixState?.state === 'removed' ? (
                            <button 
                              onClick={() => handleTagsFix(group.id, group.metadata!.tags)}
                              className="text-[10px] text-yellow-400 hover:text-yellow-300 flex items-center justify-center bg-yellow-400/10 p-1.5 rounded-md transition-colors border border-yellow-400/20"
                              title="Replace Weak Tags"
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleTagsFix(group.id, group.metadata!.tags)}
                              className={`text-[10px] flex items-center justify-center p-1.5 rounded-md transition-colors border ${tagsFixState?.state === 'replaced' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 cursor-default' : 'text-rose-400 bg-rose-400/10 border-rose-400/20 hover:bg-rose-400/20'}`}
                              title={tagsFixState?.state === 'replaced' ? "Weak Tags Replaced" : "Remove Weak Tags"}
                              disabled={tagsFixState?.state === 'replaced'}
                            >
                              {tagsFixState?.state === 'replaced' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Eraser className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button 
                            onClick={() => navigator.clipboard.writeText(group.metadata!.tags)}
                            className="text-[10px] text-[#22D3EE] hover:text-white flex items-center justify-center bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 p-1.5 rounded-md transition-colors border border-[#22D3EE]/20"
                            title="Copy Keywords"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCleanKeywords(group.id)}
                            className="text-[10px] bg-[#8B5CF6]/10 text-[#C4B5FD] hover:bg-[#8B5CF6]/20 p-1.5 rounded-md transition-colors border border-[#8B5CF6]/20 flex items-center justify-center"
                            title="Clean Keywords"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          {group.history && group.history.length > 1 && (
                            <button
                              onClick={() => handleUndo(group.id)}
                              className="text-[10px] bg-slate-800/50 text-slate-300 hover:bg-slate-700 p-1.5 rounded-md transition-colors border border-slate-700 flex items-center justify-center"
                              title="Undo"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea 
                        value={group.metadata.tags}
                        onChange={e => updateMetadata(group.id, 'tags', e.target.value)}
                        rows={2}
                        className="w-full bg-[#0B0314] border border-[#8B5CF6]/30 rounded-xl px-4 py-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] resize-none transition-all shadow-inner"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Category</label>
                      <select 
                        value={group.metadata.category || ''}
                        onChange={e => updateMetadata(group.id, 'category', e.target.value)}
                        className="w-full bg-[#0B0314] border border-[#8B5CF6]/30 rounded-xl px-4 py-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all shadow-inner appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select a category</option>
                        {ALLOWED_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {validationPlatform !== 'none' && validateMetadata(group.metadata, validationPlatform).length > 0 && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 space-y-2 mt-4">
                        <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                          <Activity className="w-4 h-4" /> Platform Warnings ({validationPlatform})
                        </div>
                        <ul className="list-disc list-inside text-xs text-rose-300/90 space-y-1.5 ml-1">
                          {validateMetadata(group.metadata, validationPlatform).map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : group.isGenerating ? (
                  <div className="h-full flex flex-col justify-center space-y-6 p-4">
                    <div className="flex items-center gap-3 text-[#22D3EE] mb-2 bg-[#22D3EE]/10 w-fit px-5 py-2.5 rounded-full border border-[#22D3EE]/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22D3EE] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22D3EE]"></span>
                      </div>
                      <span className="font-bold text-sm tracking-wide">{group.statusText || 'Analyzing image with AI...'}</span>
                    </div>
                    <div className="space-y-5 w-full">
                      <div className="space-y-2.5">
                        <div className="h-3 bg-[#8B5CF6]/30 rounded w-16 skeleton"></div>
                        <div className="h-12 bg-[#0B0314] border border-[#8B5CF6]/20 rounded-xl w-full skeleton"></div>
                      </div>
                      <div className="space-y-2.5">
                        <div className="h-3 bg-[#8B5CF6]/30 rounded w-24 skeleton"></div>
                        <div className="h-20 bg-[#0B0314] border border-[#8B5CF6]/20 rounded-xl w-full skeleton"></div>
                      </div>
                      <div className="space-y-2.5">
                        <div className="h-3 bg-[#8B5CF6]/30 rounded w-12 skeleton"></div>
                        <div className="h-24 bg-[#0B0314] border border-[#8B5CF6]/20 rounded-xl w-full skeleton"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Ready to generate metadata
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FileGroupCard = React.memo(FileGroupCardComponent, (prev, next) => {
  return prev.group === next.group &&
         prev.isSelected === next.isSelected &&
         prev.viewMode === next.viewMode &&
         prev.imageFilter === next.imageFilter &&
         prev.validationPlatform === next.validationPlatform &&
         prev.titleFixState === next.titleFixState &&
         prev.tagsFixState === next.tagsFixState;
});
