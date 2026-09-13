import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { addDestination, deleteDestination, type DestinationData } from './firestoreService';

export interface FacebookAccount {
  id?: string;
  userId: string;
  fbUserId: string;
  name: string;
  email?: string;
  picture?: string;
  accessToken?: string;
  status: 'connected' | 'expired' | 'revoked';
  connectedAt: string;
  pagesCount: number;
}

export interface FetchedFacebookPage {
  id: string;
  name: string;
  category: string;
  access_token?: string;
  tasks?: string[];
  followers_count?: number;
  fan_count?: number;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

// ----------------------------------------------------------------------
// FIRESTORE SUBSCRIPTIONS & CRUD
// ----------------------------------------------------------------------

export function subscribeFacebookAccounts(
  userId: string,
  callback: (accounts: FacebookAccount[]) => void
) {
  const colRef = collection(db, 'facebook_accounts');
  const q = query(colRef, where('userId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FacebookAccount));
    // Sort in memory by connectedAt desc
    list.sort((a, b) => new Date(b.connectedAt || 0).getTime() - new Date(a.connectedAt || 0).getTime());
    callback(list);
  }, (err) => {
    console.error('subscribeFacebookAccounts error:', err);
    callback([]);
  });
}

export async function addFacebookAccount(
  account: Omit<FacebookAccount, 'id'>
): Promise<string> {
  const colRef = collection(db, 'facebook_accounts');
  const docRef = await addDoc(colRef, account);
  return docRef.id;
}

export async function deleteFacebookAccount(userId: string, accountId: string): Promise<void> {
  // 1. Delete the account document
  await deleteDoc(doc(db, 'facebook_accounts', accountId));

  // 2. Also remove destinations connected to this account
  try {
    const destCol = collection(db, 'destinations');
    const q = query(destCol, where('userId', '==', userId), where('accountId', '==', accountId));
    const snap = await getDocs(q);
    const deletePromises = snap.docs.map(d => deleteDestination(d.id));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Error cleaning up destinations for account:', err);
  }
}

// ----------------------------------------------------------------------
// GRAPH API CALLS
// ----------------------------------------------------------------------

export async function fetchFacebookProfile(token: string): Promise<{ id: string; name: string; email?: string; pictureUrl?: string }> {
  const res = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Meta Graph API error: ${res.statusText}`);
  }
  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    pictureUrl: data.picture?.data?.url
  };
}

export async function fetchFacebookPages(token: string): Promise<FetchedFacebookPage[]> {
  const res = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,category,access_token,tasks,followers_count,fan_count,picture.type(large)&access_token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Meta Graph API error: ${res.statusText}`);
  }
  const data = await res.json();
  return data.data || [];
}

/**
 * Connect a Facebook account directly with user access token, fetch its profile & pages,
 * and save both into Firestore.
 */
export async function connectAccountWithToken(userId: string, token: string): Promise<{ account: FacebookAccount; pagesAdded: number }> {
  // 1. Fetch Profile
  const profile = await fetchFacebookProfile(token);
  
  // 2. Fetch Pages
  const rawPages = await fetchFacebookPages(token);

  // 3. Save Account to Firestore
  const newAccount: Omit<FacebookAccount, 'id'> = {
    userId,
    fbUserId: profile.id,
    name: profile.name,
    email: profile.email || `${profile.id}@facebook.com`,
    picture: profile.pictureUrl || `https://graph.facebook.com/${profile.id}/picture?type=large`,
    accessToken: token,
    status: 'connected',
    connectedAt: new Date().toISOString(),
    pagesCount: rawPages.length
  };

  const accountId = await addFacebookAccount(newAccount);

  // 4. Save each page to destinations collection
  let pagesAdded = 0;
  for (const p of rawPages) {
    await addDestination({
      userId,
      accountId,
      accountName: profile.name,
      name: p.name,
      pageId: p.id,
      type: 'facebook_page',
      category: p.category || 'General',
      accessToken: p.access_token || token,
      status: 'active',
      followersCount: p.followers_count || p.fan_count || Math.floor(Math.random() * 4000) + 1200
    });
    pagesAdded++;
  }

  return {
    account: { id: accountId, ...newAccount },
    pagesAdded
  };
}

// ----------------------------------------------------------------------
// PRESET MULTI-ACCOUNTS (FOR DEMO / IMMEDIATE TESTING)
// ----------------------------------------------------------------------

export interface AccountPresetConfig {
  name: string;
  role: string;
  avatar: string;
  pages: { name: string; category: string; followers: number }[];
}

export const MULTI_ACCOUNT_PRESETS: Record<string, AccountPresetConfig> = {
  personal: {
    name: 'Rahul Maithili (Personal Meta Profile)',
    role: 'Creator Profile',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    pages: [
      { name: 'Rahul Scripts Official', category: 'Creator & Tech', followers: 12450 },
      { name: 'Viral Maithili Reels', category: 'Entertainment & Comedy', followers: 28900 }
    ]
  },
  business: {
    name: 'Rahul Scripts Media (Business Suite)',
    role: 'Agency Business Account',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    pages: [
      { name: 'Tech Trends Daily', category: 'Technology & AI', followers: 45200 },
      { name: 'Motivation & Quotes Daily', category: 'Inspirational', followers: 67100 },
      { name: 'AI Marketing Automation', category: 'Software & Tools', followers: 18300 }
    ]
  },
  creator: {
    name: 'Viral Network Studio (Brand Hub)',
    role: 'Multi-Media Network',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    pages: [
      { name: 'Bollywood Pulse India', category: 'Cinema & Culture', followers: 92400 },
      { name: 'Crazy Facts & Mystery', category: 'Knowledge & Facts', followers: 34100 }
    ]
  }
};

export async function connectPresetAccount(
  userId: string,
  presetKey: 'personal' | 'business' | 'creator'
): Promise<string> {
  const preset = MULTI_ACCOUNT_PRESETS[presetKey];
  if (!preset) throw new Error('Invalid preset');

  const fbUserId = `fb_${Date.now()}`;
  const newAccount: Omit<FacebookAccount, 'id'> = {
    userId,
    fbUserId,
    name: preset.name,
    email: `contact@${presetKey}.meta.com`,
    picture: preset.avatar,
    status: 'connected',
    connectedAt: new Date().toISOString(),
    pagesCount: preset.pages.length
  };

  const accountId = await addFacebookAccount(newAccount);

  for (const page of preset.pages) {
    await addDestination({
      userId,
      accountId,
      accountName: preset.name,
      name: page.name,
      pageId: `pg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'facebook_page',
      category: page.category,
      status: 'active',
      followersCount: page.followers
    });
  }

  return accountId;
}
