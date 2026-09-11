import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ActivityLog } from '../../../shared/src/types';

export function useActivityLogs(limitCount = 10) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'activity_logs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
      
      setLogs(newLogs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching activity logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, limitCount]);

  const logActivity = async (type: string, description: string, metadata?: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'activity_logs'), {
        userId: user.uid,
        type,
        description,
        metadata,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  return { logs, loading, logActivity };
}
