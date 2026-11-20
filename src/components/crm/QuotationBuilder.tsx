import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, calculateUnitPrice, generateWhatsAppLink } from '../../utils/formatters';
import { Product } from '../../types';
import {
  Plus,
  Trash2,
  Printer,
  MessageCircle,
  Save,
  CheckCircle2,
  User,
  Percent,
  AlertCircle
} from 'lucide-react';

interface QuoteItem {
  product: Product;
  selectedSize: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const QuotationBuilder: React.FC = () => {
  const { products, clients, addDeal, companySettings } = useStore();
  const brandName = companySettings?.companyName || 'TU TIENDA';

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedSize, setSelectedSize] = useState<string>(products[0]?.sizes?.[0] || 'M');
  const [itemQuantity, setItemQuantity] = useState<number>(2);
  const [additionalDiscountPercent, setAdditionalDiscountPercent] = useState<number>(0);
  const [quoteSavedNotification, setQuoteSavedNotification] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  useEffect(() => {
    if (currentProduct) {
      setSelectedSize(currentProduct.sizes?.[0] || 'Único');
    }
  }, [selectedProductId, currentProduct]);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setCustomerName(client.name);
      setBusinessName(client.businessName);
      setPhone(client.phone);
      setCity(`${client.city}, ${client.province}`);
    }
  };

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const unitPrice = calculateUnitPrice(prod, itemQuantity);
    const total = unitPrice * itemQuantity;
    const sizeKey = selectedSize || 'Único';

    setQuoteError('');
    setQuoteItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === prod.id && item.selectedSize === sizeKey
      );
      if (existing) {
        const newQty = existing.quantity + itemQuantity;
        const newUnitPrice = calculateUnitPrice(prod, newQty);
        return prev.map((item) =>
          item.product.id === prod.id && item.selectedSize === sizeKey
            ? { ...item, quantity: newQty, unitPrice: newUnitPrice, total: newUnitPrice * newQty }
            : item
        );
      }
      return [...prev, { product: prod, selectedSize: sizeKey, quantity: itemQuantity, unitPrice, total }];
    });
  };

  const handleRemoveItem = (productId: string, size: string) => {
    setQuoteItems((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.selectedSize === size))
    );
  };

  const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * additionalDiscountPercent) / 100;
  const finalTotal = subtotal - discountAmount;

  const getWhatsAppPitch = () => {
    let msg = `Hola ${customerName || 'hola'}, te compartimos el presupuesto de *${brandName} · Tienda de Ropa*:\n\n`;
    quoteItems.forEach((item, idx) => {
      msg += `• ${idx + 1}. *${item.product.name}* (Talle ${item.selectedSize})\n`;
      msg += `  ${item.quantity} u. x ${formatCurrency(item.unitPrice, false)} = ${formatCurrency(item.total)}\n`;
    });
    msg += `\nSubtotal: ${formatCurrency(subtotal)}\n`;
    if (additionalDiscountPercent > 0) {
      msg += `Bonificación (${additionalDiscountPercent}%): -${formatCurrency(discountAmount)}\n`;
    }
    msg += `*TOTAL: ${formatCurrency(finalTotal)}*\n\n¿Confirmamos la reserva de los talles?`;
    return msg;
  };

  const handleSaveToPipeline = () => {
    if (!customerName.trim() || quoteItems.length === 0) {
      setQuoteError('Completá el nombre del cliente y agregá al menos una prenda al presupuesto.');
      return;
    }
    setQuoteError('');

    addDeal({
      customerName: customerName.trim(),
      businessName: businessName.trim() || 'Presupuesto Web',
      phone: phone || '+54 9 11 0000-0000',
      city: city || 'Argentina',
      stage: 'quoted',
      items: quoteItems.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        selectedSize: i.selectedSize,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      })),
      totalAmount: finalTotal,
      notes: `Presupuesto de ${quoteItems.length} prendas por ${formatCurrency(finalTotal)}.`
    });

    setQuoteSavedNotification(true);
    setTimeout(() => setQuoteSavedNotification(false), 4000);
  };

  const waUrl = generateWhatsAppLink(phone || '5491158002244', getWhatsAppPitch());

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#141413] font-serif">
            Armador de Presupuestos & Lookbooks
          </h3>
          <p className="text-xs text-[#6B675E]">
            Armá presupuestos personalizados por prenda y talle para enviar por WhatsApp o imprimir.
          </p>
        </div>

        {quoteSavedNotification && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Presupuesto guardado en seguimiento CRM</span>
          </div>
        )}
      </div>

      {quoteError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{quoteError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-5 space-y-4 no-print">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2DFD7] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#364637]" />
              <span>Cliente</span>
            </h4>

            <div>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden bg-white"
              >
                <option value="">-- Nuevo cliente --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">Nombre *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Lucía Pereyra"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[#364637]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 ..."
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[#364637]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">Ciudad</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej. CABA"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[#364637]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">Etiqueta / Showroom</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej. Particular"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[#364637]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2DFD7] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413] flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#364637]" />
              <span>Agregar Prenda</span>
            </h4>

            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.priceUnit, false)}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#6B675E] mb-1">Talle</label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden bg-white font-mono font-bold"
                >
                  {(currentProduct?.sizes && currentProduct.sizes.length > 0
                    ? currentProduct.sizes
                    : ['Único']
                  ).map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#6B675E] mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden font-bold font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2.5 px-3 bg-[#141413] hover:bg-[#364637] text-[#F8F7F4] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Insertar Prenda</span>
            </button>

            <div className="pt-2 border-t border-[#E2DFD7]">
              <div className="flex items-center justify-between text-[11px] text-[#6B675E] mb-1">
                <span className="font-semibold flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-[#364637]" />
                  <span>Bonificación especial:</span>
                </span>
                <span className="font-mono font-bold text-[#141413]">{additionalDiscountPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={additionalDiscountPercent}
                onChange={(e) => setAdditionalDiscountPercent(parseInt(e.target.value))}
                className="w-full accent-[#364637] cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleSaveToPipeline}
              className="w-full py-3 px-4 bg-[#141413] hover:bg-[#364637] text-[#F8F7F4] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar en CRM</span>
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </a>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 px-4 bg-white hover:bg-[#EFECE6] text-[#141413] rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border border-[#D4D0C7] transition-colors"
            >
              <Printer className="w-4 h-4 text-[#6B675E]" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Right: Printable Proforma */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2DFD7] p-5 sm:p-8">
          <div className="border-b border-[#E2DFD7] pb-5 mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-2xl font-bold tracking-tight text-[#141413] font-serif block">
                {brandName}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#6B675E] font-semibold block mt-0.5">
                Tienda de Ropa · {companySettings?.legalName || 'Indumentaria Contemporánea'}
              </span>
              <p className="text-[11px] text-[#6B675E] mt-1">
                {companySettings?.address}, {companySettings?.city} · {companySettings?.email}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono font-bold uppercase text-[#364637] bg-[#EFECE6] px-2.5 py-1 rounded">
                PRESUPUESTO
              </span>
              <div className="text-[11px] text-[#6B675E] mt-1.5">
                Fecha: {new Date().toLocaleDateString('es-AR')}
              </div>
            </div>
          </div>

          <div className="bg-[#F8F7F4] rounded-xl p-3.5 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border border-[#E2DFD7]">
            <div>
              <span className="text-[10px] text-[#6B675E] uppercase font-bold block">Cliente:</span>
              <strong className="text-[#141413] font-semibold">
                {customerName || 'A confirmar'}
              </strong>
              {businessName && <span className="text-[#6B675E] block text-[11px]">{businessName}</span>}
            </div>
            <div>
              <span className="text-[10px] text-[#6B675E] uppercase font-bold block">Contacto / Envío:</span>
              <span className="text-[#141413]">{city || 'A coordinar'}</span>
              <span className="text-[#6B675E] block text-[11px]">{phone || 'Sin teléfono'}</span>
            </div>
          </div>

          <div className="border border-[#E2DFD7] rounded-xl overflow-x-auto mb-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EFECE6] text-[#141413] uppercase font-bold text-[10px] border-b border-[#E2DFD7]">
                <tr>
                  <th className="py-2.5 px-3">Prenda</th>
                  <th className="py-2.5 px-2 text-center">Talle</th>
                  <th className="py-2.5 px-2 text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-right">Precio</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-2 no-print w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DFD7]">
                {quoteItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6B675E] italic">
                      Todavía no agregaste prendas a este presupuesto.
                    </td>
                  </tr>
                ) : (
                  quoteItems.map((item) => (
                    <tr key={`${item.product.id}-${item.selectedSize}`}>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[#141413] block">{item.product.name}</span>
                        <span className="font-mono text-[10px] text-[#6B675E]">
                          {item.product.sku}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-[#141413]">
                        {item.selectedSize}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-[#141413]">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#6B675E] tabular-nums">
                        {formatCurrency(item.unitPrice, false)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#141413] tabular-nums">
                        {formatCurrency(item.total, false)}
                      </td>
                      <td className="py-2.5 px-2 text-center no-print">
                        <button
                          onClick={() => handleRemoveItem(item.product.id, item.selectedSize)}
                          className="text-[#9C988F] hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-2 border-t border-[#E2DFD7]">
            <div className="text-[11px] text-[#6B675E] space-y-1">
              <p>• Reserva de talles válida por 48 horas hábiles.</p>
              <p>• Cambio de talle sin cargo dentro de los 30 días.</p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-[#6B675E]">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">{formatCurrency(subtotal, false)}</span>
              </div>
              {additionalDiscountPercent > 0 && (
                <div className="flex justify-between text-[#364637] font-semibold">
                  <span>Bonificación ({additionalDiscountPercent}%):</span>
                  <span className="font-mono">-{formatCurrency(discountAmount, false)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-[#E2DFD7] text-sm">
                <strong className="text-[#141413]">TOTAL:</strong>
                <strong className="text-lg font-bold font-mono text-[#141413] tabular-nums">
                  {formatCurrency(finalTotal)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
