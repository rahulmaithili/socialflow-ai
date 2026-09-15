import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from '../index';

export const processPublishQueue = onSchedule("every 1 minutes", async (event) => {
  const now = new Date().toISOString();
  
  // Find jobs that are scheduled and ready to be processed
  const jobsSnapshot = await db.collection('publish_jobs')
    .where('status', '==', 'scheduled')
    .where('scheduledAt', '<=', now)
    .limit(10)
    .get();

  if (jobsSnapshot.empty) {
    console.log('No jobs to process at this time.');
    return;
  }

  console.log(`Found ${jobsSnapshot.size} jobs to process.`);

  for (const doc of jobsSnapshot.docs) {
    const job = doc.data();
    
    // Lock the job to prevent duplicate processing
    await doc.ref.update({
      status: 'processing',
      lockedAt: now,
      updatedAt: now
    });

    try {
      console.log(`Processing job ${job.id} for destination ${job.destinationId}`);
      
      // MOCK: Simulate API Call to Meta
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Randomly succeed or fail to test retry logic
      const isSuccess = Math.random() > 0.1; // 90% success rate

      if (isSuccess) {
        await doc.ref.update({
          status: 'published',
          publishedAt: new Date().toISOString(),
          externalPostId: 'fb_mock_post_' + Date.now(),
          updatedAt: new Date().toISOString()
        });
        
        // Log activity
        await db.collection('activity_logs').add({
          userId: job.userId,
          type: 'post_published',
          description: `Successfully published to destination ${job.destinationId}`,
          createdAt: new Date().toISOString()
        });

      } else {
        throw new Error('Meta API Mock Timeout / Rate Limit');
      }

    } catch (error: any) {
      console.error(`Failed to publish job ${job.id}:`, error);
      
      const currentAttempts = typeof job.attemptCount === 'number' ? job.attemptCount : (typeof job.attempts === 'number' ? job.attempts : 0);
      const newAttemptCount = currentAttempts + 1;
      const maxAttempts = typeof job.maxAttempts === 'number' ? job.maxAttempts : 3;
      const isMaxAttempts = newAttemptCount >= maxAttempts;
      
      await doc.ref.update({
        status: isMaxAttempts ? 'failed' : 'scheduled', // Put back to scheduled if retrying
        attemptCount: newAttemptCount,
        lastAttemptAt: new Date().toISOString(),
        scheduledAt: isMaxAttempts ? job.scheduledAt : new Date(Date.now() + 5 * 60000).toISOString(), // Retry in 5 mins
        errorCode: 'mock_api_error',
        errorMessage: error.message || 'Unknown error',
        updatedAt: new Date().toISOString()
      });

      if (isMaxAttempts) {
        // Log final failure
        await db.collection('activity_logs').add({
          userId: job.userId,
          type: 'post_failed',
          description: `Failed to publish to destination ${job.destinationId} after ${newAttemptCount} attempts`,
          createdAt: new Date().toISOString()
        });
      }
    }
  }
});
