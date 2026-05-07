import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Settings, ChevronUp, ChevronDown, Key, RefreshCw, Plus, Trash2, CheckCircle, Upload, Image as ImageIcon, FileType2, X, Search, Copy, Clock, LayoutGrid, List, FileJson, FileSpreadsheet, FileCode, Sparkles, Filter, SlidersHorizontal, AlertCircle, CheckCircle2, Activity, Eraser, Wand2, Save, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApiKeys } from '../hooks/useApiKeys';
import { useFileGroups } from '../hooks/useFileGroups';
import { Provider, ApiKey, FileGroup, FileItem, Metadata, SEOAnalysis } from '../types';
import { MODELS } from '../constants';
import { calculateSEO, analyzeSEO, validateMetadata, WEAK_WORDS_MAP, WEAK_TAGS, cleanTrailingStopWords } from '../utils/seoAnalyzer';
import { applyImageFilter } from '../utils/imageProcessing';
import { generateMetadata } from '../services/ai';
import { motion, AnimatePresence } from 'motion/react';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';
import { Header } from '../components/Header';
import { SettingsPanel } from '../components/SettingsPanel';
import { FileUploader } from '../components/FileUploader';
import { FileGroupCard } from '../components/FileGroupCard';
import { ALLOWED_CATEGORIES } from '../utils/seoAnalyzer';
import { ExportPanel } from '../components/ExportPanel';

// 👉 LIVE RENDER API URL (Added)
const API_BASE_URL = 'https://metamatrix-backend.onrender.com';

const generateId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const DEFAULT_GEMINI_KEYS_LIST: string[] = [];

const DEFAULT_KEYS: Record<Provider, ApiKey[]> = {
  gemini: [],
  grok: [],
  mixtral: []
};

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
    case 'invert': return { filter: 'invert(100%)' };
    case 'blur': return { filter: 'blur(4px)' };
    default: return {};
  }
};


