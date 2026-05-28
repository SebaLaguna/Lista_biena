import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Anchor, LayoutDashboard } from 'lucide-react';
import CompassLogo from '../components/CompassLogo';

export default function Dashboard() {
    const { user } = useAuth();

    if (!user) return null;
    const isAdmin = user.role === 'super_admin' || user.role === 'admin_biena';

    return (
        <div className="space-y-6 md:space-y-10 py-4 md:py-8 px-4 sm:px-6 lg:px-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-8">
                <div className="animate-fade-in-up">
                    <div className="flex items-center gap-2 md:gap-3 text-armada-navy mb-1">
                        <Anchor size={20} className="text-armada-gold shrink-0" />
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tighter">Panel de Comando</h1>
                    </div>
                    <p className="text-slate-500 font-medium text-xs md:text-sm">Bienvenido de regreso, {user.nombre} {user.apellido}</p>
                </div>
                <div className="w-full md:w-auto flex gap-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="w-full md:w-auto bg-white px-4 md:px-6 py-2 md:py-3 rounded shadow-sm border border-slate-200 flex items-center gap-3">
                        <div className="bg-slate-100 p-1.5 rounded hidden sm:block">
                            <User size={16} className="text-armada-navy" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">ID de Funcionario</span>
                            <span className="text-sm md:text-md font-black text-armada-navy">{user.legajo}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
                {user.role !== 'admin_biena' && (
                    <>
                        <Link to="/reserve" className="group institutional-card hover:translate-y-[-4px] transition-all p-6 md:p-8 flex flex-col h-full hover:border-armada-navy animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <div className="bg-slate-50 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-armada-navy group-hover:bg-armada-navy group-hover:text-white transition-all mb-6 border border-slate-100 group-hover:border-armada-gold">
                                <CompassLogo size={32} bgColor="white" />
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-armada-navy uppercase tracking-tight mb-2">Solicitud de Reserva</h3>
                            <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">Inicie una nueva solicitud para viviendas vacacionales en las sedes de la Armada Nacional.</p>
                            <div className="mt-auto flex items-center text-armada-gold font-bold text-[10px] md:text-xs uppercase tracking-widest gap-2">
                                <span>Acceder Ahora</span>
                                <div className="h-[2px] w-6 md:w-8 bg-armada-gold" />
                            </div>
                        </Link>

                        <Link to="/my-reservations" className="group institutional-card hover:translate-y-[-4px] transition-all p-6 md:p-8 flex flex-col h-full hover:border-armada-navy animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            <div className="bg-slate-50 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-armada-navy group-hover:bg-armada-navy group-hover:text-white transition-all mb-6 border border-slate-100 group-hover:border-armada-gold">
                                <LayoutDashboard size={28} className="md:size-[32px]" />
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-armada-navy uppercase tracking-tight mb-2">Historial y Estado</h3>
                            <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">Consulte el estado de sus reservas vigentes y revise el historial de sus estancias anteriores.</p>
                            <div className="mt-auto flex items-center text-armada-gold font-bold text-[10px] md:text-xs uppercase tracking-widest gap-2">
                                <span>Consultar</span>
                                <div className="h-[2px] w-6 md:w-8 bg-armada-gold" />
                            </div>
                        </Link>
                    </>
                )}

                {isAdmin && (
                    <Link to="/admin" className="group institutional-card hover:translate-y-[-4px] transition-all p-6 md:p-8 flex flex-col h-full border-t-armada-navy/20 hover:border-armada-navy bg-armada-navy/5 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <div className="bg-white w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-armada-navy group-hover:bg-armada-gold group-hover:text-armada-navy transition-all mb-6 border-2 border-armada-gold shadow-sm">
                            <ShieldCheck size={28} className="md:size-[32px]" />
                        </div>
                        <h3 className="text-lg md:text-xl font-black text-armada-navy uppercase tracking-tight mb-2">Administración</h3>
                        <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">Gestione las solicitudes entrantes, apruebe cupos y supervise el calendario de disponibilidad nacional.</p>
                        <div className="mt-auto flex items-center text-armada-navy font-bold text-[10px] md:text-xs uppercase tracking-widest gap-2">
                            <span>SISTEMA ADMIN</span>
                            <div className="h-[2px] w-6 md:w-8 bg-armada-navy" />
                        </div>
                    </Link>
                )}
            </div>

            <section className="institutional-card overflow-hidden !border-t-slate-300 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="bg-slate-50 px-6 md:px-8 py-4 md:py-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <User size={18} className="text-armada-navy" />
                        <h3 className="text-xs font-black text-armada-navy uppercase tracking-widest text-[10px] md:text-xs">Credencial del Solicitante</h3>
                    </div>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1 bg-white border border-slate-200 rounded shrink-0">Solo Lectura</span>
                </div>
                <div className="p-6 md:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        <div className="space-y-1">
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">Jerarquía / Nombre</p>
                            <p className="text-armada-navy font-bold text-sm md:text-md">{user.nombre} {user.apellido}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">Identificación (C.I.)</p>
                            <p className="text-armada-navy font-bold text-sm md:text-md">{user.cedula || 'No registrada'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">Legajo Militar</p>
                            <p className="text-armada-navy font-bold text-sm md:text-md">{user.legajo}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">Dependencia</p>
                            <p className="text-armada-navy font-bold text-sm md:text-md capitalize">{user.role}</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
