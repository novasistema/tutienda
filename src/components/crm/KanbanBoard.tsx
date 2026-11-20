import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Deal, DealStage } from '../../types';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import {
  Plus,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Building2,
  Trash2,
  X,
  MapPin
} from 'lucide-react';

interface StageConfig {
  key: DealStage;
  title: string;
  dotColor: string;
}

const STAGES: StageConfig[] = [
  { key: 'lead', title: 'Nueva Consulta', dotColor: 'bg-blue-500' },
  { key: 'contacted', title: 'Asesorado / Talle', dotColor: 'bg-purple-500' },
  { key: 'quoted', title: 'Presupuesto Enviado', dotColor: 'bg-amber-500' },
  { key: 'payment_pending', title: 'Esperando Pago', dotColor: 'bg-[var(--brand-accent)]' },
  { key: 'won', title: 'Venta Confirmada', dotColor: 'bg-emerald-600' },
  { key: 'lost', title: 'Cancelada', dotColor: 'bg-zinc-400' }
];

export const KanbanBoard: React.FC = () => {
  const { deals, updateDealStage, addDeal, deleteDeal, companySettings } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDealForNotes, setSelectedDealForNotes] = useState<Deal | null>(null);
  const [mobileStage, setMobileStage] = useState<DealStage>('lead');

  const brandName = companySettings?.companyName || 'Mi Tienda';

  const [newDeal, setNewDeal] = useState({
    customerName: '',
    businessName: '',
    phone: '',
    email: '',
    city: '',
    stage: 'lead' as DealStage,
    totalAmount: 95000,
    notes: '',
    assignedSalesperson: `Asesoría ${brandName}`
  });

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.customerName || !newDeal.phone) return;

    addDeal({
      customerName: newDeal.customerName,
      businessName: newDeal.businessName || 'Consulta Web',
      phone: newDeal.phone,
      email: newDeal.email,
      city: newDeal.city || 'Buenos Aires',
      stage: newDeal.stage,
      items: [],
      totalAmount: Number(newDeal.totalAmount) || 0,
      notes: newDeal.notes,
      assignedSalesperson: newDeal.assignedSalesperson
    });

    setIsAddModalOpen(false);
    setNewDeal({
      customerName: '',
      businessName: '',
      phone: '',
      email: '',
      city: '',
      stage: 'lead',
      totalAmount: 95000,
      notes: '',
      assignedSalesperson: `Asesoría ${brandName}`
    });
  };

  const getNextStage = (current: DealStage): DealStage | null => {
    const order: DealStage[] = ['lead', 'contacted', 'quoted', 'payment_pending', 'won'];
    const idx = order.indexOf(current);
    if (idx >= 0 && idx < order.length - 1) return order[idx + 1];
    return null;
  };

  const getPrevStage = (current: DealStage): DealStage | null => {
    const order: DealStage[] = ['lead', 'contacted', 'quoted', 'payment_pending', 'won'];
    const idx = order.indexOf(current);
    if (idx > 0) return order[idx - 1];
    return null;
  };

  const renderDealCard = (deal: Deal) => {
    const next = getNextStage(deal.stage);
    const prev = getPrevStage(deal.stage);
    const waText = `Hola ${deal.customerName}, te escribimos de ${brandName} por tu consulta de prendas (${formatCurrency(deal.totalAmount)}).`;
    const waUrl = generateWhatsAppLink(deal.phone, waText);

    return (
      <div
        key={deal.id}
        className="bg-white rounded-xl p-3.5 border border-[#E2DFD7] flex flex-col justify-between gap-2.5"
      >
        <div>
          <div className="flex items-start justify-between gap-1">
            <h5 className="text-xs font-bold text-[#141413] line-clamp-1">{deal.customerName}</h5>
            <button
              onClick={() => deleteDeal(deal.id)}
              className="text-[#9C988F] hover:text-red-600 p-0.5"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {deal.businessName && (
            <div className="flex items-center gap-1 text-[11px] text-[#6B675E] mt-0.5 truncate">
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{deal.businessName}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-[10px] text-[#6B675E] mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{deal.city}</span>
          </div>

          <div className="mt-2.5 bg-[#F8F7F4] border border-[#E2DFD7] rounded-lg p-2 flex items-baseline justify-between">
            <span className="text-[10px] uppercase font-bold text-[#6B675E]">Monto</span>
            <span className="text-xs font-bold font-mono text-[#141413] tabular-nums">
              {formatCurrency(deal.totalAmount)}
            </span>
          </div>

          {deal.notes && (
            <p
              onClick={() => setSelectedDealForNotes(deal)}
              className="text-[11px] text-[#6B675E] mt-2 line-clamp-2 italic bg-[#F8F7F4] p-1.5 rounded cursor-pointer hover:bg-[#EFECE6]"
            >
              "{deal.notes}"
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-[#E2DFD7] flex items-center justify-between gap-1">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold flex items-center gap-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          <div className="flex items-center gap-1">
            {prev && (
              <button
                onClick={() => updateDealStage(deal.id, prev)}
                className="p-1.5 bg-[#EFECE6] hover:bg-[#E2DFD7] text-[#141413] rounded-md"
                title="Etapa anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {next && (
              <button
                onClick={() => updateDealStage(deal.id, next)}
                className="px-2.5 py-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white rounded-md text-[10px] font-bold flex items-center gap-0.5"
              >
                <span>Avanzar</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#141413] font-serif">
            Seguimiento Comercial & Consultas
          </h3>
          <p className="text-xs text-[#6B675E]">
            Controlá consultas por WhatsApp, reservas de talle y pedidos pendientes de pago
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-[#F8F7F4] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Consulta</span>
        </button>
      </div>

      {/* MOBILE STAGE SWITCHER */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {STAGES.map((st) => {
            const count = deals.filter((d) => d.stage === st.key).length;
            const active = mobileStage === st.key;
            return (
              <button
                key={st.key}
                onClick={() => setMobileStage(st.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-[var(--brand-primary)] text-[#F8F7F4]'
                    : 'bg-white text-[#6B675E] border border-[#E2DFD7]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${st.dotColor}`} />
                <span>{st.title}</span>
                <span className="font-mono text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2.5">
          {deals.filter((d) => d.stage === mobileStage).length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-[#E2DFD7] text-center text-xs text-[#6B675E]">
              Sin operaciones en esta etapa.
            </div>
          ) : (
            deals.filter((d) => d.stage === mobileStage).map(renderDealCard)
          )}
        </div>
      </div>

      {/* DESKTOP KANBAN COLUMNS */}
      <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-6 gap-3.5 pb-4">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.totalAmount, 0);

          return (
            <div
              key={stage.key}
              className="bg-[#EFECE6] rounded-2xl p-3 border border-[#E2DFD7] flex flex-col h-[640px]"
            >
              <div className="p-2.5 mb-2.5 bg-white rounded-xl border border-[#E2DFD7]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                    <h4 className="text-xs font-bold text-[#141413]">{stage.title}</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#6B675E] bg-[#F8F7F4] px-1.5 py-0.5 rounded">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between text-[11px]">
                  <span className="text-[#6B675E]">Total:</span>
                  <span className="font-mono font-bold text-[#141413] tabular-nums">
                    {formatCurrency(stageTotal, false)}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {stageDeals.length === 0 ? (
                  <div className="h-28 rounded-xl border border-dashed border-[#D4D0C7] flex items-center justify-center text-[11px] text-[#6B675E]">
                    Sin operaciones
                  </div>
                ) : (
                  stageDeals.map(renderDealCard)
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Deal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[var(--brand-primary)]/75 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E2DFD7]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD7] mb-4">
              <h3 className="font-bold text-[#141413] font-serif text-base">
                Nueva Consulta / Oportunidad
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#6B675E] hover:text-[#141413]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B675E] mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDeal.customerName}
                    onChange={(e) => setNewDeal({ ...newDeal, customerName: e.target.value })}
                    placeholder="Ej. Camila Rojas"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[var(--brand-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B675E] mb-1">
                    Canal / Boutique
                  </label>
                  <input
                    type="text"
                    value={newDeal.businessName}
                    onChange={(e) => setNewDeal({ ...newDeal, businessName: e.target.value })}
                    placeholder="Ej. Consulta Instagram"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[var(--brand-accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B675E] mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newDeal.phone}
                    onChange={(e) => setNewDeal({ ...newDeal, phone: e.target.value })}
                    placeholder="+54 9 11 ..."
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[var(--brand-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B675E] mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={newDeal.city}
                    onChange={(e) => setNewDeal({ ...newDeal, city: e.target.value })}
                    placeholder="Ej. Rosario"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[var(--brand-accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B675E] mb-1">
                    Monto Estimado (ARS)
                  </label>
                  <input
                    type="number"
                    value={newDeal.totalAmount}
                    onChange={(e) => setNewDeal({ ...newDeal, totalAmount: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B675E] mb-1">Etapa</label>
                  <select
                    value={newDeal.stage}
                    onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value as DealStage })}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden bg-white"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B675E] mb-1">
                  Prendas de interés y talles
                </label>
                <textarea
                  rows={2}
                  value={newDeal.notes}
                  onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                  placeholder="Ej. Consulta por Tapado Oliva talle M y Pantalón Sastrero talle 42..."
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[var(--brand-accent)]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6B675E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-[#F8F7F4] rounded-xl"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note view popup */}
      {selectedDealForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--brand-primary)]/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2DFD7] shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD7] mb-3">
              <h4 className="font-bold text-[#141413] text-sm">
                Consulta: {selectedDealForNotes.customerName}
              </h4>
              <button
                onClick={() => setSelectedDealForNotes(null)}
                className="text-[#6B675E] hover:text-[#141413]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-[#6B675E]">
              <p>
                <strong>Canal:</strong> {selectedDealForNotes.businessName || '-'}
              </p>
              <p>
                <strong>Ciudad:</strong> {selectedDealForNotes.city}
              </p>
              <p>
                <strong>Teléfono:</strong> {selectedDealForNotes.phone}
              </p>
              <p>
                <strong>Monto:</strong> {formatCurrency(selectedDealForNotes.totalAmount)}
              </p>
              <div className="bg-[#F8F7F4] p-3 rounded-xl border border-[#E2DFD7] mt-2">
                <strong className="block text-[#141413] mb-1">Detalle:</strong>
                <p className="whitespace-pre-wrap">{selectedDealForNotes.notes}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedDealForNotes(null)}
                className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
