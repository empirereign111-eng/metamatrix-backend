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

export const WEAK_WORDS_MAP: Record<string, string[]> = {
  // Strong / Marketing filler
  'beautiful': ['elegant', 'stunning', 'exquisite', 'vibrant'],
  'amazing': ['professional', 'high-quality', 'unique', 'intricate'],
  'awesome': ['impressive', 'striking', 'remarkable'],
  'nice': ['refined', 'polished', 'professional'],
  'cool': ['modern', 'stylish', 'trendy', 'contemporary'],
  'great': ['excellent', 'superior', 'outstanding'],
  'best': ['premium', 'top-tier', 'professional', 'high-end'],
  'perfect': ['flawless', 'ideal', 'impeccable'],
  'stunning': ['breathtaking', 'striking', 'spectacular'],
  'gorgeous': ['magnificent', 'splendid', 'resplendent'],
  'fantastic': ['brilliant', 'extraordinary', 'superb'],
  'incredible': ['unbelievable', 'marvelous', 'phenomenal'],
  'lovely': ['charming', 'delightful', 'endearing'],
  'wonderful': ['superb', 'exceptional', 'magnificent'],
  'super': ['exceptional', 'outstanding', 'superior'],
  'ultimate': ['supreme', 'paramount', 'definitive'],
  'premium': ['high-end', 'exclusive', 'superior'],
  'top': ['leading', 'prime', 'foremost'],
  'excellent': ['outstanding', 'superior', 'first-rate'],

  // Generic creative words
  'art': ['illustration', 'graphic', 'artwork'],
  'design': ['layout', 'composition', 'structure'],
  'illustration': ['drawing', 'sketch', 'rendering'],
  'image': ['visual', 'graphic', 'photograph'],
  'picture': ['image', 'visual', 'graphic'],
  'graphic': ['visual', 'illustration', 'design'],
  'artwork': ['illustration', 'creation', 'piece'],
  'visual': ['graphic', 'image', 'representation'],
  'creative': ['innovative', 'original', 'imaginative'],
  'modern': ['contemporary', 'current', 'up-to-date'],
  'digital': ['electronic', 'virtual', 'computerized'],
  'abstract': ['non-representational', 'conceptual', 'theoretical'],
  'concept': ['idea', 'notion', 'theory'],
  'style': ['manner', 'approach', 'technique'],
  'decorative': ['ornamental', 'embellishing', 'adorning'],
  'composition': ['arrangement', 'layout', 'structure'],
  'element': ['component', 'part', 'detail'],

  // Overused marketplace words
  'background': ['backdrop', 'setting', 'environment'],
  'template': ['layout', 'format', 'model'],
  'pattern': ['design', 'motif', 'arrangement'],
  'wallpaper': ['background', 'backdrop', 'covering'],
  'backdrop': ['background', 'setting', 'scenery'],

  // Quality / fluff words
  'high quality': ['premium', 'professional', 'superior'],
  'hd': ['high-definition', 'clear', 'sharp'],
  '4k': ['ultra-high-definition', 'detailed', 'sharp'],
  'professional': ['expert', 'specialized', 'proficient'],
  'detailed': ['intricate', 'elaborate', 'comprehensive'],
  'high resolution': ['crisp', 'sharp', 'clear'],

  // Vague descriptive words
  'colorful': ['vibrant', 'bright', 'multicolored'],
  'vibrant': ['vivid', 'bright', 'dynamic'],
  'simple': ['minimalist', 'uncomplicated', 'straightforward'],
  'minimal': ['minimalist', 'clean', 'uncluttered'],
  'clean': ['neat', 'tidy', 'uncluttered'],
  'elegant': ['graceful', 'stylish', 'sophisticated'],
  'fancy': ['elaborate', 'ornate', 'decorative'],

  // Extra / unnecessary words
  'set': ['collection', 'assortment', 'group'],
  'collection': ['assortment', 'selection', 'array'],
  'bundle': ['package', 'compilation', 'group'],
  'pack': ['package', 'set', 'bundle'],
  'series': ['sequence', 'succession', 'progression'],

  // Low-value generic words
  'object': ['item', 'entity', 'article'],
  'item': ['object', 'article', 'piece'],
  'thing': ['element', 'object', 'entity'],
  'stuff': ['elements', 'materials', 'items'],
  'content': ['material', 'substance', 'matter']
};

