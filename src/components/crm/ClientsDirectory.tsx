import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Client, Interaction } from '../../types';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import {
  Plus,
  MessageCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Search,
  X,
  Package,
  Send,
  History
} from 'lucide-react';

export const ClientsDirectory: React.FC = () => {
  const {
    clients,
    addClient,
    orders,
    interactions,
    addInteraction,
    selectedEntityForFocus,
    companySettings
  } = useStore();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);

  const brandName = companySettings?.companyName || 'Mi Tienda';

  const [interactionType, setInteractionType] = useState<Interaction['type']>('whatsapp');
  const [interactionNote, setInteractionNote] = useState('');
  const [isUrgentInteraction, setIsUrgentInteraction] = useState(false);
  const [urgencyReason, setUrgencyReason] = useState('Consulta urgente de talle o envío');

  React.useEffect(() => {
    if (selectedEntityForFocus?.type === 'client' && selectedEntityForFocus.id) {
      const found = clients.find((c) => c.id === selectedEntityForFocus.id);
      if (found) {
        setSelectedClientDetail(found);
      }
    }
  }, [selectedEntityForFocus, clients]);

  const [form, setForm] = useState({
    name: '',
    businessName: '',
    cuitOrDni: '',
    phone: '',
    email: '',
    city: '',
    province: 'Buenos Aires',
    tier: 'Minorista' as Client['tier'],
    notes: ''
  });

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.businessName.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;

    addClient({
      name: form.name,
      businessName: form.businessName || 'Cliente Particular',
      cuitOrDni: form.cuitOrDni || 'S/D',
      phone: form.phone,
      email: form.email || '',
      city: form.city || 'Buenos Aires',
      province: form.province,
      tier: form.tier,
      notes: form.notes
    });

    setIsAddModalOpen(false);
    setForm({
      name: '',
      businessName: '',
      cuitOrDni: '',
      phone: '',
      email: '',
      city: '',
      province: 'Buenos Aires',
      tier: 'Minorista',
      notes: ''
    });
  };

  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientDetail || !interactionNote.trim()) return;

    addInteraction({
      clientId: selectedClientDetail.id,
      type: interactionType,
      note: isUrgentInteraction
        ? `[PRIORITARIO: ${urgencyReason}] ${interactionNote.trim()}`
        : interactionNote.trim(),
      author: `Asesor ${brandName}`,
      urgency: isUrgentInteraction ? 'urgent' : 'normal',
      clientName: selectedClientDetail.businessName || selectedClientDetail.name
    });

    setInteractionNote('');
    setIsUrgentInteraction(false);
  };

  const getTierBadge = (tier: Client['tier']) => {
    switch (tier) {
      case 'Distribuidor':
        return (
          <span className="bg-[var(--brand-primary)] text-[#F8F7F4] text-[10px] font-bold px-2 py-0.5 rounded">
            VIP Boutique
          </span>
        );
      case 'Mayorista Oro':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded">
            Showroom Oro
          </span>
        );
      case 'Mayorista Plata':
        return (
          <span className="bg-[#EFECE6] text-[#141413] border border-[#D4D0C7] text-[10px] font-bold px-2 py-0.5 rounded">
            Cliente Frecuente
          </span>
        );
      default:
        return (
          <span className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border border-[var(--brand-accent)]/20 text-[10px] font-bold px-2 py-0.5 rounded">
            Particular
          </span>
        );
    }
  };

  const clientOrders = selectedClientDetail
    ? orders.filter(
        (o) =>
          o.customerName.toLowerCase() === selectedClientDetail.name.toLowerCase() ||
          (o.businessName &&
            o.businessName.toLowerCase() === selectedClientDetail.businessName.toLowerCase()) ||
          o.phone === selectedClientDetail.phone
      )
    : [];

  const clientInteractions = selectedClientDetail
    ? interactions.filter((i) => i.clientId === selectedClientDetail.id)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#141413] font-serif">
            Directorio de Clientes & Fidelización
          </h3>
          <p className="text-xs text-[#6B675E]">
            Historial de compras, talles habituales, notas de atención y contacto rápido por WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#6B675E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente o ciudad..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#E2DFD7] bg-white outline-hidden focus:border-[var(--brand-accent)]"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-[#F8F7F4] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Grid of Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const waText = `Hola ${client.name}, te escribimos de ${brandName} para contarte sobre los nuevos ingresos de temporada.`;
          const waUrl = generateWhatsAppLink(client.phone, waText);

          return (
            <div
              key={client.id}
              className="bg-white rounded-2xl p-5 border border-[#E2DFD7] hover:border-[#C8C3B8] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div onClick={() => setSelectedClientDetail(client)} className="cursor-pointer">
                    <h4 className="text-sm font-bold text-[#141413] hover:text-[var(--brand-accent)] transition-colors">
                      {client.name}
                    </h4>
                    <p className="text-xs text-[#6B675E] font-medium mt-0.5">
                      {client.businessName}
                    </p>
                  </div>
                  {getTierBadge(client.tier)}
                </div>

                <div className="mt-3 space-y-1 text-xs text-[#6B675E]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {client.city}, {client.province}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono">{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2 bg-[#F8F7F4] p-2.5 rounded-xl border border-[#E2DFD7] text-xs">
                  <div>
                    <span className="text-[10px] text-[#6B675E] uppercase font-bold block">
                      Total Comprado
                    </span>
                    <strong className="font-mono font-bold text-[#141413] tabular-nums">
                      {formatCurrency(client.totalSpent, false)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B675E] uppercase font-bold block">
                      Pedidos
                    </span>
                    <strong className="font-mono font-bold text-[#141413]">
                      {client.orderCount} compras
                    </strong>
                  </div>
                </div>

                {client.notes && (
                  <p className="mt-2.5 text-[11px] text-[#6B675E] italic line-clamp-2">
                    "{client.notes}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2DFD7] flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedClientDetail(client)}
                  className="text-xs font-bold text-[#141413] hover:text-[var(--brand-accent)] flex items-center gap-1 transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Historial y Notas</span>
                </button>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Detail Modal */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[var(--brand-primary)]/75 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92dvh] overflow-y-auto shadow-2xl border border-[#E2DFD7]">
            <div className="p-5 border-b border-[#E2DFD7] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFECE6] text-[#141413] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#141413] font-serif">
                    {selectedClientDetail.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#6B675E] flex-wrap">
                    <span>{selectedClientDetail.businessName}</span>
                    <span>·</span>
                    {getTierBadge(selectedClientDetail.tier)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientDetail(null)}
                className="p-1.5 text-[#6B675E] hover:text-[#141413] rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8F7F4] p-3.5 rounded-2xl border border-[#E2DFD7] text-xs">
                <div>
                  <span className="text-[10px] text-[#6B675E] uppercase font-bold block">Teléfono:</span>
                  <strong className="text-[#141413] font-mono">{selectedClientDetail.phone}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B675E] uppercase font-bold block">Email:</span>
                  <strong className="text-[#141413] truncate block">{selectedClientDetail.email || '-'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B675E] uppercase font-bold block">Ciudad:</span>
                  <strong className="text-[#141413]">
                    {selectedClientDetail.city}, {selectedClientDetail.province}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B675E] uppercase font-bold block">Total Histórico:</span>
                  <strong className="text-[var(--brand-accent)] font-mono font-bold">
                    {formatCurrency(selectedClientDetail.totalSpent, false)}
                  </strong>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[var(--brand-accent)]" />
                  <span>Historial de Pedidos ({clientOrders.length})</span>
                </h4>

                {clientOrders.length === 0 ? (
                  <div className="p-4 bg-[#F8F7F4] rounded-xl border border-[#E2DFD7] text-center text-xs text-[#6B675E]">
                    Sin pedidos registrados con este teléfono o nombre.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 bg-white rounded-xl border border-[#E2DFD7] text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono font-bold text-[#141413]">{ord.orderNumber}</span>
                          <p className="text-[11px] text-[#6B675E] mt-0.5">
                            {ord.items.length} prendas · {ord.createdAt}
                          </p>
                        </div>
                        <div className="text-right">
                          <strong className="font-mono font-bold text-[#141413] block">
                            {formatCurrency(ord.total)}
                          </strong>
                          <span className="text-[10px] text-[#6B675E] capitalize">
                            {ord.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactions */}
              <div className="space-y-3 pt-3 border-t border-[#E2DFD7]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141413] flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[var(--brand-accent)]" />
                  <span>Notas de Atención ({clientInteractions.length})</span>
                </h4>

                <form
                  onSubmit={handleAddInteraction}
                  className="bg-[#F8F7F4] p-3.5 rounded-2xl border border-[#E2DFD7] space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#141413]">Canal:</span>
                    <select
                      value={interactionType}
                      onChange={(e) => setInteractionType(e.target.value as Interaction['type'])}
                      className="text-xs p-1.5 rounded-lg border border-[#D4D0C7] bg-white font-medium"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="llamada">Llamada</option>
                      <option value="email">Email</option>
                      <option value="reunion">Showroom / Local</option>
                      <option value="nota">Nota Interna</option>
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={interactionNote}
                      onChange={(e) => setInteractionNote(e.target.value)}
                      placeholder="Ej. Prefiere talle M en camisas y tonos neutros..."
                      className="flex-1 text-xs p-2.5 rounded-xl border border-[#D4D0C7] bg-white outline-hidden focus:border-[var(--brand-accent)]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#141413] font-semibold">
                      <input
                        type="checkbox"
                        checked={isUrgentInteraction}
                        onChange={(e) => setIsUrgentInteraction(e.target.checked)}
                        className="accent-red-600 w-3.5 h-3.5"
                      />
                      <span className={isUrgentInteraction ? 'text-red-700 font-bold' : ''}>
                        Marcar como seguimiento prioritario
                      </span>
                    </label>

                    {isUrgentInteraction && (
                      <select
                        value={urgencyReason}
                        onChange={(e) => setUrgencyReason(e.target.value)}
                        className="text-[10px] p-1 rounded-md border border-red-200 bg-red-50 text-red-900 font-bold outline-hidden"
                      >
                        <option value="Consulta urgente de talle o envío">Cambio de talle / stock</option>
                        <option value="Comprobante enviado">Comprobante enviado</option>
                        <option value="Pedido para evento">Entrega con fecha fija</option>
                      </select>
                    )}
                  </div>
                </form>

                <div className="space-y-2">
                  {clientInteractions.map((item) => {
                    const isItemUrgent = item.urgency === 'urgent' || item.note.includes('[PRIORITARIO');
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border text-xs ${
                          isItemUrgent
                            ? 'bg-red-50/60 border-red-200 text-[#141413]'
                            : 'bg-white border-[#E2DFD7] text-[#141413]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold uppercase tracking-wider text-[var(--brand-accent)]">
                            {item.type}
                          </span>
                          <span className="text-[#6B675E] font-mono text-[10px]">{item.createdAt}</span>
                        </div>
                        <p>{item.note}</p>
                        <span className="text-[10px] text-[#6B675E] block mt-1">Por: {item.author}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[var(--brand-primary)]/75 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E2DFD7]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD7] mb-4">
              <h3 className="font-bold text-[#141413] font-serif text-base">
                Registrar Nuevo Cliente
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#6B675E] hover:text-[#141413]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B675E] mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Sofía Méndez"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[var(--brand-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B675E] mb-1">Showroom / Etiqueta</label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="Ej. Compra Particular o Boutique"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[var(--brand-accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B675E] mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+54 9 11 ..."
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[var(--brand-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B675E] mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Ej. Palermo, CABA"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[var(--brand-accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B675E] mb-1">Preferencias / Talles</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Talles habituales, estilo preferido..."
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
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
