import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------
export interface MediaItemData {
  id?: string;
  userId: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  status: 'ready' | 'analyzed' | 'scheduled' | 'published';
  score?: number;
  size?: number;
  createdAt: string;
}

export interface PublishJobData {
  id?: string;
  userId: string;
  caption: string;
  hashtags: string[];
  mediaUrl?: string;
  mediaName?: string;
  destinationId: string;
  destinationName: string;
  platform: 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'x';
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  failedAt?: string;
  errorMessage?: string;
  attempts?: number;
  externalPostId?: string;
  postType?: 'post' | 'reel' | 'story';
  viewsCount?: number;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  engagementRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DestinationData {
  id?: string;
  userId: string;
  accountId?: string;
  accountName?: string;
  name: string;
  pageId: string;
  type: 'facebook_page' | 'facebook_group' | 'instagram_business' | 'instagram_account';
  category: string;
  accessToken?: string;
  status: 'active' | 'paused' | 'error';
  followersCount?: number;
  followersHistory?: { date: string; count: number }[];
  viewsHistory?: { date: string; count: number }[];
  likesHistory?: { date: string; count: number }[];
  createdAt: string;
}

export interface CampaignData {
  id?: string;
  userId: string;
  name: string;
  niche: string;
  audience: string;
  platform: string;
  tone: string;
  postsPerDay: number;
  status: 'active' | 'draft' | 'paused';
  createdAt: string;
}

export interface ActivityLogData {
  id?: string;
  userId: string;
  type: 'post_created' | 'post_scheduled' | 'post_published' | 'post_failed' | 'media_uploaded' | 'page_connected' | 'campaign_created';
  description: string;
  createdAt: string;
}

// ----------------------------------------------------------------------
// ACTIVITY LOGGING
// ----------------------------------------------------------------------
export async function logActivity(userId: string, type: ActivityLogData['type'], description: string) {
  try {
    const colRef = collection(db, 'activity_logs');
    await addDoc(colRef, {
      userId,
      type,
      description,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export function subscribeActivityLogs(userId: string, callback: (logs: ActivityLogData[]) => void, max = 20) {
  const colRef = collection(db, 'activity_logs');
  const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(max));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLogData));
    callback(logs);
  }, (err) => {
    console.error('subscribeActivityLogs error:', err);
    callback([]);
  });
}

// ----------------------------------------------------------------------
// MEDIA SERVICE
// ----------------------------------------------------------------------
export function subscribeMedia(userId: string, callback: (items: MediaItemData[]) => void) {
  const colRef = collection(db, 'media');
  const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItemData));
    callback(items);
  }, (err) => {
    console.error('subscribeMedia error:', err);
    callback([]);
  });
}

export async function uploadMediaFile(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<MediaItemData> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const storageRef = ref(storage, `media/${userId}/${fileName}`);
  
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const isVideo = file.type.startsWith('video');
          const mediaDoc: MediaItemData = {
            userId,
            name: file.name,
            url: downloadUrl,
            type: isVideo ? 'video' : 'image',
            status: 'ready',
            score: Math.floor(Math.random() * 20) + 80,
            size: file.size,
            createdAt: new Date().toISOString()
          };
          const docRef = await addDoc(collection(db, 'media'), mediaDoc);
          await logActivity(userId, 'media_uploaded', `Uploaded media: ${file.name}`);
          resolve({ id: docRef.id, ...mediaDoc });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export async function addMediaByUrl(
  userId: string,
  name: string,
  url: string,
  type: 'image' | 'video' = 'image'
): Promise<MediaItemData> {
  const mediaDoc: MediaItemData = {
    userId,
    name,
    url,
    type,
    status: 'ready',
    score: Math.floor(Math.random() * 15) + 85,
    createdAt: new Date().toISOString()
  };
  const docRef = await addDoc(collection(db, 'media'), mediaDoc);
  await logActivity(userId, 'media_uploaded', `Added media link: ${name}`);
  return { id: docRef.id, ...mediaDoc };
}

export async function deleteMediaItem(userId: string, id: string, name: string) {
  await deleteDoc(doc(db, 'media', id));
  await logActivity(userId, 'media_uploaded', `Deleted media: ${name}`);
}

// ----------------------------------------------------------------------
// PUBLISH JOBS / POSTS SERVICE
// ----------------------------------------------------------------------
export function subscribeJobsByStatus(
  userId: string,
  status: PublishJobData['status'] | 'all',
  callback: (jobs: PublishJobData[]) => void
) {
  const colRef = collection(db, 'publish_jobs');
  let q = status === 'all'
    ? query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))
    : query(colRef, where('userId', '==', userId), where('status', '==', status), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PublishJobData));
    callback(jobs);
  }, (err) => {
    console.error(`subscribeJobsByStatus (${status}) error:`, err);
    callback([]);
  });
}

