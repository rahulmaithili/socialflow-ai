// ============================================================
// SocialFlow AI — Unified Shared Types
// ============================================================

// -----------------------------------------------------------
// USER & AUTH
// -----------------------------------------------------------
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  plan: 'free' | 'basic' | 'pro' | 'business';
  createdAt: string;
  lastLoginAt: string;
  timezone: string;
  language: SupportedLanguage;
}

export type SupportedLanguage =
  | 'english'
  | 'hindi'
  | 'hinglish'
  | 'spanish'
  | 'french'
  | 'german'
  | 'portuguese'
  | 'custom';

// -----------------------------------------------------------
// MEDIA
// -----------------------------------------------------------
export type MediaType = 'image' | 'video';
export type MediaStatus = 'uploading' | 'ready' | 'analyzed' | 'scheduled' | 'published' | 'error';

export interface MediaItem {
  id: string;
  userId: string;
  fileName: string;
  originalFileName: string;
  storagePath: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  mediaType: MediaType;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  hash: string;
  perceptualHash?: string;
  isFavorite: boolean;
  status: MediaStatus;
  aiAnalysisId?: string;
  scheduledPostIds: string[];
  publishedPostIds: string[];
  description?: string;
}

// -----------------------------------------------------------
// AI ANALYSIS
// -----------------------------------------------------------
export type ContentCategory =
  | 'funny' | 'cute' | 'emotional' | 'inspirational' | 'educational'
  | 'informational' | 'news' | 'entertainment' | 'lifestyle' | 'travel'
  | 'food' | 'fitness' | 'business' | 'technology' | 'devotional'
  | 'spiritual' | 'fashion' | 'gaming' | 'sports' | 'nature'
  | 'animals' | 'memes' | 'product' | 'event' | 'other';

export type EngagementAngle =
  | 'funny' | 'relatable' | 'emotional' | 'unexpected' | 'curiosity'
  | 'inspirational' | 'cute' | 'educational' | 'storytelling' | 'nostalgia'
  | 'before_after' | 'question' | 'pov' | 'reaction' | 'trend_connection';

export interface ContentAnalysis {
  id: string;
  userId: string;
  mediaId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  createdAt: string;
  completedAt?: string;

  // Visual content
  mainSubject: string;
  secondarySubjects: string[];
  objects: string[];
  people: number;
  animals: string[];
  environment: string;
  location?: string;
  locationConfidence?: 'high' | 'medium' | 'low' | 'unknown';
  activity: string;
  emotion: string;
  mood: string;
  story: string;
  visualStyle: string;

  // Classification
  categories: ContentCategory[];
  primaryCategory: ContentCategory;
  targetAudience: string;
  ageRange: string;
  interests: string[];

  // Scoring factors
  curiosityFactor: number;     // 0–10
  humorFactor: number;
  emotionalFactor: number;
  shareabilityFactor: number;
  commentPotential: number;
  uniquenessFactor: number;

  // Engagement
  bestAngles: EngagementAngle[];
  primaryAngle: EngagementAngle;

  // Engagement score
  engagementScore: EngagementScore;

  // Warnings
  warnings: string[];
  uncertainFields: string[];
}

export interface EngagementScore {
  overall: number;
  hookStrength: number;
  emotion: number;
  curiosity: number;
  relatability: number;
  shareability: number;
  commentPotential: number;
  visualAppeal: number;
  trendRelevance: number;
  audienceFit: number;
  uniqueness: number;
}

// -----------------------------------------------------------
// AI GENERATED CONTENT
// -----------------------------------------------------------
export type SocialPlatform = 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'x';
export type ContentTone =
  | 'funny' | 'emotional' | 'professional' | 'casual' | 'storytelling' | 'viral';

export interface GeneratedHook {
  type: 'curiosity' | 'question' | 'emotional' | 'funny' | 'short_viral';
  text: string;
  strengthScore: number;
}

export interface GeneratedCaption {
  type: 'best_overall' | 'funny_relatable' | 'emotional_storytelling' | 'curiosity_engagement' | 'short_punchy';
  text: string;
  length: 'short' | 'medium' | 'long';
  platform: SocialPlatform;
  engagementScore: number;
}

export interface GeneratedCTA {
  text: string;
  type: 'question' | 'opinion' | 'action' | 'experience';
}

export interface GeneratedHashtags {
  broad: string[];
  niche: string[];
  contentSpecific: string[];
  audienceSpecific: string[];
  trending: string[];         // only when real trend data available
  best10: string[];
  source: 'trending' | 'ai_recommended';
}

