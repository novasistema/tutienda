import React from 'react';
import { Truck, RotateCcw, Sparkles } from 'lucide-react';

export const WholesaleNoticeBanner: React.FC = () => {
  return (
    <div className="bg-[#EFECE6] border-b border-[#E4E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-x-6 gap-y-2 text-[11px] text-[#4E4B46]">
          <span className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-[#364637]" />
            <span>Envíos a todo el país en 24/48hs</span>
          </span>
          <span className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-[#364637]" />
            <span>Cambios de talle sin cargo</span>
          </span>
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#364637]" />
            <span>Descuentos llevando 5 o más prendas iguales</span>
          </span>
        </div>
      </div>
    </div>
  );
};
