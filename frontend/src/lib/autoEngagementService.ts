import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';

export interface AutoEngagementRule {
  id?: string;
  userId: string;
  name: string;
  pageId: string;
  pageName: string;
  triggerKeywords: string[];
  matchType: 'contains' | 'exact';
  autoLikeComment: boolean;
  commentReplies: string[];
  dmMessage: string;
  status: 'active' | 'paused';
  totalTriggered: number;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementActivityLog {
  id?: string;
  ruleId: string;
  ruleName: string;
  userId: string;
  commenterName: string;
  commentText: string;
  matchedKeyword: string;
  replySent: string;
  dmSent: string;
  status: 'success' | 'failed';
  timestamp: string;
}

/**
 * Subscribe to all auto-engagement rules for a user
 */
export function subscribeEngagementRules(
  userId: string, 
  callback: (rules: AutoEngagementRule[]) => void
): () => void {
  const colRef = collection(db, 'auto_engagement_rules');
  const q = query(colRef, where('userId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    const list: AutoEngagementRule[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as AutoEngagementRule);
    });
    // In-memory sort by createdAt descending
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(list);
  }, (error) => {
    console.warn('[AutoEngagement] Subscription notice:', error.message);
    callback([]);
  });
}

/**
 * Add a new auto-engagement rule
 */
export async function addEngagementRule(
  rule: Omit<AutoEngagementRule, 'id' | 'totalTriggered' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, 'auto_engagement_rules');
  const docRef = await addDoc(colRef, {
    ...rule,
    totalTriggered: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return docRef.id;
}

/**
 * Update an existing auto-engagement rule
 */
export async function updateEngagementRule(
  ruleId: string, 
  data: Partial<AutoEngagementRule>
): Promise<void> {
  const docRef = doc(db, 'auto_engagement_rules', ruleId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Delete an auto-engagement rule
 */
export async function deleteEngagementRule(ruleId: string): Promise<void> {
  const docRef = doc(db, 'auto_engagement_rules', ruleId);
  await deleteDoc(docRef);
}

/**
 * Simulate or test an incoming comment match against active rules
 */
export function matchCommentAgainstRule(rule: AutoEngagementRule, commentText: string): string | null {
  if (rule.status !== 'active') return null;
  const cleanComment = commentText.trim().toLowerCase();

  for (const keyword of rule.triggerKeywords) {
    const cleanKey = keyword.trim().toLowerCase();
    if (!cleanKey) continue;

    if (rule.matchType === 'exact' && cleanComment === cleanKey) {
      return keyword;
    } else if (rule.matchType === 'contains' && cleanComment.includes(cleanKey)) {
      return keyword;
    }
  }

  return null;
}
