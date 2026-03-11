import { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X, Clock, UserIcon, Anchor, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ReservationsTab() {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'administrador';
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('todos');

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
        let comments = `Solicitud ${newStatus} por el Estado Mayor / Administración`;

        if (newStatus === 'rechazada') {
            const reason = window.prompt("Indique el motivo del rechazo (Obligatorio para BIENA):");
            if (!reason) {
                alert("Debe proporcionar un motivo para rechazar la solicitud.");
                return;
            }
            comments = reason;
        } else {
            if (!window.confirm(`¿PROCEDER CON LA APROBACIÓN DE ESTA SOLICITUD?`)) return;
        }

        setActionLoading(id);
        try {
            await api.put(`/reservations/admin/${id}/status`, {
                status: newStatus,
                comments
            });
            loadReservations();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al procesar la orden administrativa');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteReservation = async (id: string) => {
        if (!window.confirm('¿Está seguro de ELIMINAR PERMANENTEMENTE esta solicitud de la base de datos? Esta acción no se puede deshacer.')) return;
        setActionLoading(id);
        try {
            await api.delete(`/reservations/admin/${id}`);
            loadReservations();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al eliminar la reserva');
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

    const sortedReservations = [...reservations].sort((a, b) => {
        if (a.status === 'pendiente' && b.status !== 'pendiente') return -1;
        if (a.status !== 'pendiente' && b.status === 'pendiente') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const filteredReservations = sortedReservations.filter(res => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;

        const solStr = `${res.user.nombre} ${res.user.apellido} ${res.user.legajo}`.toLowerCase();
        const uniStr = `${res.cabin.location.name} ${res.cabin.identifier}`.toLowerCase();
        const estStr = res.status.toLowerCase();

        // Formatear fechas para búsqueda textual fácil (ej: "15 oct", "2026", "15/10/2026")
        const fInicio = format(new Date(res.start_date), "dd MMM yyyy", { locale: es }).toLowerCase();
        const fFin = format(new Date(res.end_date), "dd MMM yyyy", { locale: es }).toLowerCase();
        const fInicioFull = format(new Date(res.start_date), "dd MMMM yyyy", { locale: es }).toLowerCase();
        const fFinFull = format(new Date(res.end_date), "dd MMMM yyyy", { locale: es }).toLowerCase();
        const fInicioNum = format(new Date(res.start_date), "dd/MM/yyyy");
        const fFinNum = format(new Date(res.end_date), "dd/MM/yyyy");
        const fInicioNumShort = format(new Date(res.start_date), "dd/MM/yy");
        const fFinNumShort = format(new Date(res.end_date), "dd/MM/yy");

        const fechaStr = `${fInicio} ${fFin} ${fInicioFull} ${fFinFull} ${fInicioNum} ${fFinNum} ${fInicioNumShort} ${fFinNumShort} ${res.start_date} ${res.end_date}`;

        switch (searchType) {
            case 'solicitante': return solStr.includes(term);
            case 'unidad': return uniStr.includes(term);
            case 'estado': return estStr.includes(term);
            case 'fecha': return fechaStr.includes(term);
            default:
                return solStr.includes(term) || uniStr.includes(term) || estStr.includes(term) || fechaStr.includes(term);
        }
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded institutional-card">
                <div className="flex-1 flex flex-col md:flex-row gap-3">
                    <select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="border-2 border-slate-100 rounded focus:border-armada-navy px-4 py-3 font-bold text-xs uppercase text-slate-500 outline-none transition-all md:w-48 bg-slate-50/50"
                    >
                        <option value="todos">Todos los campos</option>
                        <option value="solicitante">Solicitante</option>
                        <option value="unidad">Destino / Unidad</option>
                        <option value="fecha">Fecha de Reserva</option>
                        <option value="estado">Estado</option>
                    </select>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="BUSCAR EN SOLICITUDES..."
                            className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-xs uppercase tracking-widest"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={loadReservations}
                    className="flex items-center justify-center gap-3 bg-armada-navy text-armada-gold px-6 py-3 rounded font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg border border-armada-gold/30 shrink-0"
                >
                    <RefreshCw size={18} className={actionLoading ? 'animate-spin' : ''} /> ACTUALIZAR
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReservations.map((res) => (
                    <div key={res.id} className="institutional-card p-6 flex flex-col relative group animate-fade-in transition-all hover:border-armada-gold">
                        <div className="flex justify-between items-start mb-4">
                            {getStatusBadge(res.status)}
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Clock size={10} />
                                <span className="text-[8px] font-bold uppercase">{format(new Date(res.created_at), "dd/MM/yy HH:mm")}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded border border-slate-100">
                            <div className="bg-white p-2 rounded-full border border-slate-200 shadow-sm">
                                <UserIcon size={14} className="text-armada-navy" />
                            </div>
                            <div className="overflow-hidden">
                                <div className="font-black text-armada-navy uppercase text-xs truncate">{res.user.nombre} {res.user.apellido}</div>
                                <div className="text-slate-400 text-[9px] font-bold uppercase truncate">L: {res.user.legajo} | CI: {res.user.cedula}</div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6 flex-1">
                            <div className="flex items-start gap-3">
                                <Anchor size={14} className="text-armada-gold mt-1 shrink-0" />
                                <div>
                                    <div className="font-black text-armada-navy text-xs uppercase tracking-tight">{res.cabin.location.name}</div>
                                    <div className="text-slate-600 text-[10px] font-bold uppercase">{res.cabin.identifier} — {res.occupants} OCUPANTES</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock size={14} className="text-slate-400 mt-1 shrink-0" />
                                <div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Período de Estancia</div>
                                    <div className="text-armada-navy text-xs font-black uppercase mt-0.5">
                                        {format(new Date(res.start_date), "dd MMM", { locale: es })} AL {format(new Date(res.end_date), "dd MMM, yyyy", { locale: es })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            {res.status === 'pendiente' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleStatusUpdate(res.id, 'aprobada')}
                                        disabled={actionLoading === res.id}
                                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[10px] tracking-widest py-3 rounded shadow-md transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <Check size={14} strokeWidth={3} /> Autorizar
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(res.id, 'rechazada')}
                                        disabled={actionLoading === res.id}
                                        className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 font-black uppercase text-[10px] tracking-widest py-3 rounded border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <X size={14} strokeWidth={3} /> Denegar
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Observaciones Administrativas:</span>
                                    <p className="text-[10px] text-slate-600 font-bold italic">
                                        {res.comments || 'Sin comentarios adicionales.'}
                                    </p>
                                </div>
                            )}
                            {isSuperAdmin && (
                                <button
                                    onClick={() => handleDeleteReservation(res.id)}
                                    disabled={actionLoading === res.id}
                                    className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-500 border border-red-200 font-black uppercase text-[9px] tracking-widest py-2 rounded transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <Trash2 size={12} strokeWidth={3} /> Eliminar Permanentemente
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredReservations.length === 0 && !loading && (
                <div className="institutional-card py-20 text-center animate-fade-in">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">No hay solicitudes pendientes con ese criterio</p>
                </div>
            )}
        </div>
    );
}
