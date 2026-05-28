import { Home, ShieldAlert, RefreshCcw } from 'lucide-react';
import CompassLogo from '../components/CompassLogo';

interface ErrorPageProps {
    error?: Error;
    resetError?: () => void;
}

export default function ErrorPage({ error, resetError }: ErrorPageProps) {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#fef2f2]/30 pointer-events-none" />
            
            <div className="w-full max-w-xl text-center z-10 animate-fade-in-up">
                <div className="flex justify-center mb-10">
                    <div className="bg-white p-6 rounded-full shadow-2xl border-4 border-red-500 relative animate-pulse">
                        <ShieldAlert size={64} className="text-red-500" />
                    </div>
                </div>

                <div className="space-y-4 mb-10">
                    <div className="inline-block bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-lg">
                        Error Crítico del Sistema
                    </div>
                    <h1 className="text-4xl font-black text-armada-navy uppercase tracking-tighter sm:text-5xl">
                        Interrupción de <span className="text-red-600">Servicio</span>
                    </h1>
                    <div className="h-1 w-20 bg-armada-gold mx-auto my-6" />
                    
                    <div className="bg-red-50 p-6 rounded border border-red-100 mb-8 max-w-md mx-auto">
                        <p className="text-red-800 font-black text-[10px] uppercase tracking-widest mb-2">Detalles Técnicos:</p>
                        <p className="text-red-600 font-mono text-xs break-all">
                            {error?.message || 'Se ha producido una excepción inesperada en el cliente web.'}
                        </p>
                    </div>

                    <p className="text-slate-500 font-bold text-sm uppercase leading-relaxed max-w-xs mx-auto">
                        Por seguridad, la operación se ha detenido. Intente recargar la página o contactar con soporte técnico.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={() => resetError ? resetError() : window.location.href = '/dashboard'}
                        className="btn-armada flex items-center gap-3 px-8 py-4 text-xs font-black italic tracking-widest shadow-xl hover:scale-105 transition-all w-full sm:w-auto"
                    >
                        <Home size={18} /> RESTAURAR ACCESO
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-3 px-8 py-4 text-xs font-black italic tracking-widest text-slate-500 hover:text-armada-navy bg-white border-2 border-slate-200 rounded transition-all hover:border-armada-navy shadow-sm w-full sm:w-auto"
                    >
                        <RefreshCcw size={18} /> RECARGAR SISTEMA
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 opacity-50 grayscale">
                        <CompassLogo size={32} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Armada Nacional de Uruguay</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
