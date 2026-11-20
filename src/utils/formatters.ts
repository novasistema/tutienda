import { Product } from '../types';
import { unitPriceFor } from '../../shared/commerce';

export const formatCurrency = (amount: number, withCurrencySuffix = true): string => {
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount);

  return withCurrencySuffix ? `${formatted} ARS` : formatted;
};

/** Precio unitario según la cantidad. Los precios por cantidad solo aplican si la tienda vende por mayor. */
export const calculateUnitPrice = (product: Product, quantity: number, wholesaleEnabled = true): number =>
  unitPriceFor(product, quantity, wholesaleEnabled);

export const generateWhatsAppLink = (phone: string, text: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};
