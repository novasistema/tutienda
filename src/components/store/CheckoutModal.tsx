import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { Order } from '../../types';
import {
  X,
  CheckCircle2,
  User,
  CreditCard,
  Truck,
  MessageCircle,
  Printer,
  ArrowRight,
  Lock,
  Receipt,
  AlertCircle
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    cartTotal,
    isCheckoutOpen,
    setIsCheckoutOpen,
    placeOrder,
    setActiveTab,
    companySettings
  } = useStore();

  const brandName = companySettings?.companyName || 'TU TIENDA';

  const [form, setForm] = useState({
    customerName: '',
    businessName: '',
    documentId: '',
    phone: '',
    email: '',
    shippingAddress: '',
    city: '',
    province: 'Buenos Aires',
    shippingMethod: 'correo_argentino' as Order['shippingMethod'],
    paymentMethod: (companySettings?.cardPaymentsEnabled ? 'tarjeta_segura' : 'transferencia') as Order['paymentMethod'],
    invoiceType: 'B' as 'A' | 'B',
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    cardCvv: '',
    installments: '1',
    notes: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!isCheckoutOpen) return null;

  const getShippingCost = (method: Order['shippingMethod']) => {
    switch (method) {
      case 'transporte_expreso':
        return 7500;
      case 'correo_argentino':
        return 5900;
      case 'retiro_deposito':
        return 0;
    }
  };

  const currentShippingCost = getShippingCost(form.shippingMethod);
  const taxAmount = form.invoiceType === 'A' ? Math.round(cartTotal * 0.21) : 0;
  const grandTotal = cartTotal + currentShippingCost + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.customerName.trim() || !form.phone.trim() || !form.shippingAddress.trim() || !form.city.trim()) {
      setFormError('Completá los campos obligatorios: Nombre, Teléfono, Dirección y Ciudad.');
      return;
    }

    if (form.invoiceType === 'A' && !form.documentId.trim()) {
      setFormError('Para Factura A ingresá tu número de CUIT.');
      return;
    }

    if (form.paymentMethod === 'tarjeta_segura') {
      if (form.cardNumber.replace(/\s/g, '').length < 15 || !form.cardExpiry.trim() || !form.cardCvv.trim()) {
        setFormError('Completá los datos de la tarjeta correctamente.');
        return;
      }
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const newOrder = await placeOrder({
      customerName: form.customerName.trim(),
      businessName: form.businessName.trim() || 'Compra Particular',
      documentId: form.documentId.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      shippingAddress: form.shippingAddress.trim(),
      city: form.city.trim(),
      province: form.province.trim(),
      shippingMethod: form.shippingMethod,
      shippingCost: currentShippingCost,
      paymentMethod: form.paymentMethod,
      paymentDetails:
        form.paymentMethod === 'tarjeta_segura'
          ? {
              cardLast4: form.cardNumber.replace(/\s/g, '').slice(-4),
              cardBrand: 'Visa / Mastercard',
              transactionId: `TX-${Date.now().toString(36).toUpperCase()}`
            }
          : undefined,
      invoiceType: form.invoiceType,
      items: cart,
      subtotal: cartTotal,
      discount: 0,
      taxAmount,
      total: grandTotal,
      status: form.paymentMethod === 'tarjeta_segura' ? 'paid' : 'pending_payment',
      notes: form.notes.trim()
    });

    setIsProcessing(false);
    setConfirmedOrder(newOrder);
  };

  const getWhatsAppConfirmationLink = (order: Order) => {
    const itemsLine = order.items
      .map((i) => `${i.quantity}x ${i.product.name} (Talle ${i.selectedSize || 'Único'})`)
      .join(', ');
    const text = `¡Hola ${brandName}! Acabo de confirmar mi compra *#${order.orderNumber}* por *${formatCurrency(order.total)}* a nombre de *${order.customerName}*.\nPrendas: ${itemsLine}\nEnvío: ${order.shippingAddress}, ${order.city}.`;
    return generateWhatsAppLink(companySettings?.phone || '5491149821100', text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#141413]/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full sm:max-w-2xl max-h-[94dvh] overflow-y-auto shadow-2xl border border-[#DEDAD0]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#EFECE6] flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-[#141413] flex items-center gap-2">
              {confirmedOrder ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#364637]" />
                  <span>Pedido Confirmado</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#364637]" />
                  <span>Finalizar Compra · {brandName}</span>
                </>
              )}
            </h3>
            <p className="text-xs text-[#6B6862]">
              {confirmedOrder ? 'Comprobante de tu compra en Tienda de Ropa' : 'Completá tus datos de envío y forma de pago'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCheckoutOpen(false);
              setConfirmedOrder(null);
            }}
            className="p-2 text-[#6B6862] hover:text-[#141413] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          <div className="p-5 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-[#EFECE6] text-[#364637] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#364637] font-semibold">
                Orden #{confirmedOrder.orderNumber}
              </p>
              <h2 className="text-2xl font-serif font-semibold text-[#141413]">
                ¡Gracias por tu compra, {confirmedOrder.customerName}!
              </h2>
              <p className="text-xs text-[#5C5852] max-w-md mx-auto">
                {confirmedOrder.status === 'paid'
                  ? 'Tu pago fue acreditado y ya estamos preparando tus prendas.'
                  : 'Reservamos tus prendas. Enviá la transferencia para despachar tu pedido.'}
              </p>
            </div>

            <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-4 sm:p-5 space-y-3 text-xs">
              <div className="space-y-1.5">
                {confirmedOrder.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-[#141413]">
                    <span>
                      {i.quantity}x {i.product.name} · Talle {i.selectedSize || 'Único'}
                    </span>
                    <span className="font-mono tabular-nums font-semibold">
                      {formatCurrency(i.totalPrice, false)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E4E1DA] pt-2.5 flex justify-between items-baseline">
                <strong className="text-[#141413] uppercase tracking-wider text-[11px]">Total:</strong>
                <strong className="text-lg font-bold font-mono text-[#141413] tabular-nums">
                  {formatCurrency(confirmedOrder.total)}
                </strong>
              </div>
            </div>

            {confirmedOrder.paymentMethod === 'transferencia' && (
              <div className="bg-[#EFECE6] border border-[#DEDAD0] p-4 text-xs space-y-2">
                <div className="font-semibold text-[#141413] flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#364637]" />
                  <span>Datos Bancarios para Transferir:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-[#4E4B46]">
                  <p>Banco: <strong className="text-[#141413]">{companySettings?.bankName}</strong></p>
                  <p>Titular: <strong className="text-[#141413]">{companySettings?.accountHolder}</strong></p>
                  <p>Alias: <strong className="font-mono text-[#141413]">{companySettings?.alias}</strong></p>
                  <p>CBU: <strong className="font-mono text-[#141413]">{companySettings?.cbu}</strong></p>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <a
                href={getWhatsAppConfirmationLink(confirmedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-[#364637] hover:bg-[#283529] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Comprobante por WhatsApp</span>
              </a>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 px-4 bg-[#EFECE6] hover:bg-[#E4E1DA] text-[#141413] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Comprobante</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setConfirmedOrder(null);
                    setActiveTab('crm');
                  }}
                  className="py-2.5 px-4 bg-[#141413] hover:bg-[#364637] text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Ver Pedido en CRM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-7 space-y-6">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* 1. Datos */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#364637]" />
                  <span>1. Tus Datos</span>
                </h4>
                <div className="flex items-center gap-1 bg-[#EFECE6] p-1 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, invoiceType: 'B' })}
                    className={`px-2.5 py-1 cursor-pointer ${
                      form.invoiceType === 'B' ? 'bg-white text-[#141413]' : 'text-[#6B6862]'
                    }`}
                  >
                    Consumidor Final
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, invoiceType: 'A' })}
                    className={`px-2.5 py-1 cursor-pointer ${
                      form.invoiceType === 'A' ? 'bg-white text-[#141413]' : 'text-[#6B6862]'
                    }`}
                  >
                    Factura A
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#141413] mb-1">Nombre y Apellido *</label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="Ej. Sofía Martínez"
                    className="w-full text-xs p-2.5 border border-[#D8D4CB] focus:border-[#141413] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#141413] mb-1">WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+54 9 11 4000-0000"
                    className="w-full text-xs p-2.5 border border-[#D8D4CB] focus:border-[#141413] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#141413] mb-1">
                    {form.invoiceType === 'A' ? 'CUIT *' : 'DNI (Opcional)'}
                  </label>
                  <input
                    type="text"
                    required={form.invoiceType === 'A'}
                    value={form.documentId}
                    onChange={(e) => setForm({ ...form, documentId: e.target.value })}
                    placeholder="Ej. 35.442.190"
                    className="w-full text-xs p-2.5 border border-[#D8D4CB] focus:border-[#141413] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#141413] mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="sofia@mail.com"
                    className="w-full text-xs p-2.5 border border-[#D8D4CB] focus:border-[#141413] outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 2. Envío */}
            <div className="space-y-3 pt-4 border-t border-[#EFECE6]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#364637]" />
                <span>2. Entrega</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, shippingMethod: 'correo_argentino' })}
                  className={`p-3 border text-left cursor-pointer ${
                    form.shippingMethod === 'correo_argentino'
                      ? 'border-[#141413] bg-[#FAF9F6]'
                      : 'border-[#E4E1DA] bg-white'
                  }`}
                >
                  <div className="flex justify-between text-xs font-semibold text-[#141413]">
                    <span>Correo Argentino</span>
                    <span className="font-mono">$5.900</span>
                  </div>
                  <span className="text-[10px] text-[#6B6862]">A domicilio o sucursal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, shippingMethod: 'transporte_expreso' })}
                  className={`p-3 border text-left cursor-pointer ${
                    form.shippingMethod === 'transporte_expreso'
                      ? 'border-[#141413] bg-[#FAF9F6]'
                      : 'border-[#E4E1DA] bg-white'
                  }`}
                >
                  <div className="flex justify-between text-xs font-semibold text-[#141413]">
                    <span>Moto / Expreso</span>
                    <span className="font-mono">$7.500</span>
                  </div>
                  <span className="text-[10px] text-[#6B6862]">Entrega rápida 24hs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, shippingMethod: 'retiro_deposito' })}
                  className={`p-3 border text-left cursor-pointer ${
                    form.shippingMethod === 'retiro_deposito'
                      ? 'border-[#141413] bg-[#FAF9F6]'
                      : 'border-[#E4E1DA] bg-white'
                  }`}
                >
                  <div className="flex justify-between text-xs font-semibold text-[#141413]">
                    <span>Retiro en Local</span>
                    <span className="font-mono text-[#364637]">Gratis</span>
                  </div>
                  <span className="text-[10px] text-[#6B6862]">Showroom Palermo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#141413] mb-1">Dirección *</label>
                  <input
                    type="text"
                    required
                    value={form.shippingAddress}
                    onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                    placeholder="Calle, altura, piso/depto"
                    className="w-full text-xs p-2.5 border border-[#D8D4CB] focus:border-[#141413] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#141413] mb-1">Ciudad / Localidad *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Ej. CABA / Rosario"
                    className="w-full text-xs p-2.5 border border-[#D8D4CB] focus:border-[#141413] outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 3. Pago */}
            <div className="space-y-3 pt-4 border-t border-[#EFECE6]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#364637]" />
                <span>3. Forma de Pago</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: 'tarjeta_segura' })}
                  className={`p-3 border text-left cursor-pointer ${
                    form.paymentMethod === 'tarjeta_segura'
                      ? 'border-[#141413] bg-[#FAF9F6]'
                      : 'border-[#E4E1DA] bg-white'
                  }`}
                >
                  <strong className="block text-xs text-[#141413]">Tarjeta Crédito / Débito</strong>
                  <span className="text-[10px] text-[#6B6862]">Hasta 6 cuotas fijas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: 'transferencia' })}
                  className={`p-3 border text-left cursor-pointer ${
                    form.paymentMethod === 'transferencia'
                      ? 'border-[#141413] bg-[#FAF9F6]'
                      : 'border-[#E4E1DA] bg-white'
                  }`}
                >
                  <strong className="block text-xs text-[#141413]">Transferencia Bancaria</strong>
                  <span className="text-[10px] text-[#6B6862]">Alias: {companySettings?.alias}</span>
                </button>
              </div>

              {form.paymentMethod === 'tarjeta_segura' && (
                <div className="bg-[#FAF9F6] p-4 border border-[#E4E1DA] space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#6B6862] mb-1">Número de Tarjeta</label>
                    <input
                      type="text"
                      maxLength={19}
                      value={form.cardNumber}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                        const parts = [];
                        for (let i = 0; i < v.length; i += 4) parts.push(v.substring(i, i + 4));
                        setForm({ ...form, cardNumber: parts.join(' ') });
                      }}
                      placeholder="4500 0000 0000 0000"
                      className="w-full text-xs p-2.5 border border-[#D8D4CB] bg-white font-mono outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-[#6B6862] mb-1">Titular</label>
                      <input
                        type="text"
                        value={form.cardHolder}
                        onChange={(e) => setForm({ ...form, cardHolder: e.target.value.toUpperCase() })}
                        placeholder="NOMBRE EN TARJETA"
                        className="w-full text-xs p-2 border border-[#D8D4CB] bg-white uppercase outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#6B6862] mb-1">Vto.</label>
                      <input
                        type="text"
                        maxLength={5}
                        value={form.cardExpiry}
                        onChange={(e) => setForm({ ...form, cardExpiry: e.target.value })}
                        placeholder="12/28"
                        className="w-full text-xs p-2 border border-[#D8D4CB] bg-white font-mono text-center outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#6B6862] mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={form.cardCvv}
                        onChange={(e) => setForm({ ...form, cardCvv: e.target.value })}
                        placeholder="•••"
                        className="w-full text-xs p-2 border border-[#D8D4CB] bg-white font-mono text-center outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#6B6862] mb-1">Cuotas</label>
                      <select
                        value={form.installments}
                        onChange={(e) => setForm({ ...form, installments: e.target.value })}
                        className="w-full text-xs p-2 border border-[#D8D4CB] bg-white outline-hidden"
                      >
                        <option value="1">1 pago</option>
                        <option value="3">3 cuotas</option>
                        <option value="6">6 cuotas</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                <strong className="uppercase tracking-wider text-[11px] text-[#141413]">Total Final</strong>
                <strong className="text-lg font-bold font-mono text-[#141413] tabular-nums">
                  {formatCurrency(grandTotal)}
                </strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 px-6 bg-[#141413] hover:bg-[#364637] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {isProcessing
                  ? 'Confirmando Pedido...'
                  : `Confirmar Compra (${formatCurrency(grandTotal, false)})`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
