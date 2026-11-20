import React from 'react';
import { Truck, RotateCcw, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

/** Franja de beneficios bajo la portada. Los textos se editan en Configuración → Marca y diseño. */
export const WholesaleNoticeBanner: React.FC = () => {
  const { companySettings } = useStore();
  const icons = [Truck, RotateCcw, Sparkles];
  const texts = (companySettings.bannerTexts || []).map((t) => t.trim()).filter(Boolean);
  if (texts.length === 0) return null;
  return (
    <div className="bg-[#EFECE6] border-b border-[#E4E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-x-6 gap-y-2 text-[11px] text-[#4E4B46]">
          {texts.map((text, i) => {
            const Icon = icons[i % icons.length];
            return (
              <span key={i} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                <span>{text}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
