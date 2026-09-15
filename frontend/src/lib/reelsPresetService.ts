export interface ReelsCaptionPreset {
  id: string;
  name: string;
  badge: string;
  fontFamily: string;
  color: string;
  bgColor: string;
  borderStyle: string;
  textTransform: 'uppercase' | 'capitalize' | 'none';
  exampleText: string;
}

export const REELS_CAPTION_PRESETS: ReelsCaptionPreset[] = [
  {
    id: 'hormozi',
    name: 'Hormozi Viral Yellow',
    badge: '🔥 Highest Retention',
    fontFamily: 'Impact, sans-serif',
    color: '#FACC15', // Bright Yellow
    bgColor: 'rgba(0, 0, 0, 0.85)',
    borderStyle: 'border-2 border-yellow-400',
    textTransform: 'uppercase',
    exampleText: 'NEVER MAKE THIS MISTAKE AGAIN'
  },
  {
    id: 'cyber_neon',
    name: 'Cyber Neon Cyan',
    badge: '⚡ Tech & Viral',
    fontFamily: 'system-ui, sans-serif',
    color: '#06B6D4', // Cyan
    bgColor: 'rgba(15, 23, 42, 0.9)',
    borderStyle: 'border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]',
    textTransform: 'uppercase',
    exampleText: 'THIS 1 AI TRICK CHANGES EVERYTHING'
  },
  {
    id: 'sunset_gold',
    name: 'Sunset Sunset Flame',
    badge: '🌅 High Energy',
    fontFamily: 'Montserrat, sans-serif',
    color: '#FFFFFF',
    bgColor: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
    borderStyle: 'border-none shadow-lg',
    textTransform: 'uppercase',
    exampleText: 'HOW I REACHED 1M VIEWS IN 7 DAYS'
  },
  {
    id: 'clean_minimal',
    name: 'Aesthetic Clean Minimal',
    badge: '✨ Aesthetic & Brand',
    fontFamily: 'Inter, sans-serif',
    color: '#FFFFFF',
    bgColor: 'rgba(0, 0, 0, 0.65)',
    borderStyle: 'backdrop-blur-md rounded-full px-4',
    textTransform: 'capitalize',
    exampleText: 'Save this for later so you remember'
  }
];

export const HOOK_OVERLAY_PRESETS = [
  'WAIT FOR THE END... 😱',
  'POV: You finally figured this out 👇',
  'STOP SCROLLING IF YOU WANT REAL RESULTS 🛑',
  'THE 1 TRICK NOBODY IS TALKING ABOUT 🤫',
  'DO NOT MAKE THIS MISTAKE IN 2026 ⚠️',
  'WATCH THIS BEFORE YOUR NEXT POST 🚀'
];
