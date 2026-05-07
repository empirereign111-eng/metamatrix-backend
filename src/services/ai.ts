import { GoogleGenAI, Type } from '@google/genai';
import { Provider } from '../types';
import { cleanTrailingStopWords, ALLOWED_CATEGORIES } from '../utils/seoAnalyzer';

const resizeImage = (file: File, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Use a slightly lower quality to further reduce size
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const fileToBase64 = async (file: File): Promise<string> => {
  // For metadata generation, we don't need full resolution. 
  // Resizing helps avoid "Payload Too Large" errors and reduces latency.
  try {
    return await resizeImage(file);
  } catch (e) {
    console.warn("Resize failed, falling back to original:", e);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  }
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${ms / 1000} seconds`));
    }, ms);
    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(reason => {
        clearTimeout(timer);
        reject(reason);
      });
  });
};

export const generateMetadata = async (
  provider: Provider,
  model: string,
  apiKey: string,
  file: File,
  baseUrl?: string,
  minTitleLength: number = 85,
  maxTitleLength: number = 120,
  minDescriptionLength: number = 60,
  maxDescriptionLength: number = 110,
  keywordCount: number = 55,
  tagGenerationMode: 'single' | 'multi' | 'long' = 'multi'
) => {
  let tagInstructions = '';
  if (tagGenerationMode === 'single') {
    tagInstructions = `Provide EXACTLY ${keywordCount} Short Tags. Each tag MUST be exactly 1 word. DO NOT provide any multi-word phrases.`;
  } else if (tagGenerationMode === 'long') {
    tagInstructions = `Provide EXACTLY ${keywordCount} Long Tags. Each tag MUST be a phrase of 2 to 4 words (e.g., "modern architecture", "luxury home interior"). DO NOT provide single-word tags.`;
  } else {
    const bufferCount = Math.min(5, Math.ceil(keywordCount * 0.1));
    const targetCount = keywordCount + bufferCount;
    const shortTagsCount = Math.floor(targetCount / 2);
    const longTagsCount = targetCount - shortTagsCount;

    tagInstructions = `Provide EXACTLY ${targetCount} UNIQUE tags in total (to ensure at least ${keywordCount} are valid).
- ${shortTagsCount} Short Tags: Each tag MUST be exactly 1 word.
- ${longTagsCount} Long Tags: Each tag MUST be a phrase of 2 to 4 words.
EVERY TAG MUST BE UNIQUE. DO NOT use special characters like #, @, !, or quotes. Only letters, numbers, and spaces are allowed.`;
  }

  const prompt = `### STRICT COMPLIANCE RULES ###
MANDATORY: You MUST follow these character and count limits EXACTLY.

1. TITLE CONSTRAINTS:
   - LENGTH: ${minTitleLength} to ${maxTitleLength} characters (including spaces).
   - CRITICAL: If your title is under ${minTitleLength} characters, you MUST add more descriptive words (e.g., "high resolution", "detailed textures", "professional composition") until it is at least ${minTitleLength + 5} characters.
   - FORMAT: First letter Capital, rest small (except abbreviations), ends with a dot.

2. DESCRIPTION CONSTRAINTS:
   - LENGTH: ${minDescriptionLength} to ${maxDescriptionLength} characters.
   - FORMAT: First letter Capital, rest small, ends with a dot.

3. TAG CONSTRAINTS:
   - TOTAL COUNT: EXACTLY ${keywordCount + Math.min(5, Math.ceil(keywordCount * 0.1))} UNIQUE tags.
   - ${tagInstructions}
   - FORMAT: All lowercase, separated by a comma and a single space.
   - QUALITY: Unique, top-ranked, relevant keywords.

4. CATEGORY:
   - Select ONE from: (${ALLOWED_CATEGORIES.join(', ')}).

### MANDATORY VERIFICATION STEP ###
Before providing the JSON, perform this internal check:
- Count the characters in your title. Is it >= ${minTitleLength}? If not, expand it.
- Count your tags. Are there enough to meet the ${keywordCount} requirement?

Return ONLY a JSON object with the following structure:
{
  "thinking": "Title length: [X] chars. Tag count: [Y] tags. Verified both meet requirements.",
  "title": "Your generated title here",
  "description": "Your generated description here",
  "tags": "tag one, tag two, tag three, ...",
  "category": "Selected Category"
}`;

  const cleanJsonResponse = (text: string) => {
    try {
      // Find the first '{' and last '}' to extract the JSON object
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      let parsed: any = {};
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        let jsonStr = text.substring(firstBrace, lastBrace + 1);
        
        // Aggressive cleanup for common AI JSON errors
        jsonStr = jsonStr
          .replace(/,\s*}/g, '}') // Remove trailing commas in objects
          .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
          .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'); // Ensure keys are quoted
          
        try {
          parsed = JSON.parse(jsonStr);
        } catch (e) {
          // If JSON.parse still fails, we'll fall back to regex
        }
      }

      // Regex fallback for each field if JSON.parse failed or field is missing
      if (!parsed.title) {
        const titleMatch = text.match(/"title":\s*"([^"]+)"/i) || text.match(/title:\s*([^\n]+)/i);
        if (titleMatch) parsed.title = titleMatch[1].trim();
      }
      if (!parsed.description) {
        const descMatch = text.match(/"description":\s*"([^"]+)"/i) || text.match(/description:\s*([^\n]+)/i);
        if (descMatch) parsed.description = descMatch[1].trim();
      }
      if (!parsed.tags) {
        const tagsMatch = text.match(/"tags":\s*"([^"]+)"/i) || text.match(/tags:\s*([^\n]+)/i);
        if (tagsMatch) parsed.tags = tagsMatch[1].trim();
      }
      if (!parsed.category) {
        const catMatch = text.match(/"category":\s*"([^"]+)"/i) || text.match(/category:\s*([^\n]+)/i);
        if (catMatch) parsed.category = catMatch[1].trim();
      }

      if (!parsed.title && !parsed.description && !parsed.tags) {
        throw new Error("Could not extract metadata from AI response");
      }
      
      let title = parsed.title || "Untitled Design";
      title = title.replace(/^["']|["']$/g, '');
      title = cleanTrailingStopWords(title);

      let description = parsed.description || "";
      description = description.replace(/^["']|["']$/g, '');
      
      if (description.length > maxDescriptionLength) {
        const truncateAt = Math.max(0, maxDescriptionLength - 3);
        description = description.substring(0, truncateAt);
        const lastSpace = description.lastIndexOf(' ');
        if (lastSpace > 0) {
          description = description.substring(0, lastSpace) + "...";
        } else {
          description = description + "...";
        }
      }

      let tags = parsed.tags || "";
      tags = tags.replace(/^["']|["']$/g, '');
      
      if (tags) {
        const tagsArray = tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean);
        
        // If the AI provides fewer than 80% of requested tags, throw an error to trigger a retry
        const minRequiredTags = Math.max(10, Math.floor(keywordCount * 0.8));
        if (tagsArray.length < minRequiredTags) {
          throw new Error(`AI provided only ${tagsArray.length} tags. Minimum ${minRequiredTags} required.`);
        }

        if (tagsArray.length > keywordCount) {
          tags = tagsArray.slice(0, keywordCount).join(', ');
        } else {
          tags = tagsArray.join(', ');
        }
      }

      // If the title is too short, throw an error to trigger a retry
      if (title.length < minTitleLength) {
        throw new Error(`AI provided a title that is too short (${title.length} chars). Minimum ${minTitleLength} required.`);
      }

      return {
        title: title,
        description: description,
        tags: tags,
        category: parsed.category || "Graphic Resources"
      };
    } catch (e: any) {
      // Re-throw validation errors so the retry loop can catch them
      if (e.message && (e.message.includes("Minimum 50 required") || e.message.includes("Minimum 85 required") || e.message.includes("Could not extract metadata"))) {
        throw e;
      }
      console.error("Failed to parse AI response:", text);
      throw new Error("The AI response was not in the expected format. Please try again.");
    }
  };

  const maxRetries = 3; // Total 4 attempts
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Determine if we should use the OpenAI-compatible proxy logic
      const useProxy = apiKey.startsWith('sk-or-') || !!baseUrl;

      if (useProxy) {
        const base64Data = await fileToBase64(file);
        let finalModel = model;
        
        if (finalModel === 'gemini-1.5-flash' || finalModel === 'gemini-flash-latest') {
          finalModel = 'gemini-3-flash-preview';
        }
        
        const finalBaseUrl = baseUrl || 'https://openrouter.ai/api/v1';
        const isKnownProxy = finalBaseUrl.includes('openrouter') || finalBaseUrl.includes('modelrouter');

        if (isKnownProxy && !finalModel.includes('/')) {
          if (provider === 'gemini') {
            finalModel = `google/${finalModel}`;
          } else if (provider === 'grok') {
            finalModel = `x-ai/${finalModel}`;
          }
        }

        const endpoint = `${finalBaseUrl.replace(/\/$/, '')}/chat/completions`;

        const response = await withTimeout(fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Adobe Stock Metadata Generator'
          },
          body: JSON.stringify({
            model: finalModel,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:${file.type || 'image/jpeg'};base64,${base64Data}` } }
                ]
              }
            ]
          })
        }), 90000);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Proxy API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
          throw new Error("Empty response from Proxy API");
        }
        return cleanJsonResponse(data.choices[0].message.content);
      }

      if (provider === 'mixtral') {
        const base64Data = await fileToBase64(file);
        const response = await withTimeout(fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model === 'pixtral-12b vision' ? 'pixtral-12b-2409' : model,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:${file.type || 'image/jpeg'};base64,${base64Data}` } }
                ]
              }
            ]
          })
        }), 90000);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Mistral API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
          throw new Error("Empty response from Mistral API");
        }
        return cleanJsonResponse(data.choices[0].message.content);
      }

      if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey });
        const base64Data = await fileToBase64(file);
        
        const imagePart = {
          inlineData: {
            mimeType: file.type || 'image/jpeg',
            data: base64Data
          }
        };
        const textPart = {
          text: prompt
        };

        let actualModel = model;
        if (model === 'gemini-1.5-flash' || model === 'gemini-flash-latest') {
          actualModel = 'gemini-3-flash-preview';
        }

        const response = await withTimeout(ai.models.generateContent({
          model: actualModel,
          contents: { parts: [imagePart, textPart] },
        }), 120000);
        
        const text = response.text;
        if (!text) throw new Error('No response from Gemini');
        return cleanJsonResponse(text);
      } else if (provider === 'grok') {
        const base64Data = await fileToBase64(file);
        const response = await withTimeout(fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            temperature: 0,
            stream: false,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:${file.type || 'image/jpeg'};base64,${base64Data}` } }
                ]
              }
            ]
          })
        }), 90000);
        
        if (!response.ok) {
          const errText = await response.text();
          let errMsg = 'Grok API Error';
          try {
            const err = JSON.parse(errText);
            errMsg = err.error?.message || (typeof err.error === 'string' ? err.error : null) || err.message || errMsg;
          } catch (e) {}
          throw new Error(errMsg);
        }
        
        const data = await response.json();
        return cleanJsonResponse(data.choices[0].message.content);
      }
    } catch (error: any) {
      lastError = error;
      const isValidationError = error.message && (
        error.message.includes("Minimum 50 required") || 
        error.message.includes("Minimum 85 required") || 
        error.message.includes("Could not extract metadata") ||
        error.message.includes("expected format")
      );

      if (isValidationError && attempt < maxRetries) {
        console.warn(`[Attempt ${attempt + 1}] Validation failed, retrying...`, error.message);
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const rawErrorMsg = (error.message || String(error)).toLowerCase();
      const isRateLimit = rawErrorMsg.includes('quota') || rawErrorMsg.includes('rate limit') || rawErrorMsg.includes('429') || rawErrorMsg.includes('too many requests');
      
      if (isRateLimit) {
        console.warn(`[Rate Limit] Error generating metadata with ${provider}: Rate limit exceeded.`);
      } else {
        console.error(`Error generating metadata with ${provider}:`, error);
      }
      
      let errorMessage = error?.message || 'Failed to generate metadata';
      
      if (error?.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (typeof error === 'object' && !(error instanceof Error)) {
        try {
          const stringified = JSON.stringify(error);
          if (stringified !== '{}') {
            errorMessage = stringified;
          }
        } catch (e) {
          errorMessage = String(error);
        }
      }
      
      throw new Error(errorMessage);
    }
  }
  throw lastError;
};
