import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  Product,
  CartItem,
  Deal,
  Client,
  Order,
  DealStage,
  OrderStatus,
  Interaction,
  CompanySettings,
  CrmNotification
} from '../types';
import { INITIAL_PRODUCTS } from '../data/products';
import {
  INITIAL_DEALS,
  INITIAL_CLIENTS,
  INITIAL_ORDERS,
  INITIAL_INTERACTIONS,
  INITIAL_NOTIFICATIONS
} from '../data/crmMockData';
import { DEFAULT_COMPANY_SETTINGS } from '../data/defaultSettings';
import { calculateUnitPrice, formatCurrency } from '../utils/formatters';
import { playNotificationSound } from '../utils/sound';
import { resolveProductImage } from '../utils/imageUtils';
import { auth, testConnection } from '../firebase';
import {
  checkIsAuthorizedAdmin,
  seedInitialDataIfEmpty,
  subscribeToProducts,
  subscribeToOrders,
  subscribeToDeals,
  subscribeToClients,
  subscribeToInteractions,
  subscribeToSettings,
  subscribeToNotifications,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  saveDealToFirestore,
  updateDealStageInFirestore,
  deleteDealFromFirestore,
  saveClientToFirestore,
  saveInteractionToFirestore,
  saveSettingsToFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveNotificationToFirestore,
  updateNotificationInFirestore,
  deleteNotificationFromFirestore
} from '../services/firebaseSync';

interface CrmUser {
  email: string;
  name: string;
  role: string;
  isDemo: boolean;
}

