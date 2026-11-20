import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { generateWhatsAppLink } from '../../utils/formatters';

/** Botón flotante de WhatsApp en la tienda (solo si la tienda cargó su número). */
export const WhatsAppButton: React.FC = () => {
  const { companySettings, selectedProductForModal, activeTab, isCrmAuthenticated } = useStore();
  if (!companySettings.phone || activeTab !== 'store') return null;

  const text = selectedProductForModal
    ? `¡Hola ${companySettings.companyName}! Quería consultar por "${selectedProductForModal.name}".`
    : `¡Hola ${companySettings.companyName}! Quería hacer una consulta.`;

  return (
    <a
      href={generateWhatsAppLink(companySettings.phone, text)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className={`no-print fixed right-4 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform ${
        isCrmAuthenticated ? 'bottom-20 md:bottom-5' : 'bottom-5'
      }`}
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
};
