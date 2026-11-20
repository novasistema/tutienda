import { randomBytes } from 'node:crypto';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { adminDb } from './_lib/firebaseAdmin.js';
import { type ApiRequest, type ApiResponse, readJsonBody, siteUrl, str, nowAr } from './_lib/http.js';
import { createPreference, mpToken, type MpPreferenceItem } from './_lib/mercadopago.js';
import {
  formatOrderNumber,
  paymentMethodsFor,
  shippingOptionsFor,
  taxFor,
  unitPriceFor,
  type CheckoutPaymentMethod,
  type CommerceSettings,
  type ShippingMethod
} from '../shared/commerce.js';

/**
 * POST /api/orders — crea un pedido de la tienda.
 * El precio, el envío, el IVA y el número de pedido se calculan acá (nunca en el navegador),
 * el stock se descuenta en la misma transacción y el pedido siempre nace "pendiente de pago".
 * Si el comprador eligió Mercado Pago, devuelve el link de pago (Checkout Pro).
 */

class UserError extends Error {}

interface ServerSettings extends CommerceSettings {
  companyName?: string;
  orderPrefix?: string;
  pickupAddress?: string;
}

interface RequestedItem {
  productId: string;
  size: string;
  quantity: number;
}

interface StoredOrderItem {
  product: { id: string; name: string; sku: string; category: string };
  quantity: number;
  selectedSize: string;
  unitPriceApplied: number;
  totalPrice: number;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const body = readJsonBody(req);
  const c = (body.customer || {}) as Record<string, unknown>;
  const customer = {
    name: str(c.name, 160),
    businessName: str(c.businessName, 160),
    documentId: str(c.documentId, 40),
    phone: str(c.phone, 50),
    email: str(c.email, 160),
    address: str(c.address, 300),
    city: str(c.city, 120),
    province: str(c.province, 120),
    notes: str(c.notes, 1000)
  };
  const invoiceType: 'A' | 'B' = body.invoiceType === 'A' ? 'A' : 'B';
  const shippingMethod = str(body.shippingMethod, 40) as ShippingMethod;
  const paymentMethod = str(body.paymentMethod, 40) as CheckoutPaymentMethod;

  const rawItems: unknown[] = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  const items: RequestedItem[] = rawItems
    .map((i) => {
      const it = (i || {}) as Record<string, unknown>;
      return {
        productId: str(it.productId, 128),
        size: str(it.size, 20) || 'Único',
        quantity: Math.floor(Number(it.quantity))
      };
    })
    .filter((i) => /^[a-zA-Z0-9_-]{1,128}$/.test(i.productId) && i.quantity >= 1 && i.quantity <= 999);

  if (!customer.name || customer.phone.replace(/\D/g, '').length < 6) {
    return res.status(400).json({ error: 'Completá tu nombre y un teléfono válido.' });
  }
  if (shippingMethod !== 'retiro_deposito' && (!customer.address || !customer.city)) {
    return res.status(400).json({ error: 'Completá la dirección y la ciudad de entrega.' });
  }
  if (invoiceType === 'A' && customer.documentId.replace(/\D/g, '').length !== 11) {
    return res.status(400).json({ error: 'Para Factura A ingresá un CUIT válido (11 números).' });
  }
  if (items.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío.' });
  }

  let db: ReturnType<typeof adminDb>;
  try {
    db = adminDb();
  } catch (e) {
    console.error(e);
    return res.status(503).json({ error: 'La tienda todavía no está configurada para recibir pedidos.' });
  }

  const orderId = `ord-${db.collection('orders').doc().id}`;
  const orderRef = db.collection('orders').doc(orderId);
  const publicToken = randomBytes(16).toString('hex');

