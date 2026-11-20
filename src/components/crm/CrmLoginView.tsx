import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Lock, ArrowRight, ShieldCheck, Store, KeyRound, AlertCircle } from 'lucide-react';

export const CrmLoginView: React.FC = () => {
  const {
    loginDemo,
    loginWithGoogle,
    authError,
    authLoading,
    setActiveTab,
    companySettings
  } = useStore();

  const brandName = companySettings?.companyName || 'TU TIENDA';
  const [username, setUsername] = useState('demo@tutienda.com.ar');
  const [password, setPassword] = useState('demo123');
  const [localError, setLocalError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const ok = loginDemo(username, password);
    if (!ok) {
      setLocalError('Usuario o contraseña incorrectos. Probá con demo@tutienda.com.ar y demo123.');
    }
  };

  const handleOneClickDemo = () => {
    setUsername('demo@tutienda.com.ar');
    setPassword('demo123');
    setLocalError(null);
    loginDemo('demo@tutienda.com.ar', 'demo123');
  };

  const handleGoogleAdmin = async () => {
    setLocalError(null);
    setGoogleBusy(true);
    try {
      await loginWithGoogle();
    } finally {
      setGoogleBusy(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-[82vh] flex items-center justify-center p-4 sm:p-6 bg-[#F8F7F4]">
      <div className="max-w-md w-full bg-white border border-[#E4E1DA] p-7 sm:p-9 space-y-6">
        {/* Editorial Brand Lockup */}
        <div className="text-center space-y-2 border-b border-[#EFECE6] pb-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#6B6862]">
            Panel de Gestión Comercial
          </p>
          <h2 className="text-3xl font-serif font-semibold text-[#141413] tracking-tight">
            {brandName} · CRM
          </h2>
          <p className="text-xs text-[#6B6862]">
            Pedidos, carga de prendas con foto, clientes y seguimiento de ventas
          </p>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Demo Credentials Box */}
        <div className="bg-[#F5F3EE] border border-[#E4E1DA] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#364637]">
              Acceso Demo para Clientes
            </span>
            <span className="text-[10px] font-mono text-[#6B6862]">Vista previa interactiva</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="block text-[10px] text-[#6B6862] uppercase tracking-wider">Usuario</span>
              <span className="font-mono font-semibold text-[#141413]">demo@tutienda.com.ar</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#6B6862] uppercase tracking-wider">Contraseña</span>
              <span className="font-mono font-semibold text-[#141413]">demo123</span>
            </div>
          </div>
        </div>

        {/* Demo Login Form */}
        <form onSubmit={handleDemoSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1.5">
              Usuario Demo
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="demo@tutienda.com.ar"
              className="w-full text-xs px-3.5 py-2.5 border border-[#D8D4CB] bg-[#FAF9F6] focus:bg-white focus:border-[#141413] outline-hidden font-mono text-[#141413]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1.5">
              Contraseña Demo
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs px-3.5 py-2.5 border border-[#D8D4CB] bg-[#FAF9F6] focus:bg-white focus:border-[#141413] outline-hidden font-mono text-[#141413]"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 px-4 bg-[#141413] hover:bg-[#364637] text-white text-xs font-semibold uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Ingresar al Sistema (Demo)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="space-y-2.5 pt-2 border-t border-[#EFECE6]">
          <button
            type="button"
            onClick={handleOneClickDemo}
            className="w-full py-2.5 px-3 bg-[#EFECE6] hover:bg-[#E4E1DA] text-[#141413] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#364637]" />
            <span>Entrar directo con Usuario Demo</span>
          </button>

          <button
            type="button"
            onClick={handleGoogleAdmin}
            disabled={googleBusy}
            className="w-full py-2.5 px-3 bg-white hover:bg-[#FAF9F6] text-[#141413] border border-[#D8D4CB] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#364637]" />
            <span>{googleBusy ? 'Conectando...' : 'Administrador (Google Workspace)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className="w-full py-2 text-[#6B6862] hover:text-[#141413] text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Volver a la Tienda de Ropa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
