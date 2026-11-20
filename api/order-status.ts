import { timingSafeEqual } from 'node:crypto';
import { adminDb } from './_lib/firebaseAdmin.js';
import { type ApiRequest, type ApiResponse, queryParam } from './_lib/http.js';

/**
 * GET /api/order-status?id=...&t=... — estado de un pedido para el comprador
 * (al volver de Mercado Pago). Requiere el token secreto que se generó con el pedido.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const id = queryParam(req, 'id');
  const token = queryParam(req, 't');
  if (!/^ord-[a-zA-Z0-9_-]{1,120}$/.test(id) || !/^[a-f0-9]{32}$/.test(token)) {
    return res.status(400).json({ error: 'Pedido inválido' });
  }
  try {
    const snap = await adminDb().collection('orders').doc(id).get();
    const o = snap.data() as Record<string, any> | undefined;
    const stored = String(o?.publicToken || '');
    if (!o || stored.length !== token.length || !timingSafeEqual(Buffer.from(stored), Buffer.from(token))) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      order: {
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        status: o.status,
        paymentMethod: o.paymentMethod,
        shippingMethod: o.shippingMethod,
        shippingAddress: o.shippingAddress,
        city: o.city,
        province: o.province,
        phone: o.phone,
        items: o.items,
        subtotal: o.subtotal,
        shippingCost: o.shippingCost,
        taxAmount: o.taxAmount,
        discount: o.discount || 0,
        total: o.total,
        invoiceType: o.invoiceType,
        createdAt: o.createdAt,
        paymentDetails: o.paymentDetails?.mpStatus ? { mpStatus: o.paymentDetails.mpStatus } : undefined
      }
    });
  } catch (e) {
    console.error('order-status', e);
    return res.status(500).json({ error: 'No se pudo consultar el pedido' });
  }
}