export const PlanDashboard = React.memo(({ user }: { user: any }) => {
  const [remainingDays, setRemainingDays] = useState<number | null>(null);

  const calculate = useCallback(() => {
    if (!user.accessEnd) return;
    const end = new Date(user.accessEnd);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    setRemainingDays(diff);
  }, [user.accessEnd]);

  useEffect(() => {
    calculate();
    const interval = setInterval(calculate, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [calculate]);

  if (!user.planName) return null;

  // Usage stats moved to useMemo for better efficiency
  const { usagePercent, isLimitReached } = useMemo(() => {
    const percent = Math.min(100, (user.usageCount / (user.maxLimit || 1)) * 100);
    const limitReached = user.maxLimit !== -1 && user.usageCount >= user.maxLimit;
    return { usagePercent: percent, isLimitReached: limitReached };
  }, [user.usageCount, user.maxLimit]);

  return (
    <div className="bg-[#1A0B2E] border border-purple-500/30 rounded-xl pt-4 px-4 pb-3 mb-6 text-white text-sm shadow-2xl relative overflow-hidden group min-h-[140px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-colors"></div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2 text-purple-200 text-sm">
            <Sparkles className="w-4 h-4 text-purple-400" /> Subscription & Usage
          </h3>
          {isLimitReached && (
            <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse border border-red-500/30">
              Limit Over
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white/5 p-2 rounded-md border border-white/5 flex flex-col justify-center">
            <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5 leading-none">Plan</label>
            <div className="font-black text-[#22D3EE] text-xs truncate uppercase tracking-tight leading-tight">{user.planName}</div>
          </div>
          
          <div className="bg-white/5 p-2 rounded-md border border-white/5 flex flex-col justify-center">
            <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5 leading-none">Days Left</label>
            <div className="font-black text-xs truncate leading-tight">{remainingDays !== null ? (remainingDays < 0 ? 'Expired' : `${remainingDays}`) : '-'}</div>
          </div>
          
          <div className="bg-white/5 p-2 rounded-md border border-white/5 flex flex-col justify-center">
            <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5 leading-none">Reset</label>
            <div className="font-black capitalize text-purple-300 text-xs truncate leading-tight">{user.limitType || 'Daily'}</div>
          </div>
          
          <div className="bg-white/5 p-2 rounded-md border border-white/5 flex flex-col justify-center">
            <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5 leading-none">Limit</label>
            <div className="font-black text-xs truncate leading-tight">{user.maxLimit === -1 ? '∞' : user.maxLimit}</div>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex flex-col gap-2">
             <div className="flex justify-between items-end">
               <label className="text-[9px] uppercase font-bold text-slate-500">File Usage</label>
               <div className="font-black text-xs tracking-wide">
                 <span className={isLimitReached ? 'text-red-400' : 'text-[#22D3EE]'}>{user.usageCount}</span>
                 <span className="text-slate-500 mx-1 opacity-50">/</span>
                 <span className="text-slate-300">{user.maxLimit === -1 ? '∞' : user.maxLimit}</span>
               </div>
             </div>
             <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${usagePercent}%` }}
                   className={`h-full relative z-10 ${isLimitReached ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]'}`}
                ></motion.div>
              </div>
          </div>
        </div>

        {isLimitReached && (
          <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg mt-1.5">
            <AlertCircle className="w-3 h-3 text-red-400" />
            <p className="text-[10px] text-red-400 font-medium">
              Daily/Monthly limit reached. Please contact admin to upgrade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

type ToastMessage = { id: string; type: 'success' | 'error' | 'warning'; message: string };

export const Workspace = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const showToast = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000); // Auto dismiss
  }, []);

  const { token, user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<Provider>('gemini');
  const [minTitleLength, setMinTitleLength] = useState<number>(85);
  const [maxTitleLength, setMaxTitleLength] = useState<number>(120);
  const [minDescriptionLength, setMinDescriptionLength] = useState<number>(60);
  const [maxDescriptionLength, setMaxDescriptionLength] = useState<number>(110);
  const [keywordCount, setKeywordCount] = useState<number>(55);
  const [tagGenerationMode, setTagGenerationMode] = useState<'single' | 'multi' | 'long'>('multi');
  const tagGenerationModeRef = useRef(tagGenerationMode);
  const [imageFilter, setImageFilter] = useState<string>('none');
  const imageFilterRef = useRef(imageFilter);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkTitleAdd, setBulkTitleAdd] = useState('');
  const [bulkTitleRemove, setBulkTitleRemove] = useState('');
  const [bulkTagsAdd, setBulkTagsAdd] = useState('');
  const [bulkTagsRemove, setBulkTagsRemove] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'pending' | 'failed'>('all');
  const [validationPlatform, setValidationPlatform] = useState<string>('none');
  const [activePreset, setActivePreset] = useState<string>('custom');
  const [sortBy, setSortBy] = useState<'pending' | 'failed' | 'seo'>('pending');
  const [seoRange, setSeoRange] = useState<[number, number]>([0, 100]);
  const [quickFilter, setQuickFilter] = useState<'all' | 'failed' | 'high-seo' | 'needs-fix' | 'selected'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [processingMode, setProcessingMode] = useState<'safe' | 'turbo'>('safe');
  const isGeneratingRef = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { fileGroups, setFileGroups, fileGroupsRef } = useFileGroups();
  const [isDragging, setIsDragging] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type FixState = 'idle' | 'removed' | 'replaced';
  const [titleFixState, setTitleFixState] = useState<Record<string, { state: FixState, original: string }>>({});
  const [tagsFixState, setTagsFixState] = useState<Record<string, { state: FixState, original: string }>>({});

  // Auto-save file groups metadata to localStorage
  useEffect(() => {
    const savedGroups = localStorage.getItem('metamatrix_file_groups');
    if (savedGroups) {
      try {
        const parsed = JSON.parse(savedGroups);
        // We can't restore File objects or previewUrls, but we can restore metadata
        setFileGroups(parsed.map((g: any) => ({
          ...g,
          files: g.files.map((f: any) => ({ ...f, file: new File([], f.file.name) })), // Dummy files
          isGenerating: false,
          previewUrl: '' // Previews lost on refresh
        })));
      } catch (e) {
        console.error('Failed to load saved groups', e);
      }
    }
  }, []);

  useEffect(() => {
    // Save only metadata and structure, not the actual files
    const groupsToSave = fileGroups.map(g => ({
      id: g.id,
      baseName: g.baseName,
      metadata: g.metadata,
      error: g.error,
      history: g.history,
      files: g.files.map(f => ({
        id: f.id,
        type: f.type,
        baseName: f.baseName,
        extension: f.extension,
        file: { name: f.file.name } // Only save name
      }))
    }));
    localStorage.setItem('metamatrix_file_groups', JSON.stringify(groupsToSave));
  }, [fileGroups]);

  useEffect(() => {
    imageFilterRef.current = imageFilter;
  }, [imageFilter]);

  useEffect(() => {
    tagGenerationModeRef.current = tagGenerationMode;
  }, [tagGenerationMode]);

  const { apiKeys, apiKeysRef, setApiKeys, handleAddKey: addKey, handleRemoveKey: removeKey, handleActivateKey: activateKey, resetKeys } = useApiKeys(provider);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [activeSEOAnalysisGroupId, setActiveSEOAnalysisGroupId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'up' | 'down') => {
    const el = scrollContainerRef.current;
    if (el) {
      const amount = 400;
      el.scrollBy({
        top: direction === 'up' ? -amount : amount,
        behavior: 'smooth'
      });
    }
  };
  const [isApiKeysVisible, setIsApiKeysVisible] = useState(false);
  const [isMetadataLimitsVisible, setIsMetadataLimitsVisible] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('adobe');
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json' | 'xmp'>('csv');
  const [exportExtension, setExportExtension] = useState<'eps' | 'jpg' | 'png' | 'ai' | 'svg'>('eps');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  // No-op to remove the original declarations later in the file
  
  const [stats, setStats] = useState({ requests: 0, success: 0, generated: 0 });
  const globalCooldownUntilRef = useRef<number | null>(null);

  const handleAddKey = () => {
    addKey(newKey, newBaseUrl);
    setNewKey('');
    setNewBaseUrl('');
  };

  const handleRemoveKey = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeKey(id);
  };

  const handleActivateKey = (id: string) => {
    activateKey(id);
  };

  const [isAllExpanded, setIsAllExpanded] = useState(false);

  const toggleExpand = (groupId: string) => {
    setFileGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, isExpanded: g.isExpanded === undefined ? false : !g.isExpanded } : g
    ));
  };

  const toggleAllExpand = () => {
    const nextState = !isAllExpanded;
    setIsAllExpanded(nextState);
    setFileGroups(prev => prev.map(g => ({ ...g, isExpanded: nextState })));
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGroups(prev => 
      prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]
    );
  };

  const applyBulkEdit = () => {
    setFileGroups(prev => prev.map(group => {
      if (!selectedGroups.includes(group.id) || !group.metadata) return group;
      
      let updatedMetadata = { ...group.metadata };
      
      // Title Edit
      if (bulkTitleAdd.trim() || bulkTitleRemove.trim()) {
        let currentTitle = updatedMetadata.title;
        
        if (bulkTitleRemove.trim()) {
          const wordsToRemove = bulkTitleRemove.split(',').map(w => w.trim()).filter(w => w);
          wordsToRemove.forEach(word => {
            currentTitle = currentTitle.replace(new RegExp(`\\b${word}\\b`, 'gi'), '').replace(/\s+/g, ' ').trim();
          });
        }
        
        if (bulkTitleAdd.trim()) {
          const wordsToAdd = bulkTitleAdd.split(',').map(w => w.trim()).filter(w => w);
          currentTitle = `${currentTitle} ${wordsToAdd.join(' ')}`.trim();
        }
        
        updatedMetadata.title = cleanTrailingStopWords(currentTitle);
      }
      
      // Tags Edit
      if (bulkTagsAdd.trim() || bulkTagsRemove.trim()) {
        let existingTags = updatedMetadata.tags.split(',').map(t => t.trim()).filter(t => t);
        
        if (bulkTagsRemove.trim()) {
          const tagsToRemove = bulkTagsRemove.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
          existingTags = existingTags.filter(t => !tagsToRemove.includes(t.toLowerCase()));
        }
        
        if (bulkTagsAdd.trim()) {
          const tagsToAdd = bulkTagsAdd.split(',').map(t => t.trim()).filter(t => t);
          existingTags = [...existingTags, ...tagsToAdd];
        }
        
        updatedMetadata.tags = Array.from(new Set(existingTags)).join(', ');
      }
      
      if (bulkCategory.trim()) {
        updatedMetadata.category = bulkCategory.trim();
      }
      
      const analysisResult = analyzeSEO(updatedMetadata.title, updatedMetadata.description, updatedMetadata.tags, updatedMetadata.category);
      updatedMetadata.seoScore = analysisResult.score;
      updatedMetadata.seoAnalysis = analysisResult;

      const history = group.history ? [...group.history, group.metadata] : [group.metadata];
      return { ...group, metadata: updatedMetadata, history };
    }));
    
    setIsBulkEditOpen(false);
    setBulkTitleAdd('');
    setBulkTitleRemove('');
    setBulkTagsAdd('');
    setBulkTagsRemove('');
    setBulkCategory('');
    setSelectedGroups([]);
  };

  const cleanKeywords = (tagsString: string): string => {
    // Remove special characters, keep only letters, numbers, spaces, and commas
    const sanitized = tagsString.replace(/[^a-zA-Z0-9, ]/g, '');
    const tags = sanitized.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    const uniqueTags = Array.from(new Set(tags));
    return uniqueTags.join(', ');
  };

  const handleCleanKeywords = (groupId: string) => {
    setFileGroups(prev => prev.map(group => {
      if (group.id !== groupId || !group.metadata) return group;
      const cleanedTags = cleanKeywords(group.metadata.tags);
      const analysisResult = analyzeSEO(group.metadata.title, group.metadata.description, cleanedTags, group.metadata.category);
      const newSeoScore = analysisResult.score;
      const history = group.history ? [...group.history, group.metadata] : [group.metadata];
      return { 
        ...group, 
        metadata: { ...group.metadata, tags: cleanedTags, seoScore: newSeoScore, seoAnalysis: analysisResult },
        history
      };
    }));
  };

  const handleSEOAnalysis = (groupId: string) => {
    setFileGroups(prev => prev.map(group => {
      if (group.id !== groupId || !group.metadata) return group;
      const analysisResult = analyzeSEO(
        group.metadata.title, 
        group.metadata.description, 
        group.metadata.tags, 
        group.metadata.category
      );
      return {
        ...group,
        metadata: { 
          ...group.metadata, 
          seoScore: analysisResult.score, 
          seoAnalysis: analysisResult 
        }
      };
    }));
    setActiveSEOAnalysisGroupId(groupId);
  };

  const handleUndo = (groupId: string) => {
    setFileGroups(prev => prev.map(group => {
      if (group.id !== groupId || !group.history || group.history.length === 0) return group;
      const newHistory = [...group.history];
      const previousMetadata = newHistory.pop()!;
      return { ...group, metadata: previousMetadata, history: newHistory };
    }));
  };

  const processSingleGroup = async (groupId: string, isRetry: boolean = false): Promise<{ success: boolean, isRateLimit?: boolean }> => {
    const updateStatus = (text: string | undefined) => {
      setFileGroups(prev => prev.map(g => g.id === groupId ? { ...g, statusText: text } : g));
    };

    let success = false;
    let attempts = 0;
    let jsonErrors = 0;
    let lastError = '';
    const keys = apiKeysRef.current[provider];
    const maxAttempts = Math.max(keys.length * 3, 10); // Safe max attempt count
    let currentModel = selectedModel;
    let backoffDelay = 2000;

    while (!success && attempts < maxAttempts) {
      if (!isGeneratingRef.current) return { success: false };

      const group = fileGroupsRef.current.find(g => g.id === groupId);
      if (!group) return { success: false };

      if (globalCooldownUntilRef.current && globalCooldownUntilRef.current > Date.now()) {
        const waitTime = globalCooldownUntilRef.current - Date.now();
        updateStatus(`Global cooldown active. Waiting ${Math.ceil(waitTime/1000)}s...`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      const now = Date.now();
      const currentKeys = apiKeysRef.current[provider];
      
      // Find a key that is valid and not on cooldown
      const availableKey = currentKeys
            .filter(k => k.isValid !== false && (!k.cooldownUntil || k.cooldownUntil < now))
            .sort((a, b) => (a.lastUsed || 0) - (b.lastUsed || 0))[0];

      if (!availableKey) {
        const hasValidKeys = currentKeys.some(k => k.isValid !== false);
        if (!hasValidKeys) {
          // Auto-reset keys when all are invalid
          resetKeys();
          apiKeysRef.current = {
            ...apiKeysRef.current,
            [provider]: apiKeysRef.current[provider].map(k => ({ ...k, isValid: null, cooldownUntil: undefined }))
          };
          updateStatus(`All keys exhausted. Auto-resetting keys...`);
          await new Promise(r => setTimeout(r, 2000));
          attempts++;
          continue;
        }
        
        // Wait for the shortest cooldown
        const cooldowns = currentKeys.filter(k => k.cooldownUntil && k.cooldownUntil > now).map(k => k.cooldownUntil!);
        if (cooldowns.length > 0) {
          const nextCooldown = Math.min(...cooldowns);
          const waitTime = Math.max(1000, nextCooldown - now);
          
          updateStatus(`Waiting for API cooldown (${Math.ceil(waitTime/1000)}s)...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        } else {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
      }

      // SYNCHRONOUSLY update lastUsed to prevent race conditions between concurrent workers
      // If we use the async setApiKeys callback here, multiple workers starting at the same time
      // will all pick the exact same key, instantly exhausting its quota.
      apiKeysRef.current = {
        ...apiKeysRef.current,
        [provider]: apiKeysRef.current[provider].map(k => 
          k.id === availableKey.id ? { ...k, lastUsed: Date.now() } : k
        )
      };
      setApiKeys(apiKeysRef.current);

      setStats(s => ({ ...s, requests: s.requests + 1 }));
      
      try {
        const imageFile = group.files.find(f => f.type === 'image')?.file;
        if (!imageFile) throw new Error('No JPG/PNG found for this group to analyze.');

        let finalImageFile = imageFile;
        if (imageFilterRef.current !== 'none') {
          updateStatus(`Applying image filter...`);
          finalImageFile = await applyImageFilter(imageFile, imageFilterRef.current);
        }

        updateStatus(`Analyzing image with AI (Attempt ${attempts + 1})...${(lastError && !lastError.toLowerCase().includes('quota') && !lastError.toLowerCase().includes('limit')) ? ` [Last error: ${lastError.substring(0, 100)}]` : ''}`);
        
        // 👉 USAGE INCREMENT (USING LIVE URL) 
        try {
          const usageRes = await fetch(`${API_BASE_URL}/api/usage/increment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!usageRes.ok) {
            let errorData: any = {};
            try {
              const text = await usageRes.text();
              try {
                errorData = JSON.parse(text);
              } catch (e) {
                errorData = { message: text.substring(0, 100) || 'Error' };
              }
            } catch (e) {
              errorData = { message: 'Network error or limit reached' };
            }

            // Handle specific limit error to prevent AI generation
            if (usageRes.status === 403) {
              const hardLimitError = new Error('Limit Over');
              (hardLimitError as any).isUsageLimit = true;
              throw hardLimitError;
            }
            throw new Error(errorData.message || 'Usage limit reached');
          }
          await refreshUser();
        } catch (e: any) {
          if (e.isUsageLimit) throw e;
          throw new Error(e.message || 'Failed to verify usage limit');
        }

        const metadata = await generateMetadata(provider, currentModel, availableKey.key, finalImageFile, availableKey.baseUrl, minTitleLength, maxTitleLength, minDescriptionLength, maxDescriptionLength, keywordCount, tagGenerationModeRef.current);
        
        if (!isGeneratingRef.current) return { success: false };

        const cleanedTitle = cleanTrailingStopWords(metadata.title);
        const cleanedTags = cleanKeywords(metadata.tags);
        const analysisResult = analyzeSEO(cleanedTitle, metadata.description, cleanedTags, metadata.category);
        const seoScore = analysisResult.score;

        setFileGroups(prev => prev.map(g => g.id === groupId ? { 
          ...g, 
          isGenerating: false, 
          metadata: { ...metadata, title: cleanedTitle, tags: cleanedTags, seoScore, seoAnalysis: analysisResult },
          history: [{ ...metadata, title: cleanedTitle, tags: cleanedTags, seoScore, seoAnalysis: analysisResult }],
          error: undefined,
          statusText: undefined
        } : g));
        
        setStats(s => ({ ...s, success: s.success + 1, generated: s.generated + 1 }));
        success = true;
        return { success: true };
      } catch (error: any) {
        const rawErrorMsg = (error.message || String(error)).toLowerCase();
        const isRateLimit = rawErrorMsg.includes('quota') || rawErrorMsg.includes('rate limit') || rawErrorMsg.includes('429') || rawErrorMsg.includes('too many requests');
        
        if (isRateLimit) {
          console.warn(`[Process Warning] Group ${groupId}: Rate limit exceeded. Retrying...`);
        } else {
          console.error(`[Process Error] Group ${groupId}:`, error);
        }
        
        let rawError = error.message || '';
        if (error.status) rawError += ` Status: ${error.status}`;
        try {
          if (typeof error === 'object' && error !== null) {
            rawError += ' ' + JSON.stringify(error);
          }
        } catch (e) {}
        rawError = rawError || String(error) || '';
        lastError = rawError;
        
        const errorMsg = rawError.toLowerCase();
        const isUsageLimitError = error.isUsageLimit === true || errorMsg.includes('limit over') || (errorMsg.includes('limit') && !errorMsg.includes('quota') && !errorMsg.includes('rate'));
        
        const isQuotaError = !isUsageLimitError && (errorMsg.includes('quota') || 
                            errorMsg.includes('limit') || 
                            errorMsg.includes('429') || 
                            errorMsg.includes('too many requests') ||
                            errorMsg.includes('exhausted') ||
                            errorMsg.includes('resource_exhausted') ||
                            errorMsg.includes('rate limit'));

        const isHardQuotaError = isQuotaError && (errorMsg.includes('billing details') || errorMsg.includes('exceeded your current quota'));

        // Only treat as hard auth error if it's explicitly an API key issue, NOT a quota issue
        const isAuthError = !isQuotaError && !isUsageLimitError && (
                           errorMsg.includes('api key') || 
                           errorMsg.includes('key not valid') || 
                           errorMsg.includes('unauthorized') || 
                           errorMsg.includes('401') || 
                           (errorMsg.includes('403') && !errorMsg.includes('quota')) || 
                           errorMsg.includes('authentication') ||
                           errorMsg.includes('api_key_invalid') ||
                           (errorMsg.includes('project') && errorMsg.includes('enable'))
        );
                           
        // Ensure quota errors (which sometimes return 400) are NOT misclassified as fatal errors
        const isFatalError = !isQuotaError && !isUsageLimitError && !isAuthError && (
                            (errorMsg.includes('400') && !errorMsg.includes('json')) || 
                            errorMsg.includes('bad request') || 
                            errorMsg.includes('invalid argument') || 
                            errorMsg.includes('payload too large') ||
                            errorMsg.includes('no jpg/png') ||
                            errorMsg.includes('safety') ||
                            errorMsg.includes('not found') ||
                            errorMsg.includes('404') ||
                            errorMsg.includes('schema') ||
                            errorMsg.includes('mime')
        );

        const isJsonError = !isUsageLimitError && errorMsg.includes('json') && !errorMsg.includes('<html>');

        const getErrorReason = (isQuotaError: boolean, isAuthError: boolean, isFatalError: boolean, isJsonError: boolean, rawError: string) => {
          if (isUsageLimitError) return 'Limit Over';
          if (isQuotaError) return 'Waiting for retry...';
          if (isAuthError) return 'Invalid API key';
          if (isFatalError) return 'Fatal error';
          if (isJsonError) return 'Invalid AI response';
          if (rawError.toLowerCase().includes('timeout')) return 'Request timed out';
          return `Error: ${rawError.substring(0, 50)}`;
        };

        if (isUsageLimitError || isFatalError) {
          setFileGroups(prev => prev.map(g => g.id === groupId ? { ...g, isGenerating: false, error: isUsageLimitError ? 'User Usage Limit Reached' : `Fatal Error: ${rawError}`, statusText: getErrorReason(isQuotaError, isAuthError, isFatalError, isJsonError, rawError) } : g));
          return { success: false };
        }

        if (isJsonError) {
          jsonErrors++;
          if (jsonErrors > 3) {
            setFileGroups(prev => prev.map(g => g.id === groupId ? { ...g, isGenerating: false, error: `Failed to generate valid JSON after 3 attempts.`, statusText: getErrorReason(isQuotaError, isAuthError, isFatalError, isJsonError, rawError) } : g));
            return { success: false };
          }
          updateStatus(`Invalid AI response. Retrying...`);
          await new Promise(r => setTimeout(r, 2000));
        } else if (isAuthError || isHardQuotaError) {
          // Synchronous update to prevent other workers from using this invalid key
          apiKeysRef.current = {
            ...apiKeysRef.current,
            [provider]: apiKeysRef.current[provider].map(k => k.id === availableKey.id ? { ...k, isValid: false } : k)
          };
          setApiKeys(apiKeysRef.current);
          updateStatus(isHardQuotaError ? `Switching API key...` : `Invalid API Key. Switching...`);
          // Don't wait on auth errors, immediately try the next key
        } else if (isQuotaError) {
          // Synchronous update to prevent other workers from using this exhausted key
          const cooldownTime = 5 * 1000;
          // 5 seconds cooldown for rate limits
          apiKeysRef.current = {
            ...apiKeysRef.current,
            [provider]: apiKeysRef.current[provider].map(k => k.id === availableKey.id ? { ...k, cooldownUntil: Date.now() + cooldownTime } : k)
          };
          setApiKeys(apiKeysRef.current);
          
          // Trigger global cooldown so we don't spam 429s across all keys if they share a project
          globalCooldownUntilRef.current = Date.now() + 2000;
          // 2 second global pause

          // Model fallback logic
          if (currentModel.includes('3.1-pro') || currentModel.includes('3-pro')) {
             currentModel = 'gemini-2.5-flash';
             updateStatus(`Switching to 2.5 Flash for next attempt...`);
          } else if (currentModel.includes('2.5-flash')) {
             currentModel = 'gemini-1.5-flash';
             updateStatus(`Switching to 1.5 Flash for next attempt...`);
          }

          const jitter = Math.floor(Math.random() * 2000);
          updateStatus(`Next attempt in ${((backoffDelay + jitter)/1000).toFixed(1)}s...`);
          await new Promise(r => setTimeout(r, backoffDelay + jitter));
          backoffDelay = Math.min(backoffDelay * 2, 32000);
          // Exponential backoff up to 32s
        } else {
          updateStatus(`Error: ${rawError.substring(0, 40)}... Retrying in ${backoffDelay/1000}s...`);
          // For other errors, wait a bit
          await new Promise(r => setTimeout(r, backoffDelay));
          backoffDelay = Math.min(backoffDelay * 2, 32000);
        }

        attempts++;
        if (attempts >= maxAttempts) {
          const errorDisplay = isQuotaError ? 'Max attempts reached due to API limits.' : `Max attempts reached. Last error: ${rawError}`;
          setFileGroups(prev => prev.map(g => g.id === groupId ? { ...g, isGenerating: false, error: errorDisplay, statusText: getErrorReason(isQuotaError, isAuthError, isFatalError, isJsonError, rawError) } : g));
          return { success: false, isRateLimit: isQuotaError };
        }
      }
    }
    return { success: false };
  };

  const handleRetry = async (groupId: string) => {
    const group = fileGroups.find(g => g.id === groupId);
    if (!group || group.isGenerating) return;

    setFileGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, isGenerating: true, error: undefined } : g
    ));
    await processSingleGroup(groupId, true);
  };

  const handleRemoveGroup = (groupId: string) => {
    setFileGroups(prev => prev.filter(g => g.id !== groupId));
    setSelectedGroups(prev => prev.filter(id => id !== groupId));
  };

  const processFiles = async (files: File[]) => {
    const newGroups: Record<string, { files: FileItem[], isDuplicate: boolean, duplicateReason?: string }> = {};
    const duplicateNames: string[] = [];
    const duplicateImages: string[] = [];
    // EPS handling
    const epsFiles = files.filter(f => ['eps', 'ai'].includes(f.name.split('.').pop()?.toLowerCase() || ''));
    // We will process EPS files separately and pass their converted JPG preview URLs
    const processedEpsFiles = await Promise.all(epsFiles.map(async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = localStorage.getItem('metamatrix_token');
            // 👉 EPS CONVERSION (USING LIVE URL) 
            const res = await fetch(`${API_BASE_URL}/api/convert-eps`, { 
                method: 'POST', 
                body: formData,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Conversion failed');
            const data = await res.json();
            // 👉 EPS PREVIEW PATH FIX 
            return { file: file, previewUrl: API_BASE_URL + '/' + data.preview };
        } catch (e) {
            console.error('Eps conversion error:', e);
            return { file: file, previewUrl: '' }; // Fallback
        }
    }));
    files.forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      
      let isDuplicate = false;
      let duplicateReason = '';

      // Determine type
      let type: FileItem['type'] = 'other';
      if (['jpg', 'jpeg', 'png'].includes(extension)) type = 'image';
      else if (['eps', 'ai'].includes(extension)) type = 'eps';
      else if (extension === 'svg') type = 'svg';

      // Check for duplicate basename in current fileGroups
      const existingGroup = fileGroups.find(g => g.baseName === baseName);
      const batchGroup = newGroups[baseName];
      const allExistingFiles = [
        ...(existingGroup?.files || []),
        ...(batchGroup?.files || [])
      ];

      // A file is a duplicate if:
      // 1. A file of the same type already exists for this basename
      //    (Special case: image and svg are both treated as previews, so they duplicate each other)
      const isPreview = (t: string) => t === 'image' || t === 'svg';
      const hasDuplicateType = allExistingFiles.some(f => 
        f.type === type || (isPreview(f.type) && isPreview(type))
      );
      if (type !== 'other' && hasDuplicateType) {
        duplicateNames.push(file.name);
        isDuplicate = true;
        duplicateReason = 'Duplicate Preview/Source';
      }

      // Check for same image (size + lastModified as proxy for hash)
      if (fileGroups.some(g => g.files.some(f => f.file.size === file.size && f.file.lastModified === file.lastModified && f.file.name !== file.name))) {
        duplicateImages.push(file.name);
        isDuplicate = true;
        duplicateReason = 'Image Content Duplicate';
      }

      if (!newGroups[baseName]) newGroups[baseName] = { files: [], isDuplicate, duplicateReason };
      const epsData = processedEpsFiles.find(e => e.file === file);
      
      newGroups[baseName].files.push({
        id: generateId(),
        file,
        previewUrl: (type === 'image' || type === 'svg') ? URL.createObjectURL(file) : (epsData?.previewUrl || ''),
        type,
        baseName,
        extension
      });
    });

    setFileGroups(prev => {
      // Create a deep copy of the groups to avoid mutating existing state
      const updated = prev.map(group => ({
        ...group,
        files: [...group.files]
      }));
      
      Object.keys(newGroups).forEach(baseName => {
        const existingGroupIndex = updated.findIndex(g => g.baseName === baseName);
        const { files: groupFiles, isDuplicate, duplicateReason } = newGroups[baseName];
        
        // Find best preview
        const previewFile = groupFiles.find(f => f.type === 'image' || f.type === 'svg');
        const previewUrl = previewFile ? previewFile.previewUrl : '';

        if (existingGroupIndex >= 0) {
          const currentGroup = updated[existingGroupIndex];
          currentGroup.files.push(...groupFiles);
          
          if (!currentGroup.previewUrl && previewUrl) {
            currentGroup.previewUrl = previewUrl;
          }

          // Recalculate duplicate status for the whole group
          const files = currentGroup.files;
          const isPreview = (t: string) => t === 'image' || t === 'svg';
          const hasDuplicateType = files.some((f1, i) => 
            files.some((f2, j) => {
              if (i === j || f1.type === 'other' || f2.type === 'other') return false;
              return f1.type === f2.type || (isPreview(f1.type) && isPreview(f2.type));
            })
          );
          if (hasDuplicateType || isDuplicate) {
            currentGroup.isDuplicate = true;
            currentGroup.duplicateReason = hasDuplicateType ? 'Duplicate Preview/Source' : duplicateReason;
          }
        } else {
          updated.push({
            id: generateId(),
            baseName,
            files: [...groupFiles],
            previewUrl,
            isGenerating: false,
            isExpanded: isAllExpanded,
            isDuplicate,
            duplicateReason
          });
        }
      });
      return updated;
    });
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };
  useEffect(() => {
    import('../socket').then(({ socket }) => {
      const handleStopBatch = () => {
        if (isGeneratingRef.current) {
          if (window.electron) window.electron.invoke('stop-batch');
          isGeneratingRef.current = false;
          setIsGenerating(false);
          setFileGroups(prev => prev.map(g => g.isGenerating ? { ...g, isGenerating: false, statusText: undefined } : g));
          showToast('warning', 'Batch processing stopped by Admin');
        }
      };
      socket.on('stop-batch', handleStopBatch);
      return () => {
        socket.off('stop-batch', handleStopBatch);
      };
    });
  }, [showToast]);
  useEffect(() => {
    if (window.electron) {
      window.electron.on('batch-progress', (data: any) => {
        import('../socket').then(({ socket }) => {
          if (data.type === 'stats') {
             setStats(s => ({ ...s, success: s.success + (data.success || 0), generated: s.generated + (data.success || 0), requests: s.requests + (data.requests || 0) }));
          }
          
          if (data.groupId) {
             setFileGroups(prev => prev.map(g => {
                if (g.id === data.groupId) {
                   if (data.status === 'completed') {
                      socket.emit('batch:progress', { completed: 1, failed: 0 });
                      return { 
                         ...g, 
                         isGenerating: false, 
                         metadata: data.metadata,
                         history: [data.metadata],
                         error: undefined,
                         statusText: undefined
                      };
                   } else if (data.status === 'error') {
                      socket.emit('batch:progress', { completed: 0, failed: 1 });
                      return { ...g, isGenerating: false, error: data.error, statusText: data.statusText };
                   } else if (data.status === 'update') {
                      return { ...g, statusText: data.statusText };
                   }
                }
                return g;
             }));
          }

          if (data.type === 'done') {
             socket.emit('batch:completed', { message: 'Finished successfully' });
             isGeneratingRef.current = false;
             setIsGenerating(false);
             showToast('success', 'Batch processing completed');
          }
        });
      });
      window.electron.on('notify', (data: any) => {
        showToast(data.type || 'success', data.message || 'Notification');
      });
    }
    return () => {
       if (window.electron) {
         window.electron.removeAllListeners('batch-progress');
         window.electron.removeAllListeners('notify');
       }
    };
  }, [showToast]);

  const handleGenerateMetadata = async () => {
    if (isGeneratingRef.current) {
      if (window.electron) {
         window.electron.invoke('stop-batch');
      }
      isGeneratingRef.current = false;
      setIsGenerating(false);
      // Reset groups that are currently in "generating" state but don't have metadata
      setFileGroups(prev => prev.map(g => g.isGenerating ? { ...g, isGenerating: false, statusText: undefined } : g));
      return;
    }
    
    const groupsToProcess = fileGroups.filter(g => !g.metadata && !g.isGenerating);
    if (groupsToProcess.length === 0) return;

    if (user && user.maxLimit !== -1 && user.usageCount >= user.maxLimit) {
      showToast('warning', 'Daily limit reached');
      if (window.electron) {
         window.electron.invoke('notify-desktop', { title: 'Limit Reached', body: 'Daily/Monthly limit reached. Please contact admin to upgrade.' });
      }
      return;
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);
    setFileGroups(prev => prev.map(g => 
      groupsToProcess.find(pg => pg.id === g.id) ? { ...g, isGenerating: true, error: undefined } : g
    ));
    // Determine base concurrency based on model
    let baseConcurrency = 1;
    if (selectedModel.includes('3.1-pro-preview')) {
      baseConcurrency = processingMode === 'turbo' ? 2 : 1;
    } else if (selectedModel.includes('3-flash') || selectedModel.includes('3.1-flash-lite')) {
      baseConcurrency = processingMode === 'turbo' ? 3 : 2;
    } else if (selectedModel.includes('1.5-flash') || selectedModel.includes('2.5-flash')) {
      baseConcurrency = processingMode === 'turbo' ? 4 : 3;
    } else {
      baseConcurrency = processingMode === 'turbo' ? 3 : 2;
    }

    if (window.electron) {
       import('../socket').then(({ socket }) => {
          socket.emit('batch:started', { total: groupsToProcess.length, completed: 0, failed: 0 });
       });
       // Electron background IPC flow
       window.electron.invoke('start-batch', {
          groups: groupsToProcess.map(g => {
             // Ensure we grab the electron-specific custom path if it exists
             const fileObj = g.files.find(f => f.type === 'image')?.file as any;
             return {
                id: g.id,
                imagePath: fileObj?.path,
                baseName: g.baseName,
             };
          }),
          config: {
             provider,
             model: selectedModel,
             apiKeys: apiKeysRef.current[provider],
             minTitleLength,
             maxTitleLength,
             minDescriptionLength,
             maxDescriptionLength,
             keywordCount,
             tagGenerationMode: tagGenerationModeRef.current,
             imageFilter: imageFilterRef.current,
             concurrency: baseConcurrency,
             token
          }
       });
       return;
    }

    let currentConcurrency = baseConcurrency;
    let activeWorkers = 0;
    const queue = [...groupsToProcess];
    let consecutiveErrors = 0;
    let consecutiveSuccesses = 0;

    const processNext = async () => {
      if (!isGeneratingRef.current) {
        queue.length = 0;
        return;
      }
      if (queue.length === 0) return;
      // Safety limits
      const maxConcurrency = Math.min(5, baseConcurrency);
      currentConcurrency = Math.max(1, Math.min(currentConcurrency, maxConcurrency));
      if (activeWorkers >= currentConcurrency) return;

      const group = queue.shift();
      if (!group) return;

      activeWorkers++;
      // Staggered request execution (300-1000ms delay)
      await new Promise(r => setTimeout(r, 300 + Math.random() * 700));
      try {
         const result = await processSingleGroup(group.id);
         if (result.success) {
            consecutiveSuccesses++;
            consecutiveErrors = 0;
            if (consecutiveSuccesses > 3 && currentConcurrency < maxConcurrency) {
               currentConcurrency++;
               consecutiveSuccesses = 0;
            }
         } else if (result.isRateLimit) {
            consecutiveErrors++;
            consecutiveSuccesses = 0;
            if (consecutiveErrors > 1 && currentConcurrency > 1) {
               currentConcurrency--;
               consecutiveErrors = 0;
            }
         }
      } catch (e) {
         console.error("Worker error:", e);
      } finally {
         activeWorkers--;
         processNext();
      }
    };
    // Start initial workers
    for (let i = 0; i < currentConcurrency; i++) {
      processNext();
    }

    // Wait for all to finish
    await new Promise<void>(resolve => {
      const check = setInterval(() => {
        if (queue.length === 0 && activeWorkers === 0) {
          clearInterval(check);
          isGeneratingRef.current = false;
          setIsGenerating(false);
          resolve();
        }
      }, 500);
    });
  };

  const updateMetadata = (groupId: string, field: keyof Metadata, value: string) => {
    setIsDirty(true);
    if (field === 'title') {
      setTitleFixState(prev => { const s = {...prev}; delete s[groupId]; return s; });
    }
    if (field === 'tags') {
      setTagsFixState(prev => { const s = {...prev}; delete s[groupId]; return s; });
    }
    setFileGroups(prev => prev.map(g => {
      if (g.id === groupId && g.metadata) {
        const newMetadata = { ...g.metadata, [field]: value };
        newMetadata.seoScore = calculateSEO(newMetadata.title, newMetadata.description, newMetadata.tags, newMetadata.category);
        return { ...g, metadata: newMetadata };
      }
      return g;
    }));
  };

  const handleTitleFix = (groupId: string, currentTitle: string) => {
    const currentState = titleFixState[groupId]?.state || 'idle';
    if (currentState === 'idle') {
      // Remove weak words
      const words = currentTitle.split(/([\s,._-]+)/);
      const newWords = words.filter(word => {
        const lowerWord = word.toLowerCase();
        return !WEAK_WORDS_MAP[lowerWord];
      });
      const newTitle = cleanTrailingStopWords(newWords.join('').replace(/\s+/g, ' ').trim());
      
      setTitleFixState(prev => ({ ...prev, [groupId]: { state: 'removed', original: currentTitle } }));
      // Update directly without triggering the onChange reset
      setFileGroups(prev => prev.map(g => {
        if (g.id === groupId && g.metadata) {
          const newMetadata = { ...g.metadata, title: newTitle };
          newMetadata.seoScore = calculateSEO(newMetadata.title, newMetadata.description, newMetadata.tags, newMetadata.category);
          return { ...g, metadata: newMetadata };
        }
        return g;
      }));
    } else if (currentState === 'removed') {
      // Replace weak words
      const originalTitle = titleFixState[groupId].original;
      const words = originalTitle.split(/([\s,._-]+)/);
      const addedTags: string[] = [];
      let isFirstWord = true;
      const newWords = words.map(word => {
        if (/^[\s,._-]+$/.test(word)) return word;
        const lowerWord = word.toLowerCase();
        if (WEAK_WORDS_MAP[lowerWord]) {
          const alternatives = WEAK_WORDS_MAP[lowerWord];
          const randomAlt = alternatives[Math.floor(Math.random() * alternatives.length)];
          addedTags.push(randomAlt);
          const replacement = isFirstWord ? randomAlt.charAt(0).toUpperCase() + randomAlt.slice(1) : randomAlt;
          isFirstWord = false;
          return replacement;
        }
        if (isFirstWord) {
          isFirstWord = false;
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      });
      const newTitle = newWords.join('').replace(/\s+/g, ' ').trim();
      
      setTitleFixState(prev => ({ ...prev, [groupId]: { state: 'replaced', original: originalTitle } }));
      setFileGroups(prev => prev.map(g => {
        if (g.id === groupId && g.metadata) {
          const existingTags = g.metadata.tags.split(',').map(t => t.trim()).filter(t => t);
          const combinedTags = Array.from(new Set([...existingTags, ...addedTags])).join(', ');
          const newMetadata = { ...g.metadata, title: newTitle, tags: combinedTags };
          newMetadata.seoScore = calculateSEO(newMetadata.title, newMetadata.description, newMetadata.tags, newMetadata.category);
          return { ...g, metadata: newMetadata };
        }
        return g;
      }));
    }
  };

  const handleCleanAllTitles = () => {
    setFileGroups(prev => prev.map(g => {
      if (!g.metadata) return g;
      const currentTitle = g.metadata.title;
      const words = currentTitle.split(/([\s,._-]+)/);
      const addedTags: string[] = [];
      let isFirstWord = true;
      
      const newWords = words.map(word => {
        if (/^[\s,._-]+$/.test(word)) return word;
        const lowerWord = word.toLowerCase();
        if (WEAK_WORDS_MAP[lowerWord]) {
          const alternatives = WEAK_WORDS_MAP[lowerWord];
          const randomAlt = alternatives[Math.floor(Math.random() * alternatives.length)];
          addedTags.push(randomAlt);
          const replacement = isFirstWord ? randomAlt.charAt(0).toUpperCase() + randomAlt.slice(1) : randomAlt;
          isFirstWord = false;
          return replacement;
        }
        if (isFirstWord) {
          isFirstWord = false;
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      });
      
      const newTitle = newWords.join('').replace(/\s+/g, ' ').trim();
      
      if (newTitle !== currentTitle) {
        setTitleFixState(prev => ({ ...prev, [g.id]: { state: 'replaced', original: currentTitle } }));
        const existingTags = g.metadata.tags.split(',').map(t => t.trim()).filter(t => t);
        const combinedTags = Array.from(new Set([...existingTags, ...addedTags])).join(', ');
        const newMetadata = { ...g.metadata, title: newTitle, tags: combinedTags };
        newMetadata.seoScore = calculateSEO(newMetadata.title, newMetadata.description, newMetadata.tags, newMetadata.category);
        return { ...g, metadata: newMetadata };
      }
      return g;
    }));
  };
  const handleCleanAllTags = () => {
    setFileGroups(prev => prev.map(g => {
      if (!g.metadata) return g;
      const currentTags = g.metadata.tags;
      const tagsList = currentTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const newTags = tagsList.filter(tag => !WEAK_TAGS.has(tag.toLowerCase()));
      const newTagsString = newTags.join(', ');
      
      if (newTagsString !== currentTags) {
        setTagsFixState(prev => ({ ...prev, [g.id]: { state: 'replaced', original: currentTags } }));
        const newMetadata = { ...g.metadata, tags: newTagsString };
        newMetadata.seoScore = calculateSEO(newMetadata.title, newMetadata.description, newMetadata.tags, newMetadata.category);
        return { ...g, metadata: newMetadata };
      }
      return g;
    }));
  };

  const handleTagsFix = (groupId: string, currentTags: string) => {
    const currentState = tagsFixState[groupId]?.state || 'idle';
    if (currentState === 'idle') {
      // Remove weak tags
      const tagsList = currentTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const newTagsList = tagsList.filter(tag => {
        const lowerTag = tag.toLowerCase();
        if (WEAK_TAGS.has(lowerTag)) return false;
        const words = lowerTag.split(/\s+/);
        if (words.every(w => WEAK_WORDS_MAP[w] !== undefined)) return false;
        return true;
      });
      setTagsFixState(prev => ({ ...prev, [groupId]: { state: 'removed', original: currentTags } }));
      setFileGroups(prev => prev.map(g => {
        if (g.id === groupId && g.metadata) {
          const newMetadata = { ...g.metadata, tags: newTagsList.join(', ') };
          newMetadata.seoScore = calculateSEO(newMetadata.title, newMetadata.description, newMetadata.tags, newMetadata.category);
          return { ...g, metadata: newMetadata };
        }
        return g;
      }));
    } else if (currentState === 'removed') {
      // Replace weak tags
      const originalTags = tagsFixState[groupId].original;
      const tagsList = originalTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const newTagsList = tagsList.map(tag => {
        const lowerTag = tag.toLowerCase();
        let isWeak = false;
        if (WEAK_TAGS.has(lowerTag)) isWeak = true;
        else {
          const words = lowerTag.split(/\s+/);
          if (words.every(w => WEAK_WORDS_MAP[w] !== undefined)) isWeak = true;
        }
        
        if (isWeak) {
          const words = tag.split(/\s+/);
          const replacedWords = words.map(w => {
            const lowerW = w.toLowerCase();
            if (WEAK_WORDS_MAP[lowerW]) {
              return WEAK_WORDS_MAP[lowerW][0];
            }
            return w;
          });
          return replacedWords.join(' ');
        }
        return tag;
      });
      const uniqueTags = Array.from(new Set(newTagsList));
      
      setTagsFixState(prev => ({ ...prev, [groupId]: { state: 'replaced', original: originalTags } }));
      setFileGroups(prev => prev.map(g => {
        if (g.id === groupId && g.metadata) {
          const newMetadata = { ...g.metadata, tags: uniqueTags.join(', ') };
          newMetadata.seoScore = calculateSEO(newMetadata.title, newMetadata.description, newMetadata.tags, newMetadata.category);
          return { ...g, metadata: newMetadata };
        }
        return g;
      }));
    }
  };

  const filteredAndSortedGroups = useMemo(() => {
    let result = fileGroups.filter(group => {
      // 1. Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = group.baseName.toLowerCase().includes(q);
        const matchTitle = group.metadata?.title.toLowerCase().includes(q) || false;
        const matchDesc = group.metadata?.description.toLowerCase().includes(q) || false;
        const matchTags = group.metadata?.tags.toLowerCase().includes(q) || false;
        if (!matchName && !matchTitle && !matchDesc && !matchTags) return false;
      }

      // 2. Status Filter
      if (statusFilter === 'done' && !group.metadata) return false;
      if (statusFilter === 'pending' && (group.metadata || group.error)) return false;
      if (statusFilter === 'failed' && !group.error) return false;

      // 3. SEO Range
      if (group.metadata) {
        if (group.metadata.seoScore < seoRange[0] || group.metadata.seoScore > seoRange[1]) return false;
      } else if (seoRange[0] > 0 || seoRange[1] < 100) {
        // If range is restricted, hide items without SEO score
        return false;
      }

      // 4. Quick Filters
      if (quickFilter === 'failed' && !group.error) return false;
      if (quickFilter === 'high-seo' && (!group.metadata || group.metadata.seoScore < 80)) return false;
      if (quickFilter === 'needs-fix') {
        const hasWarnings = group.metadata ? validateMetadata(group.metadata, selectedPlatform).length > 0 : false;
        const isLowSeo = group.metadata ? group.metadata.seoScore < 60 : false;
        const isFailed = !!group.error;
        if (!hasWarnings && !isLowSeo && !isFailed) return false;
      }
      if (quickFilter === 'selected' && !selectedGroups.includes(group.id)) return false;
      return true;
    });

    // 5. Sort
    result.sort((a, b) => {
      if (sortBy === 'pending') {
        const aPending = !a.metadata && !a.error ? 1 : 0;
        const bPending = !b.metadata && !b.error ? 1 : 0;
        return bPending - aPending;
      }
      if (sortBy === 'failed') {
        const aFailed = a.error ? 1 : 0;
        const bFailed = b.error ? 1 : 0;
        return bFailed - aFailed;
      }
      if (sortBy === 'seo') {
        const aScore = a.metadata?.seoScore || 0;
        const bScore = b.metadata?.seoScore || 0;
        return bScore - aScore;
      }
      return 0;
    });
    return result;
  }, [fileGroups, searchQuery, statusFilter, sortBy, seoRange, quickFilter, selectedGroups, selectedPlatform]);
  const toggleAllSelection = () => {
    if (selectedGroups.length === filteredAndSortedGroups.length && filteredAndSortedGroups.length > 0) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredAndSortedGroups.map(g => g.id));
    }
  };
  const handleExport = () => {
    if (filteredAndSortedGroups.length === 0) return;
    executeExport();
  };
  const executeExport = async () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;

    filteredAndSortedGroups.forEach(g => {
      const meta = g.metadata;
      if (!meta) return;

      let targetFilename = `${g.baseName}.${exportExtension}`;
      
      const uploadedFile = g.files.find(f => {
        if (exportExtension === 'jpg' || exportExtension === 'png') {
          return f.type === 'image' && f.file.name.toLowerCase().endsWith(`.${exportExtension}`);
        }
        if (exportExtension === 'eps' || exportExtension === 'ai') {
          return f.type === 'eps' && f.file.name.toLowerCase().endsWith(`.${exportExtension}`);
        }
        if (exportExtension === 'svg') {
          return f.type === 'svg' && f.file.name.toLowerCase().endsWith(`.${exportExtension}`);
        }
        return false;
      });

      if (uploadedFile) {
        targetFilename = uploadedFile.file.name;
      } else {
        const imageFile = g.files.find(f => f.type === 'image');
        const vectorFile = g.files.find(f => f.type === 'eps' || f.type === 'svg');
        if ((exportExtension === 'jpg' || exportExtension === 'png') && imageFile) {
          targetFilename = imageFile.file.name.replace(/\.[^/.]+$/, `.${exportExtension}`);
        } else if ((exportExtension === 'eps' || exportExtension === 'ai' || exportExtension === 'svg') && vectorFile) {
          targetFilename = vectorFile.file.name.replace(/\.[^/.]+$/, `.${exportExtension}`);
        }
      }

      const createRow = (filename: string) => {
        let row: any[] = [];
        switch (selectedPlatform) {
          case 'adobe': {
            const ADOBE_STOCK_CATEGORY_MAP: Record<string, string> = {
              'Animals': '1', 'Animal': '1',
              'Buildings and Architecture': '2',
              'Business': '3',
              'Drinks': '4',
              'The Environment': '5',
              'States of Mind': '6',
              'Food': '7',
              'Graphic Resources': '8',
              'Hobbies and Leisure': '9',
              'Industry': '10',
              'Landscapes': '11',
              'Lifestyles': '12',
              'People': '13',
              'Plants and Flowers': '14',
              'Culture and Religion': '15',
              'Science': '16',
              'Social Issues': '17',
              'Sports': '18',
              'Technology': '19',
              'Transport': '20',
              'Travel': '21'
            };
            const categoryId = ADOBE_STOCK_CATEGORY_MAP[meta.category] || meta.category;
            headers = ['Filename', 'Title', 'Keywords', 'Category'];
            row = [filename, meta.title, meta.tags, categoryId];
            break;
          }
          case 'shutterstock':
            headers = ['Filename', 'Description', 'Keywords', 'Categories', 'Illustration', 'Mature Content', 'Editorial'];
            row = [filename, meta.description, meta.tags, meta.category, 'No', 'No', 'No'];
            break;
          case 'vecteezy':
            headers = ['Filename', 'Title', 'Description', 'Keywords', 'License'];
            row = [filename, meta.title, meta.description, meta.tags, 'Free'];
            break;
          case '123rf':
            headers = ['Filename', 'Description', 'Keywords'];
            row = [filename, meta.description, meta.tags];
            break;
          case 'dreamstime':
            headers = ['Filename', 'Title', 'Description', 'Keywords', 'Category 1'];
            row = [filename, meta.title, meta.description, meta.tags, meta.category];
            break;
          case 'freepik': {
            headers = ['File name', 'Title', 'Keywords'];
            const tagsList = meta.tags ? meta.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
            // Remove commas and quotes from title so it doesn't break the CSV column layout
            let rawTitle = meta.title.replace(/,/g, '').replace(/"/g, '');
            rawTitle = rawTitle.replace(/[.,;!"']+$/, '').trim();
            const formattedTitle = rawTitle ? `${rawTitle}.` : '';
            row = [filename, formattedTitle, ...tagsList];
            break;
          }
          case 'pond5':
            headers = ['Filename', 'Title', 'Description', 'Keywords'];
            row = [filename, meta.title, meta.description, meta.tags];
            break;
          case 'depositphotos':
            headers = ['Filename', 'Title', 'Description', 'Keywords'];
            row = [filename, meta.title, meta.description, meta.tags];
            break;
          case 'istock':
            headers = ['Filename', 'Title', 'Description', 'Keywords'];
            row = [filename, meta.title, meta.description, meta.tags];
            break;
          default:
            headers = ['Filename', 'Title', 'Description', 'Keywords', 'Category'];
            row = [filename, meta.title, meta.description, meta.tags, meta.category];
        }
        return row;
      };

      rows.push(createRow(targetFilename));
    });

    if (rows.length === 0) {
      alert("No metadata generated yet to export.");
      return;
    }

    if (exportFormat === 'csv') {
      let csvContent = '';
      if (selectedPlatform === 'freepik') {
        const headerLine = 'File name;Title;Keywords';
        const dataLines = rows.map(r => {
          const filename = r[0] || '';
          const title = r[1] || '';
          const firstTag = r[2] || '';
          const restTags = r.slice(3);
          
          const colA = `${filename};${title};${firstTag}`;
          if (restTags.length > 0) {
            return `${colA},${restTags.join(',')}`;
          }
          return colA;
        });
        csvContent = [headerLine, ...dataLines].join('\n');
      } else {
        csvContent = [
          headers.join(','),
          ...rows.map(r => r.map(v => escape(String(v))).join(','))
        ].join('\n');
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedPlatform}_metadata.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportFormat === 'xlsx') {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Metadata');
      XLSX.writeFile(workbook, `${selectedPlatform}_metadata.xlsx`);
    } else if (exportFormat === 'json') {
      const jsonData = rows.map(row => {
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = row[i];
        });
        return obj;
      });
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedPlatform}_metadata.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportFormat === 'xmp') {
      const zip = new JSZip();
      filteredAndSortedGroups.forEach(g => {
        const meta = g.metadata;
        if (!meta) return;
        
        let targetFilename = `${g.baseName}.${exportExtension}`;
        const uploadedFile = g.files.find(f => {
          if (exportExtension === 'jpg' || exportExtension === 'png') {
            return f.type === 'image' && f.file.name.toLowerCase().endsWith(`.${exportExtension}`);
          }
          if (exportExtension === 'eps' || exportExtension === 'ai') {
            return f.type === 'eps' && f.file.name.toLowerCase().endsWith(`.${exportExtension}`);
          }
          if (exportExtension === 'svg') {
            return f.type === 'svg' && f.file.name.toLowerCase().endsWith(`.${exportExtension}`);
          }
          return false;
        });

        if (uploadedFile) {
          targetFilename = uploadedFile.file.name;
        } else {
          const imageFile = g.files.find(f => f.type === 'image');
          const vectorFile = g.files.find(f => f.type === 'eps' || f.type === 'svg');
          if ((exportExtension === 'jpg' || exportExtension === 'png') && imageFile) {
            targetFilename = imageFile.file.name.replace(/\.[^/.]+$/, `.${exportExtension}`);
          } else if ((exportExtension === 'eps' || exportExtension === 'ai' || exportExtension === 'svg') && vectorFile) {
            targetFilename = vectorFile.file.name.replace(/\.[^/.]+$/, `.${exportExtension}`);
          }
        }

        const xmpFilename = targetFilename.replace(/\.[^/.]+$/, "") + ".xmp";
        let formatType = "image/eps";
        if (exportExtension === 'jpg') formatType = "image/jpeg";
        if (exportExtension === 'png') formatType = "image/png";
        if (exportExtension === 'svg') formatType = "image/svg+xml";
        if (exportExtension === 'ai') formatType = "application/illustrator";
        const xmpContent = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c140 79.160451, 2017/05/06-01:08:21        ">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    dc:format="${formatType}"
    photoshop:Category="${meta.category}"
    xmp:CreateDate="${new Date().toISOString()}"
    xmp:ModifyDate="${new Date().toISOString()}">
   <dc:title>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">${meta.title}</rdf:li>
    </rdf:Alt>
   </dc:title>
   <dc:description>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">${meta.description}</rdf:li>
    </rdf:Alt>
   </dc:description>
   <dc:subject>
    <rdf:Bag>
     ${meta.tags.split(',').map(tag => `<rdf:li>${tag.trim()}</rdf:li>`).join('\n     ')}
    </rdf:Bag>
   </dc:subject>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
        zip.file(xmpFilename, xmpContent);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedPlatform}_metadata_xmp.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0F051D] text-[#F1F5F9] font-sans p-6 relative">
      {/* Toast Notification System */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className={`px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 backdrop-blur-md min-w-[300px] ${
                toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' :
                toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-200' :
                'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-400" />}
              <span className="text-sm font-medium">{toast.message}</span>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="ml-auto p-1 hover:bg-white/10 rounded-full transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4 opacity-70" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Header onLogout={handleLogout} />

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Main Content */}
          <div className="w-full space-y-6">
            
            <SettingsPanel
              isSettingsOpen={isSettingsOpen}
              setIsSettingsOpen={setIsSettingsOpen}
              provider={provider}
              setProvider={setProvider}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              apiKeys={apiKeys}
              newKey={newKey}
              setNewKey={setNewKey}
              handleAddKey={handleAddKey}
              handleActivateKey={handleActivateKey}
              handleRemoveKey={handleRemoveKey}
              resetKeys={resetKeys}
              isApiKeysVisible={isApiKeysVisible}
              setIsApiKeysVisible={setIsApiKeysVisible}
              isMetadataLimitsVisible={isMetadataLimitsVisible}
              setIsMetadataLimitsVisible={setIsMetadataLimitsVisible}
              activePreset={activePreset}
              setActivePreset={setActivePreset}
              minTitleLength={minTitleLength}
              setMinTitleLength={setMinTitleLength}
              maxTitleLength={maxTitleLength}
              setMaxTitleLength={setMaxTitleLength}
              minDescriptionLength={minDescriptionLength}
              setMinDescriptionLength={setMinDescriptionLength}
              maxDescriptionLength={maxDescriptionLength}
              setMaxDescriptionLength={setMaxDescriptionLength}
              keywordCount={keywordCount}
              setKeywordCount={setKeywordCount}
              tagGenerationMode={tagGenerationMode}
              setTagGenerationMode={setTagGenerationMode}
              imageFilter={imageFilter}
              setImageFilter={setImageFilter}
              processingMode={processingMode}
              setProcessingMode={setProcessingMode}
              stats={stats}
              fileGroups={fileGroups}
            />

            {/* Uploader */}
            <FileUploader
              isDragging={isDragging}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              fileInputRef={fileInputRef}
              processFiles={processFiles}
            />

            {/* File List */}
            <div className="bg-[#1A0B2E]/50 border-colorful-3d-thick rounded-xl">
              <div className="p-4 border-b border-[#8B5CF6]/20 flex flex-col items-center gap-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 font-bold text-[#F1F5F9] text-base">
                    <ImageIcon className="w-4 h-4 text-[#22D3EE]" /> Uploaded Files ({fileGroups.length})
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search files, tags..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#0F051D] border border-[#8B5CF6]/30 rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#22D3EE] transition-colors w-48"
                      />
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${showFilters ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/50' : 'bg-[#0F051D] text-slate-400 border-[#8B5CF6]/30 hover:text-[#F1F5F9]'}`}
                    >
                      <Filter className="w-3.5 h-3.5" /> Filters
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="w-full overflow-hidden"
                    >
                      <div className="bg-[#0F051D]/50 border border-[#8B5CF6]/20 rounded-xl p-4 flex flex-col gap-4 mb-2">
                        <div className="flex flex-wrap items-center gap-6">
                          {/* Status Filter */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                            <select 
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value as any)}
                              className="bg-[#1A0B2E] border border-[#8B5CF6]/30 rounded-lg px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#22D3EE] transition-colors"
                            >
                              <option value="all">All Statuses</option>
                              <option value="done">Done</option>
                              <option value="pending">Pending</option>
                              <option value="failed">Failed</option>
                            </select>
                          </div>

                          {/* Quick Filters */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Filters</label>
                            <div className="flex items-center gap-2">
                              {(['all', 'failed', 'high-seo', 'needs-fix', 'selected'] as const).map(filter => (
                                <button
                                  key={filter}
                                  onClick={() => setQuickFilter(filter)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                    quickFilter === filter 
                                      ? 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/50' 
                                      : 'bg-[#1A0B2E] text-slate-400 border-[#8B5CF6]/30 hover:border-[#8B5CF6]/50'
                                  }`}
                                >
                                  {filter === 'all' ? 'All' : 
                                   filter === 'failed' ? 'Only Failed' : 
                                   filter === 'high-seo' ? 'High SEO (>80)' : 
                                   filter === 'needs-fix' ? 'Needs Fix' : 'Selected'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* SEO Range */}
                          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <SlidersHorizontal className="w-3 h-3" /> SEO Score Range
                              </label>
                              <span className="text-[10px] text-[#22D3EE] font-mono">{seoRange[0]} - {seoRange[1]}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <input 
                                type="range" 
                                min="0" max="100" 
                                value={seoRange[0]} 
                                onChange={(e) => setSeoRange([Math.min(parseInt(e.target.value), seoRange[1]), seoRange[1]])}
                                className="w-full accent-[#22D3EE]"
                              />
                              <input 
                                type="range" 
                                min="0" max="100" 
                                value={seoRange[1]} 
                                onChange={(e) => setSeoRange([seoRange[0], Math.max(parseInt(e.target.value), seoRange[0])])}
                                className="w-full accent-[#22D3EE]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                  <span>Showing <strong className="text-[#F1F5F9]">{filteredAndSortedGroups.length}</strong> of <strong className="text-[#F1F5F9]">{fileGroups.length}</strong> items</span>
                </div>
                
                <div className="flex items-center justify-center w-full gap-2 flex-wrap">
                  {/* Left: Select All & Validation */}
                  <div className="flex items-center gap-1 flex-wrap shrink-0">
                    <button 
                      onClick={toggleAllSelection}
                      className="text-xs flex items-center justify-center gap-1.5 text-[#22D3EE] bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 transition-colors border-colorful-3d px-3 py-1.5 h-8 rounded-lg font-bold shrink-0"
                    >
                      <CheckCircle className="w-4 h-4" /> 
                      {selectedGroups.length === fileGroups.length && fileGroups.length > 0 ? 'Deselect All' : 'Select All'}
                    </button>

                    <button 
                      onClick={() => {
                        if (selectedGroups.length === 0) {
                          alert("Please select files to edit first.");
                          return;
                        }
                        setIsBulkEditOpen(true);
                      }}
                      disabled={selectedGroups.length === 0}
                      className={`text-xs flex items-center justify-center gap-1.5 px-3 py-1.5 h-8 rounded-lg font-bold shrink-0 transition-all ${
                        selectedGroups.length > 0 
                          ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border-emerald-400/50 border-2 shadow-[0_0_15px_rgba(52,211,153,0.2)]" 
                          : "text-slate-500 bg-slate-800/50 border-slate-700 border opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <Settings className={`w-4 h-4 ${selectedGroups.length > 0 ? "text-emerald-400" : "text-slate-500"}`} /> 
                      Bulk Edit {selectedGroups.length > 0 ? `(${selectedGroups.length})` : ""}
                    </button>

                    <div className="border-colorful-3d rounded-lg shrink-0">
                      <select 
                        value={validationPlatform}
                        onChange={(e) => setValidationPlatform(e.target.value)}
                        className="bg-[#0F051D] rounded-lg px-1 text-[10px] text-[#F1F5F9] focus:outline-none focus:text-[#22D3EE] transition-colors h-7 cursor-pointer"
                      >
                        <option value="none">No Validation</option>
                        <option value="adobe">Adobe Stock</option>
                        <option value="shutterstock">Shutterstock</option>
                        <option value="freepik">Freepik</option>
                        <option value="vecteezy">Vecteezy</option>
                      </select>
                    </div>
                  </div>

                  {/* Center: Generate Metadata */}
                  <div className="flex items-center justify-center gap-1 flex-wrap shrink-0">
                    <button 
                      onClick={handleGenerateMetadata}
                      disabled={!isGenerating && (fileGroups.length === 0 || fileGroups.every(g => g.metadata || g.isGenerating))}
                      className={`text-xs flex items-center justify-center gap-1.5 text-white transition-all border border-white/10 px-4 py-2 h-9 rounded-lg font-bold disabled:opacity-50 shrink-0 ${
                        isGenerating 
                          ? 'bg-rose-500 hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
                          : 'bg-gradient-to-br from-[#F59E0B] to-[#EF4444] hover:opacity-90 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                      }`}
                    >
                      {isGenerating ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                      {isGenerating ? 'Cancel Generation' : 'Generate Metadata'}
                    </button>
                  </div>

                  {/* Right: View, Collapse, Sort, Clear */}
                  <div className="flex items-center gap-1 flex-wrap shrink-0">
                    <div className="flex items-center justify-center bg-[#0F051D] border-colorful-3d rounded-lg p-0.5 w-16 h-8 shrink-0">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`flex-1 h-full flex items-center justify-center rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#22D3EE]/20 text-[#22D3EE]' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Grid View"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setViewMode('list')}
                        className={`flex-1 h-full flex items-center justify-center rounded-md transition-all ${viewMode === 'list' ? 'bg-[#22D3EE]/20 text-[#22D3EE]' : 'text-slate-500 hover:text-slate-300'}`}
                        title="List View"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>

                    <button 
                      onClick={toggleAllExpand}
                      className="text-xs flex items-center justify-center gap-1.5 text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 transition-colors border-colorful-3d px-3 py-1.5 h-8 rounded-lg font-bold shrink-0"
                    >
                      {isAllExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isAllExpanded ? 'Collapse All' : 'Expand All'}
                    </button>

                    <button 
                      onClick={() => {
                        isGeneratingRef.current = false;
                        setIsGenerating(false);
                        setFileGroups([]);
                        setSelectedGroups([]);
                        setIsDirty(false);
                      }}
                      className="text-xs flex items-center justify-center gap-1.5 text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 transition-colors border-colorful-3d px-3 py-1.5 h-8 rounded-lg font-bold shrink-0"
                    >
                      <Trash2 className="w-4 h-4" /> Clear All
                    </button>
                    <button 
                      onClick={() => {
                        const groupsToSave = fileGroups.map(g => ({
                          id: g.id,
                          baseName: g.baseName,
                          metadata: g.metadata,
                          error: g.error,
                          history: g.history,
                          files: g.files.map(f => ({
                            id: f.id,
                            type: f.type,
                            baseName: f.baseName,
                            extension: f.extension,
                            file: { name: f.file.name }
                          }))
                        }));
                        localStorage.setItem('metamatrix_file_groups', JSON.stringify(groupsToSave));
                        setIsDirty(false);
                        alert("All changes have been saved successfully.");
                      }}
                      className={`text-xs flex items-center justify-center gap-1.5 px-3 py-1.5 h-8 rounded-lg font-bold shrink-0 transition-all ${
                        isDirty 
                          ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border-emerald-400/50 border-2 shadow-[0_0_15px_rgba(52,211,153,0.2)]" 
                          : "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border-colorful-3d"
                      }`}
                    >
                      <Save className="w-4 h-4" /> Save All
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {fileGroups.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 flex flex-col items-center">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                    <p>No files uploaded yet</p>
                  </div>
                ) : filteredAndSortedGroups.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 flex flex-col items-center">
                    <Search className="w-12 h-12 mb-3 opacity-20" />
                    <p>No files match the current filters</p>
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setQuickFilter('all');
                        setSeoRange([0, 100]);
                      }}
                      className="mt-4 text-[11px] text-[#22D3EE] hover:underline"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="w-full">
                    {viewMode === 'grid' ? (
                      <VirtuosoGrid
                        useWindowScroll
                        data={filteredAndSortedGroups}
                        components={{
                          List: React.forwardRef((props, ref) => (
                            <div {...props} ref={ref as any} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" />
                          )),
                          Item: ({ children, ...props }) => (
                            <div {...props}>{children}</div>
                          )
                        }}
                        itemContent={(index, group) => (
                          <FileGroupCard
                            key={group.id}
                            group={group}
                            isSelected={selectedGroups.includes(group.id)}
                            viewMode={viewMode}
                            imageFilter={imageFilter}
                            validationPlatform={validationPlatform}
                            toggleExpand={toggleExpand}
                            toggleSelection={toggleSelection}
                            updateMetadata={updateMetadata}
                            handleRetry={handleRetry}
                            handleRemoveGroup={handleRemoveGroup}
                            handleCleanKeywords={handleCleanKeywords}
                            handleUndo={handleUndo}
                            titleFixState={titleFixState[group.id]}
                            tagsFixState={tagsFixState[group.id]}
                            handleTitleFix={handleTitleFix}
                            handleTagsFix={handleTagsFix}
                            handleSEOAnalysis={handleSEOAnalysis}
                          />
                        )}
                      />
                    ) : (
                      <Virtuoso
                        useWindowScroll
                        data={filteredAndSortedGroups}
                        itemContent={(index, group) => (
                          <div className="pb-4">
                            <FileGroupCard
                              key={group.id}
                              group={group}
                              isSelected={selectedGroups.includes(group.id)}
                              viewMode={viewMode}
                              imageFilter={imageFilter}
                              validationPlatform={validationPlatform}
                              toggleExpand={toggleExpand}
                              toggleSelection={toggleSelection}
                              updateMetadata={updateMetadata}
                              handleRetry={handleRetry}
                              handleRemoveGroup={handleRemoveGroup}
                              handleCleanKeywords={handleCleanKeywords}
                              handleUndo={handleUndo}
                              titleFixState={titleFixState[group.id]}
                              tagsFixState={tagsFixState[group.id]}
                              handleTitleFix={handleTitleFix}
                              handleTagsFix={handleTagsFix}
                              handleSEOAnalysis={handleSEOAnalysis}
                            />
                          </div>
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Export Options Section - Moved to bottom */}
            <div className="bg-[#1A0B2E]/50 border-colorful-3d rounded-xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#F1F5F9] mb-1">Export Options</h2>
                  <p className="text-xs text-[#94A3B8]">Choose platforms and format to export your metadata</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2 justify-end">
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
                  <div className="flex flex-wrap gap-2 justify-end items-center">
                    <span className="text-[10px] font-medium text-[#94A3B8] mr-1 uppercase tracking-wider">Target Extension:</span>
                    {[
                      { id: 'eps', name: 'EPS' },
                      { id: 'jpg', name: 'JPG' },
                      { id: 'png', name: 'PNG' },
                      { id: 'ai', name: 'AI' },
                      { id: 'svg', name: 'SVG' },
                    ].map(ext => (
                      <button
                        key={ext.id}
                        onClick={() => setExportExtension(ext.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                          exportExtension === ext.id
                            ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6]'
                            : 'bg-[#0F051D] border-[#8B5CF6]/20 text-[#94A3B8] hover:border-[#8B5CF6]/50'
                        }`}
                      >
                        {ext.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                {[
                  { id: 'adobe', name: 'Adobe', icon: 'St', color: 'bg-black' },
                  { id: 'shutterstock', name: 'Shutter', icon: 'S', color: 'bg-red-500 text-white' },
                  { id: 'freepik', name: 'Freepik', icon: 'F', color: 'bg-blue-500' },
                  { id: 'dreamstime', name: 'Dreamstime', icon: 'D', color: 'bg-blue-600 text-white' },
                  { id: 'vecteezy', name: 'Vecteezy', icon: 'v', color: 'bg-rose-500' },
                  { id: 'istock', name: 'iStock', icon: 'iS', color: 'bg-black' },
                  { id: 'pond5', name: 'Pond5', icon: 'P5', color: 'bg-slate-900' },
                  { id: 'depositphotos', name: 'Deposit', icon: 'd', color: 'bg-white text-black' },
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

              <div className="mt-4">
                <PlanDashboard user={user} />
              </div>
            </div>

            {/* Removed bottom generate button */}
          </div>
          
        </div>
      </div>

      {/* Bulk Edit Modal */}
      <AnimatePresence>
        {isBulkEditOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1A0B2E] border-colorful-3d-thick rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#8B5CF6]/20 flex justify-between items-center bg-[#0F051D]">
                <h2 className="text-xl font-bold text-[#F1F5F9] flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#22D3EE]" />
                  Bulk Edit ({selectedGroups.length} items)
                </h2>
                <button 
                  onClick={() => setIsBulkEditOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[#22D3EE] border-b border-[#22D3EE]/20 pb-2">Title Edits</h3>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#F1F5F9]">Add to Title</label>
                      <p className="text-[10px] text-slate-400">Words will be appended to the end of the title.</p>
                      <input 
                        type="text" 
                        value={bulkTitleAdd}
                        onChange={(e) => setBulkTitleAdd(e.target.value)}
                        placeholder="e.g., high quality, vector"
                        className="w-full bg-[#0F051D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#22D3EE] transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#F1F5F9]">Remove from Title</label>
                      <p className="text-[10px] text-slate-400">Comma-separated words to remove from titles.</p>
                      <input 
                        type="text" 
                        value={bulkTitleRemove}
                        onChange={(e) => setBulkTitleRemove(e.target.value)}
                        placeholder="e.g., black and white, simple"
                        className="w-full bg-[#0F051D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#22D3EE] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[#22D3EE] border-b border-[#22D3EE]/20 pb-2">Tag Edits</h3>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#F1F5F9]">Add Tags</label>
                      <p className="text-[10px] text-slate-400">Comma-separated tags to append.</p>
                      <input 
                        type="text" 
                        value={bulkTagsAdd}
                        onChange={(e) => setBulkTagsAdd(e.target.value)}
                        placeholder="e.g., summer, vacation, beach"
                        className="w-full bg-[#0F051D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#22D3EE] transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#F1F5F9]">Remove Tags</label>
                      <p className="text-[10px] text-slate-400">Comma-separated tags to remove.</p>
                      <input 
                        type="text" 
                        value={bulkTagsRemove}
                        onChange={(e) => setBulkTagsRemove(e.target.value)}
                        placeholder="e.g., background, isolated"
                        className="w-full bg-[#0F051D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#22D3EE] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <label className="text-sm font-bold text-[#F1F5F9]">Update Category</label>
                  <p className="text-xs text-slate-400">Leave unselected to keep existing categories.</p>
                  <select 
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="w-full bg-[#0F051D] border border-white/10 rounded-lg px-4 py-3 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#22D3EE] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">-- Do not update category --</option>
                    {ALLOWED_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-[#8B5CF6]/20 bg-[#0F051D] flex justify-between items-center gap-3">
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      handleCleanAllTitles();
                    }}
                    className="flex flex-col items-center justify-center px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-colors border border-emerald-500/30"
                    title="Clean All Titles"
                  >
                    <Eraser className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider leading-none">Clear Title</span>
                  </button>
                  <button 
                    onClick={() => {
                      handleCleanAllTags();
                    }}
                    className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 rounded-xl transition-colors border border-[#22D3EE]/30"
                    title="Clean All Keywords"
                  >
                    <RefreshCw className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider leading-none">Clear Keyword</span>
                  </button>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsBulkEditOpen(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={applyBulkEdit}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#22D3EE] text-[#0F051D] hover:bg-[#22D3EE]/90 transition-colors shadow-lg shadow-[#22D3EE]/20"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      
      {/* Footer */}
      <footer className="mt-16 mb-8 flex justify-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative group cursor-default"
        >
          {/* Glowing backdrop */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#22D3EE] via-[#8B5CF6] to-[#EC4899] rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
          
          {/* Content */}
          <div className="relative flex items-center justify-center gap-4 px-8 py-3 bg-[#0F051D] rounded-full border border-white/10 leading-none shadow-[0_0_2rem_-0.5rem_#8B5CF6]">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/30">
              <Sparkles className="w-4 h-4 text-[#22D3EE] animate-pulse" />
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Created by</span>
              <span className="text-lg font-black text-gradient-animate tracking-[0.15em]">MUNNA HOSSAIN</span>
            </div>

            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EC4899]/10 border border-[#EC4899]/30">
              <Sparkles className="w-4 h-4 text-[#EC4899] animate-pulse" />
            </div>
          </div>
        </motion.div>
      </footer>
      {/* SEO Analysis Modal */}
      <AnimatePresence>
        {activeSEOAnalysisGroupId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setActiveSEOAnalysisGroupId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0F051D] border border-[#8B5CF6]/30 rounded-2xl w-full max-w-[800px] h-[70vh] flex flex-col overflow-hidden shadow-2xl pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const group = fileGroups.find(g => g.id === activeSEOAnalysisGroupId);
                if (!group || !group.metadata || !group.metadata.seoAnalysis) return null;
                const analysis = group.metadata.seoAnalysis;
                return (
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-2 px-3 border-b border-[#8B5CF6]/20 flex justify-between items-center bg-[#1A0B2E]/50">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#22D3EE]/10 rounded-lg">
                          <Activity className="w-4 h-4 text-[#22D3EE]" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-[#F1F5F9]">SEO Analysis</h2>
                          <p className="text-[9px] text-slate-400 truncate max-w-[120px]">{group.baseName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Scroll Buttons */}
                        <div className="flex flex-col gap-1">
                          <button type="button" onClick={() => scroll('up')} className="p-1.5 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 rounded text-[#22D3EE] transition-all active:scale-95">
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => scroll('down')} className="p-1.5 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 rounded text-[#22D3EE] transition-all active:scale-95">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-center px-2 py-0.5 bg-[#0F051D] border border-[#8B5CF6]/30 rounded-xl">
                          <div className="text-[8px] font-bold text-[#CBD5F5] uppercase tracking-wider">Score</div>
                          <div className={`text-base font-black ${analysis.score >= 90 ? 'text-emerald-400' : analysis.score >= 70 ? 'text-blue-400' : 'text-rose-400'}`}>
                            {analysis.score}%
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setActiveSEOAnalysisGroupId(null)}
                          className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-0">
                      {/* Score Breakdown */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Title', score: analysis.titleScore, max: 30 },
                          { label: 'Tags', score: analysis.tagScore, max: 30 },
                          { label: 'Category', score: analysis.categoryScore, max: 20 },
                          { label: 'Intent', score: analysis.intentScore, max: 20 },
                        ].map(stat => (
                          <div key={stat.label} className="bg-[#1A0B2E] border border-[#8B5CF6]/20 rounded-xl p-2 text-center">
                            <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">{stat.label}</div>
                            <div className="text-sm font-bold text-[#F1F5F9]">{stat.score}<span className="text-slate-600 font-normal text-[10px]">/{stat.max}</span></div>
                            <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#22D3EE]" 
                                style={{ width: `${(stat.score / stat.max) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Weak Words & Suggestions */}
                      {analysis.weakWords.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> Weak Words Detected
                          </h3>
                          <div className="grid gap-2">
                            {analysis.weakWords.map((w, i) => (
                              <div key={i} className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                  <div className="text-[10px] font-bold text-yellow-400 uppercase mb-0.5">Weak Word</div>
                                  <div className="text-sm font-bold text-[#F1F5F9] line-through decoration-rose-500/50">{w.word}</div>
                                </div>
                                <div className="flex-1 max-w-md">
                                  <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Suggested Replacements</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {w.alternatives.map(alt => (
                                      <button
                                        key={alt}
                                        onClick={() => {
                                          let isFirstWord = true;
                                          const newTitle = group.metadata!.title.replace(new RegExp(`\\b${w.word}\\b`, 'gi'), (match, offset) => {
                                            if (offset === 0 || isFirstWord) {
                                              isFirstWord = false;
                                              return alt.charAt(0).toUpperCase() + alt.slice(1);
                                            }
                                            return alt;
                                          });
                                          // Capitalize the first word of the title if it was changed
                                          const finalTitle = newTitle.charAt(0).toUpperCase() + newTitle.slice(1);
                                          const existingTags = group.metadata!.tags.split(',').map(t => t.trim()).filter(t => t);
                                          const combinedTags = Array.from(new Set([...existingTags, alt])).join(', ');
                                          setFileGroups(prev => prev.map(g => {
                                            if (g.id === group.id && g.metadata) {
                                              const newMetadata = { ...g.metadata, title: finalTitle, tags: combinedTags };
                                              newMetadata.seoScore = calculateSEO(newMetadata.title, newMetadata.description, newMetadata.tags, newMetadata.category);
                                              return { ...g, metadata: newMetadata };
                                            }
                                            return g;
                                          }));
                                          // Re-analyze after replacement
                                          setTimeout(() => handleSEOAnalysis(group.id), 100);
                                        }}
                                        className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                      >
                                        {alt}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Issues */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> Issues Found
                        </h3>
                        <div className="bg-rose-400/5 border border-rose-400/20 rounded-xl p-3">
                          <ul className="space-y-1.5">
                            {analysis.issues.length === 0 ? (
                              <li className="text-xs text-slate-400 italic">No issues found.</li>
                            ) : analysis.issues.map((issue, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0"></div>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* General Suggestions */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Improvement Tips
                        </h3>
                        <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-3">
                          <ul className="space-y-1.5">
                            {analysis.suggestions.map((sug, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                                {sug}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-[#8B5CF6]/20 bg-[#1A0B2E]/50 flex justify-end">
                      <button
                        onClick={() => setActiveSEOAnalysisGroupId(null)}
                        className="px-5 py-1.5 text-sm bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}