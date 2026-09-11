import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../index';
import { mockAiProvider } from './mockAiProvider';
// import { GoogleGenerativeAI } from '@google/generative-ai'; // For production

// Helper to determine if we should use mock (in production, use environment variables)
const USE_MOCK = true; 

export const analyzeMedia = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { mediaId, mediaUrl, mediaType } = request.data;
  if (!mediaId || !mediaUrl || !mediaType) {
    throw new HttpsError('invalid-argument', 'Missing media info');
  }

  try {
    let analysis;
    
    if (USE_MOCK) {
      analysis = await mockAiProvider.analyzeContent(mediaUrl, mediaType);
    } else {
      // Production Gemini implementation would go here
      // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      // const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      // ...
    }

    // Save to Firestore
    const analysisRef = db.collection('content_analysis').doc();
    const analysisData = {
      id: analysisRef.id,
      userId: request.auth.uid,
      mediaId,
      status: 'complete',
      createdAt: new Date().toISOString(),
      ...analysis
    };
    
    await analysisRef.set(analysisData);
    
    // Update media doc
    await db.collection('media').doc(mediaId).update({
      aiAnalysisId: analysisRef.id,
      status: 'analyzed',
      updatedAt: new Date().toISOString()
    });

    return { success: true, analysisId: analysisRef.id, data: analysisData };
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    throw new HttpsError('internal', error.message || 'AI Analysis failed');
  }
});

export const generateContent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { analysisId, platform, tone, language } = request.data;
  
  try {
    const analysisDoc = await db.collection('content_analysis').doc(analysisId).get();
    if (!analysisDoc.exists) {
      throw new HttpsError('not-found', 'Analysis not found');
    }
    const analysis = analysisDoc.data();

    let captions, hooks, hashtags;
    
    if (USE_MOCK) {
      captions = await mockAiProvider.generateCaptions(analysis, platform, tone);
      hooks = await mockAiProvider.generateHooks(analysis);
      hashtags = await mockAiProvider.generateHashtags(analysis);
    } else {
      // Production Gemini implementation
    }

    // Save Generation
    const genRef = db.collection('ai_generations').doc();
    const genData = {
      id: genRef.id,
      userId: request.auth.uid,
      mediaId: analysis?.mediaId,
      analysisId,
      platform,
      language,
      tone,
      captions,
      hooks,
      hashtags,
      createdAt: new Date().toISOString()
    };
    
    await genRef.set(genData);

    return { success: true, generationId: genRef.id, data: genData };
  } catch (error: any) {
    console.error('Content Gen Error:', error);
    throw new HttpsError('internal', 'Content generation failed');
  }
});
