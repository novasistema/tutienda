import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductSpec, ClothingCategory } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  ASSET_IMAGES,
  resolveProductImage,
  handleImageError,
  compressImageFileToDataUrl
} from '../../utils/imageUtils';
import {
  X,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Calculator,
  Layers,
  Tag,
  Package,
  AlertCircle,
  Upload,
  Camera,
  Loader2,
  Scissors,
  Check
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Remera Boxy Negra', url: ASSET_IMAGES.remera },
  { label: 'Camisa Lino Atelier', url: ASSET_IMAGES.camisa },
  { label: 'Pantalón Sastrero', url: ASSET_IMAGES.pantalon },
  { label: 'Tapado Lana Oliva', url: ASSET_IMAGES.tapado },
  { label: 'Editorial Cápsula', url: ASSET_IMAGES.hero }
];

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44', '46', 'Único'];

const AVAILABLE_ICONS = [
  { name: 'layers', label: 'Tela / Composición' },
  { name: 'scissors', label: 'Moldería / Corte' },
  { name: 'sparkles', label: 'Terminación' },
  { name: 'shield', label: 'Cuidado / Calidad' },
  { name: 'feather', label: 'Liviano / Caída' },
  { name: 'wind', label: 'Respirabilidad' },
  { name: 'sliders', label: 'Ajuste / Calce' },
  { name: 'thermometer', label: 'Abrigo / Térmico' },
  { name: 'check', label: 'Garantía' }
];

