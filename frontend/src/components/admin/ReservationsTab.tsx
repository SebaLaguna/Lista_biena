import { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { formatDateSafe } from '../../utils/dateUtils';
import { Check, X, Clock, UserIcon, Anchor, RefreshCw, Search, Trash2, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PersonnelDetailModal from './PersonnelDetailModal';
import CabinAllocationModal from './CabinAllocationModal';

interface ReservationsTabProps {
    unseenIds?: string[];
    markAsViewed?: (id: string) => void;
    markAllAsViewed?: () => void;
}

export default function ReservationsTab({ unseenIds = [], markAsViewed = () => {}, markAllAsViewed }: ReservationsTabProps) {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('todos');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [onlyNew, setOnlyNew] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedEstivalRes, setSelectedEstivalRes] = useState<any>(null);
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [limit, setLimit] = useState<string>('50');
    const [totalCount, setTotalCount] = useState<number>(0);

    const loadReservations = () => {
        setLoading(true);
        const url = limit === 'todos' ? '/reservations/admin' : `/reservations/admin?limit=${limit}`;
        api.get(url)
            .then(res => {
                setReservations(res.data);
                const total = res.headers['x-total-count'];
                if (total) {
                    setTotalCount(parseInt(total));
                } else {
                    setTotalCount(res.data.length);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadReservations();
    }, [limit]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        const reservation = reservations.find(r => r.id === id);
        if (!reservation) return;

        if (newStatus === 'aprobada' && !reservation.cabin_id) {
            // Pending estival reservation: must select cabin first
            setSelectedEstivalRes(reservation);
            setIsAllocationModalOpen(true);
            return;
        }

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
            const unseenReq = `req_${id}`;
            const unseenCan = `can_${id}`;
            if (markAsViewed) {
                if (unseenIds.includes(unseenReq)) markAsViewed(unseenReq);
                if (unseenIds.includes(unseenCan)) markAsViewed(unseenCan);
            }
            loadReservations();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al procesar la orden administrativa');
        } finally {
            setActionLoading(null);
        }
    };

    const handleAllocateCabin = async (cabinId: string) => {
        if (!selectedEstivalRes) return;
        setIsAllocationModalOpen(false);
        const id = selectedEstivalRes.id;
        setActionLoading(id);
        try {
            await api.put(`/reservations/admin/${id}/status`, {
                status: 'aprobada',
                cabin_id: cabinId,
                comments: 'Postulación estival autorizada con cabaña asignada'
            });
            const unseenReq = `req_${id}`;
            const unseenCan = `can_${id}`;
            if (markAsViewed) {
                if (unseenIds.includes(unseenReq)) markAsViewed(unseenReq);
                if (unseenIds.includes(unseenCan)) markAsViewed(unseenCan);
            }
            loadReservations();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al autorizar la postulación estival');
        } finally {
            setActionLoading(null);
            setSelectedEstivalRes(null);
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

    const handleStatusToggle = (status: string) => {
        setSelectedStatuses(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const filteredReservations = sortedReservations.filter(res => {
        // 1. Estados (Dashboard persistente)
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(res.status)) return false;

        // 2. Solo Nuevos (Globito rojo)
        const unseenReq = `req_${res.id}`;
        const unseenCan = `can_${res.id}`;
        if (onlyNew && !unseenIds.includes(unseenReq) && !unseenIds.includes(unseenCan)) return false;

        // 3. Búsqueda por Texto
        const term = searchTerm.toLowerCase();
        if (!term) return true;

        const solStr = `${res.user.nombre} ${res.user.apellido} ${res.user.legajo}`.toLowerCase();
        const uniStr = `${res.cabin?.location?.name || res.location?.name || ''} ${res.cabin?.identifier || 'Postulación Estival'}`.toLowerCase();

        // Formatear fechas de forma segura para búsqueda
        const fInicio = formatDateSafe(res.start_date, "dd MMM yyyy").toLowerCase();
        const fFin = formatDateSafe(res.end_date, "dd MMM yyyy").toLowerCase();
        const fechaStr = `${fInicio} ${fFin} ${res.start_date} ${res.end_date}`;

        switch (searchType) {
            case 'solicitante': return solStr.includes(term);
            case 'unidad': return uniStr.includes(term);
            case 'fecha': return fechaStr.includes(term);
            default:
                return solStr.includes(term) || uniStr.includes(term) || fechaStr.includes(term);
        }
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* DASHBOARD DE FILTROS PERSISTENTES */}
            <div className="bg-white p-6 rounded institutional-card shadow-sm border border-slate-100">
                <div className="flex flex-col gap-6 mb-8 pb-8 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de las Solicitudes</label>
                            <div className="flex flex-wrap gap-2 items-center">
                                {[
                                    {id: 'aprobada', label: 'Autorizadas', color: 'bg-green-100 text-green-700 border-green-500'},
                                    {id: 'pendiente', label: 'En Revisión (Pendientes)', color: 'bg-yellow-100 text-yellow-700 border-yellow-500'},
                                    {id: 'rechazada', label: 'Denegadas', color: 'bg-red-100 text-red-700 border-red-500'},
                                    {id: 'cancelada', label: 'Anuladas', color: 'bg-slate-200 text-slate-600 border-slate-400'}
                                ].map(st => (
                                    <button
                                        key={st.id}
                                        onClick={() => handleStatusToggle(st.id)}
                                        className={`px-4 py-2.5 rounded text-[10px] font-black transition-all border uppercase tracking-wider ${selectedStatuses.includes(st.id) ? st.color + ' shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-armada-gold'}`}
                                    >
                                        {st.label}
                                    </button>
                                ))}

                                <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>

                                <button
                                    onClick={() => setOnlyNew(!onlyNew)}
                                    className={`px-4 py-2.5 rounded text-[9px] font-black transition-all border uppercase tracking-widest flex items-center gap-2 ${onlyNew ? 'bg-red-500 text-white border-red-600 shadow-md transform scale-105' : 'bg-white text-slate-400 border-slate-200 hover:border-red-500'}`}
                                    title="Ver solo solicitudes con notificaciones pendientes"
                                >
                                    <div className={`w-2 h-2 rounded-full ${onlyNew ? 'bg-white animate-pulse' : 'bg-red-500'}`}></div>
                                    Solo Nuevos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BARRA DE BÚSQUEDA DE TEXTO */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex flex-col gap-1 w-full md:w-48">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar por Campo</label>
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="border-2 border-slate-100 rounded focus:border-armada-navy px-4 py-2.5 font-bold text-[11px] uppercase text-slate-500 outline-none transition-all bg-slate-50/50"
                        >
                            <option value="todos">Cualquier Campo</option>
                            <option value="solicitante">Funcionario (Nombre/LEG)</option>
                            <option value="unidad">Sede / Unidad</option>
                            <option value="fecha">Fecha de Estancia</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1 w-full md:w-40">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Límite de Carga</label>
                        <select
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                            className="border-2 border-slate-100 rounded focus:border-armada-navy px-4 py-2.5 font-bold text-[11px] uppercase text-slate-500 outline-none transition-all bg-slate-50/50"
                        >
                            <option value="30">30 Solicitudes</option>
                            <option value="50">50 Solicitudes</option>
                            <option value="100">100 Solicitudes</option>
                            <option value="200">200 Solicitudes</option>
                            <option value="todos">Cargar Todo</option>
                        </select>
                    </div>

                    <div className="flex-1 flex flex-col gap-1 w-full">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Término de Búsqueda</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="ESCRIBA FECHA, NOMBRE O UNIDAD..."
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-black text-[11px] uppercase tracking-widest bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 self-end shrink-0 pb-1">
                        {unseenIds.length > 0 && markAllAsViewed && (
                            <button
                                onClick={markAllAsViewed}
                                className="flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-2.5 rounded font-black text-[10px] uppercase tracking-widest hover:bg-red-650 transition-all shadow border border-red-600 shrink-0"
                            >
                                MARCAR TODAS COMO LEÍDAS
                            </button>
                        )}
                        <button
                            onClick={loadReservations}
                            className="flex items-center justify-center gap-2 bg-armada-navy text-armada-gold px-6 py-2.5 rounded font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow border border-armada-gold/30 shrink-0"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> REFRESCAR
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Resultados filtrados:</span>
                    <span className="bg-armada-navy text-armada-gold px-3 py-1 rounded text-xs font-black border border-armada-gold/30 shadow-sm">
                        {filteredReservations.length} de {limit === 'todos' ? reservations.length : totalCount} solicitudes {limit !== 'todos' && `(cargadas: ${reservations.length})`}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
                {filteredReservations.map((res) => {
                    const unseenReq = `req_${res.id}`;
                    const unseenCan = `can_${res.id}`;
                    const isUnseen = unseenIds.includes(unseenReq) || unseenIds.includes(unseenCan);
                    
                    return (
                        <div
                            key={res.id}
                            className="relative institutional-card p-6 flex flex-col group animate-fade-in transition-all hover:border-armada-gold shadow-sm"
                        >
                            {isUnseen && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (markAsViewed) {
                                            if (unseenIds.includes(unseenReq)) markAsViewed(unseenReq);
                                            if (unseenIds.includes(unseenCan)) markAsViewed(unseenCan);
                                        }
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-white shadow-sm flex items-center justify-center animate-pulse z-10 active:scale-95 transition-all"
                                    title="Marcar como leída"
                                >
                                    NUEVA
                                </button>
                            )}
                            <div className="flex justify-between items-start mb-4">
                                {getStatusBadge(res.status)}
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <Clock size={12} />
                                    <span className="text-[10px] font-bold uppercase">{format(new Date(res.created_at), "dd/MM/yy HH:mm")}</span>
                                </div>
                            </div>

                            <div 
                                className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors group/user shadow-sm active:scale-95"
                                onClick={() => {
                                    setSelectedUser(res.user);
                                    setIsUserModalOpen(true);
                                    if (isUnseen && markAsViewed) {
                                        if (unseenIds.includes(unseenReq)) markAsViewed(unseenReq);
                                        if (unseenIds.includes(unseenCan)) markAsViewed(unseenCan);
                                    }
                                }}
                                title="Click para ver expediente completo"
                            >
                                <div className="bg-white p-2 rounded-full border border-slate-200 shadow-sm group-hover/user:border-armada-gold transition-colors relative">
                                    <UserIcon size={14} className="text-armada-navy" />
                                    <div className="absolute -top-1 -right-1 bg-armada-gold rounded-full p-0.5 shadow-sm opacity-0 group-hover/user:opacity-100 transition-opacity">
                                        <Info size={8} className="text-white" />
                                    </div>
                                </div>
                                <div className="overflow-hidden">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="bg-slate-800 text-armada-gold px-1.5 py-0.5 rounded text-[8px] font-black border border-armada-gold/30">{res.user.jerarquia || 'S/G'}</span>
                                        {res.user.cuerpo && (
                                            <span className="bg-armada-navy/10 text-armada-navy px-1.5 py-0.5 rounded text-[8px] font-black border border-armada-navy/10">{res.user.cuerpo}</span>
                                        )}
                                        <div className="font-black text-armada-navy uppercase text-sm truncate">{res.user.nombre} {res.user.apellido}</div>
                                    </div>
                                    <div className="text-slate-400 text-[10px] font-bold uppercase truncate">LB: {res.user.legajo} | CI: {res.user.cedula}</div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6 flex-1">
                                <div className="flex items-start gap-4">
                                    <Anchor size={16} className="text-armada-gold mt-1 shrink-0" />
                                    <div>
                                        <div className="font-black text-armada-navy text-sm uppercase tracking-tight">
                                            {res.cabin?.location?.name || res.location?.name || 'Sede Solicitada'}
                                        </div>
                                        <div className="text-slate-600 text-xs font-bold uppercase">
                                            {res.cabin?.identifier || 'POSTULACIÓN ESTIVAL'} — {res.occupants} OCUPANTES
                                        </div>
                                        {res.priority && (
                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                <span className="bg-armada-gold text-armada-navy px-1.5 py-0.5 rounded text-[8px] font-black border border-armada-navy/15 shadow-sm">
                                                    OPCIÓN {res.priority}
                                                </span>
                                                {res.application_group && (
                                                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-bold border border-slate-200">
                                                        GRUPO: {res.application_group.substring(0, 8).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Clock size={16} className="text-slate-400 mt-1 shrink-0" />
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Período de Estancia</div>
                                        <div className="text-armada-navy text-sm font-black uppercase mt-0.5">
                                            {formatDateSafe(res.start_date, "dd MMM").toUpperCase()} AL {formatDateSafe(res.end_date, "dd MMM, yyyy").toUpperCase()}
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
                                    <div className={`${res.status === 'cancelada' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'} p-3 rounded border transition-colors`}>
                                        <span className={`text-[10px] font-black ${res.status === 'cancelada' ? 'text-red-400' : 'text-slate-400'} uppercase block mb-1`}>
                                            {res.status === 'cancelada' ? 'Aviso de Anulación:' : 'Observaciones Administrativas:'}
                                        </span>
                                        <p className={`text-xs ${res.status === 'cancelada' ? 'text-red-600' : 'text-slate-600'} font-bold italic`}>
                                            {res.comments || (res.status === 'cancelada' ? 'El usuario ha anulado esta solicitud.' : 'Sin comentarios adicionales.')}
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
                    );
                })}
            </div>

            {filteredReservations.length === 0 && !loading && (
                <div className="institutional-card py-20 text-center animate-fade-in">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">No hay solicitudes pendientes con ese criterio</p>
                </div>
            )}

            <PersonnelDetailModal 
                isOpen={isUserModalOpen} 
                onClose={() => setIsUserModalOpen(false)} 
                user={selectedUser} 
            />

            <CabinAllocationModal
                isOpen={isAllocationModalOpen}
                onClose={() => { setIsAllocationModalOpen(false); setSelectedEstivalRes(null); }}
                onConfirm={handleAllocateCabin}
                reservation={selectedEstivalRes}
            />
        </div>
    );
}