  let order: Record<string, unknown>;
  let settings: ServerSettings = {};
  try {
    order = await db.runTransaction(async (tx) => {
      // 1) Lecturas (Firestore exige leer todo antes de escribir dentro de la transacción).
      const settingsSnap = await tx.get(db.doc('settings/company'));
      settings = (settingsSnap.exists ? settingsSnap.data() : {}) as ServerSettings;

      const allowedPayments = paymentMethodsFor(settings).filter((m) => m !== 'mercadopago' || !!mpToken());
      if (!allowedPayments.includes(paymentMethod)) {
        throw new UserError('El medio de pago elegido no está disponible.');
      }

      const productIds = [...new Set(items.map((i) => i.productId))];
      const productRefs: DocumentReference[] = productIds.map((id) => db.collection('products').doc(id));
      const productSnaps = await tx.getAll(...productRefs);
      const products = new Map(productSnaps.map((s) => [s.id, s]));

      const counterRef = db.doc('counters/orders');
      const counterSnap = await tx.get(counterRef);

      // 2) Cálculo de precios con los datos de la base.
      const qtyByProduct = new Map<string, number>();
      for (const it of items) qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) || 0) + it.quantity);

      const orderItems: StoredOrderItem[] = items.map((it) => {
        const snap = products.get(it.productId);
        if (!snap || !snap.exists) throw new UserError('Una de las prendas ya no está disponible. Revisá tu carrito.');
        const p = snap.data() as Record<string, any>;
        const sizes: string[] = Array.isArray(p.sizes) ? p.sizes : [];
        if (sizes.length > 0 && !sizes.includes(it.size)) {
          throw new UserError(`El talle ${it.size} de "${p.name}" no está disponible.`);
        }
        // Precio por cantidad: cuenta todas las unidades de esa prenda (todos los talles).
        const unit = unitPriceFor(
          { priceUnit: Number(p.priceUnit) || 0, priceTiers: p.priceTiers || {} },
          qtyByProduct.get(it.productId) || it.quantity,
          !!settings.wholesaleEnabled
        );
        return {
          product: { id: snap.id, name: String(p.name), sku: String(p.sku || ''), category: String(p.category || '') },
          quantity: it.quantity,
          selectedSize: it.size,
          unitPriceApplied: unit,
          totalPrice: unit * it.quantity
        };
      });

      for (const [id, wanted] of qtyByProduct) {
        const p = products.get(id)!.data() as Record<string, any>;
        const stock = Number(p.stock) || 0;
        if (wanted > stock) {
          throw new UserError(stock > 0 ? `De "${p.name}" quedan ${stock} unidades.` : `"${p.name}" está agotada.`);
        }
      }

      const subtotal = orderItems.reduce((s, i) => s + i.totalPrice, 0);
      if (settings.minimumOrder && subtotal < settings.minimumOrder) {
        throw new UserError('Tu compra no llega al mínimo de la tienda.');
      }
      const shipping = shippingOptionsFor(settings, subtotal, settings.pickupAddress).find((o) => o.id === shippingMethod);
      if (!shipping) throw new UserError('La forma de entrega elegida no está disponible.');
      const effectiveInvoice: 'A' | 'B' = settings.invoiceAEnabled ? invoiceType : 'B';
      const taxAmount = taxFor(effectiveInvoice, subtotal);
      const total = subtotal + shipping.cost + taxAmount;
      const next = ((counterSnap.exists ? Number(counterSnap.data()?.next) : 0) || 0) + 1;
      const orderNumber = formatOrderNumber(settings.orderPrefix, next);

      const newOrder: Record<string, unknown> = {
        id: orderId,
        orderNumber,
        customerName: customer.name,
        phone: customer.phone,
        shippingAddress:
          shippingMethod === 'retiro_deposito' ? customer.address || 'Retiro en el local' : customer.address,
        city: customer.city || '-',
        province: customer.province || '-',
        shippingMethod,
        shippingCost: shipping.cost,
        paymentMethod,
        invoiceType: effectiveInvoice,
        items: orderItems,
        subtotal,
        discount: 0,
        taxAmount,
        total,
        status: 'pending_payment',
        createdAt: nowAr(),
        createdAtIso: new Date().toISOString(),
        publicToken
      };
      if (customer.businessName) newOrder.businessName = customer.businessName;
      if (customer.documentId) newOrder.documentId = customer.documentId;
      if (customer.email) newOrder.email = customer.email;
      if (customer.notes) newOrder.notes = customer.notes;

      // 3) Escrituras.
      tx.set(counterRef, { next }, { merge: true });
      for (const [id, wanted] of qtyByProduct) {
        tx.update(db.collection('products').doc(id), { stock: FieldValue.increment(-wanted) });
      }
      tx.set(orderRef, newOrder);

