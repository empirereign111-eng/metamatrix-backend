import React, { useState } from 'react';
import { generateMetadata } from '../services/ai';
import { analyzeSEO } from '../utils/seoAnalyzer';
import { applyImageFilter } from '../utils/imageProcessing';
import { FileGroup, Provider } from '../types';

export const useMetadataGenerator = (
  provider: Provider,
  currentModel: string,
  minTitleLength: number,
  maxTitleLength: number,
  minDescriptionLength: number,
  maxDescriptionLength: number,
  keywordCount: number,
  imageFilter: string,
  tagGenerationMode: 'single' | 'multi' | 'long',
  setFileGroups: React.Dispatch<React.SetStateAction<FileGroup[]>>,
  setStats: React.Dispatch<React.SetStateAction<{ requests: number; success: number; generated: number }>>
) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async (groupId: string, availableKey: { key: string, baseUrl?: string }, group: FileGroup) => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('metamatrix_token');
      
      const checkRes = await fetch('/api/usage/check', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!checkRes.ok) {
        const errData = await checkRes.json();
        throw new Error(errData.message || 'Error checking usage');
      }

      const imageFile = group.files.find(f => f.type === 'image')?.file;
      if (!imageFile) throw new Error('No JPG/PNG found for this group to analyze.');

      let finalImageFile = imageFile;
      if (imageFilter !== 'none') {
        finalImageFile = await applyImageFilter(imageFile, imageFilter);
      }

      const metadata = await generateMetadata(provider, currentModel, availableKey.key, finalImageFile, availableKey.baseUrl, minTitleLength, maxTitleLength, minDescriptionLength, maxDescriptionLength, keywordCount, tagGenerationMode);
      
      await fetch('/api/usage/increment', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Assuming cleanKeywords is available in utils or similar
      // const cleanedTags = cleanKeywords(metadata.tags);
      const cleanedTags = metadata.tags; // For now, assuming it's already clean
      const analysisResult = analyzeSEO(metadata.title, metadata.description, cleanedTags, metadata.category);
      const seoScore = analysisResult.score;

      setFileGroups(prev => prev.map(g => g.id === groupId ? { 
        ...g, 
        isGenerating: false, 
        metadata: { ...metadata, tags: cleanedTags, seoScore, seoAnalysis: analysisResult },
        history: [{ ...metadata, tags: cleanedTags, seoScore, seoAnalysis: analysisResult }],
        error: undefined,
        statusText: undefined
      } : g));
      
      setStats(s => ({ ...s, success: s.success + 1, generated: s.generated + 1 }));
      return { success: true };
    } catch (error: any) {
      console.error(`[Process Error] Group ${groupId}:`, error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generate,
    isGenerating
  };
};
