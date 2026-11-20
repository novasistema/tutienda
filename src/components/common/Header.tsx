import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ShoppingBag, LayoutDashboard, Store, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    cartItemCount,
    cartTotal,
    setIsCartOpen,
    companySettings
  } = useStore();

  const brandName = companySettings?.companyName || 'TU TIENDA';

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-[#F8F7F4]/95 backdrop-blur-md border-b border-[#E4E1DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Editorial Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className="flex items-baseline gap-2.5 text-left shrink-0 cursor-pointer"
          >
            <span className="text-2xl sm:text-[26px] font-serif font-semibold tracking-tight text-[#141413]">
              {brandName}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#6B6862] hidden sm:inline">
              Tienda de Ropa
            </span>
          </button>

          {/* Zone 2: Clean Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            <button
              type="button"
              onClick={() => setActiveTab('store')}
              className={`relative py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                activeTab === 'store'
                  ? 'text-[#141413] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#364637]'
                  : 'text-[#6B6862] hover:text-[#141413]'
              }`}
            >
              Tienda de Ropa
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('crm')}
              className={`relative py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                activeTab === 'crm'
                  ? 'text-[#141413] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#364637]'
                  : 'text-[#6B6862] hover:text-[#141413]'
              }`}
            >
              CRM · Pedidos &amp; Prendas
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quotation')}
              className={`relative py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                activeTab === 'quotation'
                  ? 'text-[#141413] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#364637]'
                  : 'text-[#6B6862] hover:text-[#141413]'
              }`}
            >
              Presupuestos
            </button>
          </nav>

          {/* Zone 3: Bag Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-[#141413] hover:bg-[#364637] text-white transition-colors cursor-pointer"
              aria-label="Abrir bolsa de compra"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Mi Bolsa</span>
              <span className="text-[11px] font-mono tabular-nums bg-white/15 px-1.5 py-0.5">
                {cartItemCount}
              </span>
              {cartTotal > 0 && (
                <span className="hidden lg:inline text-[11px] font-mono tabular-nums text-[#D8D4CB]">
                  {formatCurrency(cartTotal, false)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Bar for One-Thumb Navigation */}
      <nav
        className="no-print md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E4E1DA] px-2 pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegación móvil"
      >
        <div className="grid grid-cols-4 h-14">
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide cursor-pointer ${
              activeTab === 'store' ? 'text-[#364637]' : 'text-[#6B6862]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Tienda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crm')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide cursor-pointer ${
              activeTab === 'crm' ? 'text-[#364637]' : 'text-[#6B6862]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>CRM</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quotation')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide cursor-pointer ${
              activeTab === 'quotation' ? 'text-[#364637]' : 'text-[#6B6862]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Cotizar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide text-[#141413] relative cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-[#364637] text-white text-[9px] font-mono flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span>Bolsa</span>
          </button>
        </div>
      </nav>
    </>
  );
};
