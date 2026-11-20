import { randomBytes } from 'node:crypto';
import { adminDb } from './_lib/firebaseAdmin.js';
import { type ApiRequest, type ApiResponse, readJsonBody, str, nowAr } from './_lib/http.js';

/**
 * POST /api/arrepentimiento — "Botón de arrepentimiento" (Res. 424/2020 de la Secretaría de Comercio Interior).
 * Registra la solicitud, avisa en el panel y devuelve un código de seguimiento al consumidor.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const b = readJsonBody(req);
  const data = {
    name: str(b.name, 160),
    email: str(b.email, 160),
    phone: str(b.phone, 50),
    orderNumber: str(b.orderNumber, 64),
    reason: str(b.reason, 1000)
  };
  if (!data.name || (!data.email && !data.phone) || !data.orderNumber) {
    return res.status(400).json({ error: 'Completá tu nombre, un medio de contacto y el número de pedido.' });
  }
  const code = `ARR-${randomBytes(4).toString('hex').toUpperCase()}`;
  try {
    const db = adminDb();
    const batch = db.batch();
    batch.set(db.collection('withdrawals').doc(code), {
      ...data,
      code,
      createdAt: nowAr(),
      createdAtIso: new Date().toISOString()
    });
    const notifId = `notif-${Date.now()}-${code.toLowerCase()}`;
    batch.set(db.collection('notifications').doc(notifId), {
      id: notifId,
      type: 'urgent_interaction',
      title: `Botón de arrepentimiento · Pedido ${data.orderNumber}`.slice(0, 200),
      message: `${data.name} pidió revocar la compra (${code}). Contacto: ${data.email || data.phone}.${
        data.reason ? ` Motivo: ${data.reason}` : ''
      }`.slice(0, 1000),
      createdAt: nowAr(),
      isRead: false,
      priority: 'urgent',
      metadata: {
        orderNumber: data.orderNumber,
        clientName: data.name,
        phone: data.phone,
        urgencyReason: 'Arrepentimiento de compra'
      }
    });
    await batch.commit();
    return res.status(201).json({ code });
  } catch (e) {
    console.error('arrepentimiento', e);
    return res.status(500).json({ error: 'No pudimos registrar la solicitud. Escribinos por WhatsApp o email.' });
  }
}
