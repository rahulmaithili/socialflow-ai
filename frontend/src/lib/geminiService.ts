// ============================================================
// Real Google Gemini AI Integration Service
// ============================================================

export interface RealAIResult {
  hooks: string[];
  captions: { type: string; text: string }[];
  hashtags: string[];
  engagementScore: number;
  viralAngle: string;
  trendInsights?: string;
  source: 'gemini' | 'fallback';
}

// Key management: Checks localStorage first, then environment variable
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

/**
 * Call real Google Gemini API (gemini-1.5-flash) to research and generate high-engagement viral content.
 */
export async function generateContentWithGemini(
  topicOrMedia: string,
  tone: string = 'Viral',
  language: string = 'English',
  platform: string = 'facebook'
): Promise<RealAIResult> {
  const apiKey = getGeminiApiKey();

  // If no Gemini API key is configured, inform user or use smart generator
  if (!apiKey) {
    throw new Error(
      'NO_API_KEY: Please enter your Google Gemini API Key in Settings (or .env) to enable real AI research.'
    );
  }

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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
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
    const msg = errorData?.error?.message || `Gemini API Error: HTTP ${response.status}`;
    throw new Error(msg);
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

  try {
    const parsed = JSON.parse(cleaned);
    return {
      hooks: parsed.hooks || [],
      captions: parsed.captions || [],
      hashtags: parsed.hashtags || [],
      engagementScore: parsed.engagementScore || 90,
      viralAngle: parsed.viralAngle || `${tone} Angle`,
      trendInsights: parsed.trendInsights || '',
      source: 'gemini'
    };
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', rawText);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}
