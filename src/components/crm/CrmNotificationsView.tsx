import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CrmNotification } from '../../types';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Package,
  AlertTriangle,
  Clock,
  Volume2,
  VolumeX,
  Phone,
  ExternalLink,
  Sparkles,
  Flame,
  Search,
  Inbox
} from 'lucide-react';

interface CrmNotificationsViewProps {
  onNavigateToTab?: (tab: 'orders' | 'clients' | 'kanban') => void;
}

export const CrmNotificationsView: React.FC<CrmNotificationsViewProps> = ({
  onNavigateToTab
}) => {
  const {
    notifications,
    unreadNotificationsCount,
    urgentNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    isSoundEnabled,
    toggleSound,
    simulateIncomingOrder,
    simulateUrgentInteraction,
    setSelectedEntityForFocus,
    companySettings
  } = useStore();

  const brandName = companySettings?.companyName || 'TU TIENDA';
  const [activeFilter, setActiveFilter] = useState<'all' | 'orders' | 'urgent' | 'unread'>('all');
  const [search, setSearch] = useState('');

  const filteredNotifications = notifications.filter((notif) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'unread' && !notif.isRead) ||
      (activeFilter === 'orders' && notif.type === 'new_order') ||
      (activeFilter === 'urgent' &&
        (notif.type === 'urgent_interaction' || notif.priority === 'urgent'));

    const q = search.toLowerCase();
    const matchesSearch =
      notif.title.toLowerCase().includes(q) ||
      notif.message.toLowerCase().includes(q) ||
      (notif.metadata?.clientName && notif.metadata.clientName.toLowerCase().includes(q)) ||
      (notif.metadata?.orderNumber && notif.metadata.orderNumber.toLowerCase().includes(q));

    return matchesFilter && matchesSearch;
  });

  const handleAction = (notif: CrmNotification) => {
    markNotificationAsRead(notif.id);

    if (notif.entityType === 'order') {
      if (notif.entityId) {
        setSelectedEntityForFocus({ type: 'order', id: notif.entityId });
      }
      onNavigateToTab?.('orders');
    } else if (notif.entityType === 'interaction' || notif.entityType === 'client') {
      if (notif.entityId) {
        setSelectedEntityForFocus({ type: 'client', id: notif.entityId });
      }
      onNavigateToTab?.('clients');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-[#E2DFD7] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-[#141413] font-serif">
              Centro de Alertas {brandName}
            </h2>
            {urgentNotificationsCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <Flame className="w-3 h-3" />
                <span>{urgentNotificationsCount} URGENTES</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B675E] mt-1">
            Nuevos pedidos de la tienda de ropa y consultas urgentes de clientes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleSound}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-[#E2DFD7] bg-[#F8F7F4] text-[#141413]"
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-[#364637]" /> : <VolumeX className="w-4 h-4 text-[#6B675E]" />}
            <span>{isSoundEnabled ? 'Sonido Activo' : 'Silenciado'}</span>
          </button>

          {unreadNotificationsCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="px-3 py-2 bg-[#EFECE6] hover:bg-[#E2DFD7] text-[#141413] rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-[#364637]" />
              <span>Marcar leídas</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="px-3 py-2 bg-white hover:bg-red-50 text-[#6B675E] hover:text-red-700 border border-[#E2DFD7] rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Simulator Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="bg-[#EFECE6] p-4 rounded-2xl border border-[#E2DFD7] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141413] text-[#F8F7F4] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#141413]">Probar Nuevo Pedido</h4>
              <p className="text-[11px] text-[#6B675E] mt-0.5">
                Simula una venta entrante desde el catálogo web.
              </p>
            </div>
          </div>
          <button
            onClick={() => simulateIncomingOrder()}
            className="px-3 py-2 bg-[#141413] hover:bg-[#364637] text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simular</span>
          </button>
        </div>

        <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-red-950">Probar Alerta Urgente</h4>
              <p className="text-[11px] text-red-800/80 mt-0.5">
                Simula consulta prioritaria por talle o entrega hoy.
              </p>
            </div>
          </div>
          <button
            onClick={() => simulateUrgentInteraction()}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simular</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-2xl border border-[#E2DFD7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { key: 'all', label: `Todas (${notifications.length})` },
            { key: 'orders', label: 'Pedidos' },
            { key: 'urgent', label: 'Urgentes' },
            { key: 'unread', label: `Sin leer (${unreadNotificationsCount})` }
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setActiveFilter(pill.key as typeof activeFilter)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                activeFilter === pill.key
                  ? 'bg-[#141413] text-[#F8F7F4]'
                  : 'bg-[#F8F7F4] text-[#6B675E] hover:bg-[#EFECE6]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#6B675E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar alerta o pedido..."
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#E2DFD7] bg-[#F8F7F4] outline-hidden focus:border-[#364637]"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2DFD7] p-10 text-center">
            <Inbox className="w-10 h-10 text-[#9C988F] mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[#141413]">Sin alertas</h3>
            <p className="text-xs text-[#6B675E] mt-1">
              Usá los simuladores de arriba para ver cómo llegan los avisos de pedidos.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isUrgent =
              notif.priority === 'urgent' || notif.type === 'urgent_interaction';
            const isOrder = notif.type === 'new_order';

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !notif.isRead
                    ? isUrgent
                      ? 'bg-red-50/60 border-red-200'
                      : 'bg-[#EFECE6]/60 border-[#D4D0C7]'
                    : 'bg-white border-[#E2DFD7]'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                      isUrgent
                        ? 'bg-red-600 text-white'
                        : isOrder
                        ? 'bg-[#364637] text-white'
                        : 'bg-[#141413] text-white'
                    }`}
                  >
                    {isUrgent ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : isOrder ? (
                      <Package className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                          isUrgent
                            ? 'bg-red-600 text-white'
                            : isOrder
                            ? 'bg-[#364637] text-white'
                            : 'bg-[#EFECE6] text-[#141413]'
                        }`}
                      >
                        {isUrgent ? 'URGENTE' : isOrder ? 'NUEVO PEDIDO' : 'AVISO'}
                      </span>
                      <span className="text-[#6B675E] text-xs font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.createdAt}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#141413]">{notif.title}</h3>
                    <p className="text-xs text-[#6B675E] mt-1">{notif.message}</p>

                    {notif.metadata && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        {notif.metadata.orderNumber && (
                          <span className="bg-white text-[#141413] font-mono font-bold px-2 py-0.5 rounded border border-[#E2DFD7] text-[11px]">
                            {notif.metadata.orderNumber}
                          </span>
                        )}
                        {notif.metadata.total && (
                          <span className="font-mono font-bold text-[#364637]">
                            {formatCurrency(notif.metadata.total)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                  {isOrder && (
                    <button
                      onClick={() => handleAction(notif)}
                      className="px-3.5 py-2 bg-[#141413] hover:bg-[#364637] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Ver Pedido</span>
                    </button>
                  )}

                  {isUrgent && notif.metadata?.phone && (
                    <a
                      href={generateWhatsAppLink(
                        notif.metadata.phone,
                        `Hola ${notif.metadata.clientName || ''}, te contactamos de ${brandName} por tu consulta.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {(notif.entityType === 'client' || notif.entityType === 'interaction') && (
                    <button
                      onClick={() => handleAction(notif)}
                      className="px-3 py-2 bg-white text-[#141413] border border-[#D4D0C7] rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver Ficha</span>
                    </button>
                  )}

                  {!notif.isRead && (
                    <button
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="p-2 rounded-xl text-[#6B675E] hover:text-emerald-700 border border-[#E2DFD7]"
                      title="Marcar como leída"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-2 rounded-xl text-[#6B675E] hover:text-red-600 border border-[#E2DFD7]"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
