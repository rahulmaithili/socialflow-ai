// ============================================================
// Real Google Gemini AI Integration Service (Supports Gemini 3 & Gemini 2.5/1.5)
// ============================================================

export interface RealAIResult {
  hooks: string[];
  captions: { type: string; text: string }[];
  hashtags: string[];
  engagementScore: number;
  viralAngle: string;
  trendInsights?: string;
  modelUsed?: string;
  source: 'gemini' | 'fallback';
}

export const AVAILABLE_GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 3 / 2.5 Flash (Recommended - Ultra Fast & Smart)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 3 / 2.5 Pro (Deep Research & Maximum Accuracy)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Advanced Reasoning)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (High Speed Lightweight)' }
];

// Key management
export function getGeminiApiKey(): string {
  const localKey = localStorage.getItem('socialflow_gemini_api_key');
  if (localKey && localKey.trim()) return localKey.trim();
  return (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
}

export function saveGeminiApiKey(key: string): void {
  if (key && key.trim()) {
    localStorage.setItem('socialflow_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('socialflow_gemini_api_key');
  }
}

// Model version management (Gemini 3 / 2.5 / 1.5)
export function getGeminiModel(): string {
  const localModel = localStorage.getItem('socialflow_gemini_model');
  return localModel || 'gemini-2.5-flash';
}

export function saveGeminiModel(model: string): void {
  localStorage.setItem('socialflow_gemini_model', model);
}

/**
 * Call real Google Gemini API with fallback across model generations.
 */
export async function generateContentWithGemini(
  topicOrMedia: string,
  tone: string = 'Viral',
  language: string = 'English',
  platform: string = 'facebook',
  overrideModel?: string
): Promise<RealAIResult> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'NO_API_KEY: Please enter your Google Gemini API Key in Settings to enable real AI research.'
    );
  }

  const primaryModel = overrideModel || getGeminiModel();
  
  // List of models to try in sequence if one isn't supported on user's API quota
  const modelsToTry = [
    primaryModel,
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ].filter((v, i, a) => a.indexOf(v) === i); // unique

  const prompt = `You are an elite social media growth architect and viral content researcher for Meta/Facebook/Instagram.
Analyze the following topic or media and perform real-time creative research:
TOPIC/MEDIA: "${topicOrMedia}"
PLATFORM: ${platform}
TONE: ${tone}
LANGUAGE: ${language}

Perform thorough research on this topic and return a STRICT, valid JSON object (WITHOUT markdown backticks, raw JSON only) matching this exact format:
{
  "engagementScore": 94,
  "viralAngle": "Explain the psychological angle (Curiosity, FOMO, Relatability) in 1 sentence",
  "trendInsights": "2 sentences explaining why this topic is currently trending or how to make it go viral",
  "hooks": [
    "Hook 1 (High CTR viral question or shock opening)",
    "Hook 2 (Curiosity gap opening)",
    "Hook 3 (Contrarian or unexpected perspective)",
    "Hook 4 (Action-driven direct hook)"
  ],
  "captions": [
    {
      "type": "Viral & Engaging",
      "text": "Full detailed caption written in ${language} with emojis and structured line breaks."
    },
    {
      "type": "Storytelling",
      "text": "Relatable story-based caption in ${language} that hooks the reader and builds connection."
    },
    {
      "type": "Professional / Value",
      "text": "Informative, high-value caption in ${language} establishing authority."
    },
    {
      "type": "Short & Punchy",
      "text": "Quick 2-3 sentence punchy caption with high comment incentive."
    }
  ],
  "hashtags": [
    "#hashtag1",
    "#hashtag2",
    "#hashtag3",
    "#hashtag4",
    "#hashtag5",
    "#hashtag6",
    "#hashtag7",
    "#hashtag8",
    "#hashtag9",
    "#hashtag10"
  ]
}`;

  let lastError: Error | null = null;
  let successfulModel = primaryModel;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`[${model}] ${msg}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Clean JSON response
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleaned);
      successfulModel = model;

      return {
        hooks: parsed.hooks || [],
        captions: parsed.captions || [],
        hashtags: parsed.hashtags || [],
        engagementScore: parsed.engagementScore || 92,
        viralAngle: parsed.viralAngle || `${tone} Angle`,
        trendInsights: parsed.trendInsights || '',
        modelUsed: successfulModel,
        source: 'gemini'
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} attempt failed, trying fallback:`, err.message);
    }
  }

  throw lastError || new Error('Gemini API call failed across all models.');
}
