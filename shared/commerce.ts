/**
 * Reglas de precios y envíos compartidas entre la tienda (navegador) y el servidor (/api).
 * El servidor SIEMPRE recalcula con estas funciones: el total que manda el navegador no se usa.
 */

export const DEFAULT_CATEGORIES = [
  'Remeras y Tops',
  'Camisas y Blusas',
  'Pantalones y Jeans',
  'Abrigos y Tapados',
  'Vestidos y Conjuntos',
  'Accesorios y Calzado'
];

export type ShippingMethod = 'correo_argentino' | 'transporte_expreso' | 'retiro_deposito';
export type CheckoutPaymentMethod = 'mercadopago' | 'transferencia' | 'efectivo_deposito';

export interface PricingProduct {
  priceUnit: number;
  priceTiers?: { tier5?: number; tier10?: number; tier100?: number };
}

export interface CommerceSettings {
  wholesaleEnabled?: boolean;
  invoiceAEnabled?: boolean;
  mercadoPagoEnabled?: boolean;
  transferEnabled?: boolean;
  cbu?: string;
  alias?: string;
  minimumOrder?: number;
  shippingCorreoEnabled?: boolean;
  shippingCorreoCost?: number;
  shippingExpressEnabled?: boolean;
  shippingExpressCost?: number;
  pickupEnabled?: boolean;
  freeShippingFrom?: number;
}

export const unitPriceFor = (
  product: PricingProduct,
  quantity: number,
  wholesaleEnabled = true
): number => {
  const tiers = product.priceTiers || {};
  if (wholesaleEnabled) {
    if (quantity >= 100 && tiers.tier100) return tiers.tier100;
    if (quantity >= 10 && tiers.tier10) return tiers.tier10;
    if (quantity >= 5 && tiers.tier5) return tiers.tier5;
  }
  return product.priceUnit;
};

export interface ShippingOption {
  id: ShippingMethod;
  label: string;
  description: string;
  cost: number;
}

export const shippingOptionsFor = (
  settings: CommerceSettings,
  subtotal: number,
  pickupAddress?: string
): ShippingOption[] => {
  const free = !!settings.freeShippingFrom && settings.freeShippingFrom > 0 && subtotal >= settings.freeShippingFrom;
  const options: ShippingOption[] = [];
  if (settings.shippingCorreoEnabled !== false) {
    options.push({
      id: 'correo_argentino',
      label: 'Envío a domicilio',
      description: 'Correo a domicilio o sucursal',
      cost: free ? 0 : Math.max(0, settings.shippingCorreoCost ?? 0)
    });
  }
  if (settings.shippingExpressEnabled) {
    options.push({
      id: 'transporte_expreso',
      label: 'Moto / Expreso',
      description: 'Entrega rápida',
      cost: free ? 0 : Math.max(0, settings.shippingExpressCost ?? 0)
    });
  }
  if (settings.pickupEnabled !== false) {
    options.push({
      id: 'retiro_deposito',
      label: 'Retiro en el local',
      description: pickupAddress || 'Coordinamos el retiro por WhatsApp',
      cost: 0
    });
  }
  return options;
};

export const paymentMethodsFor = (settings: CommerceSettings): CheckoutPaymentMethod[] => {
  const list: CheckoutPaymentMethod[] = [];
  if (settings.mercadoPagoEnabled) list.push('mercadopago');
  if (settings.transferEnabled !== false && (settings.cbu || settings.alias)) list.push('transferencia');
  if (settings.pickupEnabled !== false) list.push('efectivo_deposito');
  return list;
};

export const IVA_RATE = 0.21;

/** Factura A: se discrimina el IVA sobre el subtotal de prendas (igual que la versión original). */
export const taxFor = (invoiceType: 'A' | 'B', subtotal: number): number =>
  invoiceType === 'A' ? Math.round(subtotal * IVA_RATE) : 0;

export const formatOrderNumber = (prefix: string | undefined, n: number): string => {
  const clean = (prefix || 'PED').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6) || 'PED';
  return `${clean}-${String(n).padStart(6, '0')}`;
};
