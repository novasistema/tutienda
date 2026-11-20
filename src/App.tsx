import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/common/Header';
import { Storefront } from './components/store/Storefront';
import { CrmDashboard } from './components/crm/CrmDashboard';
import { QuotationBuilder } from './components/crm/QuotationBuilder';
import { ProductDetailModal } from './components/store/ProductDetailModal';
import { CartDrawer } from './components/store/CartDrawer';
import { CheckoutModal } from './components/store/CheckoutModal';
import { ProductEditModal } from './components/crm/ProductEditModal';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Ocurrió un error inesperado.' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E4E1DA] p-8 space-y-4 text-center">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#6B6862]">
              TU TIENDA · Tienda de Ropa
            </p>
            <h1 className="text-2xl font-serif font-semibold text-[#141413]">
              Algo interrumpió la pantalla
            </h1>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              Podés recargar la página para continuar navegando normalmente.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold uppercase tracking-widest cursor-pointer"
            >
              Recargar Sitio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { activeTab, companySettings } = useStore();
  const brandName = companySettings?.companyName || 'TU TIENDA';

  React.useEffect(() => {
    if (brandName) {
      document.title = `${brandName} | Tienda de Ropa & CRM`;
    }
  }, [brandName]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#141413] pb-16 md:pb-0">
      <Header />

      <main className="flex-1">
        {activeTab === 'store' && <Storefront />}
        {activeTab === 'crm' && <CrmDashboard />}
        {activeTab === 'quotation' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <QuotationBuilder />
          </div>
        )}
      </main>

      {/* Global Modals & Drawers */}
      <ProductDetailModal />
      <ProductEditModal />
      <CartDrawer />
      <CheckoutModal />

      {/* Global Footer (No-print) */}
      <footer className="no-print bg-[#141413] text-[#A8A39A] text-xs py-8 border-t border-[#2A2926]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg font-semibold text-white tracking-wide">
              {brandName}
            </span>
            <span className="text-[#4A4742]">·</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#C5C0B8]">
              Tienda de Ropa
            </span>
          </div>
          <div className="text-center sm:text-right text-[11px] text-[#8A857E]">
            {companySettings?.address || 'Palermo, Buenos Aires'} · Envíos a todo el país · Cambios sin cargo
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AppErrorBoundary>
  );
}
