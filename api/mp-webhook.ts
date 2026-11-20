import { adminDb } from './_lib/firebaseAdmin.js';
import { type ApiRequest, type ApiResponse, queryParam, readJsonBody, nowAr } from './_lib/http.js';
import { getPayment, isValidSignature, mpToken } from './_lib/mercadopago.js';

/**
 * POST /api/mp-webhook — notificaciones de Mercado Pago.
 * Nunca confía en el contenido de la notificación: consulta el pago a la API de Mercado Pago
 * y solo marca el pedido como pagado si el pago está aprobado y el monto coincide.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const body = readJsonBody(req);
  const data = (body.data || {}) as Record<string, unknown>;
  const type = String(body.type || body.topic || queryParam(req, 'type') || queryParam(req, 'topic'));
  const paymentId = String(data.id || queryParam(req, 'data.id') || queryParam(req, 'id') || '');

  if (type !== 'payment' || !paymentId || !mpToken()) {
    // Otros eventos (merchant_order, etc.) no nos interesan; respondemos 200 para que MP no reintente.
    return res.status(200).json({ ok: true, ignored: true });
  }

  if (
    !isValidSignature(
      req.headers['x-signature'] as string | undefined,
      req.headers['x-request-id'] as string | undefined,
      queryParam(req, 'data.id') || paymentId
    )
  ) {
    return res.status(401).json({ error: 'Firma inválida' });
  }

  try {
    const payment = await getPayment(paymentId);
    const orderId = payment.external_reference || '';
    if (!/^ord-[a-zA-Z0-9_-]+$/.test(orderId)) return res.status(200).json({ ok: true, ignored: true });

    const db = adminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const dealRef = db.collection('deals').doc(`deal-${orderId}`);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef);
      const dealSnap = await tx.get(dealRef);
      if (!snap.exists) return;
      const order = snap.data() as Record<string, any>;
      const paymentDetails = {
        ...(order.paymentDetails || {}),
        mpPaymentId: String(payment.id),
        mpStatus: payment.status,
        transactionId: String(payment.id)
      };

      const amountOk = Math.abs((payment.transaction_amount || 0) - Number(order.total)) < 1;
      if (payment.status === 'approved' && amountOk && order.status === 'pending_payment') {
        tx.update(orderRef, { status: 'paid', paymentDetails });
        const notifId = `notif-${Date.now()}-mp${String(payment.id).slice(-6)}`;
        tx.set(db.collection('notifications').doc(notifId), {
          id: notifId,
          type: 'payment_received',
          title: `Pago acreditado #${order.orderNumber}`,
          message: `Mercado Pago aprobó el pago de ${order.customerName} por $${Number(order.total).toLocaleString('es-AR')}.`,
          createdAt: nowAr(),
          isRead: false,
          priority: 'high',
          entityId: orderId,
          entityType: 'order',
          metadata: {
            orderNumber: order.orderNumber,
            total: order.total,
            clientName: order.customerName,
            phone: order.phone
          }
        });
        if (dealSnap.exists) {
          tx.update(dealRef, { stage: 'won', updatedAt: new Date().toISOString().split('T')[0] });
        }
      } else if (order.status === 'pending_payment') {
        tx.update(orderRef, { paymentDetails });
      }
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('mp-webhook', e);
    // 500 → Mercado Pago reintenta más tarde.
    return res.status(500).json({ error: 'Error procesando la notificación' });
  }
}
