import React, { useState } from 'react';
import { SALES_SCRIPTS } from '../../data/crmMockData';
import { generateWhatsAppLink } from '../../utils/formatters';
import { Copy, Check, Sparkles, Send } from 'lucide-react';

export const SalesScriptsView: React.FC = () => {
  const [selectedScriptId, setSelectedScriptId] = useState(SALES_SCRIPTS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [clientName, setClientName] = useState('Lucía');
  const [businessName, setBusinessName] = useState('Tienda Online');
  const [amount, setAmount] = useState('$115.000');
  const [city, setCity] = useState('Palermo, CABA');
  const [customPhone, setCustomPhone] = useState('+54 9 11 5800-2244');

  const selectedScript =
    SALES_SCRIPTS.find((s) => s.id === selectedScriptId) || SALES_SCRIPTS[0];

  const getPopulatedText = (template: string) => {
    return template
      .replace(/{nombre}/g, clientName || 'hola')
      .replace(/{negocio}/g, businessName || 'Mi Tienda')
      .replace(/{monto}/g, amount || '$85.000')
      .replace(/{ciudad}/g, city || 'tu ciudad');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const currentText = getPopulatedText(selectedScript.text);
  const waUrl = generateWhatsAppLink(customPhone, currentText);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-[#141413] font-serif">
          Mensajes de Atención & Cierre por WhatsApp
        </h3>
        <p className="text-xs text-[#6B675E]">
          Plantillas listas para responder consultas de talles, confirmar envíos y avisar ingresos de colección.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E2DFD7] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--brand-accent)]" />
              <span>Personalizar Mensaje</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">Nombre:</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[var(--brand-accent)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">Showroom / Canal:</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[var(--brand-accent)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">Monto:</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-[#D4D0C7] outline-hidden font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">Ciudad:</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[var(--brand-accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">
                WhatsApp Destino:
              </label>
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-[#D4D0C7] outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            {SALES_SCRIPTS.map((script) => (
              <button
                key={script.id}
                onClick={() => setSelectedScriptId(script.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs ${
                  selectedScriptId === script.id
                    ? 'bg-[var(--brand-primary)] text-[#F8F7F4] border-[var(--brand-primary)]'
                    : 'bg-white text-[#141413] border-[#E2DFD7] hover:bg-[#EFECE6]'
                }`}
              >
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded inline-block mb-1 ${
                    selectedScriptId === script.id
                      ? 'bg-[var(--brand-accent)] text-white'
                      : 'bg-[#EFECE6] text-[#6B675E]'
                  }`}
                >
                  {script.category}
                </span>
                <strong className="block font-bold text-xs">{script.title}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2DFD7] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2DFD7] pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--brand-accent)] bg-[#EFECE6] px-2 py-0.5 rounded">
                {selectedScript.category}
              </span>
              <h4 className="text-base font-bold text-[#141413] font-serif mt-1">
                {selectedScript.title}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(selectedScript.id, currentText)}
                className="px-3 py-1.5 bg-[#EFECE6] hover:bg-[#E2DFD7] text-[#141413] rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                {copiedId === selectedScript.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-emerald-800">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </a>
            </div>
          </div>

          <div className="bg-[#EFECE6] p-4 sm:p-5 rounded-2xl border border-[#E2DFD7]">
            <div className="bg-white rounded-2xl p-4 shadow-xs max-w-lg border border-[#E2DFD7] text-xs text-[#141413] whitespace-pre-wrap leading-relaxed">
              {currentText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