export const ProductEditModal: React.FC = () => {
  const {
    isProductEditModalOpen,
    closeProductEditModal,
    productToEdit,
    addProduct,
    updateProduct,
    companySettings
  } = useStore();

  const isEditing = Boolean(productToEdit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [hook, setHook] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('');
  const [sku, setSku] = useState('');
  const [code, setCode] = useState('');
  const [brand, setBrand] = useState((companySettings.companyName || ''));
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [fit, setFit] = useState('');
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [customSizeInput, setCustomSizeInput] = useState('');

  const [priceUnit, setPriceUnit] = useState<number>(38500);
  const [tier5, setTier5] = useState<number>(35500);
  const [tier10, setTier10] = useState<number>(32500);
  const [stock, setStock] = useState<number>(20);
  const [image, setImage] = useState('');
  const [badges, setBadges] = useState<string[]>([]);
  const [newBadgeText, setNewBadgeText] = useState('');
  const [specs, setSpecs] = useState<ProductSpec[]>([]);
  const [featured, setFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const [activeTab, setActiveTab] = useState<'info' | 'image' | 'pricing' | 'specs'>('info');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when opening modal
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setHook(productToEdit.hook);
      setCategory(productToEdit.category);
      setSku(productToEdit.sku);
      setCode(productToEdit.code || '');
      setBrand(productToEdit.brand || (companySettings.companyName || ''));
      setColor(productToEdit.color || '');
      setMaterial(productToEdit.material || '');
      setFit(productToEdit.fit || '');
      setSizes(productToEdit.sizes && productToEdit.sizes.length > 0 ? productToEdit.sizes : ['S', 'M', 'L']);
      setPriceUnit(productToEdit.priceUnit);
      setTier5(productToEdit.priceTiers?.tier5 || Math.round((productToEdit.priceUnit * 0.92) / 100) * 100);
      setTier10(productToEdit.priceTiers?.tier10 || Math.round((productToEdit.priceUnit * 0.85) / 100) * 100);
      setStock(productToEdit.stock);
      setImage(productToEdit.image);
      setBadges(productToEdit.badges || []);
      setSpecs(productToEdit.specs || []);
      setFeatured(Boolean(productToEdit.featured));
      setIsNew(Boolean(productToEdit.isNew));
      setImageSizeKb(
        productToEdit.image?.startsWith('data:image/')
          ? Math.round((productToEdit.image.length * 0.75) / 1024)
          : null
      );
    } else {
      const randomSkuNum = Math.floor(100 + Math.random() * 900);
      setName('');
      setHook('');
      setCategory(companySettings.categories?.[0] || 'General');
      setSku(`${(companySettings.orderPrefix || 'SKU').toUpperCase()}-${randomSkuNum}`);
      setCode('');
      setBrand((companySettings.companyName || ''));
      setColor('Negro Lavado');
      setMaterial('100% Algodón Peinado');
      setFit('Relaxed Fit');
      setSizes(['S', 'M', 'L', 'XL']);
      setPriceUnit(42000);
      setTier5(38600);
      setTier10(35700);
      setStock(24);
      setImage(ASSET_IMAGES.remera);
      setBadges(['Nueva Colección', 'Stock Inmediato']);
      setSpecs([
        { label: 'TEXTIL', desc: 'Fibra seleccionada de alta durabilidad y caída.', iconName: 'layers' },
        { label: 'MOLDERÍA', desc: 'Corte contemporáneo diseñado en nuestro atelier.', iconName: 'scissors' },
        { label: 'TERMINACIÓN', desc: 'Costuras reforzadas y lavado pre-encogido.', iconName: 'sparkles' }
      ]);
      setFeatured(true);
      setIsNew(true);
      setImageSizeKb(null);
    }
    setActiveTab('info');
    setErrorMsg('');
  }, [productToEdit, isProductEditModalOpen]);

  if (!isProductEditModalOpen) return null;

  const handleToggleSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleAddCustomSize = () => {
    const clean = customSizeInput.trim().toUpperCase();
    if (clean && !sizes.includes(clean)) {
      setSizes((prev) => [...prev, clean]);
      setCustomSizeInput('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setIsUploadingImage(true);

    try {
      const compressedDataUrl = await compressImageFileToDataUrl(file, 760, 0.82);
      setImage(compressedDataUrl);
      setImageSizeKb(Math.round((compressedDataUrl.length * 0.75) / 1024));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo procesar la fotografía seleccionada.';
      setErrorMsg(message);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCalculateTiers = () => {
    if (!priceUnit || priceUnit <= 0) return;
    const roundToHundred = (n: number) => Math.round(n / 100) * 100;
    setTier5(roundToHundred(priceUnit * 0.92));
    setTier10(roundToHundred(priceUnit * 0.85));
  };

  const handleAddBadge = () => {
    const trimmed = newBadgeText.trim();
    if (trimmed && !badges.includes(trimmed)) {
      setBadges([...badges, trimmed]);
      setNewBadgeText('');
    }
  };

  const handleRemoveBadge = (index: number) => {
    setBadges(badges.filter((_, i) => i !== index));
  };

  const handleAddSpec = () => {
    setSpecs([
      ...specs,
      { label: 'DETALLE TEXTIL', desc: 'Descripción de tela o confección', iconName: 'layers' }
    ]);
  };

  const handleUpdateSpec = (index: number, field: keyof ProductSpec, value: string) => {
    const updated = [...specs];
    updated[index] = { ...updated[index], [field]: value };
    setSpecs(updated);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre de la prenda es obligatorio.');
      setActiveTab('info');
      return;
    }
    if (!sku.trim()) {
      setErrorMsg('El código SKU es obligatorio.');
      setActiveTab('info');
      return;
    }
    if (!priceUnit || priceUnit <= 0) {
      setErrorMsg('El precio de venta debe ser mayor a 0.');
      setActiveTab('pricing');
      return;
    }
    if (!image.trim()) {
      setErrorMsg('Subí una foto o seleccioná una imagen de catálogo para la prenda.');
      setActiveTab('image');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const productPayload: Omit<Product, 'id'> = {
        name: name.trim(),
        hook: hook.trim() || `${material || 'Diseño exclusivo'} · ${brand}`,
        category,
        sku: sku.trim().toUpperCase(),
        code: code.trim() || undefined,
        brand: brand.trim() || (companySettings.companyName || ''),
        color: color.trim() || undefined,
        material: material.trim() || undefined,
        fit: fit.trim() || undefined,
        sizes: sizes.length > 0 ? sizes : ['Único'],
        priceUnit: Number(priceUnit),
        priceTiers: {
          tier5: tier5 > 0 ? Number(tier5) : undefined,
          tier10: tier10 > 0 ? Number(tier10) : undefined
        },
        badges: badges.length > 0 ? badges : [category],
        specs: specs.length > 0 ? specs : [],
        image: image.trim(),
        stock: Number(stock) || 0,
        featured,
        isNew
      };

      if (isEditing && productToEdit) {
        await updateProduct({
          ...productPayload,
          id: productToEdit.id
        });
      } else {
        await addProduct(productPayload);
      }

      closeProductEditModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la prenda.';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-[var(--brand-primary)]/75 backdrop-blur-xs">
      <div
        className="bg-[#F8F7F4] rounded-t-3xl sm:rounded-3xl max-w-4xl w-full max-h-[92dvh] flex flex-col shadow-2xl border border-[#E2DFD7] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-[var(--brand-primary)] text-[#F8F7F4] px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between border-b border-[#2A2A27]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-accent)] text-[#F8F7F4] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-[#F8F7F4]/10 text-[#E2DFD7] px-2 py-0.5 rounded">
                  {isEditing ? 'Edición de Prenda' : 'Nueva Prenda'}
                </span>
                <span className="text-xs text-[#9C988F]">Catálogo</span>
              </div>
              <h2 className="text-base sm:text-xl font-bold text-white font-serif tracking-tight mt-0.5 truncate">
                {isEditing ? productToEdit?.name : 'Cargar Nueva Prenda & Fotografía'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeProductEditModal}
            className="p-2 text-[#9C988F] hover:text-white rounded-xl hover:bg-white/10 transition-colors shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#EFECE6] border-b border-[#E2DFD7] px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5 shrink-0">
          {[
            { id: 'info', label: 'Prenda & Talles', icon: Tag },
            { id: 'image', label: 'Subir Foto', icon: Camera },
            { id: 'pricing', label: 'Precios & Packs', icon: Calculator },
            { id: 'specs', label: `Confección (${specs.length})`, icon: Layers }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[var(--brand-primary)] text-[#F8F7F4]'
                    : 'text-[#6B675E] hover:bg-[#E2DFD7]/60 hover:text-[#141413]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800 font-medium shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: PRENDA & TALLES */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-1">
                    Nombre de la Prenda *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Camisa Lino Belga Arena"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C7] bg-white text-sm font-semibold text-[#141413] focus:border-[var(--brand-accent)] outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-1">
                    Subtítulo / Descripción breve
                  </label>
                  <input
                    type="text"
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    placeholder="Ej. Lino puro pre-lavado · Botones de nácar natural"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C7] bg-white text-sm text-[#141413] focus:border-[var(--brand-accent)] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-1">
                    Categoría *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ClothingCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C7] bg-white text-sm font-semibold text-[#141413] focus:border-[var(--brand-accent)] outline-hidden"
                  >
                    {[...new Set([...(companySettings.categories || []), ...(category ? [category] : [])])].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-1">
                    Línea / Marca *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Marca de la prenda"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C7] bg-white text-sm text-[#141413] focus:border-[var(--brand-accent)] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ej. Negro Lavado, Arena, Oliva"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C7] bg-white text-sm text-[#141413] focus:border-[var(--brand-accent)] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-1">
                    Calce / Fit
                  </label>
                  <input
                    type="text"
                    value={fit}
                    onChange={(e) => setFit(e.target.value)}
                    placeholder="Ej. Boxy Fit, Relaxed, Sastrero"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C7] bg-white text-sm text-[#141413] focus:border-[var(--brand-accent)] outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-1">
                    Composición Textil / Material
                  </label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Ej. 100% Algodón Peinado 240g"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C7] bg-white text-sm text-[#141413] focus:border-[var(--brand-accent)] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="TT-REM-001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C7] bg-white font-mono text-sm uppercase font-bold text-[#141413] focus:border-[var(--brand-accent)] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-1">
                    Stock Total Disponible *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C7] bg-white font-mono text-sm font-bold text-[#141413] focus:border-[var(--brand-accent)] outline-hidden"
                  />
                </div>
              </div>

              {/* Talles disponibles */}
              <div className="pt-3 border-t border-[#E2DFD7]">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-2">
                  Talles Disponibles (Tocá para activar/desactivar)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_SIZES.map((sz) => {
                    const selected = sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleToggleSize(sz)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                          selected
                            ? 'bg-[var(--brand-primary)] text-[#F8F7F4] border-[var(--brand-primary)]'
                            : 'bg-white text-[#6B675E] border-[#D4D0C7] hover:border-[var(--brand-primary)]'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSize();
                      }
                    }}
                    placeholder="Agregar otro talle (ej. 48 o 36)..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#D4D0C7] bg-white outline-hidden focus:border-[var(--brand-accent)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-3.5 py-2 bg-[#EFECE6] hover:bg-[#E2DFD7] text-[#141413] rounded-xl text-xs font-bold"
                  >
                    + Talle
                  </button>
                </div>
              </div>

              {/* Visibility Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer bg-white border border-[#E2DFD7] px-3.5 py-2.5 rounded-xl">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 accent-[var(--brand-accent)]"
                  />
                  <span className="text-xs font-bold text-[#141413]">Destacar en colección</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer bg-white border border-[#E2DFD7] px-3.5 py-2.5 rounded-xl">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="w-4 h-4 accent-[var(--brand-accent)]"
                  />
                  <span className="text-xs font-bold text-[#141413]">Etiquetar como "Nuevo Ingreso"</span>
                </label>
              </div>

              {/* Tags */}
              <div className="pt-2 border-t border-[#E2DFD7]">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-1.5">
                  Etiquetas de Prenda (máx. 2–3 recomendadas)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EFECE6] text-[#141413] rounded-lg text-xs font-semibold border border-[#E2DFD7]"
                    >
                      {badge}
                      <button
                        type="button"
                        onClick={() => handleRemoveBadge(idx)}
                        className="text-[#6B675E] hover:text-red-700 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBadgeText}
                    onChange={(e) => setNewBadgeText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBadge();
                      }
                    }}
                    placeholder="Ej. 100% Lino, Edición Atelier..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#D4D0C7] bg-white outline-hidden focus:border-[var(--brand-accent)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddBadge}
                    className="px-3.5 py-2 bg-[var(--brand-primary)] text-[#F8F7F4] rounded-xl text-xs font-bold"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBIDA DE FOTO DESDE CELULAR / PC */}
          {activeTab === 'image' && (
            <div className="space-y-5">
              {/* Upload Zone */}
              <div className="bg-white rounded-2xl border-2 border-dashed border-[#C8C3B8] p-5 sm:p-6 text-center space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-[#EFECE6] text-[#141413] mx-auto flex items-center justify-center">
                  {isUploadingImage ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-accent)]" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#141413]">
                    Subí una foto real de la prenda
                  </h4>
                  <p className="text-xs text-[#6B675E] mt-1 max-w-md mx-auto">
                    Elegí una imagen de la galería de tu celular, sacá una foto directa con la cámara o cargala desde tu computadora. Se optimiza automáticamente.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-[#F8F7F4] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isUploadingImage ? 'Optimizando foto...' : 'Elegir Foto o Usar Cámara'}</span>
                  </button>

                  {imageSizeKb !== null && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--brand-accent)] bg-[#EFECE6] px-3 py-1.5 rounded-xl">
                      <Check className="w-3.5 h-3.5" />
                      Foto cargada ({imageSizeKb} KB)
                    </span>
                  )}
                </div>
              </div>

              {/* Optional direct URL */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-1">
                  O pegar URL directa de imagen
                </label>
                <input
                  type="text"
                  value={image.startsWith('data:image/') ? '' : image}
                  onChange={(e) => {
                    setImageSizeKb(null);
                    setImage(e.target.value);
                  }}
                  placeholder={
                    image.startsWith('data:image/')
                      ? 'Fotografía subida desde archivo local (lista para guardar)'
                      : 'https://...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D0C7] bg-white text-xs font-mono text-[#141413] focus:border-[var(--brand-accent)] outline-hidden"
                />
              </div>

              {/* Studio Presets */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B675E] mb-2">
                  O usar fotografía base del estudio:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImageSizeKb(null);
                        setImage(preset.url);
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        image === preset.url
                          ? 'border-[var(--brand-primary)] bg-white ring-2 ring-[var(--brand-primary)]/15'
                          : 'border-[#E2DFD7] bg-white/70 hover:bg-white'
                      }`}
                    >
                      <img
                        src={resolveProductImage(preset.url)}
                        alt={preset.label}
                        onError={(e) => handleImageError(e)}
                        className="w-11 h-11 object-cover rounded-lg border border-[#E2DFD7] shrink-0"
                      />
                      <span className="text-xs font-semibold text-[#141413] line-clamp-2">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              {image && (
                <div className="p-4 bg-[#EFECE6] rounded-2xl border border-[#E2DFD7] flex flex-col items-center">
                  <span className="text-[11px] font-bold text-[#6B675E] uppercase tracking-wider mb-2">
                    Vista Previa en Catálogo
                  </span>
                  <div className="w-48 h-56 bg-white rounded-xl border border-[#E2DFD7] overflow-hidden shadow-xs">
                    <img
                      src={resolveProductImage(image, category)}
                      alt="Vista previa prenda"
                      onError={(e) => handleImageError(e, category)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRECIOS & PACKS */}
          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <div className="bg-[#EFECE6] border border-[#E2DFD7] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[#141413] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[var(--brand-accent)]" />
                    Precios por Prenda y Pack
                  </h4>
                  <p className="text-xs text-[#6B675E] mt-0.5">
                    Podés ofrecer descuentos automáticos cuando el cliente lleva 5 o 10 prendas surtidas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCalculateTiers}
                  className="px-3.5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-[#F8F7F4] rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Sugerir Escala (-8% / -15%)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[var(--brand-primary)] text-[#F8F7F4] rounded-2xl p-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#9C988F] mb-1">
                    Precio por Unidad (1 a 4 u.) *
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[#9C988F] font-bold">$</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="100"
                      value={priceUnit}
                      onChange={(e) => setPriceUnit(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-mono text-base font-bold outline-hidden"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#E2DFD7]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B675E] mb-1">
                    Pack desde 5 prendas (c/u)
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[#6B675E] font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={tier5}
                      onChange={(e) => setTier5(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#D4D0C7] font-mono text-base font-bold text-[#141413] outline-hidden"
                    />
                  </div>
                  <span className="text-[11px] text-[var(--brand-accent)] font-semibold block mt-1.5">
                    {priceUnit > 0 && tier5 > 0
                      ? `-${Math.round((1 - tier5 / priceUnit) * 100)}% ahorro`
                      : 'Opcional'}
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#E2DFD7]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B675E] mb-1">
                    Pack desde 10 prendas (c/u)
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[#6B675E] font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={tier10}
                      onChange={(e) => setTier10(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#D4D0C7] font-mono text-base font-bold text-[#141413] outline-hidden"
                    />
                  </div>
                  <span className="text-[11px] text-[var(--brand-accent)] font-semibold block mt-1.5">
                    {priceUnit > 0 && tier10 > 0
                      ? `-${Math.round((1 - tier10 / priceUnit) * 100)}% ahorro`
                      : 'Opcional'}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#E2DFD7]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B675E] mb-2">
                  Resumen visible en tienda:
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[var(--brand-primary)] text-[#F8F7F4] rounded-xl p-2.5">
                    <span className="text-[10px] uppercase block opacity-80">Precio Lista</span>
                    <span className="text-xs sm:text-sm font-bold font-mono">{formatCurrency(priceUnit, false)}</span>
                  </div>
                  <div className="bg-[#EFECE6] rounded-xl p-2.5">
                    <span className="text-[10px] uppercase text-[#6B675E] block">5+ Prendas</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-[#141413]">
                      {tier5 > 0 ? formatCurrency(tier5, false) : '-'}
                    </span>
                  </div>
                  <div className="bg-[#EFECE6] rounded-xl p-2.5">
                    <span className="text-[10px] uppercase text-[#6B675E] block">10+ Prendas</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-[var(--brand-accent)]">
                      {tier10 > 0 ? formatCurrency(tier10, false) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FICHA DE CONFECCIÓN */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413] flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-[var(--brand-accent)]" />
                    Detalles de Tela & Confección
                  </h4>
                  <p className="text-xs text-[#6B675E]">
                    Se muestran dentro de la ficha de prenda cuando el cliente toca para ver más.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSpec}
                  className="px-3 py-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-[#F8F7F4] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Detalle</span>
                </button>
              </div>

              <div className="space-y-3">
                {specs.map((spec, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-white rounded-2xl border border-[#E2DFD7] flex flex-col sm:flex-row items-start sm:items-center gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-[var(--brand-primary)] text-[#F8F7F4] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>

                    <div className="w-full sm:w-1/3">
                      <label className="text-[10px] font-bold text-[#6B675E] uppercase block mb-0.5">
                        Atributo
                      </label>
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(e) => handleUpdateSpec(index, 'label', e.target.value.toUpperCase())}
                        placeholder="Ej. GRAMAJE 240G"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D4D0C7] text-xs font-bold uppercase outline-hidden"
                      />
                    </div>

                    <div className="w-full sm:flex-1">
                      <label className="text-[10px] font-bold text-[#6B675E] uppercase block mb-0.5">
                        Detalle
                      </label>
                      <input
                        type="text"
                        value={spec.desc}
                        onChange={(e) => handleUpdateSpec(index, 'desc', e.target.value)}
                        placeholder="Ej. Jersey pesado de alta densidad"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D4D0C7] text-xs outline-hidden"
                      />
                    </div>

                    <div className="w-full sm:w-36">
                      <label className="text-[10px] font-bold text-[#6B675E] uppercase block mb-0.5">
                        Ícono
                      </label>
                      <select
                        value={spec.iconName || 'layers'}
                        onChange={(e) => handleUpdateSpec(index, 'iconName', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-[#D4D0C7] text-xs bg-white outline-hidden"
                      >
                        {AVAILABLE_ICONS.map((icon) => (
                          <option key={icon.name} value={icon.name}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(index)}
                      className="p-2 text-[#6B675E] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors self-end sm:self-center"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#E2DFD7] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={closeProductEditModal}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-[#D4D0C7] text-[#141413] hover:bg-[#EFECE6] text-xs font-bold transition-colors text-center"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving || isUploadingImage}
              className="px-6 py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] disabled:opacity-50 text-[#F8F7F4] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSaving
                  ? 'Guardando...'
                  : isEditing
                  ? 'Guardar Cambios'
                  : 'Publicar Prenda en Tienda'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
