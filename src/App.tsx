import React, { Component, ErrorInfo, ReactNode, Suspense, lazy, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/common/Header';
import { WhatsAppButton } from './components/common/WhatsAppButton';
import { Storefront } from './components/store/Storefront';
import { ProductDetailModal } from './components/store/ProductDetailModal';
import { CartDrawer } from './components/store/CartDrawer';
import { CheckoutModal } from './components/store/CheckoutModal';
import { OrderReturnModal } from './components/store/OrderReturnModal';
import { LegalPage } from './components/store/LegalPages';
import { legalPageFromPath, navigate, usePathname } from './utils/router';
import { DEMO_MODE } from './config';
import { Instagram, Facebook } from 'lucide-react';

// El panel de administración se descarga solo cuando se usa: la tienda carga más rápido para los compradores.
const CrmDashboard = lazy(() => import('./components/crm/CrmDashboard').then((m) => ({ default: m.CrmDashboard })));
const QuotationBuilder = lazy(() =>
  import('./components/crm/QuotationBuilder').then((m) => ({ default: m.QuotationBuilder }))
);
const ProductEditModal = lazy(() =>
  import('./components/crm/ProductEditModal').then((m) => ({ default: m.ProductEditModal }))
);

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
            <h1 className="text-2xl font-serif font-semibold text-[#141413]">Algo interrumpió la pantalla</h1>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              Podés recargar la página para continuar navegando normalmente.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[var(--brand-primary)] text-white text-xs font-semibold uppercase tracking-widest cursor-pointer"
            >
              Recargar sitio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const isHexColor = (c?: string) => !!c && /^#[0-9a-fA-F]{6}$/.test(c);

const Loading: React.FC = () => (
  <div className="py-24 text-center text-xs text-[#6B6862]">Cargando...</div>
);

const AppContent: React.FC = () => {
  const { activeTab, companySettings, selectedProductForModal, isCrmAuthenticated, isProductEditModalOpen } =
    useStore();
  const pathname = usePathname();
  const legalPage = legalPageFromPath(pathname);
  const brandName = companySettings?.companyName || 'Mi Tienda';

  // Colores de la marca desde Configuración.
  useEffect(() => {
    const root = document.documentElement;
    if (isHexColor(companySettings.primaryColor)) root.style.setProperty('--brand-primary', companySettings.primaryColor!);
    if (isHexColor(companySettings.accentColor)) root.style.setProperty('--brand-accent', companySettings.accentColor!);
  }, [companySettings.primaryColor, companySettings.accentColor]);

  // Título de la pestaña y descripción (también los usa Google al leer la página).
  useEffect(() => {
    if (legalPage) return;
    const tagline = companySettings.tagline || 'Tienda de ropa';
    let title = `${brandName} | ${tagline}`;
    let description = `${brandName} · ${tagline}. Comprá online con envío a todo el país.`;
    if (selectedProductForModal && activeTab === 'store') {
      title = `${selectedProductForModal.name} | ${brandName}`;
      description = selectedProductForModal.hook || description;
    } else if (activeTab !== 'store') {
      title = `Panel | ${brandName}`;
    }
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [brandName, companySettings.tagline, selectedProductForModal, activeTab, legalPage]);

  const year = new Date().getFullYear();

  return (
    <div className={`min-h-screen flex flex-col bg-[#F8F7F4] text-[#141413] ${DEMO_MODE || isCrmAuthenticated ? 'pb-16 md:pb-0' : ''}`}>
      <Header />

      <main className="flex-1">
        {legalPage ? (
          <LegalPage page={legalPage} />
        ) : (
          <>
            {activeTab === 'store' && <Storefront />}
            <Suspense fallback={<Loading />}>
              {activeTab === 'crm' && <CrmDashboard />}
              {activeTab === 'quotation' &&
                (isCrmAuthenticated ? (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <QuotationBuilder />
                  </div>
                ) : (
                  <CrmDashboard />
                ))}
            </Suspense>
          </>
        )}
      </main>

      {/* Global Modals & Drawers */}
      <ProductDetailModal />
      {isProductEditModalOpen && (
        <Suspense fallback={null}>
          <ProductEditModal />
        </Suspense>
      )}
      <CartDrawer />
      <CheckoutModal />
      <OrderReturnModal />
      <WhatsAppButton />

      <footer className="no-print bg-[var(--brand-primary)] text-[#A8A39A] text-xs py-8 border-t border-[#2A2926]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-serif text-lg font-semibold text-white tracking-wide">{brandName}</span>
              {companySettings.tagline && (
                <>
                  <span className="text-[#4A4742]">·</span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[#C5C0B8]">{companySettings.tagline}</span>
                </>
              )}
            </div>
            <div className="text-center sm:text-right text-[11px] text-[#C5C0B8]">
              {[companySettings.address, companySettings.footerText].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-5">
            <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px]" aria-label="Información legal">
              {(
                [
                  ['/terminos', 'Términos y condiciones'],
                  ['/privacidad', 'Privacidad'],
                  ['/arrepentimiento', 'Botón de arrepentimiento']
                ] as const
              ).map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(href);
                  }}
                  className="hover:text-white underline-offset-2 hover:underline"
                >
                  {label}
                </a>
              ))}
              <a
                href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white underline-offset-2 hover:underline"
              >
                Defensa de las y los consumidores
              </a>
            </nav>
            <div className="flex items-center gap-4">
              {companySettings.instagramUrl && (
                <a href={companySettings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-white">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {companySettings.facebookUrl && (
                <a href={companySettings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-white">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              <span className="text-[10px] text-[#8A857E]">
                © {year} {companySettings.legalName || brandName}
                {companySettings.cuit ? ` · CUIT ${companySettings.cuit}` : ''}
              </span>
            </div>
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
