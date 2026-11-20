import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { HERO_IMAGE } from '../../data/products';
import { handleImageError } from '../../utils/imageUtils';
import { ProductCard } from './ProductCard';
import { WholesaleNoticeBanner } from '../common/WholesaleNoticeBanner';
import {
  Search,
  SlidersHorizontal,
  MessageCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  ArrowDown
} from 'lucide-react';
import { generateWhatsAppLink } from '../../utils/formatters';

export const Storefront: React.FC = () => {
  const { products, productsLoading, setActiveTab, isCrmAuthenticated, openCreateProductModal, companySettings } =
    useStore();
  const brandTitle = companySettings?.companyName || 'Mi Tienda';
  const companyPhone = companySettings?.phone ? companySettings.phone.replace(/[^0-9]/g, '') : '';
  const heroImage = companySettings.heroImageUrl || HERO_IMAGE;

  // Categorías definidas en Configuración + las que tengan prendas cargadas.
  const categories = useMemo(() => {
    const fromSettings = companySettings.categories || [];
    const withProducts = new Set(products.map((p) => p.category));
    const extra = [...withProducts].filter((c) => c && !fromSettings.includes(c));
    return ['Todos', ...fromSettings.filter((c) => withProducts.has(c)), ...extra];
  }, [companySettings.categories, products]);

  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'name'>('featured');

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.hook.toLowerCase().includes(q) ||
          (p.color || '').toLowerCase().includes(q) ||
          (p.material || '').toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.priceUnit - b.priceUnit;
        if (sortBy === 'price_desc') return b.priceUnit - a.priceUnit;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const whatsAppGeneralLink = companyPhone
    ? generateWhatsAppLink(companyPhone, `Hola ${brandTitle}, quiero consultar por talles disponibles y envíos.`)
    : null;

  return (
    <div className="min-h-screen bg-[#F8F7F4] pb-16">
      {/* Editorial Atelier Hero */}
      <section className="bg-[#EFECE6] border-b border-[#E4E1DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Editorial Copy */}
            <div className="lg:col-span-6 space-y-5">
              <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-[var(--brand-accent)] font-semibold">
                {brandTitle}
                {companySettings.tagline ? ` · ${companySettings.tagline}` : ''}
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold text-[#141413] leading-[1.04] tracking-tight">
                {companySettings.heroTitle || 'Prendas esenciales de diseño noble y corte contemporáneo.'}
              </h1>

              <p className="text-sm sm:text-base text-[#5C5852] max-w-lg leading-relaxed">
                {companySettings.heroText ||
                  'Elegí tus prendas, tu talle y recibilas en tu casa. Pagá con Mercado Pago o transferencia.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#coleccion-ropa"
                  className="px-6 py-3.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white text-xs font-semibold uppercase tracking-[0.14em] inline-flex items-center gap-2 transition-colors"
                >
                  <span>Explorar Colección</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </a>

                {whatsAppGeneralLink && (
                <a
                  href={whatsAppGeneralLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 bg-white hover:bg-[#F8F7F4] text-[#141413] border border-[#D4CFC5] text-xs font-semibold uppercase tracking-[0.12em] inline-flex items-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                  <span>Asesoramiento</span>
                </a>
                )}
              </div>
            </div>

            {/* Lookbook Visual */}
            <div className="lg:col-span-6">
              <div className="relative overflow-hidden border border-[#DEDAD0] bg-[#E5E1D8] aspect-[16/10] sm:aspect-[16/10]">
                <img
                  src={heroImage}
                  fetchPriority="high"
                  alt={`${brandTitle} Colección de Indumentaria`}
                  onError={handleImageError}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <WholesaleNoticeBanner />

      {/* Catalog Section */}
      <div id="coleccion-ropa" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-7 sm:pt-10">
        {/* Quick Admin Toolbar when signed into CRM */}
        {isCrmAuthenticated && (
          <div className="bg-white border border-[#DEDAD0] p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <span className="text-xs font-semibold text-[#141413] block">
                Sesión de Gestión Activa
              </span>
              <span className="text-[11px] text-[#6B6862]">
                Cargá prendas con foto desde tu celular o computadora y administrá pedidos.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openCreateProductModal}
                className="px-3.5 py-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-dark)] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cargar Prenda</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('crm')}
                className="px-3.5 py-2 bg-[#EFECE6] hover:bg-[#E4E1DA] text-[#141413] text-xs font-semibold transition-colors cursor-pointer"
              >
                Ir al panel
              </button>
            </div>
          </div>
        )}

        {/* Section Heading + Category Filter Tabs */}
        <div className="mb-5 sm:mb-7 space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6B6862]">
                Catálogo Actual
              </p>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#141413]">
                {companySettings.tagline || 'Nuestras prendas'}
              </h2>
            </div>
            <span className="text-xs font-mono text-[#6B6862] tabular-nums">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'prenda' : 'prendas'}
            </span>
          </div>

          {/* Horizontal swipeable category bar (mobile-first) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 border-b border-[#E4E1DA]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`pb-3 px-2.5 text-xs font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'border-[var(--brand-primary)] text-[#141413]'
                    : 'border-transparent text-[#6B6862] hover:text-[#141413]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-6 sm:mb-8">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A857E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar remera, camisa, lino, talle..."
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-[#DEDAD0] focus:border-[var(--brand-primary)] outline-hidden text-[#141413]"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B6862] shrink-0 hidden sm:inline" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'featured' | 'price_asc' | 'price_desc' | 'name')}
              className="w-full sm:w-auto text-xs px-3 py-2.5 bg-white border border-[#DEDAD0] font-medium text-[#141413] outline-hidden"
            >
              <option value="featured">Selección Destacada</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </div>
        </div>

        {/* Garment Grid: 2 Columns on Mobile, 3-4 on Desktop */}
        {productsLoading && products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#EFECE6] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-[#E4E1DA] p-10 text-center text-sm text-[#5C5852]">
            {isCrmAuthenticated
              ? 'Todavía no cargaste prendas. Usá “Cargar prenda” para publicar la primera.'
              : 'Estamos preparando el catálogo. ¡Volvé pronto!'}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#E4E1DA] p-10 text-center space-y-3">
            <p className="text-sm text-[#5C5852]">
              No encontramos prendas con ese filtro o búsqueda.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Todos');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[var(--brand-primary)] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Ver todas las prendas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Beneficios (según la configuración de la tienda) */}
        <div className="mt-14 bg-white border border-[#E4E1DA] p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                Icon: Truck,
                title: companySettings.shippingCorreoEnabled !== false ? 'Envíos a todo el país' : 'Retiro en el local',
                text:
                  companySettings.freeShippingFrom && companySettings.freeShippingFrom > 0
                    ? `Envío gratis en compras desde $${companySettings.freeShippingFrom.toLocaleString('es-AR')}.`
                    : companySettings.pickupAddress || 'Elegí la forma de entrega al finalizar tu compra.'
              },
              {
                Icon: RotateCcw,
                title: 'Cambios de talle',
                text: 'Si el talle no te queda, escribinos y coordinamos el cambio.'
              },
              {
                Icon: ShieldCheck,
                title: 'Pago protegido',
                text: companySettings.mercadoPagoEnabled
                  ? 'Pagá con Mercado Pago: tarjetas, débito o dinero en cuenta. Tus datos no pasan por esta página.'
                  : 'Pagá por transferencia o coordiná tu compra por WhatsApp.'
              }
            ].map(({ Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-[var(--brand-accent)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413]">{title}</h4>
                  <p className="text-xs text-[#6B6862] mt-1 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
