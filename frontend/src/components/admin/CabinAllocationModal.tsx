import { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, Check, Home, Users, AlertCircle, RefreshCw, Info, ShieldAlert } from 'lucide-react';
import { formatDateSafe } from '../../utils/dateUtils';

interface Cabin {
    id: string;
    identifier: string;
    capacity: number;
    status: string;
    allowed_hierarchies?: string[];
}

interface CabinAllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (cabinId: string) => void;
    reservation: {
        id: string;
        start_date: string;
        end_date: string;
        location_id: string;
        occupants: number;
        user: {
            nombre: string;
            apellido: string;
            jerarquia: string;
            legajo: string;
        };
        location?: {
            name: string;
        };
    } | null;
}

export default function CabinAllocationModal({ isOpen, onClose, onConfirm, reservation }: CabinAllocationModalProps) {
    const [cabins, setCabins] = useState<Cabin[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedCabinId, setSelectedCabinId] = useState('');
    const [busyCabinIds, setBusyCabinIds] = useState<string[]>([]);
    const [blockedCabinIds, setBlockedCabinIds] = useState<string[]>([]);
    const [overlapDetails, setOverlapDetails] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (isOpen && reservation) {
            fetchCabinsAndAvailability();
        } else {
            setCabins([]);
            setSelectedCabinId('');
            setBusyCabinIds([]);
            setBlockedCabinIds([]);
            setOverlapDetails({});
            setError('');
        }
    }, [isOpen, reservation]);

    const fetchCabinsAndAvailability = async () => {
        if (!reservation) return;
        setLoading(true);
        setError('');
        try {
            // 1. Get all cabins for the location
            const cabinsRes = await api.get('/cabins');
            const locData = cabinsRes.data.find((l: any) => l.id === reservation.location_id);
            const allCabins: Cabin[] = locData ? locData.cabins : [];
            
            // 2. Fetch availability for the timeframe
            const availRes = await api.get(
                `/reservations/availability?location_id=${reservation.location_id}&start_date=${reservation.start_date}&end_date=${reservation.end_date}`
            );
            const { reservations: overlappingRes, blockedDates: overlappingBlocked } = availRes.data;

            const busyIds: string[] = [];
            const blockedIds: string[] = [];
            const details: { [key: string]: string } = {};

            // Determine busy cabins (already approved)
            overlappingRes.forEach((r: any) => {
                if (r.status === 'aprobada' && r.cabin_id) {
                    busyIds.push(r.cabin_id);
                    details[r.cabin_id] = `Reservada por ${r.user?.nombre || ''} ${r.user?.apellido || 'Otro Funcionario'}`;
                }
            });

            // Determine blocked cabins
            overlappingBlocked.forEach((b: any) => {
                if (b.cabin_id) {
                    blockedIds.push(b.cabin_id);
                    details[b.cabin_id] = b.reason || 'Bloqueo Administrativo';
                } else {
                    // If cabin_id is null, it's a global block for the entire location
                    allCabins.forEach(c => {
                        blockedIds.push(c.id);
                        details[c.id] = b.reason || 'Bloqueo General de la Sede';
                    });
                }
            });

            setCabins(allCabins);
            setBusyCabinIds(busyIds);
            setBlockedCabinIds(blockedIds);
            setOverlapDetails(details);
        } catch (err: any) {
            console.error(err);
            setError('Error al obtener la disponibilidad de cabañas en la sede.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !reservation) return null;

    const handleConfirm = () => {
        if (!selectedCabinId) {
            setError('Debe seleccionar una cabaña.');
            return;
        }
        onConfirm(selectedCabinId);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-armada-navy/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-in">
                {/* Header */}
                <div className="bg-armada-navy p-5 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Home size={100} className="text-white" />
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="bg-white/10 p-2.5 rounded-full border border-white/20 backdrop-blur-sm">
                            <Home size={20} className="text-armada-gold" />
                        </div>
                        <div>
                            <h3 className="text-white font-black uppercase tracking-widest text-lg leading-none">Asignación de Cabaña</h3>
                            <p className="text-armada-gold/80 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
                                Solicitud Estival — {reservation.location?.name || 'Sede Solicitada'}
                            </p>
                        </div>
                    </div>
                    
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors relative z-10">
                        <X size={20} />
                    </button>
                </div>

                {/* Info Bar */}
                <div className="bg-slate-50 border-b border-slate-100 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Funcionario</span>
                        <span className="text-armada-navy uppercase font-black">{reservation.user.nombre} {reservation.user.apellido}</span>
                    </div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Jerarquía</span>
                        <span className="bg-slate-800 text-armada-gold px-1.5 py-0.5 rounded text-[8px] font-black border border-armada-gold/20 inline-block mt-0.5">{reservation.user.jerarquia || 'S/G'}</span>
                    </div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Período</span>
                        <span className="text-slate-800 uppercase font-black">
                            {formatDateSafe(reservation.start_date, "dd/MM/yy")} AL {formatDateSafe(reservation.end_date, "dd/MM/yy")}
                        </span>
                    </div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Ocupantes</span>
                        <span className="text-slate-800 uppercase font-black">{reservation.occupants} Persona(s)</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <RefreshCw className="animate-spin text-armada-navy" size={32} />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Analizando ocupación y disponibilidad...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-700 p-4 rounded border-r-4 border-red-500 text-xs font-black uppercase flex items-center gap-3">
                            <AlertCircle size={20} className="text-red-500 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : cabins.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-bold uppercase text-xs">
                            No hay cabañas registradas en esta sede.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Seleccione una Cabaña Disponible
                            </label>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {cabins.map(cabin => {
                                    const isBusy = busyCabinIds.includes(cabin.id);
                                    const isBlocked = blockedCabinIds.includes(cabin.id) || cabin.status !== 'disponible';
                                    const isTooSmall = cabin.capacity < reservation.occupants;
                                    
                                    // Check hierarchy restrictions
                                    const isHierarchyRestricted = cabin.allowed_hierarchies && 
                                        cabin.allowed_hierarchies.length > 0 && 
                                        !cabin.allowed_hierarchies.includes(reservation.user.jerarquia);

                                    const isDisabled = isBusy || isBlocked;
                                    const isSelected = selectedCabinId === cabin.id;

                                    let statusText = 'Disponible';
                                    let statusColor = 'text-green-600 bg-green-50 border-green-200';
                                    let badgeIcon = <Check size={10} />;

                                    if (isBusy) {
                                        statusText = overlapDetails[cabin.id] || 'Ocupada';
                                        statusColor = 'text-red-600 bg-red-50 border-red-200';
                                        badgeIcon = <X size={10} />;
                                    } else if (isBlocked) {
                                        statusText = overlapDetails[cabin.id] || 'Bloqueo Admin / Mantenimiento';
                                        statusColor = 'text-orange-600 bg-orange-50 border-orange-200';
                                        badgeIcon = <ShieldAlert size={10} />;
                                    }

                                    return (
                                        <div
                                            key={cabin.id}
                                            onClick={() => !isDisabled && setSelectedCabinId(cabin.id)}
                                            className={`p-4 rounded-lg border-2 text-left transition-all relative flex flex-col justify-between ${
                                                isDisabled 
                                                    ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed' 
                                                    : isSelected
                                                        ? 'border-armada-navy bg-slate-50 ring-1 ring-armada-navy/10 cursor-pointer shadow-md'
                                                        : 'border-slate-100 hover:border-armada-gold/50 bg-white cursor-pointer'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-black text-xs text-armada-navy uppercase">
                                                        Cabaña {cabin.identifier}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border flex items-center gap-1 ${statusColor}`}>
                                                        {badgeIcon} {statusText}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Users size={12} className="text-slate-400" />
                                                        Cap: {cabin.capacity} pers
                                                    </span>
                                                    {cabin.allowed_hierarchies && cabin.allowed_hierarchies.length > 0 && (
                                                        <span className="text-[8px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">
                                                            Jerarquías: {cabin.allowed_hierarchies.join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Warnings */}
                                            {!isDisabled && (isTooSmall || isHierarchyRestricted) && (
                                                <div className="mt-2.5 bg-amber-50 text-amber-800 p-2 rounded border border-amber-200 text-[8px] font-bold uppercase tracking-tight flex items-center gap-1.5">
                                                    <Info size={10} className="text-amber-600" />
                                                    <span>
                                                        {isTooSmall && 'Capacidad menor a ocupantes. '}
                                                        {isHierarchyRestricted && 'Jerarquía restringida. '}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="bg-white text-slate-600 px-6 py-2.5 rounded font-black text-xs uppercase tracking-widest hover:bg-slate-100 border border-slate-200 transition-all shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!selectedCabinId || loading}
                        className={`px-8 py-2.5 rounded font-black text-xs uppercase tracking-widest transition-all shadow-md ${
                            selectedCabinId && !loading
                                ? 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        Autorizar y Asignar
                    </button>
                </div>
            </div>
        </div>
    );
}
