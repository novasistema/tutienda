import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, calculateUnitPrice, generateWhatsAppLink } from '../../utils/formatters';
import { resolveProductImage, handleImageError } from '../../utils/imageUtils';
import { X, ShoppingBag, MessageCircle, CheckCircle2, Truck, Plus, Minus } from 'lucide-react';

export const ProductDetailModal: React.FC = () => {
  const { selectedProductForModal, setSelectedProductForModal, addToCart, companySettings } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('M');

  useEffect(() => {
    if (selectedProductForModal) {
      setQuantity(1);
      setSelectedSize(selectedProductForModal.sizes?.[0] || 'Único');
    }
  }, [selectedProductForModal]);

  if (!selectedProductForModal) return null;
  const product = selectedProductForModal;
  const brandTitle = companySettings?.companyName || 'TU TIENDA';
  const companyPhone = companySettings?.phone ? companySettings.phone.replace(/[^0-9]/g, '') : '5491149821100';

  const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['Único'];
  const currentUnitPrice = calculateUnitPrice(product, quantity);
  const totalCost = currentUnitPrice * quantity;
  const totalSavings = product.priceUnit * quantity - totalCost;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize);
    setSelectedProductForModal(null);
  };

  const whatsAppText = `Hola ${brandTitle}, quiero consultar por la prenda:\n\n*${product.name}*\nTalle: ${selectedSize}\nCantidad: ${quantity}\nPrecio: ${formatCurrency(totalCost)}\n\n¿Tienen stock disponible para envío?`;
  const whatsAppLink = generateWhatsAppLink(companyPhone, whatsAppText);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#141413]/70 backdrop-blur-xs">
      <div
        className="bg-white w-full sm:max-w-3xl max-h-[92dvh] overflow-y-auto border border-[#DEDAD0] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#EFECE6] flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#6B6862]">
            <span className="uppercase tracking-wider text-[#364637] font-semibold">
              {product.category}
            </span>
            <span>·</span>
            <span>{product.sku}</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedProductForModal(null)}
            className="p-2 text-[#6B6862] hover:text-[#141413] cursor-pointer"
            aria-label="Cerrar detalle de prenda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* Garment Image */}
            <div className="bg-[#EFECE6] border border-[#E4E1DA] aspect-[4/5] overflow-hidden">
              <img
                src={resolveProductImage(product.image, product.category)}
                alt={product.name}
                onError={(e) => handleImageError(e, product.category)}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Contiguous Garment Purchase Block */}
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#364637]">
                  {product.brand} {product.fit ? `· ${product.fit}` : ''}
                </p>
                <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#141413] mt-1 leading-tight">
                  {product.name}
                </h2>
                <p className="text-xs text-[#5C5852] mt-1.5 leading-relaxed">
                  {product.hook}
                </p>
              </div>

              {/* Price */}
              <div className="border-y border-[#EFECE6] py-3.5 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold font-mono text-[#141413] tabular-nums">
                    {formatCurrency(currentUnitPrice, false)}
                  </span>
                  <span className="text-xs font-mono text-[#6B6862] ml-1.5">ARS</span>
                </div>
                <span className="text-[11px] text-[#364637] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Stock disponible ({product.stock})
                </span>
              </div>

              {/* Garment Composition / Color */}
              {(product.material || product.color) && (
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF9F6] border border-[#EFECE6] p-3">
                  {product.color && (
                    <div>
                      <span className="block text-[10px] font-mono uppercase text-[#6B6862]">Color</span>
                      <span className="font-medium text-[#141413]">{product.color}</span>
                    </div>
                  )}
                  {product.material && (
                    <div>
                      <span className="block text-[10px] font-mono uppercase text-[#6B6862]">Tela / Composición</span>
                      <span className="font-medium text-[#141413]">{product.material}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Size Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#141413]">Seleccionar Talle</span>
                  <span className="font-mono text-[#6B6862]">Elegido: {selectedSize}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] h-10 px-3 text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                        selectedSize === size
                          ? 'bg-[#141413] text-white border-[#141413]'
                          : 'bg-white text-[#141413] border-[#D8D4CB] hover:border-[#141413]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Pack Discount Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#141413]">Cantidad</span>
                  <div className="flex items-center border border-[#D8D4CB] bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center text-[#141413] hover:bg-[#EFECE6] cursor-pointer"
                      aria-label="Disminuir"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs font-mono font-bold text-[#141413]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-9 h-9 flex items-center justify-center text-[#141413] hover:bg-[#EFECE6] cursor-pointer"
                      aria-label="Aumentar"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {(product.priceTiers?.tier5 || product.priceTiers?.tier10) && (
                  <p className="text-[11px] text-[#6B6862]">
                    Pack x5+: {product.priceTiers.tier5 ? formatCurrency(product.priceTiers.tier5, false) : '-'} c/u
                    {product.priceTiers.tier10 ? ` · Pack x10+: ${formatCurrency(product.priceTiers.tier10, false)} c/u` : ''}
                  </p>
                )}

                {totalSavings > 0 && (
                  <p className="text-xs font-medium text-[#364637]">
                    Descuento por cantidad aplicado: ahorrás {formatCurrency(totalSavings, false)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3.5 px-5 bg-[#141413] hover:bg-[#364637] text-white text-xs font-semibold uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Agregar a la Bolsa · {formatCurrency(totalCost, false)}</span>
                </button>

                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#EFECE6] hover:bg-[#E4E1DA] text-[#141413] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#364637]" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#6B6862] pt-1">
                <Truck className="w-3.5 h-3.5 text-[#364637]" />
                <span>Despacho en 24hs a todo el país · Cambios sin cargo</span>
              </div>
            </div>
          </div>

          {/* Specs Detail */}
          {product.specs && product.specs.length > 0 && (
            <div className="border-t border-[#EFECE6] pt-5">
              <h4 className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#6B6862] mb-3">
                Detalles de Confección
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.specs.map((spec, i) => (
                  <div key={i} className="p-3 bg-[#FAF9F6] border border-[#EFECE6]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#141413] block">
                      {spec.label}
                    </span>
                    <span className="text-xs text-[#5C5852] mt-0.5 block">{spec.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
