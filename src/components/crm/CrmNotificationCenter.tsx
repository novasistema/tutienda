import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { DEMO_MODE } from '../../config';
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
  X,
  ExternalLink,
  Sparkles,
  Phone,
  Flame
} from 'lucide-react';

interface CrmNotificationCenterProps {
  onNavigateToTab?: (tab: 'orders' | 'clients' | 'kanban') => void;
}

export const CrmNotificationCenter: React.FC<CrmNotificationCenterProps> = ({
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

  const brandName = companySettings?.companyName || 'Mi Tienda';
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'orders' | 'urgent' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'orders') return notif.type === 'new_order';
    if (filter === 'urgent')
      return notif.type === 'urgent_interaction' || notif.priority === 'urgent';
    return true;
  });

  const handleActionClick = (notif: CrmNotification) => {
    markNotificationAsRead(notif.id);
    setIsOpen(false);

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
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl transition-all flex items-center justify-center border ${
          isOpen
            ? 'bg-[var(--brand-accent)] text-white border-[var(--brand-accent)]'
            : 'bg-white/10 hover:bg-white/20 text-[#F8F7F4] border-white/15'
        }`}
        title="Centro de Alertas"
        aria-label="Abrir centro de notificaciones"
      >
        <Bell className={`w-4 h-4 ${urgentNotificationsCount > 0 ? 'text-red-300' : 'text-[#F8F7F4]'}`} />
        {unreadNotificationsCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 px-1 min-w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${
              urgentNotificationsCount > 0 ? 'bg-red-600' : 'bg-[var(--brand-accent)]'
            }`}
          >
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 sm:w-96 max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-[#E2DFD7] z-50 flex flex-col overflow-hidden">
          <div className="bg-[var(--brand-primary)] text-[#F8F7F4] p-3.5 border-b border-[#2A2A27] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#C6B79E]" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider">Alertas {brandName}</h3>
                <p className="text-[11px] text-[#9C988F]">Pedidos y consultas prioritarias</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-lg bg-white/10 text-[#F8F7F4] hover:bg-white/20"
                title={isSoundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
              >
                {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#9C988F] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {DEMO_MODE && (
          <div className="bg-[#EFECE6] px-3.5 py-2 border-b border-[#E2DFD7] flex items-center justify-between text-xs gap-2">
            <span className="text-[11px] text-[#6B675E] font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
              Probar alerta:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => simulateIncomingOrder()}
                className="px-2 py-1 bg-white hover:bg-[var(--brand-primary)] hover:text-white text-[#141413] border border-[#D4D0C7] rounded-lg text-[10px] font-bold flex items-center gap-1"
              >
                <Package className="w-3 h-3" />
                <span>+ Pedido</span>
              </button>
              <button
                onClick={() => simulateUrgentInteraction()}
                className="px-2 py-1 bg-red-100 hover:bg-red-600 hover:text-white text-red-900 border border-red-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
              >
                <Flame className="w-3 h-3" />
                <span>+ Urgente</span>
              </button>
            </div>
          </div>
          )}

          <div className="px-3 py-2 bg-[#F8F7F4] border-b border-[#E2DFD7] flex items-center justify-between gap-1 overflow-x-auto no-scrollbar text-[11px]">
            <div className="flex items-center gap-1">
              {[
                { key: 'all', label: 'Todas' },
                { key: 'orders', label: 'Pedidos' },
                { key: 'urgent', label: 'Urgentes' },
                { key: 'unread', label: 'Sin leer' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as typeof filter)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    filter === item.key
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'text-[#6B675E] hover:bg-[#EFECE6]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-[10px] text-[var(--brand-accent)] font-bold flex items-center gap-1 shrink-0"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Leer todo</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#E2DFD7] max-h-80">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B675E]">
                No hay alertas para mostrar.
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUrgent =
                  notif.priority === 'urgent' || notif.type === 'urgent_interaction';
                const isOrder = notif.type === 'new_order';

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 flex items-start gap-3 ${
                      !notif.isRead ? 'bg-[#F8F7F4]' : 'bg-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                        isUrgent
                          ? 'bg-red-100 text-red-700'
                          : isOrder
                          ? 'bg-[#EFECE6] text-[var(--brand-accent)]'
                          : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {isUrgent ? <AlertTriangle className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] text-[#6B675E] font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {notif.createdAt}
                        </span>
                        <div className="flex items-center gap-1">
                          {!notif.isRead && (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="text-[#6B675E] hover:text-emerald-700 p-1"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="text-[#9C988F] hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-[#141413] leading-tight">{notif.title}</h4>
                      <p className="text-[11px] text-[#6B675E] mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {isOrder && (
                          <button
                            onClick={() => handleActionClick(notif)}
                            className="px-2.5 py-1 bg-[var(--brand-primary)] text-white rounded-lg text-[10px] font-bold"
                          >
                            Ver Pedido
                          </button>
                        )}
                        {isUrgent && notif.metadata?.phone && (
                          <a
                            href={generateWhatsAppLink(
                              notif.metadata.phone,
                              `Hola ${notif.metadata.clientName || ''}, te escribimos de ${brandName} por tu consulta.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        {notif.metadata?.total && (
                          <span className="text-[10px] font-mono font-bold text-[var(--brand-accent)]">
                            {formatCurrency(notif.metadata.total)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2.5 bg-[#F8F7F4] border-t border-[#E2DFD7] flex items-center justify-between text-[10px] text-[#6B675E]">
              <span>Total: {notifications.length}</span>
              <button
                onClick={clearAllNotifications}
                className="hover:text-red-600 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Vaciar</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const CrmToastAlert: React.FC<{
  onNavigateToTab?: (tab: 'orders' | 'clients' | 'kanban') => void;
}> = ({ onNavigateToTab }) => {
  const {
    activeToastNotification,
    dismissToast,
    markNotificationAsRead,
    setSelectedEntityForFocus
  } = useStore();

  if (!activeToastNotification) return null;

  const isUrgent =
    activeToastNotification.priority === 'urgent' ||
    activeToastNotification.type === 'urgent_interaction';
  const isOrder = activeToastNotification.type === 'new_order';

  const handleAction = () => {
    markNotificationAsRead(activeToastNotification.id);
    dismissToast();

    if (activeToastNotification.entityType === 'order') {
      if (activeToastNotification.entityId) {
        setSelectedEntityForFocus({ type: 'order', id: activeToastNotification.entityId });
      }
      onNavigateToTab?.('orders');
    } else if (
      activeToastNotification.entityType === 'interaction' ||
      activeToastNotification.entityType === 'client'
    ) {
      if (activeToastNotification.entityId) {
        setSelectedEntityForFocus({ type: 'client', id: activeToastNotification.entityId });
      }
      onNavigateToTab?.('clients');
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 left-3 sm:left-auto sm:right-6 z-50 sm:max-w-sm">
      <div
        className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 ${
          isUrgent
            ? 'bg-red-950 text-white border-red-800'
            : 'bg-[var(--brand-primary)] text-[#F8F7F4] border-[#2A2A27]'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
            isUrgent ? 'bg-red-600 text-white' : 'bg-[var(--brand-accent)] text-white'
          }`}
        >
          {isUrgent ? <AlertTriangle className="w-4 h-4" /> : <Package className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-mono uppercase tracking-wider opacity-80 block">
            {isUrgent ? 'Atención Prioritaria' : 'Nuevo Pedido'} · {activeToastNotification.createdAt}
          </span>
          <h4 className="text-xs font-bold leading-snug mt-0.5">{activeToastNotification.title}</h4>
          <p className="text-[11px] opacity-80 mt-1 line-clamp-2">
            {activeToastNotification.message}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={handleAction}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#F8F7F4] text-[#141413] flex items-center gap-1"
            >
              <span>{isOrder ? 'Ver Pedido' : 'Atender'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={dismissToast}
              className="px-2 py-1.5 text-[11px] opacity-75 hover:opacity-100"
            >
              Cerrar
            </button>
          </div>
        </div>

        <button onClick={dismissToast} className="opacity-70 hover:opacity-100 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
