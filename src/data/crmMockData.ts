import { Deal, Client, Order } from '../types';
import { ASSET_IMAGES } from '../utils/imageUtils';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-01',
    name: 'Camila Méndez',
    businessName: 'Showroom Recoleta Chic',
    cuitOrDni: '27-34449821-4',
    phone: '+54 9 11 4982-1100',
    email: 'camila@recoletachic.com.ar',
    city: 'Ciudad Autónoma de Buenos Aires',
    province: 'CABA',
    tier: 'Mayorista Oro',
    totalSpent: 1480000,
    orderCount: 6,
    notes: 'Compra curvas de lino y tapados de lana cada temporada. Prefiere entrega por moto en Palermo/Recoleta.',
    lastContact: '2026-11-16'
  },
  {
    id: 'cli-02',
    name: 'Mariana López',
    businessName: 'Casa Moda Nueva Córdoba',
    cuitOrDni: '27-32115689-2',
    phone: '+54 9 351 689-4321',
    email: 'compras@casamodacba.com',
    city: 'Córdoba Capital',
    province: 'Córdoba',
    tier: 'Mayorista Plata',
    totalSpent: 640000,
    orderCount: 3,
    notes: 'Interesada en camisas de lino y pantalones sastreros en talles M y L. Pide despacho por Correo Argentino.',
    lastContact: '2026-11-15'
  },
  {
    id: 'cli-03',
    name: 'Esteban Domínguez',
    businessName: 'Vestir Urbano Mar del Plata',
    cuitOrDni: '20-28994112-9',
    phone: '+54 9 223 544-9988',
    email: 'esteban@vestirurbano.com.ar',
    city: 'Mar del Plata',
    province: 'Buenos Aires',
    tier: 'Distribuidor',
    totalSpent: 2150000,
    orderCount: 8,
    notes: 'Cliente frecuente de remeras boxy heavyweight y jeans selvedge en packs de 10 unidades.',
    lastContact: '2026-11-18'
  },
  {
    id: 'cli-04',
    name: 'Valeria Rivas',
    businessName: 'Cliente Boutique Web',
    cuitOrDni: '27-38445100-3',
    phone: '+54 9 261 412-3344',
    email: 'valeria.rivas@gmail.com',
    city: 'Mendoza',
    province: 'Mendoza',
    tier: 'Minorista',
    totalSpent: 264500,
    orderCount: 2,
    notes: 'Compró tapado oliva en talle M y camisa lino arena. Muy conforme con el calce.',
    lastContact: '2026-11-14'
  }
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'deal-01',
    customerName: 'Santiago Rossi',
    businessName: 'Boutique San Isidro',
    phone: '+54 9 11 6543-2199',
    email: 'santiago@boutiquesi.com.ar',
    city: 'San Isidro, BA',
    stage: 'lead',
    items: [
      { productId: 'prod-rem-01', productName: 'Remera Boxy Heavyweight Obsidian', quantity: 5, unitPrice: 31900, selectedSize: 'L' },
      { productId: 'prod-cam-01', productName: 'Camisa Lino Belga Arena', quantity: 3, unitPrice: 68900, selectedSize: 'M' }
    ],
    totalAmount: 366200,
    notes: 'Consultó por disponibilidad de talles L y XL en la colección de lino.',
    createdAt: '2026-11-17',
    updatedAt: '2026-11-17',
    assignedSalesperson: 'Equipo TU TIENDA'
  },
  {
    id: 'deal-02',
    customerName: 'Mariana López',
    businessName: 'Casa Moda Nueva Córdoba',
    phone: '+54 9 351 689-4321',
    email: 'compras@casamodacba.com',
    city: 'Córdoba Capital',
    stage: 'contacted',
    items: [
      { productId: 'prod-pan-01', productName: 'Pantalón Sastrero Doble Pinza Grafito', quantity: 5, unitPrice: 78900, selectedSize: '42' }
    ],
    totalAmount: 394500,
    notes: 'Le enviamos tabla de medidas y fotos reales de la tela por WhatsApp.',
    createdAt: '2026-11-15',
    updatedAt: '2026-11-16',
    assignedSalesperson: 'Equipo TU TIENDA'
  },
  {
    id: 'deal-03',
    customerName: 'Camila Méndez',
    businessName: 'Showroom Recoleta Chic',
    phone: '+54 9 11 4982-1100',
    email: 'camila@recoletachic.com.ar',
    city: 'CABA',
    stage: 'quoted',
    items: [
      { productId: 'prod-ves-01', productName: 'Vestido Midi Lino Natural Piedra', quantity: 5, unitPrice: 74000, selectedSize: 'M' },
      { productId: 'prod-cam-01', productName: 'Camisa Lino Belga Arena', quantity: 5, unitPrice: 64000, selectedSize: 'M' }
    ],
    totalAmount: 690000,
    notes: 'Presupuesto oficial TU TIENDA enviado con descuento por pack x5.',
    createdAt: '2026-11-14',
    updatedAt: '2026-11-16',
    assignedSalesperson: 'Equipo TU TIENDA'
  },
  {
    id: 'deal-04',
    customerName: 'Esteban Domínguez',
    businessName: 'Vestir Urbano Mar del Plata',
    phone: '+54 9 223 544-9988',
    email: 'esteban@vestirurbano.com.ar',
    city: 'Mar del Plata, BA',
    stage: 'payment_pending',
    items: [
      { productId: 'prod-rem-01', productName: 'Remera Boxy Heavyweight Obsidian', quantity: 10, unitPrice: 29500, selectedSize: 'L' },
      { productId: 'prod-pan-02', productName: 'Jean Selvedge Recto Índigo Crudo', quantity: 5, unitPrice: 71000, selectedSize: '42' }
    ],
    totalAmount: 650000,
    notes: 'Esperando comprobante de transferencia bancaria (Alias: TUTIENDA.ROPA.ARS).',
    createdAt: '2026-11-13',
    updatedAt: '2026-11-18',
    assignedSalesperson: 'Equipo TU TIENDA'
  },
  {
    id: 'deal-05',
    customerName: 'Valeria Rivas',
    businessName: 'Cliente Boutique Web',
    phone: '+54 9 261 412-3344',
    email: 'valeria.rivas@gmail.com',
    city: 'Mendoza',
    stage: 'won',
    items: [
      { productId: 'prod-abr-01', productName: 'Tapado Sastrero Lana Virgen Oliva', quantity: 1, unitPrice: 185000, selectedSize: 'M' },
      { productId: 'prod-cam-01', productName: 'Camisa Lino Belga Arena', quantity: 1, unitPrice: 68900, selectedSize: 'S' }
    ],
    totalAmount: 253900,
    notes: 'Compra confirmada y despachada con embalaje de tela protectora.',
    createdAt: '2026-11-10',
    updatedAt: '2026-11-12',
    assignedSalesperson: 'Equipo TU TIENDA'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'TUT-2026-1042',
    customerName: 'Valeria Rivas',
    businessName: 'Compra Particular',
    documentId: '27-38445100-3',
    phone: '+54 9 261 412-3344',
    email: 'valeria.rivas@gmail.com',
    shippingAddress: 'Av. San Martín 1420',
    city: 'Mendoza',
    province: 'Mendoza',
    shippingMethod: 'correo_argentino',
    shippingCost: 0,
    invoiceType: 'B',
    taxAmount: 0,
    paymentMethod: 'transferencia',
    items: [
      {
        product: {
          id: 'prod-abr-01',
          name: 'Tapado Sastrero Lana Virgen Oliva',
          hook: 'Corte largo arquitectónico · Solapa clásica en punta',
          category: 'Abrigos y Tapados',
          sku: 'TT-ABR-004',
          brand: 'TU TIENDA Atelier',
          priceUnit: 185000,
          priceTiers: { tier5: 172000, tier10: 159000 },
          badges: ['Lana Virgen', 'Forrado'],
          specs: [],
          image: ASSET_IMAGES.tapado,
          stock: 14,
          sizes: ['S', 'M', 'L', 'XL']
        },
        quantity: 1,
        selectedSize: 'M',
        unitPriceApplied: 185000,
        totalPrice: 185000
      },
      {
        product: {
          id: 'prod-cam-01',
          name: 'Camisa Lino Belga Arena',
          hook: 'Lino puro lavado · Botones de nácar natural',
          category: 'Camisas y Blusas',
          sku: 'TT-CAM-002',
          brand: 'TU TIENDA Atelier',
          priceUnit: 68900,
          priceTiers: { tier5: 64000, tier10: 59500 },
          badges: ['100% Lino'],
          specs: [],
          image: ASSET_IMAGES.camisa,
          stock: 26,
          sizes: ['S', 'M', 'L', 'XL']
        },
        quantity: 1,
        selectedSize: 'S',
        unitPriceApplied: 68900,
        totalPrice: 68900
      }
    ],
    subtotal: 253900,
    discount: 0,
    total: 253900,
    status: 'shipped',
    notes: 'Incluir bolsa de lienzo protectora y guía de cuidados.',
    createdAt: '2026-11-12 14:30'
  },
  {
    id: 'ord-1002',
    orderNumber: 'TUT-2026-1043',
    customerName: 'Santiago Rossi',
    businessName: 'Boutique San Isidro',
    documentId: '20-33291044-8',
    phone: '+54 9 11 6543-2199',
    email: 'santiago@boutiquesi.com.ar',
    shippingAddress: 'Av. Centenario 820',
    city: 'San Isidro',
    province: 'Buenos Aires',
    shippingMethod: 'retiro_deposito',
    shippingCost: 0,
    invoiceType: 'B',
    taxAmount: 0,
    paymentMethod: 'transferencia',
    items: [
      {
        product: {
          id: 'prod-rem-01',
          name: 'Remera Boxy Heavyweight Obsidian',
          hook: 'Algodón peinado 240 gr · Caída estructurada',
          category: 'Remeras y Tops',
          sku: 'TT-REM-001',
          brand: 'TU TIENDA Atelier',
          priceUnit: 34500,
          priceTiers: { tier5: 31900, tier10: 29500 },
          badges: ['240 GSM'],
          specs: [],
          image: ASSET_IMAGES.remera,
          stock: 42,
          sizes: ['S', 'M', 'L', 'XL']
        },
        quantity: 5,
        selectedSize: 'L',
        unitPriceApplied: 31900,
        totalPrice: 159500
      }
    ],
    subtotal: 159500,
    discount: 0,
    total: 159500,
    status: 'pending_payment',
    notes: 'Retira por local de Palermo una vez acreditada la transferencia.',
    createdAt: '2026-11-18 10:15'
  }
];