export interface PlatformContent {
  platform: SocialPlatform;
  title?: string;            // YouTube
  hook: string;
  caption: string;
  hashtags: string[];
  description?: string;      // YouTube
  cta: string;
}

export interface AIGeneration {
  id: string;
  userId: string;
  mediaId: string;
  analysisId: string;
  platform: SocialPlatform;
  language: SupportedLanguage;
  tone: ContentTone;
  createdAt: string;

  hooks: GeneratedHook[];
  captions: GeneratedCaption[];
  cta: GeneratedCTA[];
  hashtags: GeneratedHashtags;
  platformContent: PlatformContent[];

  recommendation: AIRecommendation;
  imagePrompt?: ImagePrompt;
  videoPrompt?: VideoPrompt;
}

export interface AIRecommendation {
  bestHook: GeneratedHook;
  bestCaption: GeneratedCaption;
  bestCTA: GeneratedCTA;
  bestHashtags: string[];
  bestPlatform: SocialPlatform;
  bestAngle: EngagementAngle;
  explanation: string;
}

export interface ImagePrompt {
  subject: string;
  environment: string;
  composition: string;
  lighting: string;
  camera: string;
  style: string;
  aspectRatio: string;
  audienceAngle: string;
  fullPrompt: string;
}

export interface VideoPrompt {
  scene: string;
  character: string;
  movement: string;
  camera: string;
  lighting: string;
  environment: string;
  duration: string;
  aspectRatio: string;
  audio: string;
  ending: string;
  fullPrompt: string;
}

// -----------------------------------------------------------
// FACEBOOK / META
// -----------------------------------------------------------
export interface FacebookConnection {
  id: string;
  userId: string;
  facebookUserId: string;
  facebookUserName: string;
  accessTokenEncrypted: string;
  tokenExpiry: string;
  connectedAt: string;
  lastRefreshedAt: string;
  status: 'active' | 'expired' | 'revoked';
  scopes: string[];
}

export interface FacebookPage {
  id: string;
  userId: string;
  connectionId: string;
  pageId: string;
  pageName: string;
  pageCategory: string;
  profilePictureUrl?: string;
  followerCount?: number;
  accessTokenEncrypted: string;
  tokenExpiry: string;
  permissions: string[];
  canPublish: boolean;
  status: 'active' | 'expired' | 'disconnected';
  lastSyncedAt: string;
  createdAt: string;
}

export interface FacebookGroup {
  id: string;
  userId: string;
  connectionId: string;
  groupId: string;
  groupName: string;
  privacy: 'open' | 'closed' | 'secret';
  memberCount?: number;
  canPublishViaApi: boolean;
  apiUnsupportedReason?: string;
  status: 'active' | 'disconnected';
  lastSyncedAt: string;
  createdAt: string;
}

export type DestinationType = 'facebook_page' | 'facebook_group' | 'instagram' | 'youtube';

export interface Destination {
  id: string;
  type: DestinationType;
  name: string;
  imageUrl?: string;
  canPublish: boolean;
  manualRequired: boolean;
  manualReason?: string;
}

// -----------------------------------------------------------
// POSTS & SCHEDULING
// -----------------------------------------------------------
export type PostStatus =
  | 'draft'
  | 'scheduled'
  | 'processing'
  | 'published'
  | 'failed'
  | 'cancelled'
  | 'manual_required';

export interface SavedPost {
  id: string;
  userId: string;
  mediaId?: string;
  analysisId?: string;
  generationId?: string;

  platform: SocialPlatform;
  language: SupportedLanguage;
  tone: ContentTone;

  selectedHook: string;
  selectedCaption: string;
  selectedCTA: string;
  selectedHashtags: string[];
  fullPostText: string;

  destinations: string[];  // destination IDs
  scheduledAt?: string;    // UTC ISO string
  timezone: string;

  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  campaignId?: string;
}

export type PublishJobError =
  | 'temporary'
  | 'rate_limit'
  | 'permission'
  | 'authentication'
  | 'invalid_media'
  | 'invalid_request'
  | 'unsupported_destination'
  | 'unknown';

export interface PublishJob {
  id: string;
  userId: string;
  postId: string;
  destinationId: string;
  destinationType: DestinationType;

  status: PostStatus;
  scheduledAt: string;   // UTC
  timezone: string;
  lockedAt?: string;
  publishedAt?: string;

  externalPostId?: string;
  externalPostUrl?: string;

  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;

  errorCode?: string;
  errorMessage?: string;
  errorType?: PublishJobError;

  mediaUrl?: string;
  caption: string;
  hashtags: string[];

  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------
// CAMPAIGNS
// -----------------------------------------------------------
export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description?: string;
  niche: string;
  audience: string;
  platform: SocialPlatform;
  language: SupportedLanguage;
  tone: ContentTone;
  country: string;

