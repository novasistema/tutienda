import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/formatters';
import { Order } from '../../types';
import { DEMO_MODE } from '../../config';
import {
  paymentMethodsFor,
  shippingOptionsFor,
  taxFor,
  type CheckoutPaymentMethod,
  type ShippingMethod
} from '../../../shared/commerce';
import { OrderReceipt } from './OrderReceipt';
import { trackEvent } from '../../utils/analytics';
import { X, CheckCircle2, User, CreditCard, Truck, Lock, AlertCircle, Info } from 'lucide-react';

const PROVINCES = [
  'CABA',
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán'
];

const PAYMENT_LABELS: Record<CheckoutPaymentMethod, { title: string; hint: string }> = {
  mercadopago: { title: 'Mercado Pago', hint: 'Tarjeta de crédito, débito o dinero en cuenta' },
  transferencia: { title: 'Transferencia bancaria', hint: 'Te mostramos los datos al confirmar' },
  efectivo_deposito: { title: 'Efectivo al retirar', hint: 'Pagás en el local' }
};

export const CheckoutModal: React.FC = () => {
  const { cart, cartTotal, isCheckoutOpen, setIsCheckoutOpen, placeOrder, companySettings } = useStore();

  const brandName = companySettings?.companyName || 'la tienda';
  const shippingOptions = useMemo(
    () => shippingOptionsFor(companySettings, cartTotal, companySettings.pickupAddress),
    [companySettings, cartTotal]
  );
  const paymentOptions = useMemo(() => paymentMethodsFor(companySettings), [companySettings]);

  const [form, setForm] = useState({
    customerName: '',
    businessName: '',
    documentId: '',
    phone: '',
    email: '',
    shippingAddress: '',
    city: '',
    province: 'Buenos Aires',
    shippingMethod: (shippingOptions[0]?.id || 'correo_argentino') as ShippingMethod,
    paymentMethod: (paymentOptions[0] || 'transferencia') as CheckoutPaymentMethod,
    invoiceType: 'B' as 'A' | 'B',
    notes: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Si la configuración cambia (o se elige retiro), se ajustan las opciones disponibles.
  useEffect(() => {
    setForm((f) => {
      let next = f;
      if (!shippingOptions.some((o) => o.id === f.shippingMethod) && shippingOptions[0]) {
        next = { ...next, shippingMethod: shippingOptions[0].id };
      }
      const allowedPayments = paymentOptions.filter(
        (m) => m !== 'efectivo_deposito' || next.shippingMethod === 'retiro_deposito'
      );
      if (!allowedPayments.includes(next.paymentMethod) && allowedPayments[0]) {
        next = { ...next, paymentMethod: allowedPayments[0] };
      }
      return next;
    });
  }, [shippingOptions, paymentOptions, form.shippingMethod]);

  if (!isCheckoutOpen) return null;

  const visiblePayments = paymentOptions.filter(
    (m) => m !== 'efectivo_deposito' || form.shippingMethod === 'retiro_deposito'
  );
  const isPickup = form.shippingMethod === 'retiro_deposito';
  const currentShippingCost = shippingOptions.find((o) => o.id === form.shippingMethod)?.cost || 0;
  const effectiveInvoice = companySettings.invoiceAEnabled ? form.invoiceType : 'B';
  const taxAmount = taxFor(effectiveInvoice, cartTotal);
  const grandTotal = cartTotal + currentShippingCost + taxAmount;
  const minimum = companySettings.minimumOrder || 0;

  const close = () => {
    setIsCheckoutOpen(false);
    setConfirmedOrder(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.customerName.trim() || !form.phone.trim()) {
      setFormError('Completá tu nombre y tu WhatsApp.');
      return;
    }
    if (!isPickup && (!form.shippingAddress.trim() || !form.city.trim())) {
      setFormError('Completá la dirección y la ciudad de entrega.');
      return;
    }
    if (effectiveInvoice === 'A' && form.documentId.replace(/\D/g, '').length !== 11) {
      setFormError('Para Factura A ingresá un CUIT válido (11 números).');
      return;
    }
    if (visiblePayments.length === 0 || shippingOptions.length === 0) {
      setFormError('La tienda todavía no configuró sus medios de pago o de entrega. Escribinos por WhatsApp.');
      return;
    }
    if (minimum > 0 && cartTotal < minimum) {
      setFormError(`La compra mínima es de ${formatCurrency(minimum, false)}.`);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await placeOrder({
        customer: {
          name: form.customerName.trim(),
          businessName: form.businessName.trim(),
          documentId: form.documentId.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.shippingAddress.trim(),
          city: form.city.trim(),
          province: form.province,
          notes: form.notes.trim()
        },
        invoiceType: effectiveInvoice,
        shippingMethod: form.shippingMethod,
        paymentMethod: form.paymentMethod
      });
      trackEvent(result.paymentUrl ? 'begin_checkout' : 'purchase', result.order.total);
      if (result.paymentUrl) {
        // Mercado Pago: el comprador paga en la página segura de Mercado Pago y vuelve a la tienda.
        window.location.href = result.paymentUrl;
        return;
      }
      setConfirmedOrder(result.order);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No pudimos registrar el pedido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const optionClass = (selected: boolean) =>
    `p-3 border text-left cursor-pointer ${selected ? 'border-[var(--brand-primary)] bg-[#FAF9F6]' : 'border-[#E4E1DA] bg-white'}`;
  const inputClass = 'w-full text-xs p-2.5 border border-[#D8D4CB] focus:border-[var(--brand-primary)] outline-hidden';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[var(--brand-primary)]/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full sm:max-w-2xl max-h-[94dvh] overflow-y-auto shadow-2xl border border-[#DEDAD0]">
        <div className="p-4 sm:p-6 border-b border-[#EFECE6] flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-[#141413] flex items-center gap-2">
              {confirmedOrder ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[var(--brand-accent)]" />
                  <span>Pedido registrado</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[var(--brand-accent)]" />
                  <span>Finalizar compra</span>
                </>
              )}
            </h3>
            <p className="text-xs text-[#6B6862]">
              {confirmedOrder ? `Comprobante de tu compra en ${brandName}` : 'Completá tus datos de entrega y forma de pago'}
            </p>
          </div>
          <button type="button" onClick={close} aria-label="Cerrar" className="p-2 text-[#6B6862] hover:text-[#141413] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          <div className="p-5 sm:p-8">
            <OrderReceipt order={confirmedOrder} onClose={close} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-7 space-y-6">
            {DEMO_MODE && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Esta es una tienda de demostración: el pedido se simula y no se cobra nada.</span>
              </div>
            )}
            {formError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* 1. Datos */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413] flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--brand-accent)]" />
                  <span>1. Tus datos</span>
                </h4>
                {companySettings.invoiceAEnabled && (
                  <div className="flex items-center gap-1 bg-[#EFECE6] p-1 text-[11px] font-semibold">
                    {(['B', 'A'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, invoiceType: t })}
                        className={`px-2.5 py-1 cursor-pointer ${form.invoiceType === t ? 'bg-white text-[#141413]' : 'text-[#6B6862]'}`}
                      >
                        {t === 'B' ? 'Consumidor final' : 'Factura A'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[11px] font-medium text-[#141413] mb-1">Nombre y apellido *</span>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="Ej. Sofía Martínez"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="block text-[11px] font-medium text-[#141413] mb-1">WhatsApp *</span>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+54 9 11 4000-0000"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="block text-[11px] font-medium text-[#141413] mb-1">
                    {effectiveInvoice === 'A' ? 'CUIT *' : 'DNI (opcional)'}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required={effectiveInvoice === 'A'}
                    value={form.documentId}
                    onChange={(e) => setForm({ ...form, documentId: e.target.value })}
                    placeholder={effectiveInvoice === 'A' ? '30-12345678-9' : 'Ej. 35442190'}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="block text-[11px] font-medium text-[#141413] mb-1">Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="sofia@mail.com"
                    className={inputClass}
                  />
                </label>
                {effectiveInvoice === 'A' && (
                  <label className="block sm:col-span-2">
                    <span className="block text-[11px] font-medium text-[#141413] mb-1">Razón social</span>
                    <input
                      type="text"
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 2. Entrega */}
            <div className="space-y-3 pt-4 border-t border-[#EFECE6]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[var(--brand-accent)]" />
                <span>2. Entrega</span>
              </h4>

              {shippingOptions.length === 0 ? (
                <p className="text-xs text-[#6B6862]">La tienda todavía no configuró las formas de entrega.</p>
              ) : (
                <div className={`grid grid-cols-1 gap-2.5 ${shippingOptions.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  {shippingOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForm({ ...form, shippingMethod: opt.id })}
                      className={optionClass(form.shippingMethod === opt.id)}
                    >
                      <div className="flex justify-between gap-2 text-xs font-semibold text-[#141413]">
                        <span>{opt.label}</span>
                        <span className={`font-mono ${opt.cost === 0 ? 'text-[var(--brand-accent)]' : ''}`}>
                          {opt.cost === 0 ? 'Gratis' : formatCurrency(opt.cost, false)}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#6B6862]">{opt.description}</span>
                    </button>
                  ))}
                </div>
              )}
              {!!companySettings.freeShippingFrom && cartTotal < companySettings.freeShippingFrom && (
                <p className="text-[11px] text-[var(--brand-accent)]">
                  Envío gratis comprando desde {formatCurrency(companySettings.freeShippingFrom, false)}.
                </p>
              )}

              {!isPickup && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block sm:col-span-3">
                    <span className="block text-[11px] font-medium text-[#141413] mb-1">Dirección *</span>
                    <input
                      type="text"
                      required
                      autoComplete="street-address"
                      value={form.shippingAddress}
                      onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                      placeholder="Calle, altura, piso/depto"
                      className={inputClass}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="block text-[11px] font-medium text-[#141413] mb-1">Ciudad / Localidad *</span>
                    <input
                      type="text"
                      required
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Ej. Rosario"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="block text-[11px] font-medium text-[#141413] mb-1">Provincia *</span>
                    <select
                      value={form.province}
                      onChange={(e) => setForm({ ...form, province: e.target.value })}
                      className={`${inputClass} bg-white`}
                    >
                      {PROVINCES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>

            {/* 3. Pago */}
            <div className="space-y-3 pt-4 border-t border-[#EFECE6]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--brand-accent)]" />
                <span>3. Forma de pago</span>
              </h4>

              {visiblePayments.length === 0 ? (
                <p className="text-xs text-[#6B6862]">
                  La tienda todavía no configuró sus medios de pago. Escribinos por WhatsApp para coordinar.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {visiblePayments.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, paymentMethod: m })}
                      className={optionClass(form.paymentMethod === m)}
                    >
                      <strong className="block text-xs text-[#141413]">{PAYMENT_LABELS[m].title}</strong>
                      <span className="text-[10px] text-[#6B6862]">{PAYMENT_LABELS[m].hint}</span>
                    </button>
                  ))}
                </div>
              )}
              {form.paymentMethod === 'mercadopago' && (
                <p className="text-[11px] text-[#6B6862]">
                  Al confirmar te llevamos a Mercado Pago para pagar de forma segura. Nunca te pedimos los datos de tu
                  tarjeta en esta página.
                </p>
              )}
            </div>

            <label className="block">
              <span className="block text-[11px] font-medium text-[#141413] mb-1">Aclaraciones (opcional)</span>
              <textarea
                rows={2}
                value={form.notes}
                maxLength={1000}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Horario de entrega, cambios de talle, etc."
                className={inputClass}
              />
            </label>

            {/* Total */}
            <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#5C5852]">
                <span>Prendas ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                <span className="font-mono tabular-nums">{formatCurrency(cartTotal, false)}</span>
              </div>
              <div className="flex justify-between text-[#5C5852]">
                <span>Envío</span>
                <span className="font-mono tabular-nums">{formatCurrency(currentShippingCost, false)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-[#5C5852]">
                  <span>IVA (21%)</span>
                  <span className="font-mono tabular-nums">{formatCurrency(taxAmount, false)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-[#E4E1DA]">
                <strong className="uppercase tracking-wider text-[11px] text-[#141413]">Total</strong>
                <strong className="text-lg font-bold font-mono text-[#141413] tabular-nums">{formatCurrency(grandTotal)}</strong>
              </div>
            </div>

            <p className="text-[10px] text-[#6B6862]">
              Al confirmar aceptás los{' '}
              <a href="/terminos" target="_blank" className="underline">
                términos y condiciones
              </a>{' '}
              y la{' '}
              <a href="/privacidad" target="_blank" className="underline">
                política de privacidad
              </a>
              .
            </p>

            <button
              type="submit"
              disabled={isProcessing || cart.length === 0}
              className="w-full py-3.5 px-6 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {isProcessing
                  ? 'Registrando pedido...'
                  : form.paymentMethod === 'mercadopago'
                    ? `Ir a pagar (${formatCurrency(grandTotal, false)})`
                    : `Confirmar compra (${formatCurrency(grandTotal, false)})`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