export const SALES_SCRIPTS = [
  {
    id: 'script-01',
    title: 'Bienvenida y Asesoramiento de Talles',
    category: 'Primer Contacto',
    text: `¡Hola {nombre}! Gracias por escribirnos a *TU TIENDA · Tienda de Ropa*.

Tenemos disponible toda nuestra nueva colección con stock real y envíos a todo el país:
- Comprá desde 1 prenda sin mínimos obligatorios.
- Descuentos automáticos por pack (llevando 5 o 10 unidades).
- Cambios de talle sin cargo dentro de los 30 días.

¿Qué prenda o talle estás buscando para asesorarte con las medidas exactas?`
  },
  {
    id: 'script-02',
    title: 'Envío de Presupuesto Personalizado',
    category: 'Cotización',
    text: `Hola {nombre}, te comparto el detalle de tu selección en *TU TIENDA* ({negocio}).

- *Total:* {monto} ARS
- *Reserva de prendas:* 24 horas hábiles.
- *Envío:* Despacho en 24/48hs a {ciudad} con seguimiento online o retiro por showroom.

¿Confirmamos talles y preparamos tu pedido?`
  },
  {
    id: 'script-03',
    title: 'Datos Bancarios para Confirmar Pedido',
    category: 'Cierre de Venta',
    text: `¡Genial {nombre}! Para confirmar tu compra en *TU TIENDA* y preparar el paquete hoy mismo, te dejamos los datos de transferencia:

- *Titular:* TU TIENDA INDUMENTARIA S.R.L.
- *Banco:* Banco Galicia
- *CBU:* 0070123420000001234567
- *Alias:* TUTIENDA.ROPA.ARS
- *CUIT:* 30-71889922-4

Apenas transfieras, envianos el comprobante por acá así te pasamos el código de seguimiento.`
  },
  {
    id: 'script-04',
    title: 'Seguimiento de Prendas Guardadas',
    category: 'Seguimiento',
    text: `Hola {nombre}, ¿cómo estás? Te escribimos de *TU TIENDA* por tu selección ({monto} ARS).

Quedan pocas unidades en los talles que elegiste y queríamos avisarte antes de liberar la reserva. Si querés cambiar algún talle o sumar otra prenda, avisanos por acá y lo resolvemos en el momento.`
  }
];

