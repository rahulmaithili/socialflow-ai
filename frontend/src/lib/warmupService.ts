export interface WarmupDayPlan {
  day: number;
  title: string;
  description: string;
  trustReward: number;
  completed: boolean;
  recommendedWaitHours: number;
}

export interface AccountWarmupProfile {
  accountId: string;
  accountName: string;
  currentDay: number;
  trustScore: number;
  status: 'warming' | 'ready' | 'needs_attention';
  startedAt: string;
  lastActiveAt: string;
  days: WarmupDayPlan[];
}

const DEFAULT_WARMUP_DAYS: Omit<WarmupDayPlan, 'completed'>[] = [
  {
    day: 1,
    title: 'Seed Activity & Feed Observation',
    description: 'Scroll newsfeed for 5 minutes, view 2-3 public stories. Do NOT post any links.',
    trustReward: 15,
    recommendedWaitHours: 24
  },
  {
    day: 2,
    title: 'Natural Engagement Simulation',
    description: 'React to 3 posts in your niche and follow 1 verified industry page.',
    trustReward: 15,
    recommendedWaitHours: 24
  },
  {
    day: 3,
    title: 'Group Integration',
    description: 'Join 1 active community group. React to 2 discussions without posting links.',
    trustReward: 15,
    recommendedWaitHours: 24
  },
  {
    day: 4,
    title: 'Human Commenting Routine',
    description: 'Leave 1 thoughtful comment on a popular viral post in your target category.',
    trustReward: 15,
    recommendedWaitHours: 24
  },
  {
    day: 5,
    title: 'First Light Native Post',
    description: 'Publish 1 short personal or value status update (text only, clean IP).',
    trustReward: 15,
    recommendedWaitHours: 24
  },
  {
    day: 6,
    title: 'Media Calibration',
    description: 'Post 1 high-resolution photo or short status. Share 1 relevant post to personal feed.',
    trustReward: 15,
    recommendedWaitHours: 24
  },
  {
    day: 7,
    title: 'Full Chamber Activation (Graduated)',
    description: 'Account Trust Score reaches 100%. Safe for Spintax group posting and automated campaigns!',
    trustReward: 10,
    recommendedWaitHours: 0
  }
];

const STORAGE_PREFIX = 'socialflow_warmup_';

export function getAccountWarmup(accountId: string, accountName = 'Facebook Account'): AccountWarmupProfile {
  const key = `${STORAGE_PREFIX}${accountId}`;
  const raw = localStorage.getItem(key);

  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  // Initialize new profile
  const initialProfile: AccountWarmupProfile = {
    accountId,
    accountName,
    currentDay: 1,
    trustScore: 10,
    status: 'warming',
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    days: DEFAULT_WARMUP_DAYS.map(d => ({ ...d, completed: false }))
  };

  localStorage.setItem(key, JSON.stringify(initialProfile));
  return initialProfile;
}

export function completeWarmupTask(accountId: string, dayNumber: number): AccountWarmupProfile {
  const profile = getAccountWarmup(accountId);
  const targetDay = profile.days.find(d => d.day === dayNumber);

  if (targetDay && !targetDay.completed) {
    targetDay.completed = true;
    profile.trustScore = Math.min(100, profile.trustScore + targetDay.trustReward);
    profile.currentDay = Math.min(7, dayNumber + 1);
    profile.lastActiveAt = new Date().toISOString();

    if (profile.trustScore >= 90) {
      profile.status = 'ready';
    }
    localStorage.setItem(`${STORAGE_PREFIX}${accountId}`, JSON.stringify(profile));
  }

  return profile;
}

export function resetAccountWarmup(accountId: string, accountName: string): AccountWarmupProfile {
  localStorage.removeItem(`${STORAGE_PREFIX}${accountId}`);
  return getAccountWarmup(accountId, accountName);
}
