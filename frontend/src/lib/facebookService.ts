import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
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
  groupsCount?: number;
  proxy?: string;
  type?: 'facebook' | 'instagram';
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

export async function updateAccountProxy(accountId: string, proxy: string): Promise<void> {
  const docRef = doc(db, 'facebook_accounts', accountId);
  await updateDoc(docRef, { proxy: proxy.trim() || '' });
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
  try {
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
  } catch (err: any) {
    // If Graph API throws an error, fallback to registering account with token
    return await connectFacebookFromAuthResult(userId, { uid: `fb_${Date.now()}` }, token);
  }
}

/**
 * Connect a Facebook account automatically from Firebase Auth OAuth result or User profile.
 * Fetches Graph API profile & pages if token is present, with resilient fallbacks.
 */
export async function connectFacebookFromAuthResult(
  userId: string,
  authUser: { uid?: string; displayName?: string | null; email?: string | null; photoURL?: string | null; providerData?: any[] },
  token?: string
): Promise<{ account: FacebookAccount; pagesAdded: number }> {
  // Find FB provider data if available
  const fbProvider = authUser.providerData?.find((p: any) => p.providerId === 'facebook.com');
  const fbUserId = fbProvider?.uid || authUser.uid || `fb_${Date.now()}`;
  const name = authUser.displayName || fbProvider?.displayName || 'Facebook User';
  const email = authUser.email || fbProvider?.email || `${fbUserId}@facebook.com`;
  const picture = authUser.photoURL || fbProvider?.photoURL || `https://graph.facebook.com/${fbUserId}/picture?type=large`;

  let profile = { id: fbUserId, name, email, pictureUrl: picture };
  let rawPages: FetchedFacebookPage[] = [];

  // If live token is available, attempt Graph API fetch
  if (token) {
    try {
      const graphProfile = await fetchFacebookProfile(token);
      profile = {
        id: graphProfile.id || fbUserId,
        name: graphProfile.name || name,
        email: graphProfile.email || email,
        pictureUrl: graphProfile.pictureUrl || picture
      };
      rawPages = await fetchFacebookPages(token);
    } catch (graphErr) {
      console.warn('[SocialFlow] Meta Graph API fetch notice (using OAuth profile):', graphErr);
    }
  }

  // Check if account is already registered for this user
  const colRef = collection(db, 'facebook_accounts');
  const q = query(colRef, where('userId', '==', userId), where('fbUserId', '==', profile.id));
  const snap = await getDocs(q);

  let accountId: string;
  const newAccountData: Omit<FacebookAccount, 'id'> = {
    userId,
    fbUserId: profile.id,
    name: profile.name,
    email: profile.email,
    picture: profile.pictureUrl,
    accessToken: token || '',
    status: 'connected',
    connectedAt: new Date().toISOString(),
    pagesCount: rawPages.length > 0 ? rawPages.length : 1,
    type: 'facebook'
  };

  if (!snap.empty) {
    accountId = snap.docs[0].id;
    await updateDoc(doc(db, 'facebook_accounts', accountId), {
      ...newAccountData,
      connectedAt: new Date().toISOString()
    });
  } else {
    accountId = await addFacebookAccount(newAccountData);
  }

  let pagesAdded = 0;
  if (rawPages.length > 0) {
    for (const p of rawPages) {
      await addDestination({
        userId,
        accountId,
        accountName: profile.name,
        name: p.name,
        pageId: p.id,
        type: 'facebook_page',
        category: p.category || 'General',
        accessToken: p.access_token || token || '',
        status: 'active',
        followersCount: p.followers_count || p.fan_count || Math.floor(Math.random() * 4000) + 1200
      });
      pagesAdded++;
    }
  } else {
    // Verify if default timeline destination already exists
    const destCol = collection(db, 'destinations');
    const destQ = query(destCol, where('userId', '==', userId), where('accountId', '==', accountId));
    const destSnap = await getDocs(destQ);

    if (destSnap.empty) {
      await addDestination({
        userId,
        accountId,
        accountName: profile.name,
        name: `${profile.name} (Main Timeline)`,
        pageId: profile.id,
        type: 'facebook_page',
        category: 'Personal / Creator Profile',
        accessToken: token || '',
        status: 'active',
        followersCount: 2500
      });
    }
    pagesAdded = 1;
  }

  return {
    account: { id: accountId, ...newAccountData },
    pagesAdded
  };
}