export const INITIAL_INTERACTIONS = [
  {
    id: 'int-01',
    clientId: 'cli-01',
    dealId: 'deal-03',
    type: 'whatsapp' as const,
    note: 'Enviada guía de talles de vestidos de lino y camisas arena. Pidió reservar talle M.',
    author: 'Equipo TU TIENDA',
    createdAt: '2026-11-16 11:30'
  },
  {
    id: 'int-02',
    clientId: 'cli-02',
    dealId: 'deal-02',
    type: 'llamada' as const,
    note: 'Llamada con Mariana. Confirmó envío por Correo Argentino a Córdoba.',
    author: 'Equipo TU TIENDA',
    createdAt: '2026-11-15 15:45'
  },
  {
    id: 'int-03',
    clientId: 'cli-03',
    dealId: 'deal-04',
    type: 'whatsapp' as const,
    note: 'Confirmó transferencia por las remeras boxy y jeans selvedge.',
    author: 'Equipo TU TIENDA',
    createdAt: '2026-11-18 09:20'
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-01',
    type: 'new_order' as const,
    title: 'Nuevo Pedido Web #TUT-2026-1043',
    message: 'Santiago Rossi ingresó un pedido por $159.500 (5x Remera Boxy Heavyweight Obsidian · Talle L).',
    createdAt: 'Hace 15 min',
    isRead: false,
    priority: 'high' as const,
    entityId: 'ord-1002',
    entityType: 'order' as const,
    metadata: {
      orderNumber: 'TUT-2026-1043',
      total: 159500,
      clientName: 'Santiago Rossi',
      phone: '+54 9 11 6543-2199'
    }
  },
  {
    id: 'notif-02',
    type: 'urgent_interaction' as const,
    title: 'Consulta de Talle y Despacho: Showroom Recoleta',
    message: 'Camila Méndez solicita confirmar stock de vestidos de lino antes de las 16hs para retirar hoy.',
    createdAt: 'Hace 40 min',
    isRead: false,
    priority: 'urgent' as const,
    entityId: 'cli-01',
    entityType: 'interaction' as const,
    metadata: {
      clientName: 'Showroom Recoleta Chic',
      phone: '+54 9 11 4982-1100',
      urgencyReason: 'Retiro en el día'
    }
  }
];