      // Aviso en el panel + oportunidad en el embudo de ventas.
      const notifId = `notif-${Date.now()}-${orderId.slice(-6)}`;
      tx.set(db.collection('notifications').doc(notifId), {
        id: notifId,
        type: 'new_order',
        title: `Nuevo pedido #${orderNumber}`,
        message: `${customer.name} hizo un pedido por $${total.toLocaleString('es-AR')}.`,
        createdAt: nowAr(),
        isRead: false,
        priority: 'high',
        entityId: orderId,
        entityType: 'order',
        metadata: {
          orderNumber,
          total,
          clientName: customer.businessName || customer.name,
          phone: customer.phone
        }
      });
      const today = new Date().toISOString().split('T')[0];
      tx.set(db.collection('deals').doc(`deal-${orderId}`), {
        id: `deal-${orderId}`,
        customerName: customer.name,
        businessName: customer.businessName || 'Cliente tienda online',
        phone: customer.phone,
        ...(customer.email ? { email: customer.email } : {}),
        city: [customer.city, customer.province].filter(Boolean).join(', ').slice(0, 120),
        stage: 'payment_pending',
        items: orderItems.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
          unitPrice: i.unitPriceApplied,
          selectedSize: i.selectedSize
        })),
        totalAmount: total,
        notes: `Pedido web ${orderNumber}. Pago: ${paymentMethod}.`,
        createdAt: today,
        updatedAt: today
      });

      return newOrder;
    });
  } catch (e) {
    if (e instanceof UserError) return res.status(409).json({ error: e.message });
    console.error('Error creando pedido', e);
    return res.status(500).json({ error: 'No pudimos registrar el pedido. Probá de nuevo en unos minutos.' });
  }

  let paymentUrl: string | null = null;
  if (paymentMethod === 'mercadopago') {
    const base = siteUrl(req);
    const returnUrl = `${base}/?pedido=${encodeURIComponent(orderId)}&t=${publicToken}`;
    const mpItems: MpPreferenceItem[] = (order.items as StoredOrderItem[]).map((i) => ({
      id: i.product.id,
      title: `${i.product.name} (Talle ${i.selectedSize})`.slice(0, 250),
      quantity: i.quantity,
      unit_price: i.unitPriceApplied,
      currency_id: 'ARS'
    }));
    if (Number(order.shippingCost) > 0) {
      mpItems.push({ id: 'envio', title: 'Envío', quantity: 1, unit_price: Number(order.shippingCost), currency_id: 'ARS' });
    }
    if (Number(order.taxAmount) > 0) {
      mpItems.push({ id: 'iva', title: 'IVA (Factura A)', quantity: 1, unit_price: Number(order.taxAmount), currency_id: 'ARS' });
    }
    try {
      const pref = await createPreference({
        items: mpItems,
        external_reference: orderId,
        payer: { name: customer.name, ...(customer.email ? { email: customer.email } : {}) },
        back_urls: { success: returnUrl, pending: returnUrl, failure: returnUrl },
        auto_return: 'approved',
        notification_url: `${base}/api/mp-webhook`,
        statement_descriptor: (settings.companyName || 'TIENDA').slice(0, 22),
        metadata: { order_id: orderId, order_number: order.orderNumber }
      });
      paymentUrl = pref.init_point;
    } catch (e) {
      console.error('Mercado Pago', e);
      // Devolvemos el stock y anulamos el pedido para no dejar prendas reservadas.
      await db
        .runTransaction(async (tx) => {
          const snap = await tx.get(orderRef);
          if (!snap.exists || snap.data()?.stockRestored) return;
          for (const it of (snap.data()?.items || []) as StoredOrderItem[]) {
            tx.update(db.collection('products').doc(it.product.id), { stock: FieldValue.increment(it.quantity) });
          }
          tx.update(orderRef, {
            status: 'cancelled',
            stockRestored: true,
            notes: 'No se pudo generar el pago en Mercado Pago.'
          });
        })
        .catch((err) => console.error('No se pudo revertir el pedido', err));
      return res
        .status(502)
        .json({ error: 'No pudimos conectar con Mercado Pago. Probá de nuevo o elegí otro medio de pago.' });
    }
  }

  const { publicToken: _omit, ...publicOrder } = order;
  void _omit;
  return res.status(201).json({ order: publicOrder, token: publicToken, paymentUrl });
}