const BUYER_KEYWORDS = new Set(['vector', 'eps', 'ai', 'svg', 'png', 'jpg', 'image', 'photo', 'background', 'texture', 'printable', 'template']);
const USE_CASE_KEYWORDS = new Set(['tattoo', 'logo', 'icon', 'sticker', 'tshirt', 'poster']);

export const WEAK_TAGS = new Set([
  'art', 'design', 'illustration', 'image', 'picture', 'graphic', 'artwork', 'visual',
  'creative', 'modern', 'concept', 'style', 'element', 'decorative',
  'object', 'item', 'thing', 'stuff', 'content',
  'beautiful', 'amazing', 'awesome', 'nice', 'cool', 'best', 'perfect',
  'simple', 'clean', 'elegant', 'fancy', 'colorful', 'vibrant',
  'background', 'template', 'wallpaper', 'backdrop',
  'digital', 'abstract', 'composition', 'media',
  'beautiful design', 'amazing artwork', 'awesome illustration',
  'nice graphic design', 'cool art design', 'perfect visual art',
  'creative modern design', 'modern abstract design', 'high quality image',
  'hd background wallpaper', '4k abstract background', 'professional design artwork',
  'detailed illustration design', 'colorful abstract background', 'simple clean design',
  'elegant modern artwork', 'fancy decorative design', 'digital creative concept',
  'abstract visual composition', 'modern style element'
]);

export const ALLOWED_CATEGORIES = [
  'Animals', 'Buildings and Architecture', 'Business', 'Drinks', 'The Environment', 
  'States of Mind', 'Food', 'Graphic Resources', 'Hobbies and Leisure', 'Industry', 
  'Landscapes', 'Lifestyles', 'People', 'Plants and Flowers', 'Culture and Religion', 
  'Science', 'Social Issues', 'Sports', 'Technology', 'Transport', 'Travel'
];