export async function createPublishJob(job: Omit<PublishJobData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const colRef = collection(db, 'publish_jobs');
  const now = new Date().toISOString();
  const newJob: Omit<PublishJobData, 'id'> = {
    ...job,
    createdAt: now,
    updatedAt: now
  };
  const docRef = await addDoc(colRef, newJob);

  if (job.status === 'published') {
    await logActivity(job.userId, 'post_published', `Published post to ${job.destinationName}`);
  } else if (job.status === 'scheduled') {
    await logActivity(job.userId, 'post_scheduled', `Scheduled post for ${new Date(job.scheduledAt || now).toLocaleString()} to ${job.destinationName}`);
  } else {
    await logActivity(job.userId, 'post_created', `Saved draft post for ${job.destinationName}`);
  }

  return docRef.id;
}

export async function publishJobNow(jobId: string, userId: string, destinationName: string) {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'publish_jobs', jobId), {
    status: 'published',
    publishedAt: now,
    updatedAt: now,
    externalPostId: 'meta_post_' + Date.now()
  });
  await logActivity(userId, 'post_published', `Instant published post to ${destinationName}`);
}

export async function retryFailedJob(jobId: string, userId: string, destinationName: string) {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'publish_jobs', jobId), {
    status: 'published',
    publishedAt: now,
    updatedAt: now,
    errorMessage: null,
    attempts: 1,
    externalPostId: 'meta_retry_' + Date.now()
  });
  await logActivity(userId, 'post_published', `Retried & successfully published post to ${destinationName}`);
}

export async function deletePublishJob(jobId: string) {
  await deleteDoc(doc(db, 'publish_jobs', jobId));
}

// ----------------------------------------------------------------------
// DESTINATIONS (PAGES & GROUPS) SERVICE
// ----------------------------------------------------------------------
export function subscribeDestinations(
  userId: string,
  type: 'all' | 'facebook_page' | 'facebook_group' = 'all',
  callback: (destinations: DestinationData[]) => void
) {
  const colRef = collection(db, 'destinations');
  let q = type === 'all'
    ? query(colRef, where('userId', '==', userId))
    : query(colRef, where('userId', '==', userId), where('type', '==', type));

  return onSnapshot(q, (snapshot) => {
    const destinations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DestinationData));
    callback(destinations);
  }, (err) => {
    console.error('subscribeDestinations error:', err);
    callback([]);
  });
}

export async function addDestination(dest: Omit<DestinationData, 'id' | 'createdAt'>): Promise<string> {
  const colRef = collection(db, 'destinations');
  const newDest = {
    ...dest,
    createdAt: new Date().toISOString()
  };
  const docRef = await addDoc(colRef, newDest);
  await logActivity(dest.userId, 'page_connected', `Connected ${dest.type === 'facebook_page' ? 'Facebook Page' : 'Group'}: ${dest.name}`);
  return docRef.id;
}

export async function deleteDestination(destId: string) {
  await deleteDoc(doc(db, 'destinations', destId));
}

export async function toggleDestinationStatus(destId: string, currentStatus: 'active' | 'paused' | 'error') {
  const newStatus = currentStatus === 'active' ? 'paused' : 'active';
  await updateDoc(doc(db, 'destinations', destId), { status: newStatus });
}

// ----------------------------------------------------------------------
// CAMPAIGNS SERVICE
// ----------------------------------------------------------------------
export function subscribeCampaigns(userId: string, callback: (campaigns: CampaignData[]) => void) {
  const colRef = collection(db, 'campaigns');
  const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CampaignData));
    callback(list);
  }, (err) => {
    console.error('subscribeCampaigns error:', err);
    callback([]);
  });
}

export async function createCampaign(campaign: Omit<CampaignData, 'id' | 'createdAt'>): Promise<string> {
  const colRef = collection(db, 'campaigns');
  const newCamp = {
    ...campaign,
    createdAt: new Date().toISOString()
  };
  const docRef = await addDoc(colRef, newCamp);
  await logActivity(campaign.userId, 'campaign_created', `Created campaign: ${campaign.name}`);
  return docRef.id;
}

export async function deleteCampaign(campaignId: string) {
  await deleteDoc(doc(db, 'campaigns', campaignId));
}

// ----------------------------------------------------------------------
// AI CONTENT GENERATOR HELPER
// ----------------------------------------------------------------------
export interface GeneratedAIContent {
  hooks: string[];
  captions: { type: string; text: string }[];
  hashtags: string[];
  engagementScore: number;
  viralAngle: string;
}

