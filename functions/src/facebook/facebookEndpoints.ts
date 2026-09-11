import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../index';

export const connectFacebookMock = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  // Simulate a successful OAuth connection
  const connRef = db.collection('facebook_connections').doc();
  const connData = {
    id: connRef.id,
    userId: request.auth.uid,
    facebookUserId: 'mock_fb_' + Date.now(),
    facebookUserName: 'Mock User',
    accessTokenEncrypted: 'mock_token',
    status: 'active',
    connectedAt: new Date().toISOString(),
    scopes: ['public_profile', 'pages_manage_posts', 'pages_read_engagement']
  };
  await connRef.set(connData);

  // Auto-provision some mock pages
  const pages = [
    { name: 'My Viral Page', category: 'Entertainment' },
    { name: 'Tech News', category: 'News' }
  ];

  for (const p of pages) {
    const pageRef = db.collection('destinations').doc();
    await pageRef.set({
      id: pageRef.id,
      userId: request.auth.uid,
      type: 'facebook_page',
      connectionId: connRef.id,
      name: p.name,
      pageCategory: p.category,
      canPublish: true,
      manualRequired: false,
      status: 'active'
    });
  }

  return { success: true, message: 'Connected to mock Meta API' };
});

export const schedulePost = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { caption, hashtags, mediaUrl, destinationIds, scheduledAt, timezone } = request.data;
  
  if (!destinationIds || destinationIds.length === 0) {
    throw new HttpsError('invalid-argument', 'No destinations provided');
  }

  const jobs = [];

  for (const destId of destinationIds) {
    const jobRef = db.collection('publish_jobs').doc();
    const job = {
      id: jobRef.id,
      userId: request.auth.uid,
      destinationId: destId,
      status: 'scheduled',
      scheduledAt, 
      timezone,
      caption,
      hashtags,
      mediaUrl: mediaUrl || null,
      attemptCount: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await jobRef.set(job);
    jobs.push(job.id);
  }

  return { success: true, jobs };
});
