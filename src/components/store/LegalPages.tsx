import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { DEMO_MODE } from '../../config';
import { navigate, type LegalPageId } from '../../utils/router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

/**
 * Páginas legales exigidas para vender online en Argentina.
 * Los textos son un modelo general y se completan con los datos de Configuración.
 * Cada comercio debería revisarlos con su asesor legal.
 */

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-base font-semibold text-[#141413] pt-4">{children}</h2>
);

const Terms: React.FC = () => {
  const { companySettings: s } = useStore();
  const who = s.legalName || s.companyName;
  return (
    <>
      <p>
        Estos términos rigen las compras realizadas en la tienda online de <strong>{s.companyName}</strong>
        {s.legalName ? `, operada por ${s.legalName}` : ''}
        {s.cuit ? ` (CUIT ${s.cuit})` : ''}
        {s.address ? `, con domicilio en ${s.address}${s.city ? `, ${s.city}` : ''}` : ''}. Al confirmar un pedido, el
        comprador acepta estas condiciones.
      </p>
      <H2>Precios y disponibilidad</H2>
      <p>
        Los precios están expresados en pesos argentinos e incluyen IVA, salvo que se indique lo contrario al elegir
        Factura A. Las prendas se reservan al confirmar el pedido y están sujetas a disponibilidad de stock.
      </p>
      <H2>Medios de pago</H2>
      <p>
        Los pagos con tarjeta se procesan a través de Mercado Pago; esta tienda no recibe ni guarda los datos de tu
        tarjeta. En pagos por transferencia, el pedido se despacha una vez acreditado el importe.
      </p>
      <H2>Envíos y entregas</H2>
      <p>
        El costo y la forma de envío se informan antes de confirmar la compra. Los plazos de entrega son estimados y
        pueden variar según el destino y el transportista.
      </p>
      <H2>Cambios y devoluciones</H2>
      <p>
        Podés solicitar cambios de talle o prenda comunicándote con nosotros. La prenda debe estar sin uso, con sus
        etiquetas y en su empaque original.
      </p>
      <H2>Derecho de arrepentimiento</H2>
      <p>
        Según el artículo 34 de la Ley 24.240 de Defensa del Consumidor, tenés 10 días corridos desde que recibís el
        producto para revocar la compra sin costo ni responsabilidad. Podés hacerlo desde el{' '}
        <a href="/arrepentimiento" className="underline">
          Botón de arrepentimiento
        </a>
        .
      </p>
      <H2>Garantía</H2>
      <p>Los productos cuentan con la garantía legal prevista en la Ley 24.240.</p>
      <H2>Contacto</H2>
      <p>
        {who}
        {s.email ? ` · ${s.email}` : ''}
        {s.phone ? ` · WhatsApp ${s.phone}` : ''}
      </p>
    </>
  );
};

const Privacy: React.FC = () => {
  const { companySettings: s } = useStore();
  return (
    <>
      <p>
        <strong>{s.legalName || s.companyName}</strong> es responsable de los datos personales que nos das al comprar
        (nombre, teléfono, email, documento y dirección de entrega).
      </p>
      <H2>Para qué usamos tus datos</H2>
      <p>
        Solo para procesar y entregar tu pedido, emitir la factura, comunicarnos con vos sobre la compra y cumplir
        obligaciones legales. No vendemos ni cedemos tus datos a terceros, salvo a quienes intervienen en el pago
        (Mercado Pago) y en el envío.
      </p>
      <H2>Tus derechos</H2>
      <p>
        Podés pedir acceso, rectificación o eliminación de tus datos escribiendo a {s.email || 'nuestro email de contacto'}
        . El titular de los datos tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a
        intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto (art. 14, inc. 3, Ley
        25.326). La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, tiene la atribución
        de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre
        protección de datos personales.
      </p>
      <H2>Cookies y estadísticas</H2>
      <p>
        Guardamos tu carrito en tu navegador. Si la tienda usa herramientas de estadísticas (como Google Analytics o el
        píxel de Meta), estas registran datos anónimos de navegación.
      </p>
    </>
  );
};

const Withdrawal: React.FC = () => {
  const { companySettings: s } = useStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', orderNumber: '', reason: '' });
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (DEMO_MODE) {
      setCode('ARR-DEMO0000');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/arrepentimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No pudimos registrar la solicitud.');
      setCode(data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos registrar la solicitud.');
    } finally {
      setSending(false);
    }
  };

  if (code) {
    return (
      <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-5 text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 mx-auto text-[var(--brand-accent)]" />
        <p className="font-semibold text-[#141413]">Recibimos tu solicitud</p>
        <p>
          Tu código de seguimiento es <strong className="font-mono">{code}</strong>. Guardalo: nos vamos a comunicar con
          vos para coordinar la devolución.
        </p>
      </div>
    );
  }

  const input = 'w-full text-sm p-2.5 border border-[#D8D4CB] bg-white outline-hidden focus:border-[var(--brand-primary)]';
  return (
    <>
      <p>
        Tenés 10 días corridos desde que recibiste tu compra para revocarla (art. 34, Ley 24.240 y Resolución 424/2020).
        Completá el formulario y te enviamos un código de seguimiento.
      </p>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <label className="block">
          <span className="block text-xs font-medium mb-1">Nombre y apellido *</span>
          <input required maxLength={160} className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block">
          <span className="block text-xs font-medium mb-1">Número de pedido *</span>
          <input
            required
            maxLength={64}
            className={input}
            value={form.orderNumber}
            onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium mb-1">Email</span>
          <input type="email" maxLength={160} className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="block">
          <span className="block text-xs font-medium mb-1">Teléfono</span>
          <input type="tel" maxLength={50} className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <label className="block sm:col-span-2">
          <span className="block text-xs font-medium mb-1">Motivo (opcional)</span>
          <textarea rows={3} maxLength={1000} className={input} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </label>
        {error && (
          <p role="alert" className="sm:col-span-2 text-xs text-red-800">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={sending || (!form.email && !form.phone)}
          className="sm:col-span-2 py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
        >
          {sending ? 'Enviando...' : 'Solicitar la revocación de mi compra'}
        </button>
        <p className="sm:col-span-2 text-[11px] text-[#6B6862]">Ingresá al menos un email o un teléfono.</p>
      </form>
      {s.email && (
        <p className="text-xs">
          También podés escribirnos a {s.email}
          {s.phone ? ` o por WhatsApp al ${s.phone}` : ''}.
        </p>
      )}
    </>
  );
};

const TITLES: Record<LegalPageId, string> = {
  terminos: 'Términos y condiciones',
  privacidad: 'Política de privacidad',
  arrepentimiento: 'Botón de arrepentimiento'
};

export const LegalPage: React.FC<{ page: LegalPageId }> = ({ page }) => {
  const { companySettings } = useStore();
  useEffect(() => {
    document.title = `${TITLES[page]} | ${companySettings.companyName}`;
    window.scrollTo(0, 0);
  }, [page, companySettings.companyName]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="text-xs text-[#6B6862] hover:text-[#141413] flex items-center gap-1.5 mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Volver a la tienda
      </button>
      <h1 className="text-3xl font-serif font-semibold text-[#141413] mb-6">{TITLES[page]}</h1>
      <div className="space-y-3 text-sm text-[#4E4B46] leading-relaxed">
        {page === 'terminos' && <Terms />}
        {page === 'privacidad' && <Privacy />}
        {page === 'arrepentimiento' && <Withdrawal />}
      </div>
    </div>
  );
};
