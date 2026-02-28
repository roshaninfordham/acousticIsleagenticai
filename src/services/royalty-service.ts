
'use client';

import { collection, doc, increment, setDoc, Firestore } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * Logs a royalty event to Firestore and updates the community's total balance.
 * Uses setDoc with merge to handle first-time community document creation.
 */
export function logRoyaltyTransaction(
  db: Firestore,
  data: {
    stemId: string;
    communityId: string;
    amount: number;
  }
) {
  const eventRef = collection(db, 'royaltyEvents');
  const communityRef = doc(db, 'communities', data.communityId);

  // 1. Log the immutable event
  addDocumentNonBlocking(eventRef, {
    ...data,
    timestamp: new Date().toISOString(),
  });

  // 2. Upsert the community vault balance (creates doc if it doesn't exist)
  setDoc(communityRef, {
    communityId: data.communityId,
    currentRoyaltyBalance: increment(data.amount),
    lastUpdated: new Date().toISOString(),
  }, { merge: true }).catch(error => {
    console.error('[Royalty] Failed to update community balance:', error);
  });
}
