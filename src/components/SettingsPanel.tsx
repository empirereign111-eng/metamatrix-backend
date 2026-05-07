import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, ChevronUp, ChevronDown, SlidersHorizontal, CheckCircle, Clock } from 'lucide-react';
import { Provider, ApiKey, FileGroup } from '../types';
import { MODELS } from '../constants';
import { ApiKeyManager } from './ApiKeyManager';

interface SettingsPanelProps {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  provider: Provider;
  setProvider: (provider: Provider) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  apiKeys: Record<Provider, ApiKey[]>;
  newKey: string;
  setNewKey: (key: string) => void;
  handleAddKey: () => void;
  handleActivateKey: (id: string) => void;
  handleRemoveKey: (id: string, e: React.MouseEvent) => void;
  resetKeys: () => void;
  isApiKeysVisible: boolean;
  setIsApiKeysVisible: (visible: boolean) => void;
  isMetadataLimitsVisible: boolean;
  setIsMetadataLimitsVisible: (visible: boolean) => void;
  activePreset: string;
  setActivePreset: (preset: string) => void;
  minTitleLength: number;
  setMinTitleLength: (val: number) => void;
  maxTitleLength: number;
  setMaxTitleLength: (val: number) => void;
  minDescriptionLength: number;
  setMinDescriptionLength: (val: number) => void;
  maxDescriptionLength: number;
  setMaxDescriptionLength: (val: number) => void;
  keywordCount: number;
  setKeywordCount: (val: number) => void;
  tagGenerationMode: 'single' | 'multi' | 'long';
  setTagGenerationMode: (mode: 'single' | 'multi' | 'long') => void;
  imageFilter: string;
  setImageFilter: (val: string) => void;
  processingMode: 'safe' | 'turbo';
  setProcessingMode: (mode: 'safe' | 'turbo') => void;
  stats: { requests: number; success: number; generated: number };
  fileGroups: FileGroup[];
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isSettingsOpen,
  setIsSettingsOpen,
  provider,
  setProvider,
  selectedModel,
  setSelectedModel,
  apiKeys,
  newKey,
  setNewKey,
  handleAddKey,
  handleActivateKey,
  handleRemoveKey,
  resetKeys,
  isApiKeysVisible,
  setIsApiKeysVisible,
  isMetadataLimitsVisible,
  setIsMetadataLimitsVisible,
  activePreset,
  setActivePreset,
  minTitleLength,
  setMinTitleLength,
  maxTitleLength,
  setMaxTitleLength,
  minDescriptionLength,
  setMinDescriptionLength,
  maxDescriptionLength,
  setMaxDescriptionLength,
  keywordCount,
  setKeywordCount,
  tagGenerationMode,
  setTagGenerationMode,
  imageFilter,
  setImageFilter,
  processingMode,
  setProcessingMode,
  stats,
  fileGroups
}) => {
  return (
    <div className="glass-card rounded-xl shadow-sm mb-6 border-colorful-3d">
      <div 
        className={`p-3 flex justify-between items-center cursor-pointer hover:bg-[#8B5CF6]/10 transition-colors ${isSettingsOpen ? 'rounded-t-xl border-b border-[#8B5CF6]/20' : 'rounded-xl'}`}
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
      >
        <div className="flex items-center gap-3 text-[#22D3EE] font-bold tracking-wide">
          <Settings className="w-5 h-5" />
          API Key & Model Settings
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium bg-[#22D3EE]/10 px-3 py-1.5 rounded-full border border-[#22D3EE]/20">
            <div className="w-2 h-2 rounded-full bg-[#22D3EE] shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse"></div>
            Using {provider.charAt(0).toUpperCase() + provider.slice(1)}
          </div>
          {isSettingsOpen ? <ChevronUp className="w-5 h-5 text-[#94A3B8]" /> : <ChevronDown className="w-5 h-5 text-[#94A3B8]" />}
        </div>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Select Provider</label>
                  <div className="flex gap-2 p-1.5 bg-[#0B0314] rounded-xl border-colorful-3d shadow-inner">
                    {(['gemini', 'grok', 'mixtral'] as Provider[]).map(p => (
                      <button 
                        key={p}
                        onClick={() => {
                          setProvider(p);
                          setSelectedModel(MODELS[p][0].id);
                        }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                          provider === p 
                            ? 'bg-gradient-to-br from-[#22D3EE] to-[#6366F1] text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-white/10' 
                            : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${provider === p ? 'bg-white animate-pulse' : 'bg-slate-600'}`}></div>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Select {provider.charAt(0).toUpperCase() + provider.slice(1)} Model</label>
                  <div className="relative border-colorful-3d rounded-xl p-1.5">
                    <select 
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                      className="w-full bg-[#0B0314] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] appearance-none shadow-inner font-medium transition-all"
                    >
                      {MODELS[provider].map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] pointer-events-none" />
                  </div>
                </div>
              </div>

              <ApiKeyManager 
                provider={provider}
                apiKeys={apiKeys}
                newKey={newKey}
                setNewKey={setNewKey}
                handleAddKey={handleAddKey}
                handleActivateKey={handleActivateKey}
                handleRemoveKey={handleRemoveKey}
                resetKeys={resetKeys}
                isApiKeysVisible={isApiKeysVisible}
                setIsApiKeysVisible={setIsApiKeysVisible}
              />

              <div 
                className="flex items-center justify-between cursor-pointer p-1.5 bg-[#0B0314] border-colorful-3d rounded-xl shadow-inner hover:bg-[#8B5CF6]/10 transition-colors relative z-40"
                onClick={() => setIsMetadataLimitsVisible(!isMetadataLimitsVisible)}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#22D3EE] uppercase tracking-wider">
                  <Settings className="w-4 h-4" />
                  Metadata Limits
                </div>
                <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${isMetadataLimitsVisible ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {isMetadataLimitsVisible && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#0B0314] border-colorful-3d rounded-xl p-6 space-y-8 shadow-inner relative z-30 mt-2">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Metadata Presets</label>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {[
                              { id: 'custom', name: 'Custom' },
                              { id: 'adobe', name: 'Adobe Stock', minT: 85, maxT: 120, minD: 60, maxD: 110, k: 55 },
                              { id: 'shutterstock', name: 'Shutterstock', minT: 100, maxT: 200, minD: 100, maxD: 200, k: 50 },
                              { id: 'freepik', name: 'Freepik', minT: 50, maxT: 100, minD: 50, maxD: 100, k: 50 },
                              { id: 'vecteezy', name: 'Vecteezy', minT: 50, maxT: 100, minD: 50, maxD: 100, k: 40 },
                              { id: 'dreamstime', name: 'Dreamstime', minT: 50, maxT: 100, minD: 50, maxD: 100, k: 50 },
                              { id: 'commercial', name: 'Commercial', minT: 100, maxT: 150, minD: 80, maxD: 120, k: 50 },
                              { id: 'minimal', name: 'Minimal', minT: 40, maxT: 60, minD: 30, maxD: 50, k: 15 },
                              { id: 'vector', name: 'Vector/Illustration', minT: 60, maxT: 100, minD: 50, maxD: 80, k: 40 }
                            ].map(preset => (
                              <button
                                key={preset.id}
                                onClick={() => {
                                  setActivePreset(preset.id);
                                  if (preset.id !== 'custom') {
                                    setMinTitleLength(preset.minT!);
                                    setMaxTitleLength(preset.maxT!);
                                    setMinDescriptionLength(preset.minD!);
                                    setMaxDescriptionLength(preset.maxD!);
                                    setKeywordCount(preset.k!);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                  activePreset === preset.id 
                                    ? 'bg-[#22D3EE]/20 border-[#22D3EE] text-[#22D3EE] shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                                    : 'bg-[#1A0B2E]/50 border-[#8B5CF6]/30 text-slate-400 hover:border-[#8B5CF6]/60 hover:text-[#F8FAFC]'
                                }`}
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Min Title</label>
                              <span className="text-sm font-mono text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded-md border border-[#22D3EE]/20">{minTitleLength}</span>
                            </div>
                            <input 
                              type="range" 
                              min="10" 
                              max="200" 
                              value={minTitleLength} 
                              onChange={(e) => { setMinTitleLength(parseInt(e.target.value)); setActivePreset('custom'); }}
                              className="w-full h-2 bg-[#1A0B2E] rounded-lg appearance-none cursor-pointer accent-[#22D3EE] border border-[#8B5CF6]/20 shadow-inner"
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Max Title</label>
                              <span className="text-sm font-mono text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded-md border border-[#22D3EE]/20">{maxTitleLength}</span>
                            </div>
                            <input 
                              type="range" 
                              min="10" 
                              max="200" 
                              value={maxTitleLength} 
                              onChange={(e) => { setMaxTitleLength(parseInt(e.target.value)); setActivePreset('custom'); }}
                              className="w-full h-2 bg-[#1A0B2E] rounded-lg appearance-none cursor-pointer accent-[#22D3EE] border border-[#8B5CF6]/20 shadow-inner"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Min Description</label>
                              <span className="text-sm font-mono text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded-md border border-[#22D3EE]/20">{minDescriptionLength}</span>
                            </div>
                            <input 
                              type="range" 
                              min="10" 
                              max="300" 
                              value={minDescriptionLength} 
                              onChange={(e) => { setMinDescriptionLength(parseInt(e.target.value)); setActivePreset('custom'); }}
                              className="w-full h-2 bg-[#1A0B2E] rounded-lg appearance-none cursor-pointer accent-[#22D3EE] border border-[#8B5CF6]/20 shadow-inner"
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Max Description</label>
                              <span className="text-sm font-mono text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded-md border border-[#22D3EE]/20">{maxDescriptionLength}</span>
                            </div>
                            <input 
                              type="range" 
                              min="10" 
                              max="300" 
                              value={maxDescriptionLength} 
                              onChange={(e) => { setMaxDescriptionLength(parseInt(e.target.value)); setActivePreset('custom'); }}
                              className="w-full h-2 bg-[#1A0B2E] rounded-lg appearance-none cursor-pointer accent-[#22D3EE] border border-[#8B5CF6]/20 shadow-inner"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Keywords Count</label>
                            <span className="text-sm font-mono text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded-md border border-[#22D3EE]/20">{keywordCount}</span>
                          </div>
                          <input 
                            type="range" 
                            min="5" 
                            max="100" 
                            value={keywordCount} 
                            onChange={(e) => { setKeywordCount(parseInt(e.target.value)); setActivePreset('custom'); }}
                            className="w-full h-2 bg-[#1A0B2E] rounded-lg appearance-none cursor-pointer accent-[#22D3EE] border border-[#8B5CF6]/20 shadow-inner"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider">Tag Generation Mode</label>
                          </div>
                          <div className="flex gap-2 p-1.5 bg-[#0B0314] rounded-xl border-colorful-3d shadow-inner">
                            <button 
                              onClick={() => setTagGenerationMode('single')}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                tagGenerationMode === 'single' 
                                  ? 'bg-gradient-to-br from-[#22D3EE] to-[#6366F1] text-white shadow-[0_0_10px_rgba(99,102,241,0.3)] border border-white/10' 
                                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
                              }`}
                            >
                              Single Tag
                            </button>
                            <button 
                              onClick={() => setTagGenerationMode('multi')}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                tagGenerationMode === 'multi' 
                                  ? 'bg-gradient-to-br from-[#22D3EE] to-[#6366F1] text-white shadow-[0_0_10px_rgba(99,102,241,0.3)] border border-white/10' 
                                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
                              }`}
                            >
                              Multi Tag
                            </button>
                            <button 
                              onClick={() => setTagGenerationMode('long')}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                tagGenerationMode === 'long' 
                                  ? 'bg-gradient-to-br from-[#22D3EE] to-[#6366F1] text-white shadow-[0_0_10px_rgba(99,102,241,0.3)] border border-white/10' 
                                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
                              }`}
                            >
                              Long Tag
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#22D3EE]" />
                    Image Pre-processing
                  </label>
                  <div className="relative border-colorful-3d rounded-xl">
                    <select 
                      value={imageFilter}
                      onChange={e => setImageFilter(e.target.value)}
                      className="w-full bg-[#0B0314] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] appearance-none shadow-inner font-medium transition-all"
                    >
                      <option value="none">None (Original Image)</option>
                      <option value="auto-enhance">Auto Enhance</option>
                      <option value="sharpen">Sharpen Details</option>
                      <option value="denoise">Denoise / Smooth</option>
                      <option value="grayscale">Grayscale</option>
                      <option value="sepia">Sepia</option>
                      <option value="vintage">Vintage</option>
                      <option value="warm">Warm</option>
                      <option value="cool">Cool</option>
                      <option value="dramatic">Dramatic</option>
                      <option value="brightness">Brightness</option>
                      <option value="contrast">Contrast</option>
                      <option value="saturate">Saturate</option>
                      <option value="invert">Invert</option>
                      <option value="blur">Blur</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-[#CBD5F5] uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#22D3EE]" />
                    Processing Mode
                  </label>
                  <div className="flex gap-2 p-1.5 bg-[#0B0314] rounded-xl border-colorful-3d shadow-inner">
                    <button 
                      onClick={() => setProcessingMode('safe')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        processingMode === 'safe' 
                          ? 'bg-gradient-to-br from-[#22D3EE] to-[#6366F1] text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-white/10' 
                          : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
                      }`}
                    >
                      Safe
                    </button>
                    <button 
                      onClick={() => setProcessingMode('turbo')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        processingMode === 'turbo' 
                          ? 'bg-gradient-to-br from-[#F59E0B] to-[#EF4444] text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-white/10' 
                          : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
                      }`}
                    >
                      Turbo
                    </button>
                  </div>
                </div>
              </div>


              <div className="flex items-center justify-between bg-[#0B0314] border-colorful-3d rounded-xl p-4 shadow-inner relative z-0 mt-8">
                <div className="flex flex-col items-center flex-1 border-r border-[#8B5CF6]/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Settings className="w-4 h-4 text-[#22D3EE]" />
                    <span className="text-[10px] font-bold tracking-wider text-[#CBD5F5] uppercase">Requests</span>
                  </div>
                  <div className="text-xl font-black text-[#F8FAFC] leading-none">{stats.requests}</div>
                </div>
                <div className="flex flex-col items-center flex-1 border-r border-[#8B5CF6]/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-bold tracking-wider text-[#CBD5F5] uppercase">Success</span>
                  </div>
                  <div className="text-xl font-black text-emerald-400 leading-none">{stats.requests ? Math.round((stats.success / stats.requests) * 100) : 100}%</div>
                </div>
                <div className="flex flex-col items-center flex-1 border-r border-[#8B5CF6]/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Settings className="w-4 h-4 text-[#8B5CF6]" />
                    <span className="text-[10px] font-bold tracking-wider text-[#CBD5F5] uppercase">Generated</span>
                  </div>
                  <div className="text-xl font-black text-[#F8FAFC] leading-none">{stats.generated}</div>
                </div>
                <div className="flex flex-col items-center flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-4 h-4 text-[#F59E0B]" />
                    <span className="text-[10px] font-bold tracking-wider text-[#CBD5F5] uppercase">Remaining</span>
                  </div>
                  {fileGroups.length > 0 && fileGroups.filter(g => !g.metadata).length === 0 ? (
                    <div className="text-sm font-black text-emerald-400 leading-none h-[20px] flex items-center">All Done</div>
                  ) : (
                    <div className="text-xl font-black text-[#F8FAFC] leading-none">{fileGroups.filter(g => !g.metadata).length}</div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
