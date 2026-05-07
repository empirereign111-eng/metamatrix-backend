import { create } from 'zustand';
import React from 'react';
import { Provider, ApiKey, FileGroup } from '../types';

interface StoreState {
  apiKeys: Record<Provider, ApiKey[]>;
  fileGroups: FileGroup[];
  fileGroupsRef: React.MutableRefObject<FileGroup[]>;
  stats: { requests: number; success: number; generated: number };
  imageFilter: string;
  provider: Provider;
  currentModel: string;
  minTitleLength: number;
  maxTitleLength: number;
  minDescriptionLength: number;
  maxDescriptionLength: number;
  keywordCount: number;
  
  setApiKeys: (apiKeys: Record<Provider, ApiKey[]>) => void;
  setFileGroups: (fileGroups: FileGroup[] | ((prev: FileGroup[]) => FileGroup[])) => void;
  setStats: (stats: { requests: number; success: number; generated: number } | ((prev: { requests: number; success: number; generated: number }) => { requests: number; success: number; generated: number })) => void;
  setImageFilter: (filter: string) => void;
  setProvider: (provider: Provider) => void;
  setCurrentModel: (model: string) => void;
  setMinTitleLength: (length: number) => void;
  setMaxTitleLength: (length: number) => void;
  setMinDescriptionLength: (length: number) => void;
  setMaxDescriptionLength: (length: number) => void;
  setKeywordCount: (count: number) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  apiKeys: { gemini: [], grok: [], mixtral: [] },
  fileGroups: [],
  fileGroupsRef: { current: [] },
  stats: { requests: 0, success: 0, generated: 0 },
  imageFilter: 'none',
  provider: 'gemini',
  currentModel: 'gemini-1.5-flash',
  minTitleLength: 50,
  maxTitleLength: 100,
  minDescriptionLength: 100,
  maxDescriptionLength: 200,
  keywordCount: 10,

  setApiKeys: (apiKeys) => set({ apiKeys }),
  setFileGroups: (fileGroups) => {
    const newGroups = typeof fileGroups === 'function' ? fileGroups(get().fileGroups) : fileGroups;
    set({ fileGroups: newGroups });
    get().fileGroupsRef.current = newGroups;
  },
  setStats: (stats) => set((state) => ({ 
    stats: typeof stats === 'function' ? stats(state.stats) : stats 
  })),
  setImageFilter: (imageFilter) => set({ imageFilter }),
  setProvider: (provider) => set({ provider }),
  setCurrentModel: (currentModel) => set({ currentModel }),
  setMinTitleLength: (minTitleLength) => set({ minTitleLength }),
  setMaxTitleLength: (maxTitleLength) => set({ maxTitleLength }),
  setMinDescriptionLength: (minDescriptionLength) => set({ minDescriptionLength }),
  setMaxDescriptionLength: (maxDescriptionLength) => set({ maxDescriptionLength }),
  setKeywordCount: (keywordCount) => set({ keywordCount }),
}));
