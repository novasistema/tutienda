import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CompanySettings } from '../../types';
import { withSettingsDefaults, missingSetupFields } from '../../data/defaultSettings';
import { compressImageFileToDataUrl } from '../../utils/imageUtils';
import { DEMO_MODE } from '../../config';
import {
  Building2,
  CreditCard,
  Save,
  CheckCircle2,
  Receipt,
  ShieldCheck,
  Palette,
  Truck,
  Tags,
  AlertTriangle,
  Upload
} from 'lucide-react';

const inputCls =
  'w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] bg-white outline-hidden focus:border-[var(--brand-accent)]';

const Field: React.FC<{ label: string; hint?: string; className?: string; children: React.ReactNode }> = ({
  label,
  hint,
  className,
  children
}) => (
  <label className={`block ${className || ''}`}>
    <span className="block text-[11px] font-bold text-[#6B675E] mb-1">{label}</span>
    {children}
    {hint && <span className="block text-[10px] text-[#9C988F] mt-1">{hint}</span>}
  </label>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label
}) => (
  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#141413]">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 accent-[var(--brand-accent)]"
    />
    <span>{label}</span>
  </label>
);

const Section: React.FC<{ icon: React.ElementType; title: string; subtitle: string; children: React.ReactNode }> = ({
  icon: Icon,
  title,
  subtitle,
  children
}) => (
  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2DFD7] space-y-4">
    <div className="flex items-center gap-2.5 border-b border-[#E2DFD7] pb-3">
      <div className="w-8 h-8 rounded-lg bg-[#EFECE6] text-[#141413] flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-[#141413]">{title}</h4>
        <p className="text-[11px] text-[#6B675E]">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