export const CATEGORY_STRICT_KEYWORDS: Record<string, string[]> = {
  'Animals': ['animal', 'animals', 'wildlife', 'pet', 'pets', 'dog', 'cat', 'bird', 'fish', 'insect', 'creature', 'fauna', 'mammal', 'reptile'],
  'Buildings and Architecture': ['building', 'buildings', 'architecture', 'architectural', 'house', 'houses', 'structure', 'city', 'urban', 'construction', 'bridge', 'skyscraper', 'interior', 'exterior'],
  'Business': ['business', 'corporate', 'office', 'work', 'finance', 'marketing', 'professional', 'strategy', 'team', 'company', 'economy', 'startup', 'entrepreneur'],
  'Drinks': ['drink', 'drinks', 'beverage', 'beverages', 'juice', 'coffee', 'tea', 'alcohol', 'cocktail', 'liquid', 'water', 'wine', 'beer', 'milk'],
  'The Environment': ['environment', 'environmental', 'nature', 'ecology', 'green', 'earth', 'climate', 'sustainability', 'pollution', 'recycling', 'conservation', 'eco'],
  'States of Mind': ['emotion', 'emotions', 'feeling', 'feelings', 'mind', 'psychology', 'mood', 'mental', 'thought', 'stress', 'happiness', 'sadness', 'depression', 'anxiety', 'joy'],
  'Food': ['food', 'cooking', 'meal', 'fruit', 'vegetable', 'cuisine', 'delicious', 'eat', 'eating', 'dish', 'recipe', 'restaurant', 'snack', 'meat', 'dessert'],
  'Graphic Resources': ['graphic', 'graphics', 'resource', 'resources', 'icon', 'vector', 'template', 'layout', 'mockup', 'branding', 'design', 'element', 'illustration', 'clipart', 'stock', 'creative', 'background', 'texture', 'pattern', 'font', 'typography', 'ui', 'ux', 'interface', 'logo', 'drawing', 'art'],
  'Hobbies and Leisure': ['hobby', 'hobbies', 'leisure', 'fun', 'activity', 'pastime', 'recreation', 'game', 'games', 'playing', 'entertainment', 'craft', 'diy', 'music'],
  'Industry': ['industry', 'industrial', 'factory', 'manufacturing', 'production', 'machine', 'machinery', 'engineering', 'worker', 'plant', 'equipment', 'warehouse'],
  'Landscapes': ['landscape', 'landscapes', 'scenery', 'nature', 'mountain', 'river', 'forest', 'view', 'outdoor', 'outdoors', 'valley', 'hill', 'lake', 'ocean', 'sea', 'sky'],
  'Lifestyles': ['lifestyle', 'living', 'people', 'daily', 'home', 'family', 'wellness', 'happiness', 'life', 'routine', 'casual', 'everyday'],
  'People': ['people', 'person', 'human', 'man', 'men', 'woman', 'women', 'child', 'children', 'portrait', 'character', 'boy', 'girl', 'baby', 'crowd', 'group'],
  'Plants and Flowers': ['plant', 'plants', 'flower', 'flowers', 'floral', 'nature', 'botany', 'leaf', 'leaves', 'garden', 'bloom', 'blossom', 'tree', 'trees', 'grass', 'flora'],
  'Culture and Religion': ['culture', 'cultural', 'religion', 'religious', 'tradition', 'traditional', 'spiritual', 'festive', 'ethnic', 'history', 'custom', 'belief', 'ceremony', 'heritage', 'ritual', 'community', 'faith', 'church', 'temple', 'mosque'],
  'Science': ['science', 'scientific', 'laboratory', 'lab', 'research', 'experiment', 'technology', 'biology', 'chemistry', 'physics', 'medical', 'medicine', 'health', 'doctor', 'scientist'],
  'Social Issues': ['social', 'issue', 'issues', 'society', 'community', 'politics', 'human rights', 'activism', 'protest', 'poverty', 'equality', 'diversity', 'inclusion'],
  'Sports': ['sport', 'sports', 'fitness', 'exercise', 'athlete', 'game', 'competition', 'active', 'workout', 'gym', 'training', 'running', 'football', 'soccer', 'basketball'],
  'Technology': ['technology', 'tech', 'digital', 'computer', 'software', 'internet', 'future', 'innovation', 'device', 'electronics', 'mobile', 'app', 'network', 'cyber', 'data'],
  'Transport': ['transport', 'transportation', 'vehicle', 'vehicles', 'car', 'cars', 'plane', 'train', 'ship', 'travel', 'logistics', 'truck', 'bus', 'bike', 'bicycle', 'road', 'traffic'],
  'Travel': ['travel', 'traveling', 'tourism', 'tourist', 'vacation', 'holiday', 'trip', 'journey', 'destination', 'explore', 'adventure', 'luggage', 'passport']
};

export const cleanTrailingStopWords = (title: string): string => {
  let cleaned = title.trim();
  // Remove trailing dots, commas, spaces
  cleaned = cleaned.replace(/[\s,.]+$/, '');
  
  const stopWords = ['for', 'and', 'an', 'a', 'the', 'with', 'in', 'of', 'at', 'by', 'to', 'on', 'as', 'is', 'are', 'was', 'were', 'it', 'this', 'that', 'these', 'those', 'or', 'but', 'so', 'if', 'then', 'than', 'from'];
  
  let changed = true;
  while (changed) {
    changed = false;
    const words = cleaned.split(/\s+/);
    if (words.length > 0) {
      const lastWord = words[words.length - 1].toLowerCase();
      if (stopWords.includes(lastWord)) {
        words.pop();
        cleaned = words.join(' ');
        cleaned = cleaned.replace(/[\s,.]+$/, '');
        changed = true;
      }
    }
  }
  
  // Capitalize first letter and add dot at the end
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + '.';
  }
  
  return cleaned;
};

export const calculateSEO = (title: string, description: string, tags: string, category: string = 'Graphic Resources'): number => {
  const analysis = analyzeSEO(title, description, tags, category);
  return analysis.score;
};

