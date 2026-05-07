export type Provider = 'gemini' | 'grok' | 'mixtral';

export interface ApiKey {
  id: string;
  key: string;
  name?: string;
  isActive: boolean;
  isValid: boolean | null;
  isDefault?: boolean;
  lastUsed?: number;
  cooldownUntil?: number;
  baseUrl?: string;
}

export interface FileItem {
  id: string;
  file: File;
  type: 'image' | 'eps' | 'svg' | 'other';
  baseName: string;
  extension: string;
  previewUrl?: string;
}

export interface SEOAnalysis {
  score: number;
  titleScore: number;
  tagScore: number;
  categoryScore: number;
  intentScore: number;
  issues: string[];
  suggestions: string[];
  weakWords: { word: string; alternatives: string[] }[];
}

export interface Metadata {
  title: string;
  description: string;
  tags: string;
  category: string;
  seoScore: number;
  analysis?: string[];
  seoAnalysis?: SEOAnalysis;
}

export type TagGenerationMode = 'single' | 'multi' | 'long';

export interface FileGroup {
  id: string;
  baseName: string;
  files: FileItem[];
  metadata?: Metadata;
  history?: Metadata[];
  isGenerating: boolean;
  isExpanded?: boolean;
  error?: string;
  statusText?: string;
  isDuplicate?: boolean;
  duplicateReason?: string;
  previewUrl?: string;
}