  schedule: 'daily' | 'weekly' | 'custom';
  postsPerDay: number;
  startDate: string;
  endDate?: string;

  mediaIds: string[];
  destinationIds: string[];
  postIds: string[];

  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------
// AI CONTENT CALENDAR
// -----------------------------------------------------------
export interface AICalendarEntry {
  id: string;
  campaignId?: string;
  date: string;
  time: string;
  topic: string;
  contentType: 'image' | 'video' | 'text';
  hook: string;
  caption: string;
  hashtags: string[];
  imagePrompt?: string;
  videoPrompt?: string;
  angle: EngagementAngle;
  status: 'draft' | 'approved' | 'scheduled' | 'skipped';
}

// -----------------------------------------------------------
// TREND RESEARCH
// -----------------------------------------------------------
export type TrendSource = 'live' | 'ai_recommended';
export type TrendType = 'current_trending' | 'relevant' | 'niche' | 'broad';

export interface TrendItem {
  keyword: string;
  type: TrendType;
  source: TrendSource;
  relevanceScore: number;
  hashtags: string[];
}

export interface TrendResult {
  id: string;
  userId: string;
  topic: string;
  country: string;
  platform: SocialPlatform;
  createdAt: string;

  trends: TrendItem[];
  relatedKeywords: string[];
  seasonalTopics: string[];
  contentIdeas: string[];
  recommendedAngles: EngagementAngle[];
  source: TrendSource;
  disclaimer?: string;
}

// -----------------------------------------------------------
// ANALYTICS
// -----------------------------------------------------------
export interface PostAnalytics {
  id: string;
  userId: string;
  jobId: string;
  externalPostId: string;
  destinationId: string;
  fetchedAt: string;

  reach?: number;
  impressions?: number;
  engagements?: number;
  reactions?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  videoViews?: number;

  available: boolean;
  unavailableReason?: string;
}

// -----------------------------------------------------------
// NOTIFICATIONS
// -----------------------------------------------------------
export type NotificationType =
  | 'published'
  | 'scheduled'
  | 'failed'
  | 'auth_expired'
  | 'manual_required'
  | 'ai_complete'
  | 'upload_complete'
  | 'duplicate_detected'
  | 'retry_scheduled';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
}

// -----------------------------------------------------------
// ACTIVITY LOG
// -----------------------------------------------------------
export type ActivityType =
  | 'login' | 'logout'
  | 'facebook_connected' | 'facebook_disconnected'
  | 'media_uploaded' | 'media_deleted'
  | 'ai_analysis' | 'caption_generated' | 'hashtag_generated'
  | 'post_created' | 'post_scheduled' | 'post_published'
  | 'post_failed' | 'post_cancelled'
  | 'settings_changed';

export interface ActivityLog {
  id: string;
  userId: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// -----------------------------------------------------------
// SETTINGS
// -----------------------------------------------------------
export interface UserSettings {
  id: string;
  userId: string;
  timezone: string;
  language: SupportedLanguage;
  defaultPlatform: SocialPlatform;
  defaultTone: ContentTone;
  notifications: {
    email: boolean;
    push: boolean;
    published: boolean;
    failed: boolean;
    scheduled: boolean;
    aiComplete: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  geminiApiKey?: string;       // optional user-provided key (stored encrypted)
  updatedAt: string;
}

// -----------------------------------------------------------
// API RESPONSES
// -----------------------------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// -----------------------------------------------------------
// DUPLICATE DETECTION
// -----------------------------------------------------------
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarity: number;   // 0–1
  existingMediaId?: string;
  existingMediaUrl?: string;
  type: 'exact' | 'similar' | 'none';
}

// -----------------------------------------------------------
// WEBHOOK (n8n)
// -----------------------------------------------------------
export interface WebhookAnalyzeRequest {
  mediaUrl: string;
  platform?: SocialPlatform;
  language?: SupportedLanguage;
  tone?: ContentTone;
  userId: string;
}

export interface WebhookCreatePostRequest {
  mediaId: string;
  generationId: string;
  captionType: string;
  destinationIds: string[];
  scheduledAt?: string;
  timezone?: string;
  userId: string;
}

export interface WebhookSchedulePostRequest {
  postId: string;
  scheduledAt: string;
  timezone: string;
  userId: string;
}

export interface WebhookStatusResponse {
  postId: string;
  status: PostStatus;
  jobs: Array<{
    jobId: string;
    destinationId: string;
    status: PostStatus;
    publishedAt?: string;
    errorMessage?: string;
  }>;
}
