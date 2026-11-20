import React, { useEffect, useState } from 'react';
import { Order } from '../../types';
import { OrderReceipt } from './OrderReceipt';
import { Loader2, X } from 'lucide-react';

/**
 * Se muestra cuando el comprador vuelve de Mercado Pago (/?pedido=ID&t=TOKEN).
 * Consulta el estado real del pedido al servidor y lo vuelve a consultar unos segundos
 * mientras Mercado Pago confirma el pago.
 */
export const OrderReturnModal: React.FC = () => {
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const orderId = params.get('pedido');
  const token = params.get('t');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(!!orderId && !!token);

  useEffect(() => {
    if (!open || !orderId || !token) return;
    let cancelled = false;
    let attempts = 0;
    const load = async () => {
      try {
        const res = await fetch(`/api/order-status?id=${encodeURIComponent(orderId)}&t=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || 'No encontramos el pedido.');
        setOrder(data.order);
        attempts += 1;
        if (data.order.status === 'pending_payment' && data.order.paymentMethod === 'mercadopago' && attempts < 6) {
          setTimeout(load, 4000);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No encontramos el pedido.');
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, orderId, token]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    window.history.replaceState(null, '', '/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[var(--brand-primary)]/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full sm:max-w-2xl max-h-[94dvh] overflow-y-auto shadow-2xl border border-[#DEDAD0] relative">
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute top-3 right-3 p-2 text-[#6B6862] hover:text-[#141413] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-5 sm:p-8">
          {order ? (
            <OrderReceipt order={order} onClose={close} />
          ) : error ? (
            <p className="text-sm text-center text-[#5C5852] py-10">{error}</p>
          ) : (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#5C5852]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Consultando tu pedido...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
