import { calculateSEO, analyzeSEO, validateMetadata, WEAK_WORDS_MAP, WEAK_TAGS } from '../utils/seoAnalyzer';
import { Metadata, SEOAnalysis } from '../types';

export const seoService = {
  calculateSEO,
  analyzeSEO,
  validateMetadata,
  WEAK_WORDS_MAP,
  WEAK_TAGS
};
