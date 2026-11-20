import { CompanySettings } from '../types';
import { DEFAULT_CATEGORIES } from '../../shared/commerce';
import { DEMO_MODE } from '../config';

/**
 * Configuración con la que arranca una tienda nueva: SIN datos bancarios ni fiscales.
 * El dueño los completa en Panel → Configuración antes de vender
 * (mientras falten, la transferencia no se ofrece en el checkout).
 */
export const BLANK_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'Mi Tienda',
  legalName: '',
  cuit: '',
  address: '',
  city: '',
  province: '',
  phone: '',
  email: '',
  minimumOrder: 0,
  bankName: '',
  accountHolder: '',
  cbu: '',
  alias: '',
  cardPaymentsEnabled: false,
  installmentsAllowed: [1, 3, 6],
  updatedAt: '',
  tagline: 'Tienda de ropa',
  logoUrl: '',
  heroImageUrl: '',
  heroTitle: '',
  heroText: '',
  primaryColor: '#141413',
  accentColor: '#364637',
  instagramUrl: '',
  facebookUrl: '',
  orderPrefix: 'PED',
  categories: DEFAULT_CATEGORIES,
  bannerTexts: ['Envíos a todo el país', 'Cambios de talle sin cargo', ''],
  footerText: '',
  wholesaleEnabled: false,
  invoiceAEnabled: false,
  mercadoPagoEnabled: false,
  transferEnabled: true,
  shippingCorreoEnabled: true,
  shippingCorreoCost: 0,
  shippingExpressEnabled: false,
  shippingExpressCost: 0,
  pickupEnabled: true,
  pickupAddress: '',
  freeShippingFrom: 0
};

/** Datos de muestra para el sitio de demostración (VITE_DEMO_MODE=true). Son ficticios. */
export const DEMO_COMPANY_SETTINGS: CompanySettings = {
  ...BLANK_COMPANY_SETTINGS,
  companyName: 'TU TIENDA',
  legalName: 'TU TIENDA INDUMENTARIA S.R.L. (demo)',
  cuit: '30-00000000-0',
  address: 'Honduras 4850, Palermo',
  city: 'Ciudad Autónoma de Buenos Aires',
  province: 'CABA',
  phone: '+54 9 11 4982-1100',
  email: 'hola@tutienda.com.ar',
  bankName: 'Banco de ejemplo',
  accountHolder: 'TU TIENDA (demo)',
  cbu: '0000000000000000000000',
  alias: 'TU.TIENDA.DEMO',
  updatedAt: '2026-11-20',
  tagline: 'Tienda de ropa',
  heroTitle: 'Prendas esenciales de diseño noble y corte contemporáneo.',
  heroText:
    'Lino lavado, algodón peinado de alto gramaje y sastrería liviana pensada para durar. Comprá por unidad o aprovechá beneficios por pack.',
  orderPrefix: 'TT',
  bannerTexts: ['Envíos a todo el país en 24/48hs', 'Cambios de talle sin cargo', 'Descuentos llevando 5 o más prendas iguales'],
  wholesaleEnabled: true,
  invoiceAEnabled: true,
  mercadoPagoEnabled: true,
  shippingCorreoCost: 5900,
  shippingExpressEnabled: true,
  shippingExpressCost: 7500,
  pickupAddress: 'Showroom Palermo'
};

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = DEMO_MODE ? DEMO_COMPANY_SETTINGS : BLANK_COMPANY_SETTINGS;

/** Completa con valores por defecto los campos nuevos que una configuración vieja no tenga. */
export const withSettingsDefaults = (s: Partial<CompanySettings> | null | undefined): CompanySettings => ({
  ...DEFAULT_COMPANY_SETTINGS,
  ...(s || {}),
  categories: s?.categories && s.categories.length > 0 ? s.categories : DEFAULT_COMPANY_SETTINGS.categories,
  bannerTexts: s?.bannerTexts || DEFAULT_COMPANY_SETTINGS.bannerTexts
});

/** Lo mínimo para poder vender: nombre, WhatsApp y al menos un medio de pago configurado. */
export const missingSetupFields = (s: CompanySettings): string[] => {
  const missing: string[] = [];
  if (!s.companyName || s.companyName === 'Mi Tienda') missing.push('Nombre de la tienda');
  if (!s.phone) missing.push('WhatsApp / teléfono');
  if (!s.email) missing.push('Email de contacto');
  if (!s.legalName || !s.cuit) missing.push('Razón social y CUIT (para las páginas legales)');
  const hasTransfer = s.transferEnabled !== false && !!(s.cbu || s.alias);
  if (!s.mercadoPagoEnabled && !hasTransfer && s.pickupEnabled === false) {
    missing.push('Un medio de pago (Mercado Pago o datos para transferencia)');
  }
  return missing;
};
