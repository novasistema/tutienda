/**
 * Configuración por instalación (variables de entorno de Vercel / archivo .env).
 * Ver README.md y .env.example.
 */
const env = import.meta.env;

/** true solo en el sitio de demostración que se le muestra a los prospectos. */
export const DEMO_MODE = env.VITE_DEMO_MODE === 'true';

export const GA_MEASUREMENT_ID: string = env.VITE_GA_ID || '';
export const META_PIXEL_ID: string = env.VITE_META_PIXEL_ID || '';
