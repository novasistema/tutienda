import { Product, ClothingCategory } from '../types';
import { ASSET_IMAGES } from '../utils/imageUtils';

export const HERO_IMAGE = ASSET_IMAGES.hero;

export const CATALOG_CATEGORIES: ('Todos' | ClothingCategory)[] = [
  'Todos',
  'Remeras y Tops',
  'Camisas y Blusas',
  'Pantalones y Jeans',
  'Abrigos y Tapados',
  'Vestidos y Conjuntos',
  'Accesorios y Calzado'
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-rem-01',
    name: 'Remera Boxy Heavyweight Obsidian',
    hook: 'Algodón peinado 240 gr · Caída estructurada',
    category: 'Remeras y Tops',
    sku: 'TT-REM-001',
    code: 'COD. R240',
    brand: 'TU TIENDA Atelier',
    priceUnit: 34500,
    priceTiers: {
      tier5: 31900,
      tier10: 29500
    },
    badges: ['240 GSM', '100% Algodón', 'Boxy Fit'],
    sizes: ['S', 'M', 'L', 'XL'],
    color: 'Negro Lavado',
    material: '100% Algodón Peinado Orgánico 240g',
    fit: 'Boxy Fit',
    specs: [
      { label: 'GRAMAJE 240G', desc: 'Jersey pesado de alta densidad con tacto suave.', iconName: 'layers' },
      { label: 'CORTE BOXY', desc: 'Hombros caídos y largo cropped equilibrado.', iconName: 'scissors' },
      { label: 'CUELLO RIB', desc: 'Cuello redondo ancho de 3 cm que no se deforma.', iconName: 'shield' },
      { label: 'TEÑIDO REACTIVO', desc: 'Lavado enzimático pre-encogido.', iconName: 'sparkles' }
    ],
    image: ASSET_IMAGES.remera,
    stock: 42,
    featured: true,
    isNew: true
  },
  {
    id: 'prod-rem-02',
    name: 'Top Tejido Ribbed Tiza',
    hook: 'Tejido morley elastizado · Terminación sastrera',
    category: 'Remeras y Tops',
    sku: 'TT-REM-014',
    brand: 'TU TIENDA Essentials',
    priceUnit: 29800,
    priceTiers: {
      tier5: 27400,
      tier10: 25200
    },
    badges: ['Morley', 'Tiza'],
    sizes: ['XS', 'S', 'M', 'L'],
    color: 'Blanco Tiza',
    material: '95% Algodón Pima · 5% Elastano',
    fit: 'Entallado',
    specs: [
      { label: 'ALGODÓN PIMA', desc: 'Fibra extra larga respirable y fresca.', iconName: 'wind' },
      { label: 'ELASTICIDAD', desc: 'Recuperación firme sin ceder con el uso.', iconName: 'check' }
    ],
    image: ASSET_IMAGES.remera,
    stock: 30
  },
  {
    id: 'prod-cam-01',
    name: 'Camisa Lino Belga Arena',
    hook: 'Lino puro lavado · Botones de nácar natural',
    category: 'Camisas y Blusas',
    sku: 'TT-CAM-002',
    code: 'COD. L100',
    brand: 'TU TIENDA Atelier',
    priceUnit: 68900,
    priceTiers: {
      tier5: 64000,
      tier10: 59500
    },
    badges: ['100% Lino', 'Relaxed Fit', 'Nácar'],
    sizes: ['S', 'M', 'L', 'XL'],
    color: 'Arena Ecru',
    material: '100% Lino Belga Pre-lavado',
    fit: 'Relaxed Tailored',
    specs: [
      { label: 'LINO PURO', desc: 'Tejido noble termorregulador con caída natural.', iconName: 'feather' },
      { label: 'BOTONADURA', desc: 'Botones de nácar pulido cosidos en cruz.', iconName: 'sparkles' },
      { label: 'COSTURA FRANCESA', desc: 'Terminaciones internas limpias de alta sastrería.', iconName: 'scissors' },
      { label: 'VERSÁTIL', desc: 'Ideal abierta como sobrecamisa o cerrada formal.', iconName: 'layers' }
    ],
    image: ASSET_IMAGES.camisa,
    stock: 26,
    featured: true,
    isNew: true
  },
  {
    id: 'prod-cam-02',
    name: 'Camisa Poplin Oversize Blanca',
    hook: 'Poplin italiano crujiente · Puño francés',
    category: 'Camisas y Blusas',
    sku: 'TT-CAM-018',
    brand: 'TU TIENDA Studio',
    priceUnit: 58500,
    priceTiers: {
      tier5: 54000,
      tier10: 49900
    },
    badges: ['Poplin', 'Oversize'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    color: 'Blanco Óptico',
    material: '100% Algodón Poplin Doble Retorcido',
    fit: 'Oversize',
    specs: [
      { label: 'POPLIN DOBLE', desc: 'Trama cerrada sin transparencias.', iconName: 'shield' },
      { label: 'CUELLO ESTRUCTURADO', desc: 'Entretela liviana que mantiene la forma.', iconName: 'check' }
    ],
    image: ASSET_IMAGES.camisa,
    stock: 34
  },
  {
    id: 'prod-pan-01',
    name: 'Pantalón Sastrero Doble Pinza Grafito',
    hook: 'Paño liviano italiano · Tiro medio y pierna amplia',
    category: 'Pantalones y Jeans',
    sku: 'TT-PAN-003',
    code: 'COD. P880',
    brand: 'TU TIENDA Atelier',
    priceUnit: 84500,
    priceTiers: {
      tier5: 78900,
      tier10: 74000
    },
    badges: ['Doble Pinza', 'Wide Leg', 'Sastrería'],
    sizes: ['38', '40', '42', '44', '46'],
    color: 'Gris Grafito',
    material: '62% Lana Virgen · 35% Viscosa · 3% Elastano',
    fit: 'Wide Leg Sastrero',
    specs: [
      { label: 'DOBLE PINZA', desc: 'Volumen frontal limpio con caída vertical.', iconName: 'scissors' },
      { label: 'CINTURA REGULABLE', desc: 'Hebilla lateral metálica sin necesidad de cinturón.', iconName: 'sliders' },
      { label: 'FORRERÍA HASTA RODILLA', desc: 'Forro de acetato respirable para mayor confort.', iconName: 'layers' }
    ],
    image: ASSET_IMAGES.pantalon,
    stock: 19,
    featured: true,
    isNew: true
  },
  {
    id: 'prod-pan-02',
    name: 'Jean Selvedge Recto Índigo Crudo',
    hook: 'Denim 13.5 oz sin lavado · Costura reforzada',
    category: 'Pantalones y Jeans',
    sku: 'TT-PAN-019',
    brand: 'TU TIENDA Denim',
    priceUnit: 76000,
    priceTiers: {
      tier5: 71000,
      tier10: 66500
    },
    badges: ['13.5 OZ', 'Denim Crudo'],
    sizes: ['38', '40', '42', '44', '46'],
    color: 'Índigo Oscuro',
    material: '100% Algodón Denim Orillo Japonés',
    fit: 'Straight Leg',
    specs: [
      { label: 'DENIM 13.5 OZ', desc: 'Cuerpo firme que se amolda con cada uso.', iconName: 'shield' },
      { label: 'HERRAJES YKK', desc: 'Cierre y remaches en bronce envejecido.', iconName: 'check' }
    ],
    image: ASSET_IMAGES.pantalon,
    stock: 25
  },
  {
    id: 'prod-abr-01',
    name: 'Tapado Sastrero Lana Virgen Oliva',
    hook: 'Corte largo arquitectónico · Solapa clásica en punta',
    category: 'Abrigos y Tapados',
    sku: 'TT-ABR-004',
    code: 'COD. A950',
    brand: 'TU TIENDA Atelier',
    priceUnit: 185000,
    priceTiers: {
      tier5: 172000,
      tier10: 159000
    },
    badges: ['Lana Virgen', 'Forrado', 'Edición Atelier'],
    sizes: ['S', 'M', 'L', 'XL'],
    color: 'Oliva Oscuro',
    material: '80% Lana Virgen Peinada · 20% Poliamida',
    fit: 'Relaxed Coat',
    specs: [
      { label: '80% LANA VIRGEN', desc: 'Abrigo térmico liviano de abrigo superior.', iconName: 'thermometer' },
      { label: 'BOTONES DE CUERNO', desc: 'Terminación artesanal en frente y puños.', iconName: 'sparkles' },
      { label: 'BOLSILLO INTERNO', desc: 'Forrería satinada completa con bolsillo oculto.', iconName: 'layers' }
    ],
    image: ASSET_IMAGES.tapado,
    stock: 14,
    featured: true,
    isNew: true
  },
  {
    id: 'prod-abr-02',
    name: 'Blazer Estructurado Cruzado Negro',
    hook: 'Hombreras sutiles · Entalle contemporáneo',
    category: 'Abrigos y Tapados',
    sku: 'TT-ABR-011',
    brand: 'TU TIENDA Studio',
    priceUnit: 139000,
    priceTiers: {
      tier5: 129000,
      tier10: 119000
    },
    badges: ['Sastrería', 'Cruzado'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    color: 'Obsidiana',
    material: '70% Viscosa · 26% Lana · 4% Elastano',
    fit: 'Structured Fit',
    specs: [
      { label: 'SOLAPA PICO', desc: 'Línea estilizada de noche y oficina.', iconName: 'scissors' },
      { label: 'TAJO TRASERO', desc: 'Abertura central para libre movimiento.', iconName: 'check' }
    ],
    image: ASSET_IMAGES.tapado,
    stock: 16
  },
  {
    id: 'prod-ves-01',
    name: 'Vestido Midi Lino Natural Piedra',
    hook: 'Silueta fluida con pinzas en cintura · Escote limpio',
    category: 'Vestidos y Conjuntos',
    sku: 'TT-VES-005',
    brand: 'TU TIENDA Atelier',
    priceUnit: 79500,
    priceTiers: {
      tier5: 74000,
      tier10: 69000
    },
    badges: ['Lino Natural', 'Midi'],
    sizes: ['XS', 'S', 'M', 'L'],
    color: 'Piedra Arena',
    material: '100% Lino Lavado con Forro de Algodón',
    fit: 'A-Line Fluido',
    specs: [
      { label: 'BOLSILLOS LATERALES', desc: 'Integrados en costura para máxima practicidad.', iconName: 'check' },
      { label: 'CIERRE INVISIBLE', desc: 'Espalda limpia con cierre oculto al tono.', iconName: 'scissors' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 21,
    featured: true
  },
  {
    id: 'prod-ves-02',
    name: 'Conjunto Sastrero Cápsula Tiza',
    hook: 'Blazer liviano + pantalón tiro alto combinables',
    category: 'Vestidos y Conjuntos',
    sku: 'TT-VES-012',
    brand: 'TU TIENDA Studio',
    priceUnit: 148000,
    priceTiers: {
      tier5: 138000,
      tier10: 129000
    },
    badges: ['Set 2 Piezas', 'Tiza'],
    sizes: ['S', 'M', 'L'],
    color: 'Marfil Tiza',
    material: 'Crepe Sastrero Liviano Premium',
    fit: 'Relaxed',
    specs: [
      { label: 'DOS PRENDAS', desc: 'Se entrega conjunto completo listo para usar.', iconName: 'layers' },
      { label: 'NO SE ARRUGA', desc: 'Ideal para viajes y jornadas largas.', iconName: 'sparkles' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 12
  },
  {
    id: 'prod-acc-01',
    name: 'Bufanda Oversize Lana Merino Crudo',
    hook: 'Tejido suave sin picazón · Flecos retorcidos a mano',
    category: 'Accesorios y Calzado',
    sku: 'TT-ACC-006',
    brand: 'TU TIENDA Atelier',
    priceUnit: 39000,
    priceTiers: {
      tier5: 35500,
      tier10: 32500
    },
    badges: ['Lana Merino', '200x45 cm'],
    sizes: ['Único'],
    color: 'Crudo Natural',
    material: '100% Lana Merino Extra Fina',
    fit: 'Oversize',
    specs: [
      { label: 'TACTO ULTRA SUAVE', desc: 'Fibra 19 micrones apta piel sensible.', iconName: 'feather' }
    ],
    image: ASSET_IMAGES.camisa,
    stock: 38
  },
  {
    id: 'prod-acc-02',
    name: 'Cinturón Cuero Vacuno Hebilla Cepillada',
    hook: 'Cuero plena flor argentino · Herraje níquel mate',
    category: 'Accesorios y Calzado',
    sku: 'TT-ACC-009',
    brand: 'TU TIENDA Essentials',
    priceUnit: 32000,
    priceTiers: {
      tier5: 29500,
      tier10: 27000
    },
    badges: ['Cuero Vacuno', '3 cm'],
    sizes: ['85', '90', '95', '100'],
    color: 'Negro Mate',
    material: '100% Cuero Vacuno Curtido Vegetal',
    fit: 'Clásico',
    specs: [
      { label: 'PLENA FLOR', desc: 'Sin láminas sintéticas; envejece con carácter.', iconName: 'shield' }
    ],
    image: ASSET_IMAGES.pantalon,
    stock: 44
  }
];
