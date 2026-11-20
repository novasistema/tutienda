import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { CATALOG_CATEGORIES } from '../../data/products';
import { formatCurrency } from '../../utils/formatters';
import { resolveProductImage, handleImageError } from '../../utils/imageUtils';
import {
  Package,
  Plus,
  Search,
  Edit3,
  Copy,
  Trash2,
  Eye,
  Percent,
  AlertTriangle,
  CheckCircle2,
  LayoutGrid,
  List,
  Camera
} from 'lucide-react';

export const ProductsManager: React.FC = () => {
  const {
    products,
    openCreateProductModal,
    openEditProductModal,
    addProduct,
    updateProduct,
    deleteProduct,
    setSelectedProductForModal,
    batchUpdatePrices
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('name');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isBatchPriceModalOpen, setIsBatchPriceModalOpen] = useState(false);
  const [batchPercentage, setBatchPercentage] = useState<number>(10);
  const [batchCategory, setBatchCategory] = useState<string>('Todos');
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.hook.toLowerCase().includes(q) ||
          (p.color && p.color.toLowerCase().includes(q)) ||
          p.brand.toLowerCase().includes(q);

        const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;

        let matchesStock = true;
        if (stockFilter === 'in_stock') matchesStock = p.stock > 10;
        else if (stockFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= 10;
        else if (stockFilter === 'out_of_stock') matchesStock = p.stock === 0;

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.priceUnit - b.priceUnit;
        if (sortBy === 'price_desc') return b.priceUnit - a.priceUnit;
        if (sortBy === 'stock_asc') return a.stock - b.stock;
        if (sortBy === 'stock_desc') return b.stock - a.stock;
        return a.name.localeCompare(b.name);
      });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy]);

  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalStockValuation = products.reduce((sum, p) => sum + (p.stock || 0) * p.priceUnit, 0);
  const lowStockCount = products.filter((p) => p.stock <= 10).length;

  const handleQuickStockChange = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    await updateProduct({ ...product, stock: newStock });
  };

  const handleDuplicateProduct = async (product: Product) => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const duplicated: Omit<Product, 'id'> = {
      ...product,
      name: `${product.name} (Copia)`,
      sku: `${product.sku}-${randomSuffix}`,
      stock: 10,
      featured: false,
      isNew: true
    };
    await addProduct(duplicated);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    await deleteProduct(productToDelete.id);
    setProductToDelete(null);
  };

  const handleApplyBatchPrices = async () => {
    if (batchPercentage === 0) return;
    await batchUpdatePrices(batchPercentage, batchCategory);
    setBatchSuccessMsg(
      `Precios actualizados (${batchPercentage > 0 ? '+' : ''}${batchPercentage}%).`
    );
    setTimeout(() => {
      setBatchSuccessMsg('');
      setIsBatchPriceModalOpen(false);
    }, 1800);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Overview */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E2DFD7]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-[#EFECE6] text-[#364637] px-2.5 py-1 rounded">
              Catálogo & Inventario · TU TIENDA
            </span>
            <h2 className="text-xl sm:text-3xl font-bold text-[#141413] font-serif tracking-tight mt-2">
              Prendas, Talles & Fotografías
            </h2>
            <p className="text-xs sm:text-sm text-[#6B675E] mt-1">
              Cargá nuevas prendas con foto desde tu celular o PC, actualizá talles disponibles y ajustá precios en un clic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsBatchPriceModalOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-[#EFECE6] hover:bg-[#E2DFD7] text-[#141413] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Percent className="w-3.5 h-3.5 text-[#364637]" />
              <span>Ajuste Precios</span>
            </button>

            <button
              onClick={openCreateProductModal}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#141413] hover:bg-[#364637] text-[#F8F7F4] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Cargar Prenda + Foto</span>
            </button>
          </div>
        </div>

        {/* Inventory Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <div className="bg-[#F8F7F4] rounded-2xl p-3.5 sm:p-4 border border-[#E2DFD7]">
            <span className="text-[11px] font-bold text-[#6B675E] uppercase tracking-wider block">
              Modelos Activos
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#141413] mt-1">
              {products.length}
            </div>
          </div>

          <div className="bg-[#F8F7F4] rounded-2xl p-3.5 sm:p-4 border border-[#E2DFD7]">
            <span className="text-[11px] font-bold text-[#6B675E] uppercase tracking-wider block">
              Stock Total
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#141413] mt-1">
              {totalStockUnits.toLocaleString('es-AR')} u.
            </div>
          </div>

          <div className="bg-[#F8F7F4] rounded-2xl p-3.5 sm:p-4 border border-[#E2DFD7]">
            <span className="text-[11px] font-bold text-[#6B675E] uppercase tracking-wider block">
              Valorización Lista
            </span>
            <div className="text-lg sm:text-2xl font-bold font-mono text-[#364637] mt-1">
              {formatCurrency(totalStockValuation, false)}
            </div>
          </div>

          <div className="bg-[#F8F7F4] rounded-2xl p-3.5 sm:p-4 border border-[#E2DFD7]">
            <span className="text-[11px] font-bold text-[#6B675E] uppercase tracking-wider block">
              Stock Bajo (≤ 10)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-700 mt-1">
              {lowStockCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2DFD7] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B675E] absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar prenda por nombre, SKU o color..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E2DFD7] bg-[#F8F7F4] focus:border-[#364637] focus:bg-white outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 sm:flex-none text-xs py-2 px-3 rounded-xl border border-[#E2DFD7] bg-[#F8F7F4] font-semibold text-[#141413] outline-hidden"
            >
              <option value="Todos">Todas las Categorías</option>
              {CATALOG_CATEGORIES.filter((c) => c !== 'Todos').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
              className="flex-1 sm:flex-none text-xs py-2 px-3 rounded-xl border border-[#E2DFD7] bg-[#F8F7F4] font-semibold text-[#141413] outline-hidden"
            >
              <option value="all">Todo el Stock</option>
              <option value="in_stock">Stock Alto (&gt; 10)</option>
              <option value="low_stock">Stock Bajo (≤ 10)</option>
              <option value="out_of_stock">Agotado (0)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="flex-1 sm:flex-none text-xs py-2 px-3 rounded-xl border border-[#E2DFD7] bg-[#F8F7F4] font-semibold text-[#141413] outline-hidden"
            >
              <option value="name">A-Z</option>
              <option value="price_asc">Menor Precio</option>
              <option value="price_desc">Mayor Precio</option>
              <option value="stock_desc">Mayor Stock</option>
              <option value="stock_asc">Menor Stock</option>
            </select>

            <div className="hidden md:flex items-center bg-[#EFECE6] p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white text-[#141413] shadow-2xs' : 'text-[#6B675E]'
                }`}
                title="Vista Tabla"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-[#141413] shadow-2xs' : 'text-[#6B675E]'
                }`}
                title="Vista Tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E2DFD7]">
          <Package className="w-10 h-10 text-[#9C988F] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#141413]">No se encontraron prendas</h3>
          <p className="text-xs text-[#6B675E] mt-1">
            Probá limpiando los filtros o cargá una nueva prenda con fotografía.
          </p>
          <button
            onClick={openCreateProductModal}
            className="mt-4 px-4 py-2 bg-[#141413] text-[#F8F7F4] rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Prenda</span>
          </button>
        </div>
      ) : (
        <>
          {/* MOBILE CARDS (always visible on mobile; also shown on desktop if grid selected) */}
          <div className={`${viewMode === 'grid' ? 'grid' : 'grid md:hidden'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-[#E2DFD7] overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4 flex gap-3.5">
                  <img
                    src={resolveProductImage(product.image, product.category)}
                    alt={product.name}
                    onError={(e) => handleImageError(e, product.category)}
                    className="w-20 h-24 object-cover rounded-xl bg-[#F8F7F4] border border-[#E2DFD7] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#364637] block">
                      {product.category}
                    </span>
                    <h3 className="text-sm font-bold text-[#141413] line-clamp-2 leading-snug mt-0.5">
                      {product.name}
                    </h3>
                    <span className="text-[11px] font-mono text-[#6B675E] block mt-1">
                      {product.sku} {product.color ? `· ${product.color}` : ''}
                    </span>
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {product.sizes.slice(0, 5).map((sz) => (
                          <span
                            key={sz}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EFECE6] text-[#141413]"
                          >
                            {sz}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3 bg-[#F8F7F4] border-t border-[#E2DFD7] flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-bold font-mono text-[#141413]">
                      {formatCurrency(product.priceUnit, false)}
                    </div>
                    <span className="text-[10px] text-[#6B675E]">
                      Stock: <strong>{product.stock} u.</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditProductModal(product)}
                      className="px-3 py-1.5 bg-[#141413] hover:bg-[#364637] text-[#F8F7F4] rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDuplicateProduct(product)}
                      className="p-2 bg-white border border-[#E2DFD7] rounded-xl text-[#6B675E] hover:text-[#141413]"
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProductToDelete(product)}
                      className="p-2 bg-white border border-[#E2DFD7] rounded-xl text-red-600 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          {viewMode === 'table' && (
            <div className="hidden md:block bg-white rounded-2xl border border-[#E2DFD7] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141413] text-[#F8F7F4] font-mono text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Prenda & Color</th>
                      <th className="py-3.5 px-3">Categoría & Talles</th>
                      <th className="py-3.5 px-3">Precio Lista</th>
                      <th className="py-3.5 px-3">Packs (5+ / 10+)</th>
                      <th className="py-3.5 px-3 text-center">Stock</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2DFD7]">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-[#F8F7F4] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={resolveProductImage(product.image, product.category)}
                              alt={product.name}
                              onError={(e) => handleImageError(e, product.category)}
                              className="w-12 h-14 object-cover rounded-lg bg-[#F8F7F4] border border-[#E2DFD7] shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-[#141413] text-xs block truncate max-w-xs">
                                {product.name}
                              </span>
                              <span className="text-[11px] text-[#6B675E] block truncate max-w-xs">
                                {product.color || product.hook}
                              </span>
                              <span className="font-mono text-[10px] text-[#6B675E]">
                                SKU: {product.sku}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-[#EFECE6] text-[#141413] text-[11px] font-semibold">
                            {product.category}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(product.sizes || ['Único']).map((sz) => (
                              <span key={sz} className="text-[10px] font-mono text-[#6B675E]">
                                {sz}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap font-mono font-bold text-sm text-[#141413]">
                          {formatCurrency(product.priceUnit, false)}
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px] text-[#6B675E]">
                          <div>5u: {product.priceTiers?.tier5 ? formatCurrency(product.priceTiers.tier5, false) : '-'}</div>
                          <div className="text-[#364637] font-bold">
                            10u: {product.priceTiers?.tier10 ? formatCurrency(product.priceTiers.tier10, false) : '-'}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center border border-[#E2DFD7] rounded-xl bg-[#F8F7F4] p-0.5">
                            <button
                              onClick={() => handleQuickStockChange(product, -1)}
                              className="w-6 h-6 flex items-center justify-center text-[#6B675E] hover:text-[#141413]"
                            >
                              -
                            </button>
                            <span
                              className={`w-9 text-center font-mono font-bold text-xs ${
                                product.stock === 0
                                  ? 'text-red-600'
                                  : product.stock <= 10
                                  ? 'text-amber-700'
                                  : 'text-[#141413]'
                              }`}
                            >
                              {product.stock}
                            </span>
                            <button
                              onClick={() => handleQuickStockChange(product, 1)}
                              className="w-6 h-6 flex items-center justify-center text-[#6B675E] hover:text-[#141413]"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedProductForModal(product)}
                              className="p-1.5 rounded-lg text-[#6B675E] hover:text-[#141413] hover:bg-[#EFECE6]"
                              title="Vista previa en Tienda"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicateProduct(product)}
                              className="p-1.5 rounded-lg text-[#6B675E] hover:text-[#141413] hover:bg-[#EFECE6]"
                              title="Duplicar prenda"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditProductModal(product)}
                              className="p-1.5 rounded-lg bg-[#EFECE6] text-[#141413] hover:bg-[#141413] hover:text-white transition-colors"
                              title="Editar prenda / cambiar foto"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(product)}
                              className="p-1.5 rounded-lg text-[#6B675E] hover:text-red-600 hover:bg-red-50"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Batch Price Modal */}
      {isBatchPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[#141413]/70 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E2DFD7]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD7]">
              <h3 className="text-base font-bold text-[#141413] font-serif">
                Ajuste Masivo de Precios
              </h3>
              <button
                onClick={() => setIsBatchPriceModalOpen(false)}
                className="p-1 text-[#6B675E] hover:text-[#141413]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-[#6B675E] mb-1">Categoría</label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D4D0C7] text-xs font-semibold bg-white outline-hidden"
                >
                  <option value="Todos">Toda la Colección ({products.length} prendas)</option>
                  {CATALOG_CATEGORIES.filter((c) => c !== 'Todos').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B675E] mb-1">
                  Porcentaje de Ajuste (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    value={batchPercentage}
                    onChange={(e) => setBatchPercentage(parseFloat(e.target.value) || 0)}
                    className="flex-1 p-2.5 rounded-xl border border-[#D4D0C7] font-mono text-sm font-bold outline-hidden"
                  />
                  <span className="text-sm font-bold text-[#141413] font-mono">%</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {[-10, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setBatchPercentage(pct)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                        batchPercentage === pct
                          ? 'bg-[#141413] text-white border-[#141413]'
                          : 'bg-[#F8F7F4] text-[#6B675E] border-[#E2DFD7]'
                      }`}
                    >
                      {pct > 0 ? `+${pct}%` : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {batchSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{batchSuccessMsg}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-[#E2DFD7]">
              <button
                type="button"
                onClick={() => setIsBatchPriceModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B675E]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyBatchPrices}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#141413] hover:bg-[#364637] text-[#F8F7F4]"
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141413]/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E2DFD7]">
            <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-center text-[#141413]">
              ¿Eliminar esta prenda?
            </h3>
            <p className="text-xs text-center text-[#6B675E] mt-2">
              Vas a quitar <strong>{productToDelete.name}</strong> ({productToDelete.sku}) de la tienda.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#D4D0C7] text-[#141413] text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
