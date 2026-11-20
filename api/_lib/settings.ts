import type { Firestore } from 'firebase-admin/firestore';
import type { CommerceSettings } from '../../shared/commerce.js';

export interface ServerSettings extends CommerceSettings {
  companyName?: string;
  orderPrefix?: string;
  phone?: string;
  pickupAddress?: string;
}

export async function loadSettings(db: Firestore): Promise<ServerSettings> {
  const snap = await db.doc('settings/company').get();
  return (snap.exists ? snap.data() : {}) as ServerSettings;
}
