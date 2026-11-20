import React from 'react';
import heroImage from '../assets/images/tienda_ropa_hero_1795189410519.jpg';
import remeraImage from '../assets/images/remera_boxy_algodon_1795189410886.jpg';
import camisaImage from '../assets/images/camisa_lino_atelier_1795189411061.jpg';
import pantalonImage from '../assets/images/pantalon_sastrero_pinzas_1795189410661.jpg';
import tapadoImage from '../assets/images/tapado_lana_corte_1795189410305.jpg';

export const ASSET_IMAGES = {
  hero: heroImage,
  remera: remeraImage,
  camisa: camisaImage,
  pantalon: pantalonImage,
  tapado: tapadoImage,
};

/**
 * Resolves any image URL to a valid, production-ready asset URL.
 * Supports uploaded Data URIs, Vite bundler asset paths, legacy paths, and HTTPS URLs.
 */
export function resolveProductImage(url?: string | null, category?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getCategoryFallback(category);
  }

  const trimmed = url.trim();

  if (trimmed.includes('tienda_ropa_hero')) return heroImage;
  if (trimmed.includes('remera_boxy_algodon')) return remeraImage;
  if (trimmed.includes('camisa_lino_atelier')) return camisaImage;
  if (trimmed.includes('pantalon_sastrero_pinzas')) return pantalonImage;
  if (trimmed.includes('tapado_lana_corte')) return tapadoImage;

  // Legacy appliance paths map cleanly to clothing fallbacks
  if (trimmed.includes('nuvoh_')) {
    return getCategoryFallback(category);
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  return getCategoryFallback(category);
}

/**
 * Fallback image based on clothing category
 */
export function getCategoryFallback(category?: string): string {
  if (!category) return heroImage;
  const lower = category.toLowerCase();
  if (lower.includes('remera') || lower.includes('top')) return remeraImage;
  if (lower.includes('camisa') || lower.includes('blusa')) return camisaImage;
  if (lower.includes('pantal') || lower.includes('jean')) return pantalonImage;
  if (lower.includes('abrigo') || lower.includes('tapado') || lower.includes('campera')) return tapadoImage;
  if (lower.includes('vestido') || lower.includes('conjunto')) return heroImage;
  return camisaImage;
}

/**
 * Safe image onError handler to prevent broken image icons
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string
): void {
  const target = event.currentTarget;
  const fallback = getCategoryFallback(category);
  if (target.src !== fallback) {
    target.onerror = null;
    target.src = fallback;
  }
}

/**
 * Compresses an uploaded image File on the client into a lightweight JPEG Data URL
 * suitable for storing inside Firestore documents (well under 1MB document limit).
 */
export function compressImageFileToDataUrl(
  file: File,
  maxDimension = 760,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado debe ser una imagen (JPG, PNG o WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el procesador de imagen.'));
          return;
        }

        ctx.fillStyle = '#F8F7F4';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > 320000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        }
        if (dataUrl.length > 340000) {
          reject(new Error('La imagen sigue siendo muy pesada. Probá con una foto más liviana.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
