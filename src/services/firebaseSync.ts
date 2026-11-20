import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Order, Deal, Client, Interaction, CompanySettings, CrmNotification } from '../types';
import { withSettingsDefaults } from '../data/defaultSettings';
import { resolveProductImage } from '../utils/imageUtils';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  shouldThrow = true
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
  return errInfo;
}

/**
 * Recursively strips `undefined` properties before writing to Firestore
 * because Firestore throws on explicit `undefined` field values.
 */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

/**
 * Checks whether a signed-in Firebase user is authorized to manage the CRM.
 */
export async function checkIsAuthorizedAdmin(uid: string, email?: string | null, emailVerified?: boolean): Promise<boolean> {
  // Un usuario es administrador si existe el documento /admins/{uid} (ver README).
  void email;
  if (!emailVerified) return false;
  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

// Public Catalog Subscription
export function subscribeToProducts(callback: (products: Product[]) => void) {
  return onSnapshot(
    collection(db, 'products'),
    (snap) => {
      const prods: Product[] = [];
      snap.forEach((d) => {
        const p = d.data() as Product;
        prods.push({
          ...p,
          image: resolveProductImage(p.image, p.category)
        });
      });
      callback(prods);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'products', false);
    }
  );
}

// Public Company Settings Subscription
export function subscribeToSettings(callback: (settings: CompanySettings) => void) {
  return onSnapshot(
    doc(db, 'settings', 'company'),
    (snap) => {
      if (snap.exists()) {
        callback(withSettingsDefaults(snap.data() as Partial<CompanySettings>));
      } else {
        callback(withSettingsDefaults(null));
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'settings/company', false);
    }
  );
}

// Authenticated Admin Subscriptions
export function subscribeToOrders(callback: (orders: Order[]) => void) {
  return onSnapshot(
    collection(db, 'orders'),
    (snap) => {
      const ordersList: Order[] = [];
      snap.forEach((d) => {
        const order = d.data() as Order;
        const normalizedItems = (order.items || []).map((it) => ({
          ...it,
          product: {
            ...it.product,
            image: resolveProductImage(it.product?.image, it.product?.category)
          }
        }));
        ordersList.push({
          ...order,
          items: normalizedItems
        });
      });
      const sortKey = (o: Order & { createdAtIso?: string }) => o.createdAtIso || o.id;
      ordersList.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
      callback(ordersList);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders', false);
    }
  );
}

export function subscribeToDeals(callback: (deals: Deal[]) => void) {
  return onSnapshot(
    collection(db, 'deals'),
    (snap) => {
      const dealsList: Deal[] = [];
      snap.forEach((d) => dealsList.push(d.data() as Deal));
      dealsList.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      callback(dealsList);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'deals', false);
    }
  );
}

export function subscribeToClients(callback: (clients: Client[]) => void) {
  return onSnapshot(
    collection(db, 'clients'),
    (snap) => {
      const clientsList: Client[] = [];
      snap.forEach((d) => clientsList.push(d.data() as Client));
      callback(clientsList);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'clients', false);
    }
  );
}

export function subscribeToInteractions(callback: (interactions: Interaction[]) => void) {
  return onSnapshot(
    collection(db, 'interactions'),
    (snap) => {
      const list: Interaction[] = [];
      snap.forEach((d) => list.push(d.data() as Interaction));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'interactions', false);
    }
  );
}

export function subscribeToNotifications(callback: (notifications: CrmNotification[]) => void) {
  return onSnapshot(
    collection(db, 'notifications'),
    (snap) => {
      const notifs: CrmNotification[] = [];
      snap.forEach((docSnap) => {
        notifs.push(docSnap.data() as CrmNotification);
      });
      notifs.sort((a, b) => (b.id > a.id ? 1 : -1));
      callback(notifs);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'notifications', false);
    }
  );
}

// Database Mutators (all sanitized with stripUndefined)
export async function saveOrderToFirestore(order: Order): Promise<void> {
  try {
    await setDoc(doc(db, 'orders', order.id), stripUndefined(order));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `orders/${order.id}`);
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: Order['status']): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function saveDealToFirestore(deal: Deal): Promise<void> {
  try {
    await setDoc(doc(db, 'deals', deal.id), stripUndefined(deal));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `deals/${deal.id}`);
  }
}

export async function updateDealStageInFirestore(dealId: string, stage: Deal['stage']): Promise<void> {
  try {
    await updateDoc(doc(db, 'deals', dealId), {
      stage,
      updatedAt: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `deals/${dealId}`);
  }
}

export async function deleteDealFromFirestore(dealId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'deals', dealId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `deals/${dealId}`);
  }
}

export async function saveClientToFirestore(client: Client): Promise<void> {
  try {
    await setDoc(doc(db, 'clients', client.id), stripUndefined(client));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `clients/${client.id}`);
  }
}

export async function saveInteractionToFirestore(interaction: Interaction): Promise<void> {
  try {
    await setDoc(doc(db, 'interactions', interaction.id), stripUndefined(interaction));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `interactions/${interaction.id}`);
  }
}

export async function saveSettingsToFirestore(settings: CompanySettings): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'company'), stripUndefined(settings));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/company');
  }
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    await setDoc(doc(db, 'products', product.id), stripUndefined(product));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
  }
}

export async function saveNotificationToFirestore(notification: CrmNotification): Promise<void> {
  try {
    await setDoc(doc(db, 'notifications', notification.id), stripUndefined(notification));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `notifications/${notification.id}`);
  }
}

export async function updateNotificationInFirestore(notificationId: string, updates: Partial<CrmNotification>): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), stripUndefined(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function deleteNotificationFromFirestore(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notifications/${notificationId}`);
  }
}

/** Devuelve al stock las prendas de un pedido cancelado (una sola vez por pedido). */
export async function restoreStockForOrder(order: Order): Promise<void> {
  try {
    for (const it of order.items || []) {
      if (!it.product?.id) continue;
      await updateDoc(doc(db, 'products', it.product.id), { stock: increment(it.quantity) });
    }
    await updateDoc(doc(db, 'orders', order.id), { stockRestored: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
  }
}
