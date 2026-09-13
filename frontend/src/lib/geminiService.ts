// ============================================================
// Real Google Gemini AI Integration Service (Supports Gemini 3 & Gemini 2.5/1.5)
// With Live Google Search Grounding & Real-Time Trend Intelligence
// ============================================================

export interface RealAIResult {
  hooks: string[];
  captions: { type: string; text: string }[];
  hashtags: string[];
  engagementScore: number;
  viralAngle: string;
  trendInsights?: string;
  modelUsed?: string;
  webSources?: { title: string; url: string }[];
  source: 'gemini' | 'fallback';
}

export interface LiveTrendResult {
  topic: string;
  country: string;
  platform: string;
  trends: {
    type: 'VIRAL BREAKOUT' | 'HIGH ENGAGEMENT' | 'NICHE SPECIFIC';
    title: string;
    score: number;
    description: string;
  }[];
  keywords: string[];
  ideas: string[];
  angles: string[];
  webSources: { title: string; url: string }[];
  researchedAt: string;
  modelUsed: string;
}

export interface ViralScoreBreakdown {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C';
  verdict: string;
  dimensions: {
    hookStrength: number;
    emotionalResonance: number;
    readability: number;
    viralityPotential: number;
  };
  suggestions: string[];
}

export const AVAILABLE_GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 3 / 2.5 Flash (Recommended - Ultra Fast & Grounded)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 3 / 2.5 Pro (Deep Research & Grounding)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (High Speed Lightweight)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Advanced Reasoning)' }
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
 * Call real Google Gemini API with fallback and optional Google Search Grounding.
 */
export async function generateContentWithGemini(
  topicOrMedia: string,
  tone: string = 'Viral',
  language: string = 'English',
  platform: string = 'facebook',
  overrideModel?: string,
  useSearchGrounding: boolean = true
): Promise<RealAIResult> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'NO_API_KEY: Please enter your Google Gemini API Key in Settings to enable real AI research.'
    );
  }

  const primaryModel = overrideModel || getGeminiModel();
  
  const modelsToTry = [
    primaryModel,
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ].filter((v, i, a) => a.indexOf(v) === i);

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
  "trendInsights": "2 sentences explaining why this topic is currently trending or how to make it go viral based on latest internet discussions",
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
    const configs = useSearchGrounding
      ? [{ withTools: true }, { withTools: false }]
      : [{ withTools: false }];

    for (const cfg of configs) {
      try {
        const bodyPayload: any = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95
          }
        };

        if (cfg.withTools) {
          bodyPayload.tools = [{ googleSearch: {} }];
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const msg = errorData?.error?.message || `HTTP ${response.status}`;
          if (cfg.withTools) continue;
          throw new Error(`[${model}] ${msg}`);
        }

        const data = await response.json();
        const candidate = data?.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text || '';

        const webSources: { title: string; url: string }[] = [];
        const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
        if (Array.isArray(groundingChunks)) {
          groundingChunks.forEach((chunk: any) => {
            if (chunk?.web?.uri) {
              webSources.push({
                title: chunk.web.title || new URL(chunk.web.uri).hostname,
                url: chunk.web.uri
              });
            }
          });
        }

        let cleaned = rawText.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
        }

        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
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
          webSources: webSources.length > 0 ? webSources : undefined,
          modelUsed: successfulModel,
          source: 'gemini'
        };
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error('Gemini API call failed across all models.');
}

/**
 * Real-time Trend Research with Google Search Grounding
 */
