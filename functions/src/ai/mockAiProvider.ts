// Mock AI Provider for Development
// Mimics the behavior of Gemini 1.5 Pro/Flash

export const mockAiProvider = {
  async analyzeContent(mediaUrl: string, mediaType: 'image' | 'video') {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      mainSubject: mediaType === 'image' ? 'A cute golden retriever' : 'A person cooking pasta',
      secondarySubjects: ['park', 'ball', 'grass'],
      objects: ['collar', 'frisbee'],
      environment: 'outdoor',
      activity: 'playing',
      mood: 'joyful',
      primaryCategory: 'animals',
      targetAudience: 'pet lovers',
      bestAngles: ['funny', 'cute', 'relatable'],
      primaryAngle: 'cute',
      engagementScore: {
        overall: 88,
        hookStrength: 85,
        emotion: 90,
        curiosity: 80,
        relatability: 95,
        shareability: 92,
        commentPotential: 88,
        visualAppeal: 85,
        trendRelevance: 70,
        audienceFit: 95,
        uniqueness: 75
      }
    };
  },

  async generateCaptions(analysis: any, platform: string, tone: string) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      { type: 'best_overall', text: `This is exactly what I needed today! 😍 Rate this out of 10! \n\n#${analysis.primaryCategory} #viral` },
      { type: 'funny_relatable', text: `When you realize it's only Tuesday... 😂 \n\n#relatable #${analysis.primaryAngle}` },
      { type: 'emotional_storytelling', text: `Some moments just capture your heart perfectly. This one did it for me. ❤️ \n\n#storytelling` },
      { type: 'curiosity_engagement', text: `Wait until the end... you won't believe what happens! 😱 \n\n#waitforit #surprise` },
      { type: 'short_punchy', text: `Mood right now. ✨ \n\n#mood #vibes` }
    ];
  },

  async generateHooks(analysis: any) {
    return [
      { type: 'curiosity', text: 'You will never guess what happens next...', strengthScore: 90 },
      { type: 'question', text: 'Have you ever experienced this?', strengthScore: 85 },
      { type: 'funny', text: 'Me pretending to work while watching this:', strengthScore: 88 }
    ];
  },
  
  async generateHashtags(analysis: any) {
    return {
      broad: ['#viral', '#trending', '#explorepage'],
      niche: ['#goldenretriever', '#dogsofinstagram'],
      contentSpecific: ['#playingfetch', '#happydog'],
      audienceSpecific: ['#petparents', '#doglovers'],
      trending: ['#dogsoftiktok'],
      best10: ['#viral', '#trending', '#goldenretriever', '#dogsofinstagram', '#petparents', '#doglovers', '#happydog', '#playingfetch', '#explorepage', '#cute'],
      source: 'ai_recommended'
    };
  }
};
