import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { Printer, MessageCircle, Truck, Search, X } from 'lucide-react';

export const OrdersManager: React.FC = () => {
  const { orders, updateOrderStatus, selectedEntityForFocus, companySettings } = useStore();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrderForRemito, setSelectedOrderForRemito] = useState<Order | null>(null);

  const brandName = companySettings?.companyName || 'TU TIENDA';

  React.useEffect(() => {
    if (selectedEntityForFocus?.type === 'order' && selectedEntityForFocus.id) {
      const targetOrder = orders.find((o) => o.id === selectedEntityForFocus.id);
      if (targetOrder) {
        setSelectedStatus('all');
        setSelectedOrderForRemito(targetOrder);
      }
    }
  }, [selectedEntityForFocus, orders]);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (o.businessName && o.businessName.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded">
            Pendiente de Pago
          </span>
        );
      case 'paid':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded">
            Pago Acreditado
          </span>
        );
      case 'preparing':
        return (
          <span className="bg-[#EFECE6] text-[#141413] border border-[#D4D0C7] text-[10px] font-bold px-2 py-0.5 rounded">
            En Preparación
          </span>
        );
      case 'shipped':
        return (
          <span className="bg-[#364637]/15 text-[#364637] border border-[#364637]/30 text-[10px] font-bold px-2 py-0.5 rounded">
            Despachado
          </span>
        );
      case 'delivered':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
            Entregado
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded">
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#141413] font-serif">
            Gestión de Pedidos & Despachos
          </h3>
          <p className="text-xs text-[#6B675E]">
            Seguimiento de compras online, talles solicitados y emisión de remitos
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#6B675E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por N° pedido o cliente..."
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#E2DFD7] bg-white outline-hidden focus:border-[#364637]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pending_payment', label: 'Pendientes' },
          { key: 'paid', label: 'Pagados' },
          { key: 'preparing', label: 'En Preparación' },
          { key: 'shipped', label: 'Despachados' },
          { key: 'delivered', label: 'Entregados' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              selectedStatus === tab.key
                ? 'bg-[#141413] text-[#F8F7F4]'
                : 'bg-white text-[#6B675E] hover:bg-[#EFECE6] border border-[#E2DFD7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MOBILE CARDS */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2DFD7] p-8 text-center text-xs text-[#6B675E]">
            No hay pedidos con los filtros actuales.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);
            const waText = `Hola ${order.customerName}, te escribimos de ${brandName} por tu pedido *${order.orderNumber}* (${formatCurrency(order.total)}).`;
            const waUrl = generateWhatsAppLink(order.phone, waText);

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-[#E2DFD7] p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-xs text-[#141413] block">
                      {order.orderNumber}
                    </span>
                    <strong className="text-sm font-bold text-[#141413] block">
                      {order.customerName}
                    </strong>
                    <span className="text-[11px] text-[#6B675E]">
                      {order.city}, {order.province} · {order.createdAt}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="bg-[#F8F7F4] rounded-xl p-2.5 border border-[#E2DFD7] space-y-1 text-xs">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2">
                      <span className="text-[#141413] truncate">
                        {item.quantity}x {item.product.name}
                        {item.selectedSize ? ` (Talle ${item.selectedSize})` : ''}
                      </span>
                      <span className="font-mono font-semibold text-[#141413] shrink-0">
                        {formatCurrency(item.totalPrice, false)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-1.5 border-t border-[#E2DFD7] flex items-center justify-between font-bold">
                    <span className="text-[#6B675E]">{totalUnits} prendas</span>
                    <span className="font-mono text-[#141413]">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      onClick={() => setSelectedOrderForRemito(order)}
                      className="px-2.5 py-1.5 bg-[#EFECE6] text-[#141413] rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Remito</span>
                    </button>
                  </div>

                  {order.status === 'pending_payment' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'paid')}
                      className="px-3 py-1.5 bg-[#141413] text-[#F8F7F4] rounded-xl text-[11px] font-bold"
                    >
                      Acreditar Pago
                    </button>
                  )}
                  {order.status === 'paid' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="px-3 py-1.5 bg-[#364637] text-white rounded-xl text-[11px] font-bold"
                    >
                      Preparar
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                      className="px-3 py-1.5 bg-[#364637] text-white rounded-xl text-[11px] font-bold flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Despachar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#E2DFD7] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EFECE6] border-b border-[#E2DFD7] text-[#141413] uppercase font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Pedido</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Prendas & Talles</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DFD7]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B675E] italic">
                    No hay pedidos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);
                  const waText = `Hola ${order.customerName}, te escribimos de ${brandName} por tu pedido *${order.orderNumber}* (${formatCurrency(order.total)}).`;
                  const waUrl = generateWhatsAppLink(order.phone, waText);

                  return (
                    <tr key={order.id} className="hover:bg-[#F8F7F4] transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#141413] block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-[#6B675E] capitalize">
                          {order.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[#141413] block">{order.customerName}</span>
                        <span className="text-[11px] text-[#6B675E]">
                          {order.businessName || `${order.city}, ${order.province}`}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#6B675E] text-[11px]">{order.createdAt}</td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[#141413]">{totalUnits} prendas</span>
                        <div className="text-[11px] text-[#6B675E] truncate max-w-[220px]">
                          {order.items
                            .map((i) => `${i.product.name}${i.selectedSize ? ` (${i.selectedSize})` : ''}`)
                            .join(', ')}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-[#141413] tabular-nums">
                        {formatCurrency(order.total)}
                      </td>

                      <td className="py-3 px-4 text-center">{getStatusBadge(order.status)}</td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => setSelectedOrderForRemito(order)}
                            className="px-2 py-1.5 text-[#141413] bg-[#EFECE6] hover:bg-[#E2DFD7] rounded-lg flex items-center gap-1 text-[11px] font-semibold"
                            title="Ver e imprimir Remito"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Remito</span>
                          </button>

                          {order.status === 'pending_payment' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'paid')}
                              className="px-2.5 py-1 bg-[#141413] hover:bg-[#364637] text-white rounded-lg text-[10px] font-bold"
                            >
                              Acreditar Pago
                            </button>
                          )}

                          {order.status === 'paid' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="px-2.5 py-1 bg-[#364637] text-white rounded-lg text-[10px] font-bold"
                            >
                              Preparar
                            </button>
                          )}

                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'shipped')}
                              className="px-2.5 py-1 bg-[#364637] text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Despachar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Remito Modal */}
      {selectedOrderForRemito && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[#141413]/75 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-2xl w-full p-5 sm:p-8 max-h-[92dvh] overflow-y-auto shadow-2xl border border-[#E2DFD7]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2DFD7] mb-5 no-print">
              <span className="text-xs font-bold text-[#6B675E] uppercase tracking-wider">
                Comprobante de Envío
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#141413] hover:bg-[#364637] text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setSelectedOrderForRemito(null)}
                  className="p-1.5 text-[#6B675E] hover:text-[#141413]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border border-[#141413] p-5 rounded-xl">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2DFD7] pb-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold font-serif tracking-tight text-[#141413]">
                    {brandName}
                  </h2>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#6B675E]">
                    Tienda de Ropa · Indumentaria Contemporánea
                  </p>
                  <p className="text-xs text-[#6B675E] mt-1">
                    {companySettings?.address}, {companySettings?.city} · CUIT: {companySettings?.cuit}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block border-2 border-[#141413] px-3 py-1 text-center mb-1">
                    <span className="text-xl font-bold font-serif">R</span>
                    <span className="text-[9px] block uppercase font-bold">Documento no fiscal</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#141413]">
                    REMITO {selectedOrderForRemito.orderNumber}
                  </div>
                  <div className="text-[11px] text-[#6B675E]">
                    Fecha: {selectedOrderForRemito.createdAt}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4 pb-3 border-b border-[#E2DFD7]">
                <div>
                  <span className="text-[#6B675E] block text-[10px] uppercase font-bold">
                    Destinatario:
                  </span>
                  <strong className="text-[#141413] font-semibold">
                    {selectedOrderForRemito.customerName}
                  </strong>
                  <span className="text-[#6B675E] block text-[11px]">
                    DNI/CUIT: {selectedOrderForRemito.documentId || 'S/D'}
                  </span>
                  <span className="text-[#6B675E] block text-[11px]">
                    Tel: {selectedOrderForRemito.phone}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B675E] block text-[10px] uppercase font-bold">
                    Entrega / Envío:
                  </span>
                  <span className="text-[#141413] block font-medium">
                    {selectedOrderForRemito.shippingAddress}
                  </span>
                  <span className="text-[#6B675E] block text-[11px]">
                    {selectedOrderForRemito.city}, {selectedOrderForRemito.province}
                  </span>
                  <span className="text-[#364637] font-semibold block text-[11px] capitalize mt-0.5">
                    Modo: {selectedOrderForRemito.shippingMethod.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <table className="w-full text-left text-xs mb-6">
                <thead className="bg-[#EFECE6] font-bold uppercase text-[10px] text-[#141413]">
                  <tr>
                    <th className="py-1.5 px-2">SKU</th>
                    <th className="py-1.5 px-2">Prenda</th>
                    <th className="py-1.5 px-2 text-center">Talle</th>
                    <th className="py-1.5 px-2 text-center">Cant.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DFD7]">
                  {selectedOrderForRemito.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 font-mono text-[11px]">{i.product.sku}</td>
                      <td className="py-2 px-2 font-semibold text-[#141413]">{i.product.name}</td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">
                        {i.selectedSize || 'Único'}
                      </td>
                      <td className="py-2 px-2 text-center font-bold font-mono">{i.quantity} u.</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-[#E2DFD7] text-center text-xs">
                <div>
                  <div className="border-t border-dashed border-[#6B675E] pt-1 text-[11px] text-[#6B675E]">
                    Despacho {brandName}
                  </div>
                </div>
                <div>
                  <div className="border-t border-dashed border-[#6B675E] pt-1 text-[11px] text-[#6B675E]">
                    Firma y DNI Recepción
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
