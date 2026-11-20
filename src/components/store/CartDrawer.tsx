import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { resolveProductImage, handleImageError } from '../../utils/imageUtils';
import { X, Trash2, Plus, Minus, ShoppingBag, MessageCircle, ArrowRight } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    setIsCheckoutOpen,
    companySettings
  } = useStore();

  if (!isCartOpen) return null;

  const brandTitle = companySettings?.companyName || 'Mi Tienda';
  const companyPhone = companySettings?.phone ? companySettings.phone.replace(/[^0-9]/g, '') : '';

  const generateOrderMessage = () => {
    let msg = `*NUEVO PEDIDO - ${brandTitle} *\n`;
    msg += `------------------------------------\n`;
    cart.forEach((item, index) => {
      msg += `${index + 1}. *${item.product.name}* (Talle: ${item.selectedSize || 'Único'})\n`;
      msg += `   Cant: ${item.quantity} u. x ${formatCurrency(item.unitPriceApplied, false)} = ${formatCurrency(item.totalPrice)}\n\n`;
    });
    msg += `------------------------------------\n`;
    msg += `*TOTAL:* ${formatCurrency(cartTotal)}\n\n`;
    msg += `Hola, quiero confirmar disponibilidad para finalizar la compra.`;
    return msg;
  };

  const whatsAppLink = generateWhatsAppLink(companyPhone, generateOrderMessage());

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-[var(--brand-primary)]/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-[#E4E1DA]">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-[#EFECE6] bg-[#FAF9F6] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-[var(--brand-accent)]" />
              <div>
                <h3 className="font-serif font-semibold text-[#141413] text-lg leading-none">
                  Mi Bolsa · {brandTitle}
                </h3>
                <p className="text-[11px] text-[#6B6862] mt-1">
                  {cart.length} {cart.length === 1 ? 'prenda seleccionada' : 'prendas seleccionadas'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="p-2 text-[#6B6862] hover:text-red-700 transition-colors cursor-pointer"
                  title="Vaciar bolsa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-[#6B6862] hover:text-[#141413] transition-colors cursor-pointer"
                aria-label="Cerrar bolsa"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-14 h-14 bg-[#EFECE6] text-[var(--brand-accent)] mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-semibold text-[#141413] text-lg">Tu bolsa está vacía</h4>
                <p className="text-xs text-[#6B6862] max-w-xs mx-auto">
                  Elegí tus prendas favoritas y seleccioná tu talle para armar tu compra.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Ver Colección
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedSize || 'Único'}`}
                  className="bg-white p-3 border border-[#E4E1DA] flex items-center gap-3"
                >
                  <img
                    src={resolveProductImage(item.product.image, item.product.category)}
                    alt={item.product.name}
                    onError={(e) => handleImageError(e, item.product.category)}
                    className="w-16 h-20 object-cover bg-[#EFECE6] shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[#141413] line-clamp-2">
                        {item.product.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                        className="text-[#8A857E] hover:text-red-700 p-1 shrink-0 cursor-pointer"
                        title="Quitar prenda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] font-mono text-[#6B6862] mt-0.5">
                      Talle: <strong className="text-[#141413]">{item.selectedSize || 'Único'}</strong> · {item.product.sku}
                    </p>

                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-[#D8D4CB] bg-[#FAF9F6]">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(item.product.id, item.quantity - 1, item.selectedSize)
                          }
                          className="w-8 h-8 flex items-center justify-center text-[#141413] hover:bg-[#EFECE6] cursor-pointer"
                          aria-label="Restar"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold font-mono text-[#141413]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(item.product.id, item.quantity + 1, item.selectedSize)
                          }
                          className="w-8 h-8 flex items-center justify-center text-[#141413] hover:bg-[#EFECE6] cursor-pointer"
                          aria-label="Sumar"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#6B6862] block font-mono">
                          {formatCurrency(item.unitPriceApplied, false)} c/u
                        </span>
                        <strong className="text-xs font-bold font-mono text-[#141413] tabular-nums">
                          {formatCurrency(item.totalPrice, false)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#E4E1DA] bg-[#FAF9F6] space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-[0.14em] font-semibold text-[#6B6862]">
                  Total de Compra
                </span>
                <span className="text-xl font-bold font-mono text-[#141413] tabular-nums">
                  {formatCurrency(cartTotal)}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white font-semibold text-xs uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Finalizar Compra</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {companyPhone && (
                  <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-white hover:bg-[#EFECE6] text-[#141413] border border-[#D8D4CB] font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[var(--brand-accent)]" />
                  <span>Enviar Pedido por WhatsApp</span>
                </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
