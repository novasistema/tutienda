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
import { DEFAULT_COMPANY_SETTINGS, withSettingsDefaults } from '../data/defaultSettings';
import { calculateUnitPrice, formatCurrency } from '../utils/formatters';
import { DEMO_MODE } from '../config';
import { navigate, productIdFromPath, usePathname } from '../utils/router';
import { trackEvent } from '../utils/analytics';
import {
  formatOrderNumber,
  shippingOptionsFor,
  taxFor,
  type CheckoutPaymentMethod,
  type ShippingMethod
} from '../../shared/commerce';
import { playNotificationSound } from '../utils/sound';
import { resolveProductImage } from '../utils/imageUtils';
import { auth, testConnection } from '../firebase';
import {
  checkIsAuthorizedAdmin,
  restoreStockForOrder,
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

export interface CheckoutInput {
  customer: {
    name: string;
    businessName?: string;
    documentId?: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    province: string;
    notes?: string;
  };
  invoiceType: 'A' | 'B';
  shippingMethod: ShippingMethod;
  paymentMethod: CheckoutPaymentMethod;
}

export interface PlaceOrderResult {
  order: Order;
  /** Link de pago de Mercado Pago (si corresponde). */
  paymentUrl: string | null;
  token?: string;
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
  placeOrder: (input: CheckoutInput) => Promise<PlaceOrderResult>;
  productsLoading: boolean;
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

const CART_STORAGE_KEY = 'tutienda_cart_v2';
const DEMO_STORAGE_KEY = 'tutienda_demo_auth_v2';
const SOUND_STORAGE_KEY = 'tutienda_crm_sound_v2';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Los datos de ejemplo solo se usan en el sitio de demostración (VITE_DEMO_MODE=true).
  const [products, setProducts] = useState<Product[]>(DEMO_MODE ? INITIAL_PRODUCTS : []);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [deals, setDeals] = useState<Deal[]>(DEMO_MODE ? INITIAL_DEALS : []);
  const [clients, setClients] = useState<Client[]>(DEMO_MODE ? INITIAL_CLIENTS : []);
  const [orders, setOrders] = useState<Order[]>(DEMO_MODE ? INITIAL_ORDERS : []);
  const [interactions, setInteractions] = useState<Interaction[]>(DEMO_MODE ? INITIAL_INTERACTIONS : []);
  const [notifications, setNotifications] = useState<CrmNotification[]>(DEMO_MODE ? INITIAL_NOTIFICATIONS : []);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);

  // Auth states: Firebase Admin OR Prospective Client Demo Mode
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      return DEMO_MODE && localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [crmUser, setCrmUser] = useState<CrmUser | null>(() => {
    try {
      if (DEMO_MODE && localStorage.getItem(DEMO_STORAGE_KEY) === 'true') {
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
    if (!DEMO_MODE) {
      setAuthError('El acceso de demostración no está habilitado en esta tienda.');
      return false;
    }
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
          `La cuenta ${cred.user.email || ''} no está autorizada como administradora de esta tienda. Pedile al responsable del sistema que la habilite.`
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
  // Navegación sincronizada con la URL: /admin abre el panel y /producto/:id abre una prenda.
  const pathname = usePathname();
  const [activeTab, setActiveTabState] = useState<'store' | 'crm' | 'quotation'>(() =>
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') ? 'crm' : 'store'
  );
  const [selectedProductForModal, setSelectedProductState] = useState<Product | null>(null);

  const setActiveTab = (tab: 'store' | 'crm' | 'quotation') => {
    setActiveTabState(tab);
    navigate(tab === 'store' ? '/' : '/admin');
  };

  const setSelectedProductForModal = (product: Product | null) => {
    setSelectedProductState(product);
    if (product && activeTab === 'store') {
      navigate(`/producto/${encodeURIComponent(product.id)}`);
    } else if (!product && productIdFromPath(window.location.pathname)) {
      navigate('/');
    }
  };

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      setActiveTabState((t) => (t === 'store' ? 'crm' : t));
      return;
    }
    setActiveTabState('store');
    const productId = productIdFromPath(pathname);
    if (!productId) {
      setSelectedProductState(null);
      return;
    }
    const found = products.find((p) => p.id === productId);
    if (found) setSelectedProductState(found);
  }, [pathname, products]);
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
          if (!active) return;
          // En la demo, si la base está vacía, se muestran las prendas de ejemplo.
          setProducts(DEMO_MODE && prods.length === 0 ? INITIAL_PRODUCTS : prods);
          setProductsLoading(false);
        });
        unsubSettings = subscribeToSettings((sets) => {
          if (active) setCompanySettings(sets);
        });
      }
    }

    initPublic().finally(() => {
      if (active) setTimeout(() => active && setProductsLoading(false), 4000);
    });

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
            name: firebaseUser.displayName || 'Administrador',
            email: firebaseUser.email || '',
            role: 'Administrador General',
            isDemo: false
          });
          setAuthLoading(false);

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
      if (DEMO_MODE && localStorage.getItem(DEMO_STORAGE_KEY) === 'true') {
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
    try {
      // Las fotos subidas se guardan como texto largo: no se copian al carrito local para no llenar el navegador.
      const light = cart.map((i) => ({
        ...i,
        product: { ...i.product, image: i.product.image?.startsWith('data:') ? '' : i.product.image }
      }));
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(light));
    } catch {
      /* almacenamiento lleno o bloqueado: el carrito sigue funcionando en memoria */
    }
  }, [cart]);

  // Al actualizarse el catálogo, el carrito toma la foto y el precio vigentes de cada prenda.
  useEffect(() => {
    if (products.length === 0) return;
    setCart((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const fresh = products.find((p) => p.id === item.product.id);
        if (!fresh || fresh === item.product) return item;
        changed = true;
        const unitPriceApplied = calculateUnitPrice(fresh, item.quantity, !!companySettings.wholesaleEnabled);
        return { ...item, product: fresh, unitPriceApplied, totalPrice: unitPriceApplied * item.quantity };
      });
      return changed ? next : prev;
    });
  }, [products, companySettings.wholesaleEnabled]);

  const updateCompanySettings = async (newSettings: CompanySettings) => {
    setCompanySettings(withSettingsDefaults(newSettings));
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
      const unitPriceApplied = calculateUnitPrice(product, newQuantity, !!companySettings.wholesaleEnabled);
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
    trackEvent('add_to_cart', product.priceUnit * quantity);
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
          const unitPriceApplied = calculateUnitPrice(item.product, quantity, !!companySettings.wholesaleEnabled);
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

  /**
   * Crea el pedido. En una tienda real lo hace el servidor (/api/orders), que recalcula precios,
   * descuenta stock y genera el link de Mercado Pago. En la demo se simula en el navegador.
   */
  const placeOrder = async (input: CheckoutInput): Promise<PlaceOrderResult> => {
    if (!DEMO_MODE) {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          items: cart.map((i) => ({
            productId: i.product.id,
            size: i.selectedSize || 'Único',
            quantity: i.quantity
          }))
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.order) {
        throw new Error(data.error || 'No pudimos registrar el pedido. Probá de nuevo en unos minutos.');
      }
      clearCart();
      return { order: data.order as Order, paymentUrl: data.paymentUrl || null, token: data.token };
    }

    // --- Simulación para el sitio de demostración ---
    const subtotal = cartTotal;
    const shipping = shippingOptionsFor(companySettings, subtotal, companySettings.pickupAddress).find(
      (o) => o.id === input.shippingMethod
    );
    const taxAmount = taxFor(companySettings.invoiceAEnabled ? input.invoiceType : 'B', subtotal);
    const shippingCost = shipping?.cost || 0;
    const newOrder: Order = {
      id: `ord-demo-${Date.now()}`,
      orderNumber: formatOrderNumber(companySettings.orderPrefix, Math.floor(1000 + Math.random() * 9000)),
      customerName: input.customer.name,
      businessName: input.customer.businessName || undefined,
      documentId: input.customer.documentId || undefined,
      phone: input.customer.phone,
      email: input.customer.email || undefined,
      shippingAddress: input.customer.address || 'Retiro en el local',
      city: input.customer.city || '-',
      province: input.customer.province || '-',
      shippingMethod: input.shippingMethod,
      shippingCost,
      paymentMethod: input.paymentMethod,
      invoiceType: input.invoiceType,
      items: cart.map((i) => ({
        product: { id: i.product.id, name: i.product.name, sku: i.product.sku, category: i.product.category },
        quantity: i.quantity,
        selectedSize: i.selectedSize,
        unitPriceApplied: i.unitPriceApplied,
        totalPrice: i.totalPrice
      })),
      subtotal,
      discount: 0,
      taxAmount,
      total: subtotal + shippingCost + taxAmount,
      status: 'pending_payment',
      notes: input.customer.notes || undefined,
      createdAt: new Date().toLocaleString('es-AR')
    };
    setOrders((prev) => [newOrder, ...prev]);
    if (isDemoMode) {
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
        notes: `Pedido web ${newOrder.orderNumber} (demo). Pago: ${newOrder.paymentMethod}.`
      });
      await addNotification({
        type: 'new_order',
        title: `Nuevo Pedido #${newOrder.orderNumber}`,
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
    return { order: newOrder, paymentUrl: null };
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const previous = orders.find((o) => o.id === orderId);
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
    if (isFirebaseAdmin) {
      await updateOrderStatusInFirestore(orderId, status);
      // Al cancelar un pedido, las prendas vuelven al stock (una sola vez).
      if (status === 'cancelled' && previous && previous.status !== 'cancelled' && !previous.stockRestored) {
        await restoreStockForOrder(previous);
      }
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
    const orderNum = formatOrderNumber(companySettings.orderPrefix, randomSuffix);
    const sampleProd = products[Math.floor(Math.random() * products.length)] || INITIAL_PRODUCTS[0];
    const qty = 2;
    const unitPrice = calculateUnitPrice(sampleProd, qty, !!companySettings.wholesaleEnabled);
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
        productsLoading,
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
