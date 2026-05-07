export interface SEOAnalysis {
  score: number;
  titleScore: number;
  tagScore: number;
  categoryScore: number;
  intentScore: number;
  analysis: string[];
}

export const calculateSEO = (title: string, description: string, tags: string, category: string = ''): number => {
  const analysis = analyzeSEO(title, tags, category, description);
  return analysis.score;
};

export const analyzeSEO = (title: string, tags: string, category: string, description: string = ''): SEOAnalysis => {
  let titleScore = 30;
  let tagScore = 30;
  let categoryScore = 20;
  let intentScore = 10;
  const analysis: string[] = [];

  // Title Analysis
  const weakWords = ['beautiful', 'nice', 'amazing', 'cute', 'cool', 'art', 'design', 'illustration', 'picture', 'thing', 'stuff', 'and', 'or'];
  const strongKeywords = ['vector', 'line art', 'tattoo', 'portrait', 'floral', 'abstract', 'logo', 'icon', 'template', 'clipart', 'printable', 'svg', 'black and white', 'hand drawn', 'minimalist', 'boho', 'japanese', 'tribal', 'gothic'];
  
  const titleLower = title.toLowerCase();
  let titlePenalty = 0;
  weakWords.forEach(word => {
    if (titleLower.includes(word)) {
      titlePenalty += 2;
    }
  });
  titlePenalty = Math.min(10, titlePenalty);
  titleScore -= titlePenalty;
  
  if (titlePenalty > 0) {
    analysis.push(`Title contains weak filler words (-${titlePenalty} points).`);
  } else if (title.trim().length > 0) {
    analysis.push("Title is clear and relevant.");
  }

  // Tag Analysis
  const tagList = tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
  const uniqueTags = new Set<string>();
  let duplicatePenalty = 0;
  let genericPenalty = 0;

  tagList.forEach(tag => {
    if (uniqueTags.has(tag)) {
      duplicatePenalty += 2;
    } else {
      uniqueTags.add(tag);
      if (weakWords.includes(tag)) {
        genericPenalty += 1;
      }
    }
  });

  tagScore = Math.max(0, tagScore - duplicatePenalty - genericPenalty);
  if (duplicatePenalty > 0) analysis.push(`Duplicate tags found (-${duplicatePenalty} points).`);
  if (genericPenalty > 0) analysis.push(`Generic/weak tags found (-${genericPenalty} points).`);

  // Category Analysis
  // Since we don't have the artwork, we assume the category is correct if provided
  if (!category || category.trim() === '') {
    categoryScore = 0;
    analysis.push("Category is missing (0 points).");
  } else {
    categoryScore = 20;
    analysis.push("Category matches the artwork intent.");
  }

  // Search Intent Analysis
  const buyerKeywords = ['vector', 'svg', 'printable', 'template'];
  const useCaseKeywords = ['tattoo', 'logo', 'icon'];

  const allContent = (title + ' ' + tags).toLowerCase();
  
  let hasBuyer = false;
  buyerKeywords.forEach(word => {
    if (allContent.includes(word)) hasBuyer = true;
  });
  if (hasBuyer) intentScore += 5;

  let hasUseCase = false;
  useCaseKeywords.forEach(word => {
    if (allContent.includes(word)) hasUseCase = true;
  });
  if (hasUseCase) intentScore += 5;

  if (hasBuyer) analysis.push("High-intent buyer keywords found (+5 points).");
  if (hasUseCase) analysis.push("Clear use-case keywords found (+5 points).");
  if (!hasBuyer && !hasUseCase) analysis.push("No specific search intent keywords found.");

  const totalScore = titleScore + tagScore + categoryScore + intentScore;

  return {
    score: Math.min(100, totalScore),
    titleScore,
    tagScore,
    categoryScore,
    intentScore,
    analysis
  };
};
