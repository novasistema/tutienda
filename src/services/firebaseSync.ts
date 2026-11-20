import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Order, Deal, Client, Interaction, CompanySettings, CrmNotification } from '../types';
import { INITIAL_PRODUCTS } from '../data/products';
import { INITIAL_DEALS, INITIAL_CLIENTS, INITIAL_ORDERS, INITIAL_INTERACTIONS, INITIAL_NOTIFICATIONS } from '../data/crmMockData';
import { DEFAULT_COMPANY_SETTINGS } from '../data/defaultSettings';
import { resolveProductImage } from '../utils/imageUtils';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'ajnovasistemas@gmail.com';

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
  if (!emailVerified) return false;
  if (email && email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) {
    return true;
  }
  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

/**
 * Seeds initial TU TIENDA data ONLY when called by an authenticated CRM admin.
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  if (!auth.currentUser) return;

  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), stripUndefined(prod));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'products', false);
  }

  try {
    const clientsSnap = await getDocs(collection(db, 'clients'));
    if (clientsSnap.empty) {
      for (const client of INITIAL_CLIENTS) {
        await setDoc(doc(db, 'clients', client.id), stripUndefined(client));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'clients', false);
  }

  try {
    const dealsSnap = await getDocs(collection(db, 'deals'));
    if (dealsSnap.empty) {
      for (const deal of INITIAL_DEALS) {
        await setDoc(doc(db, 'deals', deal.id), stripUndefined(deal));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'deals', false);
  }

  try {
    const ordersSnap = await getDocs(collection(db, 'orders'));
    if (ordersSnap.empty) {
      for (const order of INITIAL_ORDERS) {
        await setDoc(doc(db, 'orders', order.id), stripUndefined(order));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'orders', false);
  }

  try {
    const interactionsSnap = await getDocs(collection(db, 'interactions'));
    if (interactionsSnap.empty) {
      for (const inter of INITIAL_INTERACTIONS) {
        await setDoc(doc(db, 'interactions', inter.id), stripUndefined(inter));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'interactions', false);
  }

  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'company'));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, 'settings', 'company'), stripUndefined(DEFAULT_COMPANY_SETTINGS));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/company', false);
  }

  try {
    const notifsSnap = await getDocs(collection(db, 'notifications'));
    if (notifsSnap.empty) {
      for (const notif of INITIAL_NOTIFICATIONS) {
        await setDoc(doc(db, 'notifications', notif.id), stripUndefined(notif));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'notifications', false);
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
      callback(prods.length > 0 ? prods : INITIAL_PRODUCTS);
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
        callback(snap.data() as CompanySettings);
      } else {
        callback(DEFAULT_COMPANY_SETTINGS);
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
      ordersList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(ordersList.length > 0 ? ordersList : INITIAL_ORDERS);
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
      callback(dealsList.length > 0 ? dealsList : INITIAL_DEALS);
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
      callback(clientsList.length > 0 ? clientsList : INITIAL_CLIENTS);
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
      callback(list.length > 0 ? list : INITIAL_INTERACTIONS);
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
