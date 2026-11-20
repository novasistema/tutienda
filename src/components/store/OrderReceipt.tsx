import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { Order } from '../../types';
import { CheckCircle2, Clock, MessageCircle, Printer, Receipt, XCircle } from 'lucide-react';

/** Comprobante del pedido para el comprador (después de confirmar o al volver de Mercado Pago). */
export const OrderReceipt: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const { companySettings } = useStore();
  const brandName = companySettings?.companyName || 'la tienda';

  const isPaid = order.status !== 'pending_payment' && order.status !== 'cancelled';
  const mpRejected =
    order.paymentMethod === 'mercadopago' &&
    order.status === 'pending_payment' &&
    ['rejected', 'cancelled'].includes(order.paymentDetails?.mpStatus || '');

  const statusText = (() => {
    if (order.status === 'cancelled') return 'Este pedido fue cancelado.';
    if (isPaid) return 'Tu pago está acreditado. Ya estamos preparando tus prendas.';
    if (mpRejected) return 'Mercado Pago rechazó el pago. Escribinos por WhatsApp y te ayudamos a completarlo.';
    if (order.paymentMethod === 'mercadopago')
      return 'Estamos esperando la confirmación de Mercado Pago. Puede tardar unos minutos.';
    if (order.paymentMethod === 'transferencia')
      return 'Reservamos tus prendas. Hacé la transferencia y mandanos el comprobante por WhatsApp.';
    return 'Reservamos tus prendas. Te contactamos por WhatsApp para coordinar.';
  })();

  const itemsLine = order.items
    .map((i) => `${i.quantity}x ${i.product.name} (Talle ${i.selectedSize || 'Único'})`)
    .join(', ');
  const waText = `¡Hola ${brandName}! Hice el pedido *#${order.orderNumber}* por *${formatCurrency(order.total)}* a nombre de *${order.customerName}*.\nPrendas: ${itemsLine}.`;
  const waLink = companySettings.phone ? generateWhatsAppLink(companySettings.phone, waText) : null;

  const StatusIcon = order.status === 'cancelled' || mpRejected ? XCircle : isPaid ? CheckCircle2 : Clock;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-[#EFECE6] text-[var(--brand-accent)] mx-auto flex items-center justify-center">
          <StatusIcon className="w-8 h-8" />
        </div>
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--brand-accent)] font-semibold">
          Pedido #{order.orderNumber}
        </p>
        <h2 className="text-2xl font-serif font-semibold text-[#141413]">¡Gracias, {order.customerName}!</h2>
        <p className="text-xs text-[#5C5852] max-w-md mx-auto">{statusText}</p>
      </div>

      <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-4 sm:p-5 space-y-3 text-xs">
        <div className="space-y-1.5">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex justify-between gap-3 text-[#141413]">
              <span>
                {i.quantity}x {i.product.name} · Talle {i.selectedSize || 'Único'}
              </span>
              <span className="font-mono tabular-nums font-semibold">{formatCurrency(i.totalPrice, false)}</span>
            </div>
          ))}
          {order.shippingCost > 0 && (
            <div className="flex justify-between text-[#5C5852]">
              <span>Envío</span>
              <span className="font-mono tabular-nums">{formatCurrency(order.shippingCost, false)}</span>
            </div>
          )}
          {order.taxAmount > 0 && (
            <div className="flex justify-between text-[#5C5852]">
              <span>IVA</span>
              <span className="font-mono tabular-nums">{formatCurrency(order.taxAmount, false)}</span>
            </div>
          )}
        </div>
        <div className="border-t border-[#E4E1DA] pt-2.5 flex justify-between items-baseline">
          <strong className="text-[#141413] uppercase tracking-wider text-[11px]">Total:</strong>
          <strong className="text-lg font-bold font-mono text-[#141413] tabular-nums">{formatCurrency(order.total)}</strong>
        </div>
      </div>

      {order.paymentMethod === 'transferencia' && order.status === 'pending_payment' && (
        <div className="bg-[#EFECE6] border border-[#DEDAD0] p-4 text-xs space-y-2">
          <div className="font-semibold text-[#141413] flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-[var(--brand-accent)]" />
            <span>Datos para transferir {formatCurrency(order.total, false)}:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-[#4E4B46]">
            {companySettings.bankName && (
              <p>
                Banco: <strong className="text-[#141413]">{companySettings.bankName}</strong>
              </p>
            )}
            {companySettings.accountHolder && (
              <p>
                Titular: <strong className="text-[#141413]">{companySettings.accountHolder}</strong>
              </p>
            )}
            {companySettings.alias && (
              <p>
                Alias: <strong className="font-mono text-[#141413]">{companySettings.alias}</strong>
              </p>
            )}
            {companySettings.cbu && (
              <p>
                CBU/CVU: <strong className="font-mono text-[#141413] break-all">{companySettings.cbu}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-dark)] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{order.paymentMethod === 'transferencia' ? 'Enviar comprobante por WhatsApp' : 'Escribirnos por WhatsApp'}</span>
          </a>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="py-2.5 px-4 bg-[#EFECE6] hover:bg-[#E4E1DA] text-[#141413] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir comprobante</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Seguir comprando
          </button>
        </div>
      </div>
    </div>
  );
};