export async function researchLiveTrendsWithGemini(
  topicOrNiche: string,
  country: string = 'Global',
  platform: string = 'Facebook'
): Promise<LiveTrendResult> {
  const apiKey = getGeminiApiKey();
  const q = topicOrNiche.trim() || 'General Viral Social Trends';

  if (!apiKey) {
    throw new Error(
      'NO_API_KEY: Please enter your Google Gemini API Key in Settings to enable real-time web research.'
    );
  }

  const model = getGeminiModel();
  const prompt = `You are an elite live web social researcher.
Conduct live web research using Google Search on the current top viral trends, discussions, news, and memes for:
TOPIC/NICHE: "${q}"
TARGET REGION: ${country}
PLATFORM: ${platform}
DATE: 2026

Search for what people are talking about RIGHT NOW on the internet, Facebook, Instagram, and Reddit.
Return a STRICT, valid JSON object (WITHOUT backticks or extra prose, only valid JSON) matching this exact format:
{
  "trends": [
    {
      "type": "VIRAL BREAKOUT",
      "title": "Specific trending hook or breaking angle title",
      "score": 96,
      "description": "Why this specific angle is exploding right now with real-world context."
    },
    {
      "type": "HIGH ENGAGEMENT",
      "title": "Controversial, debate-sparking or curious trending title",
      "score": 89,
      "description": "What debate or curiosity is driving high comment volume."
    },
    {
      "type": "NICHE SPECIFIC",
      "title": "High-utility problem solving or secret revelation title",
      "score": 82,
      "description": "Specific actionable insight your target audience craves."
    }
  ],
  "keywords": ["trendingkeyword1", "viralhook2", "nichekeyword3", "hashtag4", "keyword5", "keyword6"],
  "ideas": [
    "Actionable post idea 1 with a concrete hook",
    "Actionable post idea 2 with storytelling hook",
    "Actionable post idea 3 with comparison or debate hook"
  ],
  "angles": ["Psychological Angle 1", "Curiosity Gap Angle 2", "FOMO / Breaking News Angle 3", "Humor / Relatability Angle 4"]
}`;

  const modelsToTry = [model, 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  let lastError: Error | null = null;

  for (const m of modelsToTry) {
    const attempts = [{ withTools: true }, { withTools: false }];
    for (const att of attempts) {
      try {
        const bodyPayload: any = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            topK: 40,
            topP: 0.95
          }
        };

        if (att.withTools) {
          bodyPayload.tools = [{ googleSearch: {} }];
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
          }
        );

        if (!res.ok) {
          if (att.withTools) continue;
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}`);
        }

        const data = await responseToJson(res);
        const candidate = data?.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text || '';

        const webSources: { title: string; url: string }[] = [];
        const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
        if (Array.isArray(groundingChunks)) {
          groundingChunks.forEach((chunk: any) => {
            if (chunk?.web?.uri) {
              webSources.push({
                title: chunk.web.title || new URL(chunk.web.uri).hostname,
                url: chunk.web.uri
              });
            }
          });
        }

        let cleaned = rawText.trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(cleaned);

        return {
          topic: q,
          country,
          platform,
          trends: parsed.trends || [],
          keywords: parsed.keywords || [],
          ideas: parsed.ideas || [],
          angles: parsed.angles || [],
          webSources,
          researchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: m
        };
      } catch (e: any) {
        lastError = e;
      }
    }
  }

  throw lastError || new Error('Failed to conduct live trend research.');
}

async function responseToJson(res: Response) {
  return await res.json();
}

/**
 * Predicts Viral Engagement Score and provides granular algorithmic breakdown
 */
export function predictViralScore(
  content: string,
  platform: string = 'facebook',
  hasMedia: boolean = false
): ViralScoreBreakdown {
  const text = content.trim();
  if (!text) {
    return {
      score: 0,
      grade: 'C',
      verdict: 'No content to analyze.',
      dimensions: { hookStrength: 0, emotionalResonance: 0, readability: 0, viralityPotential: 0 },
      suggestions: ['Write or generate post content to measure viral potential.']
    };
  }

  let hookStrength = 50;
  let emotionalResonance = 50;
  let readability = 50;
  let viralityPotential = 50;
  const suggestions: string[] = [];

  // 1. Hook Analysis (First line)
  const firstLine = text.split('\n')[0] || '';
  if (firstLine.includes('?') || firstLine.includes('!')) hookStrength += 15;
  if (/\d+/.test(firstLine)) hookStrength += 12;
  if (/^(how to|why|the secret|never|stop|this is|discover|top)/i.test(firstLine)) hookStrength += 18;
  if (/[\u{1F300}-\u{1F9FF}]/u.test(firstLine)) hookStrength += 8;

  if (hookStrength < 65) {
    suggestions.push('Add an intriguing question, strong statistic, or curiosity gap to the first line.');
  }

  // 2. Emotional Resonance
  const emotionalKeywords = [
    'secret', 'proven', 'mistake', 'truth', 'insane', 'shocking', 'unbelievable',
    'easy', 'simple', 'fast', 'money', 'grow', 'viral', 'fail', 'win', 'changed'
  ];
  let triggerCount = 0;
  emotionalKeywords.forEach(word => {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) triggerCount++;
  });
  emotionalResonance += Math.min(triggerCount * 8, 35);
  if (/[\u{1F300}-\u{1F9FF}]/u.test(text)) emotionalResonance += 10;

  if (emotionalResonance < 65) {
    suggestions.push('Incorporate emotional trigger words (e.g. "secret", "proven", "mistake") to hook attention.');
  }

  // 3. Readability & Spacing
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length >= 3) readability += 18;
  if (text.length > 80 && text.length < 900) readability += 15;
  if (text.includes('•') || text.includes('- ') || text.includes('1.')) readability += 12;

  if (readability < 65) {
    suggestions.push('Use shorter 1-2 sentence paragraphs and bullet points for mobile readability.');
  }

  // 4. Virality Potential & CTA
  const hashtags = (text.match(/#[a-zA-Z0-9_]+/g) || []).length;
  if (hashtags >= 3 && hashtags <= 8) viralityPotential += 18;
  else if (hashtags > 12) viralityPotential -= 10;

  if (/comment|share|tell me|drop|what do you think|save this/i.test(text)) {
    viralityPotential += 20;
  } else {
    suggestions.push('Include a clear Call To Action (e.g. "Drop your thoughts below 👇").');
  }

  if (hasMedia) viralityPotential += 15;

  hookStrength = Math.min(Math.max(hookStrength, 30), 99);
  emotionalResonance = Math.min(Math.max(emotionalResonance, 30), 98);
  readability = Math.min(Math.max(readability, 30), 99);
  viralityPotential = Math.min(Math.max(viralityPotential, 30), 98);

  const composite = Math.round(
    hookStrength * 0.35 + emotionalResonance * 0.25 + readability * 0.2 + viralityPotential * 0.2
  );

  let grade: 'A+' | 'A' | 'B' | 'C' = 'C';
  let verdict = 'Moderate potential. Needs stronger hooks and formatting.';

  if (composite >= 90) {
    grade = 'A+';
    verdict = '🔥 High Viral Probability! Exceptional hooks, clean spacing, and high engagement incentive.';
  } else if (composite >= 80) {
    grade = 'A';
    verdict = '🚀 Strong Viral Potential. Well-structured and likely to capture feed attention.';
  } else if (composite >= 68) {
    grade = 'B';
    verdict = 'Good baseline post. A stronger opening hook will significantly boost CTR.';
  }

  return {
    score: composite,
    grade,
    verdict,
    dimensions: {
      hookStrength,
      emotionalResonance,
      readability,
      viralityPotential
    },
    suggestions: suggestions.slice(0, 3)
  };
}
