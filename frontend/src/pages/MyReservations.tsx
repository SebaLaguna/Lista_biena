import { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MapPin, Clock, Anchor, Ship, ShieldCheck } from 'lucide-react';

export default function MyReservations() {
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/reservations/me')
            .then(res => setReservations(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'aprobada': return 'bg-green-50 text-green-700 border-green-200';
            case 'rechazada': return 'bg-red-50 text-red-700 border-red-200';
            case 'cancelada': return 'bg-slate-50 text-slate-600 border-slate-200';
            default: return 'bg-armada-gold/10 text-armada-navy border-armada-gold/30'; // pendiente
        }
    };

    if (loading) return <div className="p-12 text-center text-armada-navy font-bold animate-pulse">Cargando legajo de reservas...</div>;

    return (
        <div className="w-full space-y-8 md:space-y-10 py-4 md:py-8 px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b-4 border-armada-gold pb-6 text-center sm:text-left animate-fade-in-up">
                <div className="bg-armada-navy p-3 rounded shadow-lg shrink-0">
                    <Ship className="text-white" size={28} />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-armada-navy uppercase tracking-tighter">Historial de Reservas</h2>
                    <p className="text-slate-500 font-medium text-[10px] md:text-sm uppercase tracking-widest mt-1">Registro oficial de solicitudes y estancias vacacionales</p>
                </div>
            </div>

            {reservations.length === 0 ? (
                <div className="institutional-card p-12 md:p-16 text-center bg-slate-50/50 border-dashed border-2 border-slate-200 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <Compass className="mx-auto h-12 w-12 md:h-16 md:w-16 text-slate-300 mb-4" />
                    <h3 className="text-lg md:text-xl font-bold text-slate-400 uppercase tracking-widest">Sin registros activos</h3>
                    <p className="mt-2 text-slate-400 text-xs md:text-sm">No se han encontrado solicitudes vinculadas a su legajo militar.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:gap-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    {reservations.map((reservation, idx) => (
                        <div key={reservation.id} className="institutional-card group hover:border-armada-gold transition-all overflow-hidden" style={{ animationDelay: `${idx * 50}ms` }}>
                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                <div className="p-5 md:p-8 md:w-2/3 space-y-6">
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-armada-gold mb-1">
                                                <Anchor size={12} />
                                                <span>Destino Naval</span>
                                            </div>
                                            <h3 className="text-lg md:text-xl font-black text-armada-navy uppercase tracking-tight">
                                                {reservation.cabin.location.name} — {reservation.cabin.identifier}
                                            </h3>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded text-[9px] md:text-[10px] font-black uppercase tracking-widest border shadow-sm w-full sm:w-auto text-center ${getStatusStyles(reservation.status)}`}>
                                            {reservation.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-slate-100 p-2 rounded shrink-0">
                                                <Calendar size={18} className="text-armada-navy" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Período de Estancia</p>
                                                <p className="text-xs md:text-sm font-bold text-slate-700">
                                                    {format(new Date(reservation.start_date), "dd MMMM", { locale: es })} — {format(new Date(reservation.end_date), "dd MMMM, yyyy", { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="bg-slate-100 p-2 rounded shrink-0">
                                                <MapPin size={18} className="text-armada-navy" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Ubicación Geográfica</p>
                                                <p className="text-xs md:text-sm font-bold text-slate-700">{reservation.cabin.location.name}, Uruguay</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 md:p-8 md:w-1/3 bg-slate-50/50 flex flex-col justify-between border-t md:border-t-0">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock size={14} />
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Fecha de Solicitud</span>
                                        </div>
                                        <p className="text-xs md:text-sm font-bold text-slate-600">{format(new Date(reservation.created_at), "PPP", { locale: es })}</p>
                                    </div>

                                    {reservation.status === 'pendiente' && (
                                        <div className="mt-6 flex items-center gap-3 bg-white p-3 rounded border border-armada-gold/20 shadow-sm">
                                            <ShieldCheck size={16} className="text-armada-gold shrink-0" />
                                            <p className="text-[8px] md:text-[9px] font-bold text-armada-navy uppercase leading-tight italic">
                                                Esta solicitud se encuentra bajo revisión de BIENA.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper icons specifically for this view
const Compass = ({ className, size }: { className?: string, size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
);
