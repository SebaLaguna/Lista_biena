import { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X, Clock, UserIcon, MapPin, ShieldCheck, Anchor, RefreshCw } from 'lucide-react';

export default function AdminPanel() {
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadReservations = () => {
        setLoading(true);
        api.get('/reservations/admin')
            .then(res => setReservations(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadReservations();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        const labels: Record<string, string> = { aprobada: 'APROBACIÓN', rechazada: 'RECHAZO' };
        const label = labels[newStatus] ?? newStatus.toUpperCase();
        if (!window.confirm(`¿PROCEDER CON LA ${label} DE ESTA SOLICITUD?`)) return;

        setActionLoading(id);
        try {
            await api.put(`/reservations/admin/${id}/status`, {
                status: newStatus,
                comments: `Solicitud ${newStatus} por el Estado Mayor / Administración`
            });
            loadReservations();
        } catch (err) {
            console.error(err);
            alert('Error al procesar la orden administrativa');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aprobada': return <span className="bg-green-50 text-green-700 border-green-200 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border shadow-sm">Autorizada</span>;
            case 'rechazada': return <span className="bg-red-50 text-red-700 border-red-200 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border shadow-sm">Denegada</span>;
            case 'cancelada': return <span className="bg-slate-50 text-slate-500 border-slate-200 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border shadow-sm">Anulada</span>;
            default: return <span className="bg-armada-gold/10 text-armada-navy border-armada-gold/30 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border shadow-sm inline-flex items-center gap-1.5"><Clock size={10} /> En Revisión</span>;
        }
    };

    if (loading && reservations.length === 0) return <div className="p-12 text-center text-armada-navy font-black animate-pulse uppercase tracking-[0.2em]">Accediendo al Registro Central de Reservas...</div>;

    return (
        <div className="w-full space-y-8 md:space-y-10 py-4 md:py-8 px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end border-b-4 border-armada-gold pb-6 gap-4 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    <div className="bg-armada-navy p-3 rounded shadow-xl border border-armada-gold/30 shrink-0">
                        <ShieldCheck className="text-armada-gold" size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-armada-navy uppercase tracking-tighter">Estado Mayor de Reservas</h2>
                        <p className="text-slate-500 font-medium text-[10px] md:text-sm uppercase tracking-widest mt-1">Control y Gestión de Viviendas Vacacionales</p>
                    </div>
                </div>
                <button
                    onClick={loadReservations}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 btn-armada text-[10px] md:text-xs py-2.5 md:py-3 px-6 shadow-md active:scale-95"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    ACTUALIZAR REGISTROS
                </button>
            </div>

            <div className="institutional-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 text-left text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 italic">Estado</th>
                                <th className="px-5 py-4 text-left text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 italic">Funcionario Solicitante</th>
                                <th className="px-5 py-4 text-left text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 italic">Destino y Período</th>
                                <th className="px-5 py-4 text-left text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 italic">Registro</th>
                                <th className="px-5 py-4 text-right text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 italic">Mando Administrativo</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {reservations.map((res) => (
                                <tr key={res.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-5 py-5 whitespace-nowrap">
                                        {getStatusBadge(res.status)}
                                    </td>
                                    <td className="px-5 py-5 min-w-[200px]">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 p-2 rounded-full border border-slate-200 shrink-0">
                                                <UserIcon size={16} className="text-armada-navy" />
                                            </div>
                                            <div>
                                                <div className="font-black text-armada-navy uppercase tracking-tight text-xs md:text-sm leading-none mb-1">{res.user.nombre} {res.user.apellido}</div>
                                                <div className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">L: {res.user.legajo} | CI: {res.user.cedula}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 min-w-[250px]">
                                        <div className="flex items-start gap-3">
                                            <MapPin size={16} className="text-armada-gold mt-1 shrink-0" />
                                            <div>
                                                <div className="font-bold text-slate-700 text-xs md:text-sm uppercase leading-tight">{res.cabin.location.name} — {res.cabin.identifier}</div>
                                                <div className="text-slate-400 text-[9px] md:text-[10px] font-bold mt-1 uppercase tracking-tight">
                                                    {format(new Date(res.start_date), "dd MMMM", { locale: es })} AL {format(new Date(res.end_date), "dd MMMM, yyyy", { locale: es })}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-slate-400 text-[9px] md:text-[10px] font-bold">
                                            <Clock size={12} />
                                            {format(new Date(res.created_at), "dd/MM/yyyy HH:mm")}
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 whitespace-nowrap text-right">
                                        {res.status === 'pendiente' ? (
                                            <div className="flex items-center justify-end gap-3 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleStatusUpdate(res.id, 'aprobada')}
                                                    disabled={actionLoading === res.id}
                                                    className="bg-green-500 hover:bg-green-600 text-white p-2 md:p-2.5 rounded shadow-sm transition-all disabled:opacity-50 active:scale-90"
                                                    title="Autorizar Solicitud"
                                                >
                                                    <Check size={18} strokeWidth={3} />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(res.id, 'rechazada')}
                                                    disabled={actionLoading === res.id}
                                                    className="bg-red-500 hover:bg-red-600 text-white p-2 md:p-2.5 rounded shadow-sm transition-all disabled:opacity-50 active:scale-90"
                                                    title="Denegar Solicitud"
                                                >
                                                    <X size={18} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-2 text-slate-300">
                                                <Anchor size={14} className="opacity-20" />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {reservations.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Anchor size={48} className="text-slate-100" />
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">No se han reportado solicitudes pendientes</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-center text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] pt-4 italic">
                Operaciones Logísticas de Bienestar · Armada Nacional de Uruguay
            </p>
        </div>
    );
}
