# Tienda de ropa + panel de gestión

Tienda online para comercios de indumentaria, con panel para cargar prendas con foto, gestionar pedidos,
clientes, presupuestos por WhatsApp y estadísticas. Cada comercio tiene su propia copia (su propio
proyecto de Firebase y su propio sitio en Vercel), con su marca, colores, categorías y medios de cobro.

- **Tienda:** catálogo con talles, carrito, checkout con Mercado Pago o transferencia, envío o retiro.
- **Panel (`/admin`):** pedidos, prendas, embudo de ventas, clientes, analítica, presupuestos, alertas y configuración.
- **Legal (Argentina):** términos, privacidad, botón de arrepentimiento y enlace a Defensa del Consumidor.

## Cómo funciona por dentro

| Parte | Dónde | Qué hace |
| --- | --- | --- |
| Tienda y panel | `src/` (React + Vite) | Lo que ve el comprador y el dueño. |
| Servidor | `api/` (funciones de Vercel) | Crea los pedidos con precios recalculados, descuenta stock, cobra con Mercado Pago, recibe sus avisos de pago, registra arrepentimientos y genera `sitemap.xml` y las páginas de cada prenda para Google y WhatsApp. |
| Base de datos | Firebase Firestore | Prendas, pedidos, clientes y configuración. Reglas en `firestore.rules`. |
| Ingreso al panel | Firebase Auth (Google) | Solo pueden entrar las cuentas dadas de alta en la colección `admins`. |

El navegador **nunca** decide el precio ni marca un pedido como pagado: lo hace el servidor.

## Instalar una tienda nueva (por cliente)

1. **Copiar el repositorio** para el cliente (o crear un proyecto de Vercel nuevo apuntando a este repo).
2. **Firebase** ([console.firebase.google.com](https://console.firebase.google.com)):
   - Crear un proyecto, activar **Firestore** y **Authentication → Google**.
   - En Authentication → Configuración → Dominios autorizados, agregar el dominio de la tienda.
   - Registrar una app web y copiar su configuración a las variables `VITE_FIREBASE_*`.
   - Configuración del proyecto → Cuentas de servicio → **Generar nueva clave privada**. Ese JSON va en
     `FIREBASE_SERVICE_ACCOUNT` (en Vercel, nunca en el repositorio).
   - Publicar las reglas: `npx firebase-tools deploy --only firestore:rules --project ID_DEL_PROYECTO`.
     Si la base no se llama `(default)`, poner su id en `firebase.json` (`"database": "..."`) y en
     `FIREBASE_DATABASE_ID` / `VITE_FIREBASE_DATABASE_ID`.
3. **Mercado Pago** (cuenta del comercio): en *Tus integraciones* crear una aplicación, copiar el
   **Access Token de producción** a `MP_ACCESS_TOKEN`. En *Webhooks* cargar la URL
   `https://DOMINIO/api/mp-webhook` con el evento **Pagos** y copiar la clave secreta a `MP_WEBHOOK_SECRET`.
4. **Vercel:** cargar todas las variables de `.env.example` en Settings → Environment Variables
   (incluida `PUBLIC_SITE_URL`) y desplegar.
5. **Dar acceso al dueño:** que entre a `https://DOMINIO/admin` y toque *Ingresar con Google* (va a ver
   "no autorizada"). Después, desde la carpeta del proyecto:
   ```bash
   FIREBASE_SERVICE_ACCOUNT=./clave.json FIREBASE_DATABASE_ID=(id) node scripts/crear-admin.mjs dueno@gmail.com
   ```
   Al volver a ingresar ya ve el panel y puede empezar a cargar prendas.
6. **Configurar la tienda:** Panel → *Mi Tienda & Pagos*. Nombre, WhatsApp, email, razón social y CUIT,
   logo, colores, portada, categorías, envíos, Mercado Pago y datos de transferencia. Mientras falte algo
   importante, el panel lo avisa arriba.
7. **Probar una compra real** de bajo monto con Mercado Pago y verificar que el pedido pase a *Pagado*.

## Sitio de demostración

Para mostrarle el sistema a un comercio, desplegar una copia con `VITE_DEMO_MODE=true`:
aparece el usuario demo (`demo@tutienda.com.ar` / `demo123`), los datos de ejemplo, los botones de
"simular pedido" y el checkout simula la compra sin cobrar. Google no la indexa.
**En las tiendas de los clientes esta variable va en `false` (o sin cargar).**

## Desarrollo

```bash
bun install          # o npm install --legacy-peer-deps
cp .env.example .env # completar
bun run dev          # http://localhost:3000 (solo la tienda; /api corre con `vercel dev`)
bun run lint         # chequeo de tipos
bun run build
```

## Pendientes recomendados

- Fotos en Firebase Storage o Cloudinary (hoy se guardan comprimidas dentro de cada prenda).
- Stock por talle (hoy el stock es total por prenda).
- Emails automáticos de confirmación al comprador.
- Cálculo de envío por código postal (Correo Argentino / Andreani).
- Cancelar automáticamente pedidos de Mercado Pago que no se pagan en 48 h (hoy se cancelan a mano y el
  stock vuelve solo al cancelar).
- Que cada comercio revise los textos legales con su asesor.
