import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ShoppingBag, LayoutDashboard, Store, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { DEMO_MODE } from '../../config';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, cartItemCount, cartTotal, setIsCartOpen, companySettings, isCrmAuthenticated } =
    useStore();

  const brandName = companySettings?.companyName || 'Mi Tienda';
  // El acceso al panel solo se muestra en la demo o a quien ya inició sesión.
  // El dueño de la tienda entra desde /admin.
  const showAdminNav = DEMO_MODE || isCrmAuthenticated;

  const navItem = (tab: 'store' | 'crm' | 'quotation', label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`relative py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer ${
        activeTab === tab
          ? 'text-[#141413] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--brand-accent)]'
          : 'text-[#6B6862] hover:text-[#141413]'
      }`}
    >
      {label}
    </button>
  );

  const mobileItem = (tab: 'store' | 'crm' | 'quotation', label: string, Icon: React.ElementType) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide cursor-pointer ${
        activeTab === tab ? 'text-[var(--brand-accent)]' : 'text-[#6B6862]'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-[#F8F7F4]/95 backdrop-blur-md border-b border-[#E4E1DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('store');
            }}
            className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer"
          >
            {companySettings.logoUrl ? (
              <img src={companySettings.logoUrl} alt={brandName} className="h-10 w-auto max-w-[160px] object-contain" />
            ) : (
              <span className="text-2xl sm:text-[26px] font-serif font-semibold tracking-tight text-[#141413] truncate">
                {brandName}
              </span>
            )}
            {companySettings.tagline && (
              <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#6B6862] hidden lg:inline truncate">
                {companySettings.tagline}
              </span>
            )}
          </a>

          {showAdminNav && (
            <nav className="hidden md:flex items-center gap-7">
              {navItem('store', 'Tienda')}
              {navItem('crm', 'Panel · Pedidos & Prendas')}
              {navItem('quotation', 'Presupuestos')}
            </nav>
          )}

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white transition-colors cursor-pointer"
              aria-label="Abrir bolsa de compra"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Mi bolsa</span>
              <span className="text-[11px] font-mono tabular-nums bg-white/15 px-1.5 py-0.5">{cartItemCount}</span>
              {cartTotal > 0 && (
                <span className="hidden lg:inline text-[11px] font-mono tabular-nums text-[#D8D4CB]">
                  {formatCurrency(cartTotal, false)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {showAdminNav && (
        <nav
          className="no-print md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E4E1DA] px-2 pb-[env(safe-area-inset-bottom)]"
          aria-label="Navegación móvil"
        >
          <div className="grid grid-cols-4 h-14">
            {mobileItem('store', 'Tienda', Store)}
            {mobileItem('crm', 'Panel', LayoutDashboard)}
            {mobileItem('quotation', 'Cotizar', FileText)}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide text-[#141413] relative cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-[var(--brand-accent)] text-white text-[9px] font-mono flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span>Bolsa</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};