export const CompanySettingsView: React.FC = () => {
  const { companySettings, updateCompanySettings, isFirebaseAdmin } = useStore();
  const [formData, setFormData] = useState<CompanySettings>(withSettingsDefaults(companySettings));
  const [categoriesText, setCategoriesText] = useState((companySettings.categories || []).join('\n'));
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (companySettings) {
      setFormData(withSettingsDefaults(companySettings));
      setCategoriesText((companySettings.categories || []).join('\n'));
    }
  }, [companySettings]);

  const set = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) =>
    setFormData((f) => ({ ...f, [key]: value }));

  const handleImage = async (key: 'logoUrl' | 'heroImageUrl', file?: File) => {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, key === 'logoUrl' ? 320 : 1200, 0.78);
      set(key, dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo procesar la imagen.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    const categories = categoriesText
      .split('\n')
      .map((c) => c.trim().slice(0, 60))
      .filter(Boolean)
      .filter((c, i, arr) => arr.indexOf(c) === i)
      .slice(0, 40);
    try {
      await updateCompanySettings({
        ...formData,
        categories: categories.length ? categories : formData.categories,
        bannerTexts: (formData.bannerTexts || []).slice(0, 3).map((t) => t.slice(0, 120)),
        orderPrefix: (formData.orderPrefix || 'PED').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6),
        updatedAt: new Date().toISOString().split('T')[0]
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar. Revisá que estés conectado con una cuenta de administrador.');
    } finally {
      setIsSaving(false);
    }
  };

  const missing = missingSetupFields(formData);
  const banner = formData.bannerTexts || ['', '', ''];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#141413] font-serif">Configuración de la tienda</h3>
          <p className="text-xs text-[#6B675E]">
            Marca, medios de pago, envíos y categorías. Todo lo que cargues acá se ve en la tienda.
          </p>
        </div>

        {isSaved && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Configuración guardada</span>
          </div>
        )}
      </div>

      {DEMO_MODE && !isFirebaseAdmin && (
        <div className="p-3 rounded-xl bg-[#EFECE6] border border-[#E2DFD7] text-xs text-[#4E4B46]">
          Estás en la demostración: los cambios se ven en tu navegador pero no se guardan.
        </div>
      )}

      {missing.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Falta completar:</strong> {missing.join(' · ')}
          </span>
        </div>
      )}

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section icon={Building2} title="Datos del negocio" subtitle="Se usan en la tienda, los comprobantes y las páginas legales">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <Field label="Nombre de la tienda *">
              <input
                type="text"
                required
                maxLength={120}
                value={formData.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                className={`${inputCls} font-semibold`}
              />
            </Field>
            <Field label="Razón social">
              <input
                type="text"
                maxLength={160}
                value={formData.legalName}
                onChange={(e) => set('legalName', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="CUIT">
              <input
                type="text"
                maxLength={40}
                value={formData.cuit}
                onChange={(e) => set('cuit', e.target.value)}
                placeholder="30-12345678-9"
                className={`${inputCls} font-mono`}
              />
            </Field>
            <Field label="Dirección del local" className="sm:col-span-2">
              <input
                type="text"
                maxLength={200}
                value={formData.address}
                onChange={(e) => set('address', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Ciudad">
              <input
                type="text"
                maxLength={120}
                value={formData.city}
                onChange={(e) => set('city', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="WhatsApp de ventas *" hint="Con código de país, ej. +54 9 11 4000-0000">
              <input
                type="tel"
                maxLength={50}
                value={formData.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </Field>
            <Field label="Email de contacto *">
              <input
                type="email"
                maxLength={160}
                value={formData.email}
                onChange={(e) => set('email', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Provincia">
              <input
                type="text"
                maxLength={120}
                value={formData.province}
                onChange={(e) => set('province', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Instagram (link)">
              <input
                type="url"
                maxLength={300}
                value={formData.instagramUrl || ''}
                onChange={(e) => set('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/mitienda"
                className={inputCls}
              />
            </Field>
            <Field label="Facebook (link)">
              <input
                type="url"
                maxLength={300}
                value={formData.facebookUrl || ''}
                onChange={(e) => set('facebookUrl', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        <Section icon={Palette} title="Marca y diseño" subtitle="Logo, colores y textos de la portada">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <Field label="Frase de la marca" hint="Aparece en la portada y en el título de la página">
              <input
                type="text"
                maxLength={120}
                value={formData.tagline || ''}
                onChange={(e) => set('tagline', e.target.value)}
                placeholder="Ropa de autor hecha en Argentina"
                className={inputCls}
              />
            </Field>
            <Field label="Título de la portada" className="sm:col-span-2">
              <input
                type="text"
                maxLength={160}
                value={formData.heroTitle || ''}
                onChange={(e) => set('heroTitle', e.target.value)}
                placeholder="Prendas esenciales de diseño noble y corte contemporáneo."
                className={inputCls}
              />
            </Field>
            <Field label="Texto de la portada" className="sm:col-span-2 lg:col-span-3">
              <textarea
                rows={2}
                maxLength={400}
                value={formData.heroText || ''}
                onChange={(e) => set('heroText', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Color principal" hint="Botones y franjas oscuras">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primaryColor || '#141413'}
                  onChange={(e) => set('primaryColor', e.target.value)}
                  className="w-10 h-9 rounded-lg border border-[#D4D0C7] cursor-pointer"
                />
                <span className="font-mono">{formData.primaryColor}</span>
              </div>
            </Field>
            <Field label="Color de acento" hint="Íconos, precios destacados y botón de WhatsApp">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.accentColor || '#364637'}
                  onChange={(e) => set('accentColor', e.target.value)}
                  className="w-10 h-9 rounded-lg border border-[#D4D0C7] cursor-pointer"
                />
                <span className="font-mono">{formData.accentColor}</span>
              </div>
            </Field>
            <Field label="Logo" hint="PNG o JPG. Si no cargás uno, se muestra el nombre.">
              <div className="flex items-center gap-3">
                {formData.logoUrl && (
                  <img src={formData.logoUrl} alt="Logo" className="h-10 w-auto max-w-24 object-contain bg-[#F8F7F4] rounded" />
                )}
                <span className="px-3 py-2 rounded-xl border border-[#D4D0C7] bg-white flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" /> Subir
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage('logoUrl', e.target.files?.[0])} />
                {formData.logoUrl && (
                  <button type="button" onClick={() => set('logoUrl', '')} className="text-[11px] underline cursor-pointer">
                    Quitar
                  </button>
                )}
              </div>
            </Field>
            <Field label="Foto de portada" hint="Horizontal, idealmente 1200 px de ancho.">
              <div className="flex items-center gap-3">
                {formData.heroImageUrl && (
                  <img src={formData.heroImageUrl} alt="Portada" className="h-10 w-16 object-cover rounded" />
                )}
                <span className="px-3 py-2 rounded-xl border border-[#D4D0C7] bg-white flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" /> Subir
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage('heroImageUrl', e.target.files?.[0])} />
                {formData.heroImageUrl && (
                  <button type="button" onClick={() => set('heroImageUrl', '')} className="text-[11px] underline cursor-pointer">
                    Quitar
                  </button>
                )}
              </div>
            </Field>
            <Field label="Prefijo de pedidos" hint="Ej. TT → pedido TT-000123">
              <input
                type="text"
                maxLength={6}
                value={formData.orderPrefix || ''}
                onChange={(e) => set('orderPrefix', e.target.value.toUpperCase())}
                className={`${inputCls} font-mono uppercase`}
              />
            </Field>
            {[0, 1, 2].map((i) => (
              <Field key={i} label={`Banner superior · frase ${i + 1}`} hint={i === 2 ? 'Dejá vacío para no mostrarla' : undefined}>
                <input
                  type="text"
                  maxLength={120}
                  value={banner[i] || ''}
                  onChange={(e) => {
                    const next = [banner[0] || '', banner[1] || '', banner[2] || ''];
                    next[i] = e.target.value;
                    set('bannerTexts', next);
                  }}
                  className={inputCls}
                />
              </Field>
            ))}
            <Field label="Texto del pie de página" className="sm:col-span-2 lg:col-span-3">
              <input
                type="text"
                maxLength={300}
                value={formData.footerText || ''}
                onChange={(e) => set('footerText', e.target.value)}
                placeholder="Envíos a todo el país · Cambios sin cargo"
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        <Section icon={Tags} title="Categorías y ventas" subtitle="Cómo se organiza el catálogo y cómo se vende">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            <Field label="Categorías del catálogo" hint="Una por línea. Ej. Remeras, Jeans, Calzado.">
              <textarea
                rows={7}
                value={categoriesText}
                onChange={(e) => setCategoriesText(e.target.value)}
                className={inputCls}
              />
            </Field>
            <div className="space-y-4">
              <Field label="Compra mínima (0 = sin mínimo)">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.minimumOrder}
                  onChange={(e) => set('minimumOrder', Math.max(0, Number(e.target.value) || 0))}
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Toggle
                checked={!!formData.wholesaleEnabled}
                onChange={(v) => set('wholesaleEnabled', v)}
                label="Precios por cantidad (venta mayorista: x5, x10, x100)"
              />
              <Toggle
                checked={!!formData.invoiceAEnabled}
                onChange={(v) => set('invoiceAEnabled', v)}
                label="Ofrecer Factura A (suma 21% de IVA al subtotal)"
              />
            </div>
          </div>
        </Section>

        <Section icon={Truck} title="Envíos y retiro" subtitle="Opciones que ve el comprador al finalizar la compra">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-[#E2DFD7] space-y-3">
              <Toggle
                checked={formData.shippingCorreoEnabled !== false}
                onChange={(v) => set('shippingCorreoEnabled', v)}
                label="Envío a domicilio (correo)"
              />
              <Field label="Costo">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.shippingCorreoCost || 0}
                  onChange={(e) => set('shippingCorreoCost', Math.max(0, Number(e.target.value) || 0))}
                  className={`${inputCls} font-mono`}
                />
              </Field>
            </div>
            <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-[#E2DFD7] space-y-3">
              <Toggle
                checked={!!formData.shippingExpressEnabled}
                onChange={(v) => set('shippingExpressEnabled', v)}
                label="Moto / expreso"
              />
              <Field label="Costo">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.shippingExpressCost || 0}
                  onChange={(e) => set('shippingExpressCost', Math.max(0, Number(e.target.value) || 0))}
                  className={`${inputCls} font-mono`}
                />
              </Field>
            </div>
            <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-[#E2DFD7] space-y-3">
              <Toggle
                checked={formData.pickupEnabled !== false}
                onChange={(v) => set('pickupEnabled', v)}
                label="Retiro en el local (y pago en efectivo)"
              />
              <Field label="Dónde se retira">
                <input
                  type="text"
                  maxLength={200}
                  value={formData.pickupAddress || ''}
                  onChange={(e) => set('pickupAddress', e.target.value)}
                  placeholder="Showroom en Palermo, lunes a sábado 10 a 19 hs"
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-[#E2DFD7] space-y-3">
              <Field label="Envío gratis desde (0 = nunca)">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.freeShippingFrom || 0}
                  onChange={(e) => set('freeShippingFrom', Math.max(0, Number(e.target.value) || 0))}
                  className={`${inputCls} font-mono`}
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section icon={CreditCard} title="Cobros" subtitle="Medios de pago que se ofrecen en la tienda">
          <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-[#E2DFD7] space-y-2 text-xs">
            <Toggle
              checked={!!formData.mercadoPagoEnabled}
              onChange={(v) => set('mercadoPagoEnabled', v)}
              label="Mercado Pago (tarjetas, débito y dinero en cuenta)"
            />
            <p className="text-[11px] text-[#6B675E]">
              Requiere cargar el Access Token de Mercado Pago del comercio en el servidor (variable MP_ACCESS_TOKEN, ver
              guía de instalación). Las cuotas se configuran en la cuenta de Mercado Pago.
            </p>
          </div>

          <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-[#E2DFD7] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#141413] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[var(--brand-accent)]" />
                <span>Transferencia bancaria</span>
              </span>
              <Toggle
                checked={formData.transferEnabled !== false}
                onChange={(v) => set('transferEnabled', v)}
                label="Ofrecer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <Field label="Banco">
                <input type="text" maxLength={120} value={formData.bankName} onChange={(e) => set('bankName', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Titular">
                <input
                  type="text"
                  maxLength={160}
                  value={formData.accountHolder}
                  onChange={(e) => set('accountHolder', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="CBU / CVU">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={40}
                  value={formData.cbu}
                  onChange={(e) => set('cbu', e.target.value.replace(/\s/g, ''))}
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="Alias">
                <input
                  type="text"
                  maxLength={80}
                  value={formData.alias}
                  onChange={(e) => set('alias', e.target.value.toUpperCase())}
                  className={`${inputCls} font-mono uppercase font-bold`}
                />
              </Field>
            </div>
            <p className="text-[11px] text-[#6B675E]">Revisá bien el CBU y el alias: los compradores transfieren a esta cuenta.</p>
          </div>
        </Section>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#6B675E] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[var(--brand-accent)] shrink-0" />
            <span>La configuración se aplica en toda la tienda al guardar.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-[#F8F7F4] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar configuración'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
