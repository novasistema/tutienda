// Las categorías son editables por cada tienda desde Configuración.
export type ClothingCategory = string;

export interface ProductSpec {
  label: string;
  desc: string;
  iconName?: string;
}

export interface ProductTierPricing {
  tier5?: number;
  tier10?: number;
  tier100?: number;
}

export interface Product {
  id: string;
  name: string;
  hook: string;
  category: ClothingCategory;
  sku: string;
  code?: string;
  brand: string;
  priceUnit: number;
  priceTiers: ProductTierPricing;
  badges: string[];
  specs: ProductSpec[];
  image: string;
  stock: number;
  sizes?: string[];
  color?: string;
  material?: string;
  fit?: string;
  isNew?: boolean;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  unitPriceApplied: number;
  totalPrice: number;
}

export type DealStage = 'lead' | 'contacted' | 'quoted' | 'payment_pending' | 'won' | 'lost';

export interface Deal {
  id: string;
  customerName: string;
  businessName?: string;
  phone: string;
  email?: string;
  city: string;
  stage: DealStage;
  items: { productId: string; productName: string; quantity: number; unitPrice: number; selectedSize?: string }[];
  totalAmount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  assignedSalesperson?: string;
}

/** Datos mínimos de la prenda que se guardan dentro de un pedido (sin la foto, para no superar el límite de 1 MB de Firestore). */
export type OrderProductRef = Pick<Product, 'id' | 'name' | 'sku'> & Partial<Product>;

export interface OrderItem {
  product: OrderProductRef;
  quantity: number;
  selectedSize?: string;
  unitPriceApplied: number;
  totalPrice: number;
}

export type OrderStatus = 'pending_payment' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  businessName?: string;
  documentId?: string;
  phone: string;
  email?: string;
  shippingAddress: string;
  city: string;
  province: string;
  shippingMethod: 'transporte_expreso' | 'retiro_deposito' | 'correo_argentino';
  shippingCost: number;
  // 'tarjeta_segura' queda solo para leer pedidos viejos: el cobro con tarjeta ahora pasa por Mercado Pago.
  paymentMethod: 'mercadopago' | 'transferencia' | 'efectivo_deposito' | 'acuerdo_comercial' | 'tarjeta_segura';
  paymentDetails?: {
    cardLast4?: string;
    cardBrand?: string;
    transactionId?: string;
    mpPaymentId?: string;
    mpStatus?: string;
  };
  invoiceType: 'A' | 'B';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  /** true cuando el stock de este pedido ya se devolvió al cancelarlo. */
  stockRestored?: boolean;
}

export interface Client {
  id: string;
  name: string;
  businessName: string;
  cuitOrDni: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  tier: 'Minorista' | 'Mayorista Plata' | 'Mayorista Oro' | 'Distribuidor';
  totalSpent: number;
  orderCount: number;
  notes: string;
  lastContact: string;
}

export interface Interaction {
  id: string;
  clientId: string;
  dealId?: string;
  type: 'whatsapp' | 'llamada' | 'email' | 'reunion' | 'nota';
  note: string;
  author: string;
  createdAt: string;
  urgency?: 'normal' | 'high' | 'urgent';
  clientName?: string;
}

export type NotificationType = 'new_order' | 'urgent_interaction' | 'payment_received' | 'low_stock' | 'deal_won';
export type NotificationPriority = 'normal' | 'high' | 'urgent';

export interface CrmNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  priority: NotificationPriority;
  entityId?: string;
  entityType?: 'order' | 'interaction' | 'deal' | 'client';
  metadata?: {
    orderNumber?: string;
    total?: number;
    clientName?: string;
    phone?: string;
    urgencyReason?: string;
  };
}

export interface CompanySettings {
  companyName: string;
  legalName: string;
  cuit: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  minimumOrder: number;
  bankName: string;
  accountHolder: string;
  cbu: string;
  alias: string;
  cardPaymentsEnabled: boolean;
  installmentsAllowed: number[];
  updatedAt: string;

  // --- Marca y personalización por cliente ---
  tagline?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  heroTitle?: string;
  heroText?: string;
  primaryColor?: string;
  accentColor?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  /** Prefijo del número de pedido, ej. "TT" → TT-000123 */
  orderPrefix?: string;
  categories?: string[];
  /** Tres frases del banner superior (envíos, cambios, promos). */
  bannerTexts?: string[];
  footerText?: string;

  // --- Ventas ---
  wholesaleEnabled?: boolean;
  invoiceAEnabled?: boolean;
  mercadoPagoEnabled?: boolean;
  transferEnabled?: boolean;
  shippingCorreoEnabled?: boolean;
  shippingCorreoCost?: number;
  shippingExpressEnabled?: boolean;
  shippingExpressCost?: number;
  pickupEnabled?: boolean;
  pickupAddress?: string;
  freeShippingFrom?: number;
}
