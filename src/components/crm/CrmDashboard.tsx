import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { KanbanBoard } from './KanbanBoard';
import { QuotationBuilder } from './QuotationBuilder';
import { OrdersManager } from './OrdersManager';
import { ClientsDirectory } from './ClientsDirectory';
import { SalesScriptsView } from './SalesScriptsView';
import { CompanySettingsView } from './CompanySettingsView';
import { ProductsManager } from './ProductsManager';
import { PerformanceAnalyticsView } from './PerformanceAnalyticsView';
import { CrmLoginView } from './CrmLoginView';
import { CrmNotificationCenter, CrmToastAlert } from './CrmNotificationCenter';
import { CrmNotificationsView } from './CrmNotificationsView';
import { formatCurrency } from '../../utils/formatters';
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  FileText,
  MessageSquare,
  Store,
  Layers,
  Settings,
  LogOut,
  UserCheck,
  Boxes,
  BarChart3,
  Bell,
  Eye
} from 'lucide-react';

export const CrmDashboard: React.FC = () => {
  const {
    products,
    deals,
    orders,
    clients,
    setActiveTab,
    isCrmAuthenticated,
    isDemoMode,
    crmUser,
    logoutCrm,
    unreadNotificationsCount,
    urgentNotificationsCount,
    companySettings
  } = useStore();

  const [crmSubTab, setCrmSubTab] = useState<
    'orders' | 'products' | 'kanban' | 'clients' | 'analytics' | 'quote' | 'alerts' | 'scripts' | 'settings'
  >('orders');

  if (!isCrmAuthenticated) {
    return <CrmLoginView />;
  }

  // Compute live KPIs
  const wonDeals = deals.filter((d) => d.stage === 'won');
  const paidOrders = orders.filter(
    (o) => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered'
  );

  const totalRevenueWon =
    wonDeals.reduce((sum, d) => sum + d.totalAmount, 0) +
    paidOrders.reduce((sum, o) => sum + o.total, 0);

  const activePipelineDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
  const activePipelineValue = activePipelineDeals.reduce((sum, d) => sum + d.totalAmount, 0);

  const totalClosedOrdersCount = wonDeals.length + paidOrders.length;
  const averageTicket =
    totalClosedOrdersCount > 0 ? Math.round(totalRevenueWon / totalClosedOrdersCount) : 95000;

  return (
    <div className="min-h-screen bg-[#F8F7F4] pb-24 md:pb-16">
      {/* Demo Mode Info Strip */}
      {isDemoMode && (
        <div className="bg-[#364637] text-[#F8F7F4] px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Modo Demo Activo</strong> · Estás explorando el CRM de <strong>TU TIENDA</strong> en modo vista previa (los cambios se prueban localmente sin modificar la base oficial).
              </span>
            </div>
            <button
              onClick={logoutCrm}
              className="underline font-bold hover:text-white/80 shrink-0"
            >
              Cambiar a Acceso Administrador
            </button>
          </div>
        </div>
      )}

      {/* Top Banner Bar */}
      <div className="bg-[#141413] text-[#F8F7F4] border-b border-[#2A2A27]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-[#364637] px-2 py-0.5 rounded text-[#F8F7F4]">
                  CRM · {companySettings?.companyName || 'TU TIENDA'}
                </span>
                <span className="text-xs text-[#9C988F]">
                  Gestión de Indumentaria, Pedidos & Stock
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-bold text-white font-serif tracking-tight mt-1">
                Panel Comercial & Catálogo
              </h1>
            </div>

            {/* Authenticated user badge & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-full bg-[#364637] text-[#F8F7F4] flex items-center justify-center font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-white block text-[11px] leading-tight">
                    {crmUser?.name || 'Administrador'}
                  </strong>
                  <span className="text-[10px] text-[#9C988F] leading-tight">
                    {crmUser?.role || 'Gestión Comercial'}
                  </span>
                </div>
              </div>

              <CrmNotificationCenter
                onNavigateToTab={(tab) => setCrmSubTab(tab as typeof crmSubTab)}
              />

              <button
                onClick={() => setActiveTab('store')}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/10"
              >
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Ver Tienda</span>
              </button>

              <button
                onClick={logoutCrm}
                className="px-3 py-2 bg-red-950/50 hover:bg-red-900/70 text-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-800/40"
                title="Cerrar sesión del CRM"
              >
                <LogOut className="w-4 h-4 text-red-300" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>

          {/* Top KPI Metrics Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-5">
            <div className="bg-white/5 rounded-2xl p-3.5 sm:p-4 border border-white/10">
              <div className="flex items-center justify-between text-[#9C988F] text-[11px] sm:text-xs mb-1">
                <span>Ventas Cerradas</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg sm:text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
                {formatCurrency(totalRevenueWon, false)}
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">
                {totalClosedOrdersCount} pedidos acreditados
              </span>
            </div>

            <div className="bg-white/5 rounded-2xl p-3.5 sm:p-4 border border-white/10">
              <div className="flex items-center justify-between text-[#9C988F] text-[11px] sm:text-xs mb-1">
                <span>En Seguimiento</span>
                <TrendingUp className="w-4 h-4 text-[#C6B79E]" />
              </div>
              <div className="text-lg sm:text-2xl font-bold font-mono text-[#E8E2D5] tabular-nums tracking-tight">
                {formatCurrency(activePipelineValue, false)}
              </div>
              <span className="text-[10px] text-[#9C988F]">
                {activePipelineDeals.length} consultas activas
              </span>
            </div>

            <div className="bg-white/5 rounded-2xl p-3.5 sm:p-4 border border-white/10">
              <div className="flex items-center justify-between text-[#9C988F] text-[11px] sm:text-xs mb-1">
                <span>Ticket Promedio</span>
                <Layers className="w-4 h-4 text-[#C6B79E]" />
              </div>
              <div className="text-lg sm:text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
                {formatCurrency(averageTicket, false)}
              </div>
              <span className="text-[10px] text-[#9C988F]">Por pedido confirmado</span>
            </div>

            <div className="bg-white/5 rounded-2xl p-3.5 sm:p-4 border border-white/10">
              <div className="flex items-center justify-between text-[#9C988F] text-[11px] sm:text-xs mb-1">
                <span>Prendas Activas</span>
                <Boxes className="w-4 h-4 text-[#C6B79E]" />
              </div>
              <div className="text-lg sm:text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
                {products.length}
              </div>
              <span className="text-[10px] text-[#9C988F]">
                {clients.length} clientes registrados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CRM Navigation Subtabs */}
      <div className="bg-[#F8F7F4]/95 backdrop-blur-md border-b border-[#E2DFD7] sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5">
            {[
              { id: 'orders', label: `Pedidos (${orders.length})`, icon: Package },
              { id: 'products', label: `Prendas & Fotos (${products.length})`, icon: Boxes },
              { id: 'kanban', label: 'Pipeline Kanban', icon: TrendingUp },
              { id: 'clients', label: `Clientes (${clients.length})`, icon: Users },
              { id: 'analytics', label: 'Analítica', icon: BarChart3 },
              { id: 'quote', label: 'Presupuestos', icon: FileText },
              { id: 'alerts', label: 'Alertas', icon: Bell, count: unreadNotificationsCount, urgent: urgentNotificationsCount },
              { id: 'scripts', label: 'WhatsApp', icon: MessageSquare },
              { id: 'settings', label: 'Mi Tienda & Pagos', icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              const active = crmSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCrmSubTab(item.id as typeof crmSubTab)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#141413] text-[#F8F7F4]'
                      : 'text-[#6B675E] hover:text-[#141413] hover:bg-[#EFECE6]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
                        item.urgent && item.urgent > 0 ? 'bg-red-600' : 'bg-[#364637]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subtab Contents */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {crmSubTab === 'orders' && <OrdersManager />}
        {crmSubTab === 'products' && <ProductsManager />}
        {crmSubTab === 'kanban' && <KanbanBoard />}
        {crmSubTab === 'clients' && <ClientsDirectory />}
        {crmSubTab === 'analytics' && <PerformanceAnalyticsView />}
        {crmSubTab === 'quote' && <QuotationBuilder />}
        {crmSubTab === 'alerts' && (
          <CrmNotificationsView
            onNavigateToTab={(tab) => setCrmSubTab(tab as typeof crmSubTab)}
          />
        )}
        {crmSubTab === 'scripts' && <SalesScriptsView />}
        {crmSubTab === 'settings' && <CompanySettingsView />}
      </main>

      <CrmToastAlert onNavigateToTab={(tab) => setCrmSubTab(tab as typeof crmSubTab)} />
    </div>
  );
};
