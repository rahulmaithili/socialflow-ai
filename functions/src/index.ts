import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';

// Initialize Firebase Admin
initializeApp();
export const db = getFirestore();

// Set global options for functions (e.g. region, max instances)
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

// Export modular functions
export * from './ai/aiEndpoints';
export * from './scheduler/publishWorker';
export * from './facebook/facebookEndpoints';
