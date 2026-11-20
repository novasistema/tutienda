import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CompanySettings } from '../../types';
import {
  Building2,
  CreditCard,
  Save,
  CheckCircle2,
  Receipt,
  ShieldCheck
} from 'lucide-react';

export const CompanySettingsView: React.FC = () => {
  const { companySettings, updateCompanySettings } = useStore();
  const [formData, setFormData] = useState<CompanySettings>(companySettings);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (companySettings) {
      setFormData(companySettings);
    }
  }, [companySettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateCompanySettings({
      ...formData,
      updatedAt: new Date().toISOString().split('T')[0]
    });
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  const handleToggleInstallment = (val: number) => {
    const list = formData.installmentsAllowed || [];
    if (list.includes(val)) {
      setFormData({
        ...formData,
        installmentsAllowed: list.filter((n) => n !== val)
      });
    } else {
      setFormData({
        ...formData,
        installmentsAllowed: [...list, val].sort((a, b) => a - b)
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#141413] font-serif">
            Configuración de la Tienda & Medios de Pago
          </h3>
          <p className="text-xs text-[#6B675E]">
            Datos de tu marca de ropa, showroom de retiro y cuentas bancarias para transferencias.
          </p>
        </div>

        {isSaved && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Configuración guardada</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2DFD7] space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E2DFD7] pb-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFECE6] text-[#141413] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#141413]">Identidad & Showroom</h4>
              <p className="text-[11px] text-[#6B675E]">
                Visible en encabezados, presupuestos y remitos de envío
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#6B675E] mb-1">
                Nombre de la Tienda
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[#364637] font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B675E] mb-1">
                Razón Social / Subtítulo
              </label>
              <input
                type="text"
                required
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[#364637]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B675E] mb-1">CUIT</label>
              <input
                type="text"
                required
                value={formData.cuit}
                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-[#6B675E] mb-1">
                Dirección del Showroom / Local
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[#364637]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B675E] mb-1">Ciudad</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[#364637]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B675E] mb-1">
                WhatsApp Comercial
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B675E] mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden focus:border-[#364637]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B675E] mb-1">
                Mínimo de Compra (0 = Sin mínimo)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={formData.minimumOrder}
                onChange={(e) =>
                  setFormData({ ...formData, minimumOrder: Number(e.target.value) || 0 })
                }
                className="w-full text-xs p-2.5 rounded-xl border border-[#D4D0C7] outline-hidden font-mono font-bold text-[#364637]"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2DFD7] space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E2DFD7] pb-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFECE6] text-[#141413] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#141413]">Cobros & Transferencias</h4>
              <p className="text-[11px] text-[#6B675E]">
                Datos que se muestran al finalizar el pedido en la tienda online
              </p>
            </div>
          </div>

          <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-[#E2DFD7] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#141413] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#364637]" />
                <span>Transferencia Bancaria</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Activo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">Banco</label>
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-[#D4D0C7] bg-white outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">Titular</label>
                <input
                  type="text"
                  required
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  placeholder="TU TIENDA INDUMENTARIA S.R.L."
                  className="w-full text-xs p-2 rounded-lg border border-[#D4D0C7] bg-white outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">CBU / CVU</label>
                <input
                  type="text"
                  required
                  value={formData.cbu}
                  onChange={(e) => setFormData({ ...formData, cbu: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-[#D4D0C7] bg-white outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B675E] mb-0.5">Alias</label>
                <input
                  type="text"
                  required
                  value={formData.alias}
                  onChange={(e) =>
                    setFormData({ ...formData, alias: e.target.value.toUpperCase() })
                  }
                  placeholder="TUTIENDA.ROPA.ARS"
                  className="w-full text-xs p-2 rounded-lg border border-[#D4D0C7] bg-white outline-hidden font-mono uppercase font-bold"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-[#E2DFD7] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-[#141413]">
                  Pagos con Tarjeta y Cuotas
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.cardPaymentsEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, cardPaymentsEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#364637]"
                />
                <span className="text-xs font-bold text-[#141413]">
                  {formData.cardPaymentsEnabled ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </label>
            </div>

            {formData.cardPaymentsEnabled && (
              <div className="pt-2 border-t border-[#E2DFD7] flex flex-wrap items-center gap-4 text-xs">
                <span className="font-semibold text-[#6B675E]">Cuotas:</span>
                {[1, 3, 6, 12].map((installment) => (
                  <label key={installment} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.installmentsAllowed?.includes(installment)}
                      onChange={() => handleToggleInstallment(installment)}
                      className="accent-[#364637]"
                    />
                    <span className="font-medium text-[#141413]">
                      {installment} {installment === 1 ? 'pago' : 'cuotas'}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#6B675E] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#364637] shrink-0" />
            <span>La configuración se sincroniza en toda la tienda.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-[#141413] hover:bg-[#364637] text-[#F8F7F4] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
