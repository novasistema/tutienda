import { createHmac, timingSafeEqual } from 'node:crypto';

const MP_API = 'https://api.mercadopago.com';

export const mpToken = (): string => process.env.MP_ACCESS_TOKEN || '';

export interface MpPreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: 'ARS';
}

export async function createPreference(body: Record<string, unknown>): Promise<{ id: string; init_point: string }> {
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mpToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mercado Pago respondió ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as { id: string; init_point: string };
}

export interface MpPayment {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
}

export async function getPayment(paymentId: string): Promise<MpPayment> {
  const res = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${mpToken()}` }
  });
  if (!res.ok) {
    throw new Error(`No se pudo consultar el pago ${paymentId} (${res.status}).`);
  }
  return (await res.json()) as MpPayment;
}

/**
 * Verifica la firma x-signature que manda Mercado Pago en las notificaciones.
 * Si MP_WEBHOOK_SECRET no está configurado se omite (igual se consulta el pago a la API de MP,
 * así que nadie puede marcar un pedido como pagado con una notificación falsa).
 */
export function isValidSignature(
  signatureHeader: string | undefined,
  requestId: string | undefined,
  dataId: string
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, ...v] = p.trim().split('=');
      return [k, v.join('=')];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  let manifest = `id:${dataId.toLowerCase()};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
  } catch {
    return false;
  }
}
