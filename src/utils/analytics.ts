import { GA_MEASUREMENT_ID, META_PIXEL_ID } from '../config';

/**
 * Carga Google Analytics 4 y/o el píxel de Meta si la tienda configuró sus IDs
 * (variables VITE_GA_ID y VITE_META_PIXEL_ID). Sin IDs no se carga nada.
 */
type AnyFn = (...args: unknown[]) => void;
type W = Window & { dataLayer?: unknown[]; gtag?: AnyFn; fbq?: AnyFn & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: AnyFn; push?: AnyFn } };

export function initAnalytics(): void {
  const w = window as W;
  if (GA_MEASUREMENT_ID && /^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID)) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(s);
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag('js', new Date());
    w.gtag('config', GA_MEASUREMENT_ID);
  }

  if (META_PIXEL_ID && /^[0-9]+$/.test(META_PIXEL_ID)) {
    // Snippet oficial del píxel de Meta, escrito en TypeScript.
    type Fbq = NonNullable<W['fbq']>;
    const fbq: Fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    } as Fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    w.fbq = fbq;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    w.fbq!('init', META_PIXEL_ID);
    w.fbq!('track', 'PageView');
  }
}

/** Eventos de comercio electrónico (si hay analítica configurada). */
export function trackEvent(name: 'add_to_cart' | 'begin_checkout' | 'purchase', value?: number): void {
  const w = window as W;
  w.gtag?.('event', name, value !== undefined ? { currency: 'ARS', value } : {});
  const fbName = { add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', purchase: 'Purchase' }[name];
  w.fbq?.('track', fbName, value !== undefined ? { currency: 'ARS', value } : {});
}
