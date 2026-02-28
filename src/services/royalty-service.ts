
'use client';

import { collection, doc, increment, Firestore } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * Logs a royalty event to Firestore and updates the community's total balance.
 * This ensures the ledger is "durable" and verifiable.
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

  // 2. Increment the global community vault balance
  updateDocumentNonBlocking(communityRef, {
    currentRoyaltyBalance: increment(data.amount)
  });
}
