import { Link } from 'react-router-dom';
import { Home, AlertCircle, RefreshCcw } from 'lucide-react';
import CompassLogo from '../components/CompassLogo';

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-armada-gold/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-armada-navy/5 rounded-full -ml-48 -mb-48 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="w-full max-w-lg text-center z-10 animate-fade-in-up">
                <div className="flex justify-center mb-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-armada-gold/20 rounded-full blur-2xl animate-ping opacity-50" />
                        <div className="bg-white p-6 rounded-full shadow-2xl border-4 border-armada-gold relative">
                            <CompassLogo size={64} className="text-armada-navy" bgColor="white" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 mb-10">
                    <div className="inline-block bg-armada-navy text-armada-gold px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                        Status Code: 404
                    </div>
                    <h1 className="text-4xl font-black text-armada-navy uppercase tracking-tighter sm:text-5xl">
                        Ruta No <span className="text-armada-gold">Localizada</span>
                    </h1>
                    <div className="h-1 w-20 bg-armada-gold mx-auto my-6" />
                    <p className="text-slate-500 font-bold text-sm uppercase leading-relaxed max-w-xs mx-auto">
                        Lo sentimos, la sección que intenta navegar no existe en el sistema oficial de reservas.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        to="/dashboard"
                        className="btn-armada flex items-center gap-3 px-8 py-4 text-xs font-black italic tracking-widest shadow-xl hover:scale-105 transition-all w-full sm:w-auto"
                    >
                        <Home size={18} /> VOLVER AL TABLERO
                    </Link>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-3 px-8 py-4 text-xs font-black italic tracking-widest text-slate-500 hover:text-armada-navy bg-white border-2 border-slate-200 rounded transition-all hover:border-armada-navy shadow-sm w-full sm:w-auto"
                    >
                        <RefreshCcw size={18} /> RECARGAR SISTEMA
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-200">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                        <AlertCircle size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Servicio de Bienestar · Armada Nacional</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
