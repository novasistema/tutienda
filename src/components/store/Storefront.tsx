import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { CATALOG_CATEGORIES, HERO_IMAGE } from '../../data/products';
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
  const { products, setActiveTab, isCrmAuthenticated, openCreateProductModal, companySettings } = useStore();
  const brandTitle = companySettings?.companyName || 'TU TIENDA';
  const companyPhone = companySettings?.phone ? companySettings.phone.replace(/[^0-9]/g, '') : '5491149821100';

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

  const whatsAppGeneralLink = generateWhatsAppLink(
    companyPhone,
    `Hola ${brandTitle}, quiero consultar por talles disponibles y envíos en la Tienda de Ropa.`
  );

  return (
    <div className="min-h-screen bg-[#F8F7F4] pb-16">
      {/* Editorial Atelier Hero */}
      <section className="bg-[#EFECE6] border-b border-[#E4E1DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Editorial Copy */}
            <div className="lg:col-span-6 space-y-5">
              <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#364637] font-semibold">
                {brandTitle} · Tienda de Ropa
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold text-[#141413] leading-[1.04] tracking-tight">
                Prendas esenciales de diseño noble y corte contemporáneo.
              </h1>

              <p className="text-sm sm:text-base text-[#5C5852] max-w-lg leading-relaxed">
                Lino lavado, algodón peinado de alto gramaje y sastrería liviana pensada para durar. Comprá por unidad o aprovechá beneficios por pack.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#coleccion-ropa"
                  className="px-6 py-3.5 bg-[#141413] hover:bg-[#364637] text-white text-xs font-semibold uppercase tracking-[0.14em] inline-flex items-center gap-2 transition-colors"
                >
                  <span>Explorar Colección</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </a>

                <a
                  href={whatsAppGeneralLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 bg-white hover:bg-[#F8F7F4] text-[#141413] border border-[#D4CFC5] text-xs font-semibold uppercase tracking-[0.12em] inline-flex items-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#364637]" />
                  <span>Asesoramiento</span>
                </a>
              </div>
            </div>

            {/* Lookbook Visual */}
            <div className="lg:col-span-6">
              <div className="relative overflow-hidden border border-[#DEDAD0] bg-[#E5E1D8] aspect-[16/10] sm:aspect-[16/10]">
                <img
                  src={HERO_IMAGE}
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
                className="px-3.5 py-2 bg-[#364637] hover:bg-[#283529] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cargar Prenda</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('crm')}
                className="px-3.5 py-2 bg-[#EFECE6] hover:bg-[#E4E1DA] text-[#141413] text-xs font-semibold transition-colors cursor-pointer"
              >
                Ir al CRM
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
                Tienda de Ropa
              </h2>
            </div>
            <span className="text-xs font-mono text-[#6B6862] tabular-nums">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'prenda' : 'prendas'}
            </span>
          </div>

          {/* Horizontal swipeable category bar (mobile-first) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 border-b border-[#E4E1DA]">
            {CATALOG_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`pb-3 px-2.5 text-xs font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'border-[#141413] text-[#141413]'
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
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-[#DEDAD0] focus:border-[#141413] outline-hidden text-[#141413]"
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
        {filteredProducts.length === 0 ? (
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
              className="px-4 py-2 bg-[#141413] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
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

        {/* Store Guarantees Footer Strip */}
        <div className="mt-14 bg-white border border-[#E4E1DA] p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-[#364637] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413]">
                  Envíos a Todo el País
                </h4>
                <p className="text-xs text-[#6B6862] mt-1 leading-relaxed">
                  Despachos en el día en CABA y envíos por Correo Argentino o expreso a todas las provincias.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-[#364637] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413]">
                  Cambios de Talle Simples
                </h4>
                <p className="text-xs text-[#6B6862] mt-1 leading-relaxed">
                  Tenés 30 días para cambiar cualquier prenda por otro talle o modelo sin complicaciones.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#364637] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413]">
                  Pago Protegido &amp; Asistencia
                </h4>
                <p className="text-xs text-[#6B6862] mt-1 leading-relaxed">
                  Pagá con tarjeta, transferencia bancaria o coordiná atención directa por WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