export const analyzeSEO = (title: string, description: string, tags: string, category: string = 'Graphic Resources'): SEOAnalysis => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const weakWordsDetected: { word: string; alternatives: string[] }[] = [];
  
  const titleWords = title.toLowerCase().split(/[\s,._-]+/).filter(w => w.length > 2);
  const tagsList = tags.toLowerCase().split(',').map(t => t.trim()).filter(t => t.length > 0);
  const normalizedCategory = category.trim();
  const categoryKeywords = CATEGORY_STRICT_KEYWORDS[normalizedCategory] || [];
  
  // 1. TITLE SCORE (0–30)
  let titleScore = 30;
  let titlePenalty = 0;
  
  const lowerTitle = title.toLowerCase();
  Object.keys(WEAK_WORDS_MAP).forEach(weakWord => {
    // Exempt if relevant to category
    if (categoryKeywords.includes(weakWord)) return;

    const regex = new RegExp(`\\b${weakWord}\\b`, 'i');
    if (regex.test(lowerTitle)) {
      titlePenalty += 2;
      issues.push(`-2 points (Title): The word/phrase "${weakWord}" is considered weak.`);
      if (!weakWordsDetected.some(w => w.word === weakWord)) {
        weakWordsDetected.push({ word: weakWord, alternatives: WEAK_WORDS_MAP[weakWord] });
      }
    }
  });
  
  titleScore -= titlePenalty;
  titleScore = Math.max(0, titleScore);
  
  // 2. TAG SCORE (0–30)
  let tagScore = 30;
  let tagDeduction = 0;
  const seenTags = new Set<string>();
  
  tagsList.forEach(tag => {
    if (seenTags.has(tag)) {
      tagDeduction += 2;
      issues.push(`-2 points (Tags): Found duplicate tag "${tag}".`);
    } else {
      seenTags.add(tag);
      let isWeak = false;
      
      // Check if this tag is a sub-part of any other tag in the list
      const isSubPart = tagsList.some(otherTag => otherTag !== tag && otherTag.includes(tag));
      
      if (!isSubPart) {
        // Exempt if relevant to category
        if (categoryKeywords.includes(tag)) {
          isWeak = false;
        } else if (WEAK_TAGS.has(tag)) {
          isWeak = true;
        } else {
          const words = tag.split(/\s+/);
          if (words.length > 0 && words.every(w => WEAK_WORDS_MAP[w] !== undefined)) {
            isWeak = true;
          }
        }
      }
      
      if (isWeak) {
        tagDeduction += 1;
        issues.push(`-1 point (Tags): The tag "${tag}" is considered weak.`);
      }
    }
  });

  tagScore -= tagDeduction;
  tagScore = Math.max(0, tagScore);
  
  // 3. CATEGORY SCORE (0–20)
  let categoryScore = 0;
  
  if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
    categoryScore = 0;
    issues.push(`-20 points (Category): "${normalizedCategory}" is not a valid Adobe Stock category.`);
  } else {
    // Combine title and tags for keyword matching
    const allKeywords = [...titleWords, ...tagsList.flatMap(t => t.split(/\s+/))].map(w => w.toLowerCase());
    
    // Check for strong match
    const hasStrongMatch = categoryKeywords.some(ck => allKeywords.includes(ck));
    
    if (hasStrongMatch) {
      categoryScore = 20; // Strong match
    } else {
      // Check if any other category keywords match better
      let bestMatchScore = 0;
      let matchedCategory = '';
      for (const [cat, keywords] of Object.entries(CATEGORY_STRICT_KEYWORDS)) {
        if (cat === normalizedCategory) continue;
        let score = 0;
        for (const ck of keywords) {
          if (allKeywords.includes(ck)) score++;
        }
        
        // De-prioritize "Graphic Resources" as a suggestion since 
        // almost all vector files will contain words like "vector", "illustration", "art"
        if (cat === 'Graphic Resources') {
          score = score * 0.3;
        }

        if (score > bestMatchScore && score > 0) {
          bestMatchScore = score;
          matchedCategory = cat;
        }
      }
      
      if (bestMatchScore > 0) {
        categoryScore = 0; // No clear match (matches something else strongly)
        issues.push(`-20 points (Category): Keywords suggest a different category than "${normalizedCategory}".`);
        suggestions.push(`Change category to "${matchedCategory}" to match your keywords better.`);
      } else {
        categoryScore = 10; // Partial match / Unsure
        issues.push(`-10 points (Category): No strong keyword match for "${normalizedCategory}". Consider adding more relevant keywords.`);
      }
    }
  }
  
  // 4. SEARCH INTENT SCORE (0–20)
  let intentScore = 10;
  
  const hasBuyerKeywords = tagsList.some(tag => BUYER_KEYWORDS.has(tag)) || 
                           titleWords.some(word => BUYER_KEYWORDS.has(word));
                           
  const hasUseCaseKeywords = tagsList.some(tag => USE_CASE_KEYWORDS.has(tag)) || 
                             titleWords.some(word => USE_CASE_KEYWORDS.has(word));
  
  if (hasBuyerKeywords) {
    intentScore += 5;
  }
  
  if (hasUseCaseKeywords) {
    intentScore += 5;
  }
  
  const score = titleScore + tagScore + categoryScore + intentScore;
  
  // Generate general issues
  if (title.length < 85 || title.length > 120) issues.push(`Title length (${title.length}) is outside recommended range (85-120).`);
  if (!title.endsWith('.')) issues.push("Title should end with a dot.");
  if (title.length > 0 && title[0] !== title[0].toUpperCase()) issues.push("Title should start with a capital letter.");

  if (description && (description.length < 60 || description.length > 110)) issues.push(`Description length (${description.length}) is outside recommended range (60-110).`);
  if (description && !description.endsWith('.')) issues.push("Description should end with a dot.");
  
  if (tagsList.length < 50) issues.push(`Tag count (${tagsList.length}) is below 50.`);
  if (tagsList.length > 55) issues.push(`Tag count (${tagsList.length}) exceeds 55.`);
  
  const shortTags = tagsList.filter(t => !t.includes(' '));
  const longTags = tagsList.filter(t => t.includes(' '));
  if (shortTags.length < 20) issues.push(`Short tags count (${shortTags.length}) is low (aim for ~25).`);
  if (longTags.length < 25) issues.push(`Long tags count (${longTags.length}) is low (aim for ~30).`);

  const duplicatesCount = tagsList.length - seenTags.size;

  // Dynamic Tips for Weak Words
  weakWordsDetected.forEach(w => {
    suggestions.push(`Replace the weak word "${w.word}" with powerful alternatives like: ${w.alternatives.join(', ')}.`);
  });

  if (duplicatesCount > 0) {
    suggestions.push(`Remove the ${duplicatesCount} duplicate tags to make room for more unique, descriptive keywords.`);
  }
  
  if (suggestions.length === 0 && issues.length === 0) {
    const successMessages = [
      "Great job! Your metadata is perfectly optimized for microstock agencies.",
      "Excellent keyword density and formatting. Ready for upload!",
      "Your title and tags are well-balanced for maximum visibility.",
      "Perfect score! This metadata will help your file rank well across stock platforms.",
      "Flawless optimization! Your file is ready to attract buyers."
    ];
    // Use title length to deterministically pick a message so it stays consistent for the same file
    const msgIndex = title.length % successMessages.length;
    suggestions.push(successMessages[msgIndex]);
  }
  
  return { 
    score: Math.min(100, Math.max(0, score)), 
    titleScore, 
    tagScore, 
    categoryScore, 
    intentScore, 
    issues, 
    suggestions, 
    weakWords: weakWordsDetected 
  };
};

export const validateMetadata = (metadata: { title: string; tags: string; description: string } | undefined, platform: string) => {
  if (!metadata) return [];
  const warnings: string[] = [];
  const title = metadata.title.trim();
  const tags = metadata.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
  const description = metadata.description.trim();

  if (platform === 'adobe') {
    if (title.length < 85) warnings.push("Adobe Stock: Title is too short (min 85 chars).");
    if (title.length > 120) warnings.push("Adobe Stock: Title is too long (max 120 chars).");
    if (tags.length < 5) warnings.push("Adobe Stock: Too few tags (min 5).");
    if (tags.length > 55) warnings.push("Adobe Stock: Too many tags (max 55).");
    if (description.length < 60) warnings.push("Adobe Stock: Description is too short (min 60 chars).");
    if (description.length > 110) warnings.push("Adobe Stock: Description is too long (max 110 chars).");
  }
  return warnings;
};