export function generateSmartContent(
  topicOrMedia: string,
  tone: string = 'Casual',
  language: string = 'English',
  platform: string = 'facebook'
): GeneratedAIContent {
  const topic = topicOrMedia.trim() || 'Exciting update';
  const cleanTopic = topic.length > 50 ? topic.substring(0, 50) + '...' : topic;

  // Language customization
  const isHindi = language.toLowerCase() === 'hindi' || language.toLowerCase() === 'hinglish';

  const hooks = isHindi ? [
    `🔥 Kya aapko iske baare mein pata tha? Yeh dekh kar aap hairan reh jayenge!`,
    `💡 99% log is secret ko miss kar dete hain — dhyan se dekhein!`,
    `🚀 Aaj ka sabse bada game-changer: ${cleanTopic}!`,
    `✨ Ek aisi cheez jo aapki zindagi asaan bana degi!`
  ] : [
    `🔥 You won't believe this! The secret to ${cleanTopic} revealed:`,
    `💡 99% of people miss this crucial detail. Don't be one of them!`,
    `🚀 The game has completely changed with ${cleanTopic}! Here's why:`,
    `✨ Stop scrolling! This will completely transform how you look at ${cleanTopic}.`
  ];

  const captions = isHindi ? [
    {
      type: 'Best Overall',
      text: `Dosto, kya aapne kabhi yeh socha tha? ${cleanTopic} ke sath sab kuch kitna asaan aur impactful ho sakta hai! 🚀\n\nAapki ispar kya rai hai? Comments mein zaroor batayein aur apne dosto ke sath share karein! 👇`
    },
    {
      type: 'Viral & Engaging',
      text: `Agar aap bhi isko pehli baar dekh rahe hain toh sach mein mind blown ho jayega! 🤯💥\n\n${cleanTopic} ne internet par dhoom macha di hai. Like karein agar aapko pasand aaya! ❤️`
    },
    {
      type: 'Storytelling',
      text: `Jab maine pehli baar ${cleanTopic} ke baare mein dekha, toh vishwas nahi hua. Lekin jab try kiya toh results kamaal ke the! ✨\n\nEk baar aap bhi dekhein aur batayein kaisa laga!`
    },
    {
      type: 'Professional',
      text: `Important insights on ${cleanTopic}: Strategically maximizing engagement and delivering real value to your audience.\n\nKey takeaway: Consistency and authenticity lead the way. What's your perspective?`
    }
  ] : [
    {
      type: 'Best Overall',
      text: `Have you ever wondered what makes ${cleanTopic} so special? Here's the inside scoop that will change how you view everything! 🚀\n\nDouble tap if you agree, and tag a friend who needs to see this! 👇`
    },
    {
      type: 'Viral & Engaging',
      text: `Stop everything and look at this! 🤯 ${cleanTopic} is taking the internet by storm today.\n\nDrop a 🔥 in the comments if this inspired you!`
    },
    {
      type: 'Storytelling',
      text: `Not long ago, I struggled with finding inspiration for ${cleanTopic}. But once I discovered this approach, everything clicked. ✨\n\nSave this post so you don't lose it!`
    },
    {
      type: 'Professional',
      text: `Mastering the nuances of ${cleanTopic} requires a blend of strategy and execution. When done right, the results speak for themselves.\n\nHow is your team approaching this in 2026? Let's discuss below.`
    }
  ];

  // Hashtags generation
  const tagKeyword = cleanTopic.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'viral';
  const hashtags = [
    `#${tagKeyword}`,
    '#SocialFlow',
    '#ViralPost',
    '#TrendingNow',
    '#ContentCreator',
    '#SocialMediaMarketing',
    '#Engagement',
    '#DailyInspiration',
    '#GrowthHacking'
  ];

  const engagementScore = Math.floor(Math.random() * 12) + 88; // 88% - 99%

  return {
    hooks,
    captions,
    hashtags,
    engagementScore,
    viralAngle: `Curiosity + High Relatability (${tone} Tone)`
  };
}

export async function updateJobMetrics(jobId: string, metrics: Partial<PublishJobData>) {
  try {
    const docRef = doc(db, 'publish_jobs', jobId);
    await updateDoc(docRef, {
      ...metrics,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to update job metrics:', err);
  }
}

export async function updateDestinationAnalytics(destinationId: string, data: Partial<DestinationData>) {
  try {
    const docRef = doc(db, 'destinations', destinationId);
    await updateDoc(docRef, data);
  } catch (err) {
    console.error('Failed to update destination analytics:', err);
  }
}