interface StoreContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
  removeFromCart: (productId: string, selectedSize?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
  isMinimumReached: boolean;
  minimumRemaining: number;
  // CRM
  deals: Deal[];
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDealStage: (dealId: string, stage: DealStage) => Promise<void>;
  updateDeal: (deal: Deal) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'totalSpent' | 'orderCount' | 'lastContact'>) => Promise<void>;
  orders: Order[];
  placeOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  interactions: Interaction[];
  addInteraction: (data: Omit<Interaction, 'id' | 'createdAt'>) => Promise<void>;
  // Notifications & Realtime Alerts
  notifications: CrmNotification[];
  unreadNotificationsCount: number;
  urgentNotificationsCount: number;
  addNotification: (notification: Omit<CrmNotification, 'id' | 'createdAt' | 'isRead'>) => Promise<CrmNotification>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  activeToastNotification: CrmNotification | null;
  dismissToast: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  simulateIncomingOrder: () => Promise<void>;
  simulateUrgentInteraction: () => Promise<void>;
  selectedEntityForFocus: { type: 'order' | 'client' | 'deal'; id: string } | null;
  setSelectedEntityForFocus: (entity: { type: 'order' | 'client' | 'deal'; id: string } | null) => void;
  // Company & Payment Settings
  companySettings: CompanySettings;
  updateCompanySettings: (settings: CompanySettings) => Promise<void>;
  // CRM Auth
  isCrmAuthenticated: boolean;
  isDemoMode: boolean;
  isFirebaseAdmin: boolean;
  authLoading: boolean;
  authError: string | null;
  crmUser: CrmUser | null;
  loginDemo: (username: string, password: string) => boolean;
  loginWithGoogle: () => Promise<boolean>;
  logoutCrm: () => Promise<void>;
  // Navigation & Modals
  activeTab: 'store' | 'crm' | 'quotation';
  setActiveTab: (tab: 'store' | 'crm' | 'quotation') => void;
  selectedProductForModal: Product | null;
  setSelectedProductForModal: (product: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isFirebaseConnected: boolean;
  // Product Management Modal & Batch Operations
  productToEdit: Product | null;
  setProductToEdit: (product: Product | null) => void;
  isProductEditModalOpen: boolean;
  setIsProductEditModalOpen: (open: boolean) => void;
  openCreateProductModal: () => void;
  openEditProductModal: (product: Product) => void;
  closeProductEditModal: () => void;
  batchUpdatePrices: (percentage: number, category?: string) => Promise<void>;
  resetCatalogToDefault: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'tutienda_settings_v2';
const CART_STORAGE_KEY = 'tutienda_cart_v2';
const DEMO_STORAGE_KEY = 'tutienda_demo_auth_v2';
const SOUND_STORAGE_KEY = 'tutienda_crm_sound_v2';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [interactions, setInteractions] = useState<Interaction[]>(INITIAL_INTERACTIONS);
  const [notifications, setNotifications] = useState<CrmNotification[]>(INITIAL_NOTIFICATIONS);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_COMPANY_SETTINGS;
    } catch {
      return DEFAULT_COMPANY_SETTINGS;
    }
  });

  // Auth states: Firebase Admin OR Prospective Client Demo Mode
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [crmUser, setCrmUser] = useState<CrmUser | null>(() => {
    try {
      if (localStorage.getItem(DEMO_STORAGE_KEY) === 'true') {
        return {
          name: 'Cliente Demo',
          email: 'demo@tutienda.com.ar',
          role: 'Vista Previa del Sistema',
          isDemo: true
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const isCrmAuthenticated = isFirebaseAdmin || isDemoMode;

  const loginDemo = (username: string, password: string): boolean => {
    setAuthError(null);
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const validUser = cleanUser === 'demo' || cleanUser === 'demo@tutienda.com.ar' || cleanUser === 'cliente';
    const validPass = cleanPass === 'demo123' || cleanPass === 'demo' || cleanPass === 'tutienda';

    if (validUser && validPass) {
      setIsDemoMode(true);
      setCrmUser({
        name: 'Cliente Demo',
        email: 'demo@tutienda.com.ar',
        role: 'Vista Previa Comercial',
        isDemo: true
      });
      localStorage.setItem(DEMO_STORAGE_KEY, 'true');
      return true;
    }

    setAuthError('Usuario o contraseña demo incorrectos. Usá demo@tutienda.com.ar / demo123.');
    return false;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const authorized = await checkIsAuthorizedAdmin(
        cred.user.uid,
        cred.user.email,
        cred.user.emailVerified
      );
      if (!authorized) {
        await signOut(auth);
        setAuthError(
          `La cuenta ${cred.user.email || ''} no está autorizada como administrador en Firestore. Podés ingresar con el Acceso Demo o elegir una cuenta autorizada.`
        );
        return false;
      }
      // Exit demo mode when entering live admin session
      setIsDemoMode(false);
      localStorage.removeItem(DEMO_STORAGE_KEY);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError(msg);
      }
      return false;
    }
  };

  const logoutCrm = async () => {
    setIsDemoMode(false);
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setIsFirebaseAdmin(false);
    setCrmUser(null);
    setAuthError(null);
    if (auth.currentUser) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }
  };

  // Cart state persisted locally
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeToastNotification, setActiveToastNotification] = useState<CrmNotification | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  });
  const [selectedEntityForFocus, setSelectedEntityForFocus] = useState<{
    type: 'order' | 'client' | 'deal';
    id: string;
  } | null>(null);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
  const urgentNotificationsCount = notifications.filter(
    (n) => !n.isRead && (n.priority === 'urgent' || n.type === 'urgent_interaction')
  ).length;

  useEffect(() => {
    if (activeToastNotification) {
      const timer = setTimeout(() => {
        setActiveToastNotification(null);
      }, 6500);
      return () => clearTimeout(timer);
    }
  }, [activeToastNotification]);

  // UI state
  const [activeTab, setActiveTab] = useState<'store' | 'crm' | 'quotation'>('store');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isProductEditModalOpen, setIsProductEditModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const openCreateProductModal = () => {
    setProductToEdit(null);
    setIsProductEditModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setProductToEdit(product);
    setIsProductEditModalOpen(true);
  };

  const closeProductEditModal = () => {
    setProductToEdit(null);
    setIsProductEditModalOpen(false);
  };

  // Public Firestore listeners (products + public company settings only — zero permission errors)
  useEffect(() => {
    let unsubProds: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;
    let active = true;

    async function initPublic() {
      const connected = await testConnection();
      if (!active) return;
      setIsFirebaseConnected(connected);

      if (connected) {
        unsubProds = subscribeToProducts((prods) => {
          if (active) setProducts(prods);
        });
        unsubSettings = subscribeToSettings((sets) => {
          if (active) setCompanySettings(sets);
        });
      }
    }

    initPublic();

    return () => {
      active = false;
      unsubProds?.();
      unsubSettings?.();
    };
  }, []);

  // Auth-gated CRM Firestore listeners (active ONLY when real Firebase Admin is verified)
  useEffect(() => {
    let crmUnsubs: (() => void)[] = [];

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      crmUnsubs.forEach((u) => u());
      crmUnsubs = [];

      if (firebaseUser) {
        const authorized = await checkIsAuthorizedAdmin(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.emailVerified
        );

        if (authorized) {
          setIsFirebaseAdmin(true);
          setIsDemoMode(false);
          localStorage.removeItem(DEMO_STORAGE_KEY);
          setCrmUser({
            name: firebaseUser.displayName || 'Administrador TU TIENDA',
            email: firebaseUser.email || '',
            role: 'Administrador General',
            isDemo: false
          });
          setAuthLoading(false);

          await seedInitialDataIfEmpty();

          crmUnsubs = [
            subscribeToOrders(setOrders),
            subscribeToDeals(setDeals),
            subscribeToClients(setClients),
            subscribeToInteractions(setInteractions),
            subscribeToNotifications(setNotifications)
          ];
          return;
        }
      }

      setIsFirebaseAdmin(false);
      if (localStorage.getItem(DEMO_STORAGE_KEY) === 'true') {
        setIsDemoMode(true);
        setCrmUser({
          name: 'Cliente Demo',
          email: 'demo@tutienda.com.ar',
          role: 'Vista Previa Comercial',
          isDemo: true
        });
      } else {
        setCrmUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubAuth();
      crmUnsubs.forEach((u) => u());
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const updateCompanySettings = async (newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    if (isFirebaseAdmin) {
      await saveSettingsToFirestore(newSettings);
    }
  };

  // Cart operations (size-aware)
  const addToCart = (product: Product, quantity = 1, selectedSize?: string) => {
    const resolvedSize = selectedSize || product.sizes?.[0] || 'Único';
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && (item.selectedSize || 'Único') === resolvedSize
      );
      const newQuantity = existing ? existing.quantity + quantity : quantity;
      const unitPriceApplied = calculateUnitPrice(product, newQuantity);
      const totalPrice = unitPriceApplied * newQuantity;

      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && (item.selectedSize || 'Único') === resolvedSize
            ? { ...item, quantity: newQuantity, unitPriceApplied, totalPrice }
            : item
        );
      }

      return [
        ...prev,
        { product, quantity: newQuantity, selectedSize: resolvedSize, unitPriceApplied, totalPrice }
      ];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (productId: string, quantity: number, selectedSize?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        const sizeMatches = selectedSize ? (item.selectedSize || 'Único') === selectedSize : true;
        if (item.product.id === productId && sizeMatches) {
          const unitPriceApplied = calculateUnitPrice(item.product, quantity);
          return {
            ...item,
            quantity,
            unitPriceApplied,
            totalPrice: unitPriceApplied * quantity
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string, selectedSize?: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        if (item.product.id !== productId) return true;
        if (selectedSize) return (item.selectedSize || 'Único') !== selectedSize;
        return false;
      })
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isMinimumReached = cartTotal >= (companySettings.minimumOrder || 0);
  const minimumRemaining = Math.max(0, (companySettings.minimumOrder || 0) - cartTotal);

  // CRM Deals operations
  const addDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDeal: Deal = {
      ...dealData,
      id: `deal-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setDeals((prev) => [newDeal, ...prev]);
    if (isFirebaseAdmin) {
      await saveDealToFirestore(newDeal);
    }
  };

  const updateDealStage = async (dealId: string, stage: DealStage) => {
    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === dealId
          ? { ...deal, stage, updatedAt: new Date().toISOString().split('T')[0] }
          : deal
      )
    );
    if (isFirebaseAdmin) {
      await updateDealStageInFirestore(dealId, stage);
    }
  };

  const updateDeal = async (updatedDeal: Deal) => {
    setDeals((prev) => prev.map((deal) => (deal.id === updatedDeal.id ? updatedDeal : deal)));
    if (isFirebaseAdmin) {
      await saveDealToFirestore(updatedDeal);
    }
  };

  const deleteDeal = async (dealId: string) => {
    setDeals((prev) => prev.filter((deal) => deal.id !== dealId));
    if (isFirebaseAdmin) {
      await deleteDealFromFirestore(dealId);
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'totalSpent' | 'orderCount' | 'lastContact'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      totalSpent: 0,
      orderCount: 0,
      lastContact: new Date().toISOString().split('T')[0]
    };
    setClients((prev) => [newClient, ...prev]);
    if (isFirebaseAdmin) {
      await saveClientToFirestore(newClient);
    }
  };

  const placeOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Promise<Order> => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `TUT-${new Date().getFullYear()}-${randomSuffix}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toLocaleString('es-AR')
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Storefront shoppers are allowed to create orders under Firestore rules;
    // avoid private CRM writes unless authenticated as Firebase Admin.
    if (isFirebaseConnected && !isDemoMode) {
      try {
        await saveOrderToFirestore(newOrder);
      } catch (e) {
        console.error('Order sync note:', e);
      }
    }

    if (isFirebaseAdmin || isDemoMode) {
      await addDeal({
        customerName: newOrder.customerName,
        businessName: newOrder.businessName || 'Cliente Tienda Online',
        phone: newOrder.phone,
        email: newOrder.email,
        city: `${newOrder.city}, ${newOrder.province}`,
        stage: 'payment_pending',
        items: newOrder.items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
          unitPrice: i.unitPriceApplied,
          selectedSize: i.selectedSize
        })),
        totalAmount: newOrder.total,
        notes: `Pedido web ${orderNumber}. Pago: ${newOrder.paymentMethod}. Entrega: ${newOrder.shippingAddress}`
      });

      await addNotification({
        type: 'new_order',
        title: `Nuevo Pedido #${orderNumber}`,
        message: `${newOrder.customerName} confirmó una compra por ${formatCurrency(newOrder.total)}.`,
        priority: 'high',
        entityId: newOrder.id,
        entityType: 'order',
        metadata: {
          orderNumber: newOrder.orderNumber,
          total: newOrder.total,
          clientName: newOrder.businessName || newOrder.customerName,
          phone: newOrder.phone
        }
      });
    }

    clearCart();
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
    if (isFirebaseAdmin) {
      await updateOrderStatusInFirestore(orderId, status);
    }
  };

  const addInteraction = async (data: Omit<Interaction, 'id' | 'createdAt'>) => {
    const newInteraction: Interaction = {
      ...data,
      id: `int-${Date.now()}`,
      createdAt: new Date().toLocaleString('es-AR')
    };
    setInteractions((prev) => [newInteraction, ...prev]);
    if (isFirebaseAdmin) {
      await saveInteractionToFirestore(newInteraction);
    }

    const isUrgent =
      data.urgency === 'urgent' ||
      data.urgency === 'high' ||
      /urgente|reclamo|inmediat|talle|comprobante|cambio/i.test(data.note);

    if (isUrgent) {
      const client = clients.find((c) => c.id === data.clientId);
      const clientTitle = client ? client.businessName || client.name : data.clientName || 'Cliente';
      await addNotification({
        type: 'urgent_interaction',
        title: `Seguimiento Prioritario: ${clientTitle}`,
        message: `${data.author || 'Asesor'}: "${data.note}"`,
        priority: 'urgent',
        entityId: data.clientId,
        entityType: 'interaction',
        metadata: {
          clientName: clientTitle,
          phone: client?.phone,
          urgencyReason: 'Atención prioritaria'
        }
      });
    }
  };

  const addNotification = async (
    notifData: Omit<CrmNotification, 'id' | 'createdAt' | 'isRead'>
  ): Promise<CrmNotification> => {
    const newNotif: CrmNotification = {
      ...notifData,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: 'Ahora',
      isRead: false
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToastNotification(newNotif);

    if (isSoundEnabled) {
      if (newNotif.type === 'urgent_interaction' || newNotif.priority === 'urgent') {
        playNotificationSound('urgent');
      } else if (newNotif.type === 'new_order') {
        playNotificationSound('order');
      } else {
        playNotificationSound('default');
      }
    }

    if (isFirebaseAdmin) {
      await saveNotificationToFirestore(newNotif);
    }

    return newNotif;
  };

  const markNotificationAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    if (activeToastNotification?.id === notificationId) {
      setActiveToastNotification(null);
    }
    if (isFirebaseAdmin) {
      await updateNotificationInFirestore(notificationId, { isRead: true });
    }
  };

  const markAllNotificationsAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setActiveToastNotification(null);
    if (isFirebaseAdmin) {
      await Promise.all(
        unreadIds.map((id) => updateNotificationInFirestore(id, { isRead: true }).catch(() => {}))
      );
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (activeToastNotification?.id === notificationId) {
      setActiveToastNotification(null);
    }
    if (isFirebaseAdmin) {
      await deleteNotificationFromFirestore(notificationId);
    }
  };

  const clearAllNotifications = async () => {
    const current = [...notifications];
    setNotifications([]);
    setActiveToastNotification(null);
    if (isFirebaseAdmin) {
      await Promise.all(
        current.map((n) => deleteNotificationFromFirestore(n.id).catch(() => {}))
      );
    }
  };

  const dismissToast = () => setActiveToastNotification(null);

  const toggleSound = () => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      if (next) playNotificationSound('default');
      return next;
    });
  };

  const simulateIncomingOrder = async () => {
    const demoClients = [
      { name: 'Lucía Pereyra', business: 'Compra Online', phone: '+54 9 11 5552-8822', city: 'Palermo, CABA' },
      { name: 'Carla Silvestri', business: 'Showroom Oeste', phone: '+54 9 11 6789-0123', city: 'Morón, Buenos Aires' },
      { name: 'Tomás Quiroga', business: 'Compra Online', phone: '+54 9 351 443-2211', city: 'Córdoba, Córdoba' }
    ];
    const demo = demoClients[Math.floor(Math.random() * demoClients.length)];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNum = `TUT-${new Date().getFullYear()}-${randomSuffix}`;
    const sampleProd = products[Math.floor(Math.random() * products.length)] || INITIAL_PRODUCTS[0];
    const qty = 2;
    const unitPrice = calculateUnitPrice(sampleProd, qty);
    const selectedSize = sampleProd.sizes?.[1] || sampleProd.sizes?.[0] || 'M';

    const newOrder: Order = {
      id: `ord-sim-${Date.now()}`,
      orderNumber: orderNum,
      customerName: demo.name,
      businessName: demo.business,
      phone: demo.phone,
      email: `${demo.name.toLowerCase().replace(/\s+/g, '.')}@mail.com`,
      shippingAddress: 'Av. Santa Fe 3120',
      city: demo.city.split(',')[0],
      province: demo.city.split(',')[1]?.trim() || 'Buenos Aires',
      shippingMethod: 'correo_argentino',
      shippingCost: 4500,
      paymentMethod: 'transferencia',
      invoiceType: 'B',
      items: [
        {
          product: sampleProd,
          quantity: qty,
          selectedSize,
          unitPriceApplied: unitPrice,
          totalPrice: unitPrice * qty
        }
      ],
      subtotal: unitPrice * qty,
      discount: 0,
      taxAmount: 0,
      total: unitPrice * qty + 4500,
      status: 'pending_payment',
      notes: 'Compra realizada desde la tienda de ropa online.',
      createdAt: new Date().toLocaleString('es-AR')
    };

    setOrders((prev) => [newOrder, ...prev]);
    if (isFirebaseAdmin) {
      saveOrderToFirestore(newOrder).catch(() => {});
    }

    await addDeal({
      customerName: newOrder.customerName,
      businessName: newOrder.businessName,
      phone: newOrder.phone,
      email: newOrder.email,
      city: demo.city,
      stage: 'payment_pending',
      items: [
        {
          productId: sampleProd.id,
          productName: sampleProd.name,
          quantity: qty,
          unitPrice,
          selectedSize
        }
      ],
      totalAmount: newOrder.total,
      notes: `Pedido web ${orderNum} (Talle ${selectedSize}).`
    });

    await addNotification({
      type: 'new_order',
      title: `Nuevo Pedido #${newOrder.orderNumber}`,
      message: `${newOrder.customerName} compró ${qty}x ${sampleProd.name} (Talle ${selectedSize}) por ${formatCurrency(newOrder.total)}.`,
      priority: 'high',
      entityId: newOrder.id,
      entityType: 'order',
      metadata: {
        orderNumber: newOrder.orderNumber,
        total: newOrder.total,
        clientName: newOrder.customerName,
        phone: newOrder.phone
      }
    });
  };

  const simulateUrgentInteraction = async () => {
    await addInteraction({
      clientId: 'cli-01',
      type: 'whatsapp',
      note: 'Consulta urgente de clienta: necesita confirmar si el Tapado Oliva en talle M llega hoy por moto antes de las 17hs.',
      author: 'Cliente Web (WhatsApp)',
      urgency: 'urgent',
      clientName: 'Showroom Recoleta Chic'
    });
  };

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      image: resolveProductImage(productData.image, productData.category)
    };
    setProducts((prev) => [newProduct, ...prev]);
    if (isFirebaseAdmin) {
      await saveProductToFirestore(newProduct);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    const normalized: Product = {
      ...updatedProduct,
      image: resolveProductImage(updatedProduct.image, updatedProduct.category)
    };
    setProducts((prev) => prev.map((p) => (p.id === normalized.id ? normalized : p)));
    if (isFirebaseAdmin) {
      await saveProductToFirestore(normalized);
    }
  };

  const deleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (isFirebaseAdmin) {
      await deleteProductFromFirestore(productId);
    }
  };

  const batchUpdatePrices = async (percentage: number, category?: string) => {
    const factor = 1 + percentage / 100;
    const updated = products.map((p) => {
      if (!category || category === 'Todos' || p.category === category) {
        const roundPrice = (price: number) => Math.round((price * factor) / 100) * 100;
        const newPriceUnit = roundPrice(p.priceUnit);
        const newPriceTiers = {
          ...(p.priceTiers?.tier5 ? { tier5: roundPrice(p.priceTiers.tier5) } : {}),
          ...(p.priceTiers?.tier10 ? { tier10: roundPrice(p.priceTiers.tier10) } : {}),
          ...(p.priceTiers?.tier100 ? { tier100: roundPrice(p.priceTiers.tier100) } : {})
        };
        const updatedProd: Product = {
          ...p,
          priceUnit: newPriceUnit,
          priceTiers: newPriceTiers
        };
        if (isFirebaseAdmin) {
          saveProductToFirestore(updatedProd).catch(console.error);
        }
        return updatedProd;
      }
      return p;
    });
    setProducts(updated);
  };

  const resetCatalogToDefault = async () => {
    setProducts(INITIAL_PRODUCTS);
    if (isFirebaseAdmin) {
      for (const p of INITIAL_PRODUCTS) {
        await saveProductToFirestore(p).catch(console.error);
      }
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        batchUpdatePrices,
        resetCatalogToDefault,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartItemCount,
        isMinimumReached,
        minimumRemaining,
        deals,
        addDeal,
        updateDealStage,
        updateDeal,
        deleteDeal,
        clients,
        addClient,
        orders,
        placeOrder,
        updateOrderStatus,
        interactions,
        addInteraction,
        companySettings,
        updateCompanySettings,
        isCrmAuthenticated,
        isDemoMode,
        isFirebaseAdmin,
        authLoading,
        authError,
        crmUser,
        loginDemo,
        loginWithGoogle,
        logoutCrm,
        activeTab,
        setActiveTab,
        selectedProductForModal,
        setSelectedProductForModal,
        productToEdit,
        setProductToEdit,
        isProductEditModalOpen,
        setIsProductEditModalOpen,
        openCreateProductModal,
        openEditProductModal,
        closeProductEditModal,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isFirebaseConnected,
        notifications,
        unreadNotificationsCount,
        urgentNotificationsCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        activeToastNotification,
        dismissToast,
        isSoundEnabled,
        toggleSound,
        simulateIncomingOrder,
        simulateUrgentInteraction,
        selectedEntityForFocus,
        setSelectedEntityForFocus
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
