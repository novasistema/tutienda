import React from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/formatters';
import { resolveProductImage, handleImageError } from '../../utils/imageUtils';
import { ShoppingBag, Edit3 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, setSelectedProductForModal, isCrmAuthenticated, openEditProductModal } = useStore();
  const defaultSize = product.sizes?.[0] || 'Único';

  return (
    <article className="bg-white border border-[#E4E1DA] flex flex-col justify-between group transition-colors hover:border-[#BDB8AE]">
      <div>
        {/* Image Frame (~70% card emphasis) */}
        <div
          onClick={() => setSelectedProductForModal(product)}
          className="relative aspect-[4/5] bg-[#EFECE6] overflow-hidden cursor-pointer"
        >
          <img
            src={resolveProductImage(product.image, product.category)}
            alt={product.name}
            onError={(e) => handleImageError(e, product.category)}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />

          {product.isNew && (
            <span className="absolute top-2.5 left-2.5 bg-[#141413] text-white text-[9px] font-mono uppercase tracking-[0.16em] px-2 py-0.5">
              Nuevo
            </span>
          )}

          {isCrmAuthenticated && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEditProductModal(product);
              }}
              className="absolute top-2.5 right-2.5 bg-white/95 hover:bg-[#141413] text-[#141413] hover:text-white p-1.5 border border-[#DEDAD0] transition-colors cursor-pointer"
              title="Editar prenda"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Minimal Editorial Info */}
        <div className="p-3 sm:p-4 space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#6B6862] truncate">
            {product.category}
            {product.color ? ` · ${product.color}` : ''}
          </p>

          <h3
            onClick={() => setSelectedProductForModal(product)}
            className="text-xs sm:text-sm font-semibold text-[#141413] leading-snug line-clamp-2 cursor-pointer group-hover:text-[#364637] transition-colors"
          >
            {product.name}
          </h3>

          {product.sizes && product.sizes.length > 0 && (
            <p className="text-[10px] sm:text-[11px] font-mono text-[#7C7770] truncate">
              Talles: {product.sizes.join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Price & Single Clean Action */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm sm:text-base font-bold font-mono text-[#141413] tabular-nums">
            {formatCurrency(product.priceUnit, false)}
          </div>
          {product.priceTiers?.tier5 && (
            <div className="text-[9px] sm:text-[10px] text-[#364637] font-medium">
              x5 u.: {formatCurrency(product.priceTiers.tier5, false)}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => addToCart(product, 1, defaultSize)}
          className="px-2.5 sm:px-3 py-2 bg-[#141413] hover:bg-[#364637] text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          aria-label={`Agregar ${product.name} a la bolsa`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </div>
    </article>
  );
};
