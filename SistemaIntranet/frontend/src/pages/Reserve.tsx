import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';
import { addDays, eachDayOfInterval, differenceInDays } from 'date-fns';
import { parseDateSafe } from '../utils/dateUtils';
import { MapPin, ChevronRight, Info, AlertCircle, CheckCircle2, X, ShieldAlert } from 'lucide-react';
import CompassLogo from '../components/CompassLogo';
import { useAuth } from '../context/AuthContext';

interface Cabin {
    id: string;
    identifier: string;
    capacity: number;
    status: string;
}

interface Location {
    id: string;
    name: string;
    mando?: string;
    cabins: Cabin[];
}

const HIERARCHY_OPTIONS = [
    { value: 'ALM', label: 'Almirante (ALM)' },
    { value: 'CA', label: 'Contraalmirante (CA)' },
    { value: 'CN', label: 'Capitán de Navío (CN)' },
    { value: 'CF', label: 'Capitán de Fragata (CF)' },
    { value: 'CC', label: 'Capitán de Corbeta (CC)' },
    { value: 'TN', label: 'Teniente de Navío (TN)' },
    { value: 'AN', label: 'Alférez de Navío (AN)' },
    { value: 'AF', label: 'Alférez de Fragata (AF)' },
    { value: 'GM', label: 'Guardiamarina (GM)' },
    { value: 'SOC', label: 'Suboficial de Cargo (SOC)' },
    { value: 'SOP', label: 'Suboficial de Primera (SOP)' },
    { value: 'SOS', label: 'Suboficial de Segunda (SOS)' },
    { value: 'CP', label: 'Cabo de Primera (CP)' },
    { value: 'CS', label: 'Cabo de Segunda (CS)' },
    { value: 'MP', label: 'Marinero de Primera (MP)' },
    { value: 'RET', label: 'Retirado (RET)' }
];

const CUERPO_OPTIONS = [
    { value: 'CG', label: 'Cuerpo General (CG)' },
    { value: 'CIME', label: 'Ingeniería de Máquinas y Electricidad (CIME)' },
    { value: 'CP', label: 'Cuerpo de Prefectura (CP)' },
    { value: 'CAA', label: 'Administración y Abastecimiento (CAA)' },
    { value: 'RN', label: 'Reserva Naval (RN)' },
    { value: 'MED', label: 'Servicio de Sanidad (MED)' },
    { value: 'CC', label: 'Cuerpo Complementario (CC)' },
    { value: 'S/C', label: 'Sin Cuerpo / Otro (S/C)' }
];

export default function Reserve() {
    const { user, updateUser } = useAuth();
    const [locations, setLocations] = useState<Location[]>([]);
    
    // Reglas de anticipación por jerarquía
    const isRetired = user?.jerarquia === 'RET';
    const anticipationDays = isRetired ? 45 : 60;
    const maxDateLimit = addDays(new Date(), anticipationDays);

    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [selectedCabin, setSelectedCabin] = useState<string>('');

    // Nueva gestión de fechas
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [disabledDates, setDisabledDates] = useState<Date[]>([]);
    const [approvedDates, setApprovedDates] = useState<Date[]>([]);
    const [bienaBlockedDates, setBienaBlockedDates] = useState<Date[]>([]);
    const [pendingDates, setPendingDates] = useState<Date[]>([]);
    const [showPendingWarning, setShowPendingWarning] = useState(false);
    
    // Periodos Estivales
    const [estivalPeriods, setEstivalPeriods] = useState<any[]>([]);
    const [estivalDates, setEstivalDates] = useState<Date[]>([]);

    // Ocupantes y términos
    const [occupants, setOccupants] = useState<number>(1);
    const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    // Estados para el Modal Obligatorio de Perfil
    const [showProfileModal, setShowProfileModal] = useState(true);
    const [profileForm, setProfileForm] = useState({
        nombre: '',
        apellido: '',
        cedula: '',
        legajo: '',
        jerarquia: '',
        cuerpo: '',
        correo: '',
        telefono: ''
    });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState('');

    useEffect(() => {
        if (user) {
            setProfileForm({
                nombre: user.nombre || '',
                apellido: user.apellido || '',
                cedula: user.cedula || '',
                legajo: user.legajo || '',
                jerarquia: user.jerarquia || '',
                cuerpo: user.cuerpo || '',
                correo: user.correo || '',
                telefono: user.telefono || ''
            });
        }
    }, [user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'cedula' || name === 'legajo') {
            const cleanVal = value.replace(/\D/g, '');
            setProfileForm(prev => ({ ...prev, [name]: cleanVal }));
        } else {
            setProfileForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError('');
        setProfileSaving(true);

        const { nombre, apellido, cedula, legajo, jerarquia, cuerpo, correo, telefono } = profileForm;

        // Validaciones en Frontend
        if (!nombre.trim() || !apellido.trim() || !cedula.trim() || !legajo.trim() || !jerarquia.trim() || !cuerpo.trim() || !correo.trim() || !telefono.trim()) {
            setProfileError('Todos los campos son obligatorios.');
            setProfileSaving(false);
            return;
        }

        if (!/^\d+$/.test(cedula)) {
            setProfileError('La cédula debe contener solo números (sin puntos ni guiones).');
            setProfileSaving(false);
            return;
        }

        if (!/^\d+$/.test(legajo)) {
            setProfileError('El legajo debe contener solo números (sin puntos ni guiones).');
            setProfileSaving(false);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            setProfileError('El correo electrónico no tiene un formato válido.');
            setProfileSaving(false);
            return;
        }

        try {
            const response = await api.patch('/users/profile', profileForm);
            updateUser(response.data);
            setShowProfileModal(false);
        } catch (err: any) {
            console.error(err);
            setProfileError(err.response?.data?.error || 'Error al actualizar el perfil.');
        } finally {
            setProfileSaving(false);
        }
    };

    // --- ESTIVAL STATE ---
    const [isEstival, setIsEstival] = useState<boolean>(false);
    const [estivalMode, setEstivalMode] = useState<'A' | 'B'>('A');

    // Modalidad A: Mismo periodo, 2 Sedes
    const [estivalWeek, setEstivalWeek] = useState<Date | null>(null);
    const [estivalLoc1, setEstivalLoc1] = useState<string>('');
    const [estivalLoc2, setEstivalLoc2] = useState<string>('');

    // Modalidad B: Misma sede, 2 Periodos
    const [estivalLoc, setEstivalLoc] = useState<string>('');
    const [estivalWeek1, setEstivalWeek1] = useState<Date | null>(null);
    const [estivalWeek2, setEstivalWeek2] = useState<Date | null>(null);

    useEffect(() => {
        api.get('/cabins')
            .then(res => setLocations(res.data))
            .catch(err => console.error(err));
            
        api.get('/reservations/estival-periods')
            .then(res => {
                setEstivalPeriods(res.data);
                let dates: Date[] = [];
                res.data.forEach((ep: any) => {
                    const days = eachDayOfInterval({ 
                        start: parseDateSafe(ep.start_date), 
                        end: parseDateSafe(ep.end_date) 
                    });
                    dates = [...dates, ...days];
                });
                setEstivalDates(dates);
            })
            .catch(err => console.error("Error al obtener periodos estivales", err));
    }, []);

    useEffect(() => {
        if (!isEstival && selectedLocation && selectedCabin) {
            fetchAvailability();
        } else {
            setStartDate(null);
            setEndDate(null);
            setDisabledDates([]);
            setApprovedDates([]);
            setBienaBlockedDates([]);
            setPendingDates([]);
            setShowPendingWarning(false);
        }
    }, [selectedLocation, selectedCabin, isEstival]);

    const fetchAvailability = async () => {
        setLoading(true);
        const today = new Date();
        const maxFetchDate = addDays(today, anticipationDays + 15);

        try {
            const res = await api.get(`/reservations/availability?location_id=${selectedLocation}&start_date=${today.toISOString()}&end_date=${maxFetchDate.toISOString()}`);
            const { reservations, blockedDates } = res.data;

            let disabled: Date[] = [];
            let approved: Date[] = [];
            let bienaBlocked: Date[] = [];
            let pending: Date[] = [];

            reservations.forEach((r: any) => {
                if (r.cabin_id === selectedCabin) {
                    const rStart = parseDateSafe(r.start_date);
                    const rEnd = parseDateSafe(r.end_date);
                    const days = eachDayOfInterval({ start: rStart, end: rEnd });

                    if (r.status === 'aprobada') {
                        disabled = [...disabled, ...days];
                        approved = [...approved, ...days];
                    } else if (r.status === 'pendiente') {
                        pending = [...pending, ...days];
                    }
                }
            });

            blockedDates.forEach((b: any) => {
                if (!b.cabin_id || b.cabin_id === selectedCabin) {
                    const bStart = parseDateSafe(b.start_date);
                    const bEnd = parseDateSafe(b.end_date);
                    const days = eachDayOfInterval({ start: bStart, end: bEnd });
                    disabled = [...disabled, ...days];
                    bienaBlocked = [...bienaBlocked, ...days];
                }
            });

            setDisabledDates(disabled);
            setApprovedDates(approved);
            setBienaBlockedDates(bienaBlocked);
            setPendingDates(pending);
        } catch (err) {
            console.error(err);
            setError('No se pudo cargar la disponibilidad oficial.');
        } finally {
            setLoading(false);
        }
    };

    const getEstivalWeeks = () => {
        const weeks: Date[] = [];
        const seen = new Set<number>();
        
        estivalPeriods.forEach(ep => {
            const start = parseDateSafe(ep.start_date);
            const end = parseDateSafe(ep.end_date);
            if (!start || !end) return;

            let current = new Date(start);
            while (current.getDay() !== 1 && current <= end) {
                current.setDate(current.getDate() + 1);
            }
            while (current <= end) {
                const time = current.getTime();
                if (!seen.has(time)) {
                    seen.add(time);
                    weeks.push(new Date(current));
                }
                current.setDate(current.getDate() + 7);
            }
        });

        return weeks.sort((a, b) => a.getTime() - b.getTime());
    };

    const getGroupedEstivalWeeks = () => {
        const weeks = getEstivalWeeks();
        const groups: { [key: string]: Date[] } = {};

        weeks.forEach(week => {
            const monthNames = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            const month = monthNames[week.getMonth()];
            const year = week.getFullYear();
            const key = `${month} ${year}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(week);
        });

        return groups;
    };

    const onChangeDates = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
        setError('');
        setShowPendingWarning(false);

        if (start) {
            if (start > maxDateLimit) {
                setError(`Como usuario con jerarquía ${user?.jerarquia}, solo puede reservar con hasta ${anticipationDays} días de anticipación.`);
                setStartDate(null);
                return;
            }
            const isEstival = estivalDates.some(d => d.getTime() === new Date(start).setHours(0,0,0,0));
            if (isEstival) {
                setError('La fecha seleccionada corresponde al período estival. Use la pestaña de Temporada Estival.');
                setStartDate(null);
                return;
            }
        }

        if (start && end) {
            const diffDays = differenceInDays(end, start);
            if (diffDays > 7) {
                setError('Las reservas no pueden superar los 7 días consecutivos.');
                setEndDate(null);
                return;
            }
            
            const selectedDays = eachDayOfInterval({ start, end });
            const hasEstivalOverlap = selectedDays.some(day =>
                estivalDates.some(eDate => eDate.getTime() === day.getTime())
            );
            if (hasEstivalOverlap) {
                setError('El rango de fechas seleccionado se superpone con un período estival. Use la pestaña de Temporada Estival.');
                setEndDate(null);
                return;
            }

            const hasPendingOverlap = selectedDays.some(day =>
                pendingDates.some(pDate => pDate.getTime() === day.getTime())
            );
            if (hasPendingOverlap) {
                setShowPendingWarning(true);
            }
        }
    };

    const selectedLocData = locations.find(l => l.id === selectedLocation);
    const selectedCabinData = selectedLocData?.cabins.find(c => c.id === selectedCabin);

    const groupedWeeks = getGroupedEstivalWeeks();

    // Cálculos para el resumen
    const reservationDuration = (startDate && endDate) ? differenceInDays(endDate, startDate) : 0;
    
    const canSubmitNormal = selectedCabin && startDate && endDate && acceptedTerms && !loading;
    const canSubmitEstival = acceptedTerms && !loading && (
        (estivalMode === 'A' && estivalWeek && estivalLoc1 && estivalLoc2) ||
        (estivalMode === 'B' && estivalLoc && estivalWeek1 && estivalWeek2)
    );

    const canSubmit = isEstival ? canSubmitEstival : canSubmitNormal;

    const handleBooking = async () => {
        if (!canSubmit) return;
        
        if (!isEstival && selectedCabinData && occupants > selectedCabinData.capacity) {
            setError(`La capacidad máxima de la cabaña es de ${selectedCabinData.capacity} ocupantes.`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (isEstival) {
                let options = [];
                if (estivalMode === 'A') {
                    if (!estivalWeek || !estivalLoc1 || !estivalLoc2) {
                        setError('Debe completar la semana y ambos destinos.');
                        setLoading(false);
                        return;
                    }
                    const start = estivalWeek;
                    const end = addDays(estivalWeek, 7);
                    options = [
                        { location_id: estivalLoc1, start_date: start.toISOString(), end_date: end.toISOString(), priority: 1 },
                        { location_id: estivalLoc2, start_date: start.toISOString(), end_date: end.toISOString(), priority: 2 }
                    ];
                } else {
                    if (!estivalLoc || !estivalWeek1 || !estivalWeek2) {
                        setError('Debe completar el destino y ambas semanas.');
                        setLoading(false);
                        return;
                    }
                    const start1 = estivalWeek1;
                    const end1 = addDays(estivalWeek1, 7);
                    const start2 = estivalWeek2;
                    const end2 = addDays(estivalWeek2, 7);
                    options = [
                        { location_id: estivalLoc, start_date: start1.toISOString(), end_date: end1.toISOString(), priority: 1 },
                        { location_id: estivalLoc, start_date: start2.toISOString(), end_date: end2.toISOString(), priority: 2 }
                    ];
                }

                await api.post('/reservations', {
                    is_estival: true,
                    occupants,
                    options
                });
                setSuccess('Postulación estival enviada a BIENA exitosamente.');
            } else {
                await api.post('/reservations', {
                    cabin_id: selectedCabin,
                    start_date: startDate!.toISOString(),
                    end_date: endDate!.toISOString(),
                    occupants
                });
                setSuccess('Solicitud de reserva enviada a BIENA exitosamente.');
            }

            setTimeout(() => {
                navigate('/my-reservations');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'No se pudo completar el trámite.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto py-4 md:py-6 px-4 sm:px-6 lg:px-8">
            <header className="border-b-2 border-armada-gold pb-4 mb-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="bg-armada-navy p-2 rounded shadow-lg shrink-0">
                        <CompassLogo className="text-armada-gold" size={28} bgColor="white" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-xl md:text-2xl font-black text-armada-navy uppercase tracking-tighter">Reserva de Alojamiento</h2>
                        <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.2em] italic">Servicio de Bienestar Social — Armada Nacional</p>
                    </div>
                </div>
            </header>

            {/* Switch de Procesos */}
            <div className="flex gap-4 mb-6 border-b border-slate-200 pb-4 animate-fade-in-up">
                <button
                    onClick={() => { setIsEstival(false); setError(''); }}
                    className={`px-5 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${!isEstival 
                        ? 'bg-armada-navy text-white shadow-md' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                    Temporada Normal (Reserva Regular)
                </button>
                <button
                    onClick={() => { setIsEstival(true); setError(''); }}
                    className={`px-5 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${isEstival 
                        ? 'bg-armada-navy text-white shadow-md border-b-2 border-armada-gold' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                    Temporada Estival (Postulación Verano)
                </button>
            </div>

            {/* Notificaciones */}
            {error && (
                <div className="fixed top-20 right-4 z-50 w-full max-w-md animate-fade-in">
                    <div className="bg-red-50 text-red-700 p-4 rounded border-r-8 border-red-500 shadow-2xl flex items-center gap-4 relative">
                        <AlertCircle size={20} className="shrink-0 text-red-500" />
                        <span className="font-black text-[10px] uppercase tracking-tight pr-6">{error}</span>
                        <button onClick={() => setError('')} className="absolute right-2 top-2 p-1 hover:bg-red-100 rounded-full"><X size={14} /></button>
                    </div>
                </div>
            )}

            {success && (
                <div className="fixed top-20 right-4 z-50 w-full max-w-md animate-fade-in">
                    <div className="bg-green-50 text-green-700 p-4 rounded border-r-8 border-green-500 shadow-2xl flex items-center gap-4">
                        <CheckCircle2 size={20} className="shrink-0 text-green-500" />
                        <span className="font-black text-[10px] uppercase tracking-tight">{success}</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* COLUMNA IZQUIERDA: SELECCIÓN */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {!isEstival ? (
                        <>
                            {/* PROCESO NORMAL */}
                            {/* 1. DESTINO */}
                            <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm animate-fade-in-up">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="w-6 h-6 rounded-full bg-armada-navy text-armada-gold flex items-center justify-center font-black text-xs border border-armada-gold">1</span>
                                    <h3 className="text-[10px] font-black text-armada-navy uppercase tracking-widest italic">Destino Naval</h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {locations.map(loc => (
                                        <button
                                            key={loc.id}
                                            onClick={() => { setSelectedLocation(loc.id); setSelectedCabin(''); }}
                                            className={`p-3 rounded border-2 text-left transition-all relative group ${selectedLocation === loc.id
                                                ? 'border-armada-navy bg-slate-50 ring-1 ring-armada-gold/30'
                                                : 'border-slate-100 hover:border-armada-gold/50 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className={selectedLocation === loc.id ? 'text-armada-gold' : 'text-slate-300'} />
                                                <span className="font-black text-[11px] text-armada-navy uppercase truncate">{loc.name}</span>
                                            </div>
                                            {selectedLocation === loc.id && <div className="absolute top-1 right-1 text-armada-gold animate-pulse"><CompassLogo size={10} bgColor="transparent" /></div>}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* 2. UNIDAD */}
                            {selectedLocation && (
                                <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm animate-fade-in-up">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="w-6 h-6 rounded-full bg-armada-navy text-armada-gold flex items-center justify-center font-black text-xs border border-armada-gold">2</span>
                                        <h3 className="text-[10px] font-black text-armada-navy uppercase tracking-widest italic">Unidad Habitacional</h3>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                        {selectedLocData?.cabins
                                            .filter(c => c.status === 'disponible')
                                            .filter(c => {
                                                const allowed = (c as any).allowed_hierarchies;
                                                if (!allowed || allowed.length === 0) return true;
                                                return allowed.includes(user?.jerarquia);
                                            })
                                            .sort((a, b) => a.identifier.localeCompare(b.identifier, undefined, { numeric: true }))
                                            .map(cabin => (
                                                <button
                                                    key={cabin.id}
                                                    onClick={() => setSelectedCabin(cabin.id)}
                                                    className={`p-2 rounded border-2 text-center transition-all ${selectedCabin === cabin.id
                                                        ? 'bg-armada-navy border-armada-gold text-armada-gold shadow-md'
                                                        : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="font-black text-[10px] truncate">{cabin.identifier}</div>
                                                    <div className={`text-[8px] font-bold opacity-70 ${selectedCabin === cabin.id ? 'text-white' : 'text-slate-500'}`}>Cap: {cabin.capacity}</div>
                                                </button>
                                            ))}
                                    </div>
                                </section>
                            )}

                            {/* 3. CALENDARIO */}
                            {selectedCabin && (
                                <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm animate-fade-in-up">
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-armada-navy text-armada-gold flex items-center justify-center font-black text-xs border border-armada-gold">3</span>
                                            <h3 className="text-[10px] font-black text-armada-navy uppercase tracking-widest italic">Cronograma de Estancia</h3>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase ml-2">
                                                (Anticipación: {anticipationDays} días para {user?.jerarquia})
                                            </span>
                                        </div>
                                        {(startDate || endDate) && (
                                            <button onClick={() => { setStartDate(null); setEndDate(null); }} className="text-[9px] font-black text-red-500 uppercase hover:underline">Limpiar Fechas</button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 p-3 bg-slate-50 rounded border border-slate-100">
                                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-100 border border-green-400"></div><span className="text-[9px] font-bold text-slate-600 uppercase">Disponible</span></div>
                                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500"></div><span className="text-[9px] font-bold text-slate-600 uppercase">Tu Reserva</span></div>
                                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-200 border border-red-400"></div><span className="text-[9px] font-bold text-slate-600 uppercase">Ocupado</span></div>
                                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-100 border border-orange-400"></div><span className="text-[9px] font-bold text-slate-600 uppercase">Bloqueado</span></div>
                                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-400"></div><span className="text-[9px] font-bold text-slate-600 uppercase">Pendiente</span></div>
                                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#E6D5C3] border border-[#8B5A2B]"></div><span className="text-[9px] font-bold text-slate-600 uppercase">Estival</span></div>
                                    </div>

                                    <div className="custom-datepicker flex justify-center pb-4">
                                        <DatePicker
                                            selected={startDate}
                                            onChange={onChangeDates}
                                            startDate={startDate}
                                            endDate={endDate}
                                            selectsRange
                                            inline
                                            locale={es}
                                            minDate={new Date()}
                                            maxDate={maxDateLimit}
                                            excludeDates={[...disabledDates, ...estivalDates]}
                                            highlightDates={[
                                                { "react-datepicker__day--highlight-approved": approvedDates },
                                                { "react-datepicker__day--highlight-biena-blocked": bienaBlockedDates },
                                                { "react-datepicker__day--highlight-pending": pendingDates },
                                                { "react-datepicker__day--highlight-estival": estivalDates }
                                            ]}
                                            monthsShown={window.innerWidth > 1024 ? 2 : 1}
                                            dayClassName={(date) => {
                                                const isApproved = approvedDates.some(d => d.getTime() === date.getTime());
                                                const isBiena = bienaBlockedDates.some(d => d.getTime() === date.getTime());
                                                const isPending = pendingDates.some(d => d.getTime() === date.getTime());
                                                const isPast = date < new Date(new Date().setHours(0,0,0,0));
                                                const isTooFar = date > maxDateLimit;
                                                const isEstival = estivalDates.some(d => d.getTime() === date.getTime());

                                                if (isApproved || isBiena || isPast || isTooFar || isEstival) return "cursor-not-allowed opacity-50";
                                                if (isPending) return "cursor-pointer hover:bg-yellow-300 transition-colors";
                                                return "hover:scale-110 transition-transform cursor-pointer";
                                            }}
                                            renderDayContents={(day, date) => {
                                                if (!date) return day;
                                                const isApproved = approvedDates.some(d => d.getTime() === date.getTime());
                                                const isBiena = bienaBlockedDates.some(d => d.getTime() === date.getTime());
                                                const isPending = pendingDates.some(d => d.getTime() === date.getTime());
                                                const isTooFar = date > maxDateLimit;
                                                const isPast = date < new Date(new Date().setHours(0,0,0,0));
                                                const isEstival = estivalDates.some(d => d.getTime() === date.getTime());
                                                
                                                let tooltip = "Disponible";
                                                if (isEstival) tooltip += " (Período Estival)";
                                                if (isApproved) tooltip = "Reservado (Aprobado)";
                                                if (isBiena) tooltip = "Bloqueado por Administración BIENA";
                                                if (isPending) tooltip = "Solicitud en espera (Pendiente)";
                                                if (isPast) tooltip = "Fecha pasada";
                                                if (isTooFar) tooltip = `Límite de anticipación excedido (${anticipationDays} días)`;

                                                return (
                                                    <div title={tooltip} className="w-full h-full flex items-center justify-center">
                                                        {day}
                                                    </div>
                                                );
                                            }}
                                        />
                                    </div>

                                    {showPendingWarning && (
                                        <div className="mt-4 bg-amber-50 text-amber-800 p-3 rounded border-r-4 border-amber-500 text-[10px] flex items-center gap-3">
                                            <Info size={16} className="text-amber-600 shrink-0" />
                                            <p className="font-bold uppercase tracking-tight">Atención: Hay solicitudes pendientes para estos días. Tu reserva entrará en cola de revisión.</p>
                                        </div>
                                    )}
                                </section>
                            )}
                        </>
                    ) : (
                        <>
                            {/* PROCESO ESTIVAL (VERANO) */}
                            <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm animate-fade-in-up space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-armada-navy text-armada-gold flex items-center justify-center font-black text-xs border border-armada-gold">1</span>
                                        <h3 className="text-[11px] font-black text-armada-navy uppercase tracking-widest italic">Modalidad de Trámite Estival</h3>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                                        Anticipación Límite: {anticipationDays} días
                                    </span>
                                </div>

                                {estivalPeriods.length === 0 ? (
                                    <div className="p-6 text-center bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs font-bold uppercase">
                                        Actualmente no hay períodos de temporada estival abiertos por la administración.
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setEstivalMode('A')}
                                                className={`p-4 rounded-lg border-2 text-left transition-all ${estivalMode === 'A' 
                                                    ? 'border-armada-navy bg-slate-50 ring-1 ring-armada-navy/10' 
                                                    : 'border-slate-100 hover:border-slate-200'}`}
                                            >
                                                <div className="font-black text-xs text-armada-navy uppercase tracking-tight mb-1">Opción A: 1 Semana, 2 Destinos</div>
                                                <p className="text-[10px] text-slate-500 font-bold leading-normal">Solicita una única semana y elige dos ubicaciones distintas por orden de prioridad.</p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEstivalMode('B')}
                                                className={`p-4 rounded-lg border-2 text-left transition-all ${estivalMode === 'B' 
                                                    ? 'border-armada-navy bg-slate-50 ring-1 ring-armada-navy/10' 
                                                    : 'border-slate-100 hover:border-slate-200'}`}
                                            >
                                                <div className="font-black text-xs text-armada-navy uppercase tracking-tight mb-1">Opción B: 2 Semanas, 1 Destino</div>
                                                <p className="text-[10px] text-slate-500 font-bold leading-normal">Elige una única ubicación y solicita dos semanas distintas (consecutivas o alternas) en orden de prioridad.</p>
                                            </button>
                                        </div>

                                        <div className="border-t border-slate-100 pt-6">
                                            {estivalMode === 'A' ? (
                                                <div className="space-y-6">
                                                    <div>
                                                         <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">1. Seleccione la Semana (Lunes a Lunes)</label>
                                                         <select
                                                             value={estivalWeek ? estivalWeek.toISOString() : ''}
                                                             onChange={(e) => {
                                                                 const val = e.target.value;
                                                                 setEstivalWeek(val ? new Date(val) : null);
                                                             }}
                                                             className="w-full max-w-xs px-4 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white"
                                                         >
                                                             <option value="">SELECCIONE UNA SEMANA ESTIVAL...</option>
                                                             {Object.keys(groupedWeeks).map(groupKey => (
                                                                 <optgroup label={groupKey} key={groupKey}>
                                                                     {groupedWeeks[groupKey].map((weekDate) => {
                                                                         const startStr = weekDate.toLocaleDateString('es-ES');
                                                                         const endStr = addDays(weekDate, 7).toLocaleDateString('es-ES');
                                                                         return (
                                                                             <option key={weekDate.toISOString()} value={weekDate.toISOString()}>
                                                                                 Lunes {startStr} al Lunes {endStr}
                                                                             </option>
                                                                         );
                                                                     })}
                                                                 </optgroup>
                                                             ))}
                                                         </select>
                                                         {estivalWeek && (
                                                             <div className="mt-2 text-[10px] font-bold text-slate-500 italic">
                                                                 Rango: Lunes {estivalWeek.toLocaleDateString('es-ES')} al Lunes {addDays(estivalWeek, 7).toLocaleDateString('es-ES')}
                                                             </div>
                                                         )}
                                                     </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">2. Destino Prioridad 1</label>
                                                            <select
                                                                value={estivalLoc1}
                                                                onChange={(e) => setEstivalLoc1(e.target.value)}
                                                                className="w-full px-4 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white"
                                                            >
                                                                <option value="">Seleccionar Sede...</option>
                                                                {locations.map(loc => (
                                                                    <option key={loc.id} value={loc.id} disabled={loc.id === estivalLoc2}>{loc.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">3. Destino Prioridad 2</label>
                                                            <select
                                                                value={estivalLoc2}
                                                                onChange={(e) => setEstivalLoc2(e.target.value)}
                                                                className="w-full px-4 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white"
                                                            >
                                                                <option value="">Seleccionar Sede...</option>
                                                                {locations.map(loc => (
                                                                    <option key={loc.id} value={loc.id} disabled={loc.id === estivalLoc1}>{loc.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">1. Seleccione el Destino Naval</label>
                                                        <select
                                                            value={estivalLoc}
                                                            onChange={(e) => setEstivalLoc(e.target.value)}
                                                            className="w-full max-w-xs px-4 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white"
                                                        >
                                                            <option value="">Seleccionar Sede...</option>
                                                            {locations.map(loc => (
                                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                         <div>
                                                             <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">2. Semana Prioridad 1 (Lunes a Lunes)</label>
                                                             <select
                                                                 value={estivalWeek1 ? estivalWeek1.toISOString() : ''}
                                                                 onChange={(e) => {
                                                                     const val = e.target.value;
                                                                     setEstivalWeek1(val ? new Date(val) : null);
                                                                 }}
                                                                 className="w-full px-4 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white"
                                                             >
                                                                 <option value="">SELECCIONE SEMANA 1...</option>
                                                                 {Object.keys(groupedWeeks).map(groupKey => (
                                                                     <optgroup label={groupKey} key={groupKey}>
                                                                         {groupedWeeks[groupKey].map((weekDate) => {
                                                                             const startStr = weekDate.toLocaleDateString('es-ES');
                                                                             const endStr = addDays(weekDate, 7).toLocaleDateString('es-ES');
                                                                             return (
                                                                                 <option key={weekDate.toISOString()} value={weekDate.toISOString()} disabled={!!(estivalWeek2 && weekDate.getTime() === estivalWeek2.getTime())}>
                                                                                     Lunes {startStr} al Lunes {endStr}
                                                                                 </option>
                                                                             );
                                                                         })}
                                                                     </optgroup>
                                                                 ))}
                                                             </select>
                                                             {estivalWeek1 && (
                                                                 <div className="mt-2 text-[10px] font-bold text-slate-500 italic">
                                                                     Rango: Lunes {estivalWeek1.toLocaleDateString('es-ES')} al Lunes {addDays(estivalWeek1, 7).toLocaleDateString('es-ES')}
                                                                 </div>
                                                             )}
                                                         </div>
                                                         <div>
                                                             <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">3. Semana Prioridad 2 (Lunes a Lunes)</label>
                                                             <select
                                                                 value={estivalWeek2 ? estivalWeek2.toISOString() : ''}
                                                                 onChange={(e) => {
                                                                     const val = e.target.value;
                                                                     setEstivalWeek2(val ? new Date(val) : null);
                                                                 }}
                                                                 className="w-full px-4 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white"
                                                             >
                                                                 <option value="">SELECCIONE SEMANA 2...</option>
                                                                 {Object.keys(groupedWeeks).map(groupKey => (
                                                                     <optgroup label={groupKey} key={groupKey}>
                                                                         {groupedWeeks[groupKey].map((weekDate) => {
                                                                             const startStr = weekDate.toLocaleDateString('es-ES');
                                                                             const endStr = addDays(weekDate, 7).toLocaleDateString('es-ES');
                                                                             return (
                                                                                 <option key={weekDate.toISOString()} value={weekDate.toISOString()} disabled={!!(estivalWeek1 && weekDate.getTime() === estivalWeek1.getTime())}>
                                                                                     Lunes {startStr} al Lunes {endStr}
                                                                                 </option>
                                                                             );
                                                                         })}
                                                                     </optgroup>
                                                                 ))}
                                                             </select>
                                                             {estivalWeek2 && (
                                                                 <div className="mt-2 text-[10px] font-bold text-slate-500 italic">
                                                                     Rango: Lunes {estivalWeek2.toLocaleDateString('es-ES')} al Lunes {addDays(estivalWeek2, 7).toLocaleDateString('es-ES')}
                                                                 </div>
                                                             )}
                                                         </div>
                                                     </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </section>
                        </>
                    )}
                </div>

                {/* COLUMNA DERECHA: RESUMEN Y ACCIÓN */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                    
                    {/* CARD DE RESUMEN */}
                    <div className="bg-armada-navy text-white p-6 rounded-lg shadow-2xl border-b-4 border-armada-gold animate-fade-in">
                        <h3 className="text-xs font-black text-armada-gold uppercase tracking-[0.2em] mb-6 border-b border-white/10 pb-2 italic">
                            {isEstival ? 'Resumen de Postulación' : 'Resumen de Reserva'}
                        </h3>
                        
                        {!isEstival ? (
                            <div className="space-y-5">
                                <div className="flex justify-between items-center group">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unidad</span>
                                    <span className="text-sm font-black text-white uppercase">{selectedCabinData ? selectedCabinData.identifier : '---'}</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estancia</span>
                                    <div className="text-right">
                                        <div className="text-[11px] font-black text-white">{startDate ? startDate.toLocaleDateString('es-ES') : '---'}</div>
                                        <div className="text-[11px] font-black text-armada-gold">al {endDate ? endDate.toLocaleDateString('es-ES') : '---'}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duración</span>
                                    <span className="text-sm font-black text-white">{reservationDuration > 0 ? `${reservationDuration} Noches` : '---'}</span>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <label className="flex items-center justify-between mb-3">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ocupantes</span>
                                        <div className="flex items-center gap-3 bg-white/5 rounded p-1">
                                            <button type="button" onClick={() => setOccupants(Math.max(1, occupants - 1))} className="w-6 h-6 rounded bg-white/10 hover:bg-armada-gold text-white font-black text-xs transition-colors">-</button>
                                            <span className="w-4 text-center font-black text-sm">{occupants}</span>
                                            <button type="button" onClick={() => setOccupants(Math.min(Math.min(6, selectedCabinData?.capacity || 6), occupants + 1))} className="w-6 h-6 rounded bg-white/10 hover:bg-armada-gold text-white font-black text-xs transition-colors">+</button>
                                        </div>
                                    </label>
                                    {selectedCabinData && (
                                        <p className="text-[8px] text-slate-400 text-right uppercase font-bold italic">Capacidad Máxima: {Math.min(6, selectedCabinData.capacity)} Personas</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</span>
                                    <span className="text-[10px] font-black uppercase text-armada-gold bg-white/10 px-2 py-0.5 rounded border border-white/10">ESTIVAL</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Modalidad</span>
                                    <span className="text-[10px] font-black uppercase text-white">
                                        {estivalMode === 'A' ? 'A: 1 Sem / 2 Sedes' : 'B: 2 Sem / 1 Sede'}
                                    </span>
                                </div>

                                {estivalMode === 'A' ? (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Sedes</span>
                                            <div className="text-right">
                                                <div className="text-[11px] font-black text-white">
                                                    P1: {locations.find(l => l.id === estivalLoc1)?.name || '---'}
                                                </div>
                                                <div className="text-[11px] font-black text-slate-300">
                                                    P2: {locations.find(l => l.id === estivalLoc2)?.name || '---'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Semana</span>
                                            <span className="text-[11px] font-black text-white">
                                                {estivalWeek ? estivalWeek.toLocaleDateString() : '---'}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sede</span>
                                            <span className="text-[11px] font-black text-white">
                                                {locations.find(l => l.id === estivalLoc)?.name || '---'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Semanas</span>
                                            <div className="text-right">
                                                <div className="text-[11px] font-black text-white">
                                                    P1: {estivalWeek1 ? estivalWeek1.toLocaleDateString() : '---'}
                                                </div>
                                                <div className="text-[11px] font-black text-slate-300">
                                                    P2: {estivalWeek2 ? estivalWeek2.toLocaleDateString() : '---'}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="pt-4 border-t border-white/10">
                                    <label className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ocupantes</span>
                                        <div className="flex items-center gap-3 bg-white/5 rounded p-1">
                                            <button type="button" onClick={() => setOccupants(Math.max(1, occupants - 1))} className="w-6 h-6 rounded bg-white/10 hover:bg-armada-gold text-white font-black text-xs transition-colors">-</button>
                                            <span className="w-4 text-center font-black text-sm">{occupants}</span>
                                            <button type="button" onClick={() => setOccupants(Math.min(6, occupants + 1))} className="w-6 h-6 rounded bg-white/10 hover:bg-armada-gold text-white font-black text-xs transition-colors">+</button>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CONDICIONES */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-start gap-3 p-3 rounded-md bg-slate-50 border border-slate-100 mb-4 transition-all hover:border-armada-gold/50">
                            <input
                                type="checkbox"
                                id="terms_new"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="w-5 h-5 mt-0.5 accent-armada-navy cursor-pointer"
                            />
                            <label htmlFor="terms_new" className="text-[10px] font-bold text-armada-navy leading-tight cursor-pointer">
                                Acepto las <Link to="/terms" target="_blank" className="text-armada-gold underline hover:text-armada-navy">Condiciones y Reglamentos</Link> de alojamiento institucional.
                            </label>
                        </div>
                        
                        {!canSubmit && (
                            <div className="text-center mb-4 p-2 bg-red-50 rounded border border-red-100 animate-pulse">
                                <p className="text-[8px] font-black text-red-600 uppercase tracking-wider">
                                    Debe completar los campos obligatorios y aceptar los términos
                                </p>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleBooking}
                            disabled={!canSubmit}
                            className={`w-full py-4 rounded-lg flex items-center justify-center gap-3 transition-all group ${canSubmit 
                                ? 'bg-armada-navy text-white hover:bg-armada-black shadow-xl scale-100 hover:scale-[1.02]' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            }`}
                        >
                            <span className="font-black text-xs uppercase tracking-[0.2em] italic">
                                {isEstival ? 'Enviar Postulación Estival' : 'Confirmar Reserva a Biena'}
                            </span>
                            <ChevronRight size={20} className={canSubmit ? 'text-armada-gold group-hover:translate-x-1 transition-transform' : 'text-slate-300'} />
                        </button>
                    </div>

                    <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] italic px-4">
                        La confirmación está sujeta a aprobación del Estado Mayor de Bienestar Social.
                    </p>
                </div>
            </div>

            {showProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full my-8 animate-fade-in-up">
                        <div className="p-6 border-b-2 border-armada-gold bg-armada-navy text-white rounded-t-lg">
                            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <ShieldAlert className="text-armada-gold" size={24} />
                                Actualización de Perfil Requerida
                            </h3>
                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mt-1">
                                Debe verificar y completar sus datos para continuar con el trámite de reserva.
                            </p>
                        </div>
                        
                        <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
                            {/* Disclaimer Box */}
                            <div className="bg-amber-50 border-r-4 border-amber-500 p-4 rounded text-amber-800 space-y-1">
                                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                                    <Info size={16} className="text-amber-600" />
                                    Importante: Prioridad y Asignación
                                </h4>
                                <p className="text-[10px] font-bold leading-relaxed">
                                    Los datos de jerarquía, cuerpo, cédula y legajo son indispensables para calcular automáticamente la prioridad y viabilidad de las solicitudes de alojamiento. Asegúrese de que toda la información sea exacta y esté completa.
                                </p>
                            </div>

                            {profileError && (
                                <div className="bg-red-50 text-red-700 p-3 rounded border-r-4 border-red-500 text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                                    <AlertCircle size={16} className="text-red-500" />
                                    {profileError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={profileForm.nombre}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white focus:border-armada-navy"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Apellido</label>
                                    <input
                                        type="text"
                                        name="apellido"
                                        value={profileForm.apellido}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white focus:border-armada-navy"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cédula de Identidad</label>
                                    <input
                                        type="text"
                                        name="cedula"
                                        value={profileForm.cedula}
                                        onChange={handleProfileChange}
                                        placeholder="Solo números, sin puntos ni guión"
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white focus:border-armada-navy"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nro. de Legajo</label>
                                    <input
                                        type="text"
                                        name="legajo"
                                        value={profileForm.legajo}
                                        onChange={handleProfileChange}
                                        placeholder="Solo números"
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white focus:border-armada-navy"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Jerarquía</label>
                                    <select
                                        name="jerarquia"
                                        value={profileForm.jerarquia}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white focus:border-armada-navy"
                                        required
                                    >
                                        <option value="">Seleccione jerarquía...</option>
                                        {HIERARCHY_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cuerpo</label>
                                    <select
                                        name="cuerpo"
                                        value={profileForm.cuerpo}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white focus:border-armada-navy"
                                        required
                                    >
                                        <option value="">Seleccione cuerpo...</option>
                                        {CUERPO_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        name="correo"
                                        value={profileForm.correo}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs text-slate-700 bg-white focus:border-armada-navy"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono</label>
                                    <input
                                        type="text"
                                        name="telefono"
                                        value={profileForm.telefono}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded outline-none font-bold text-xs uppercase text-slate-700 bg-white focus:border-armada-navy"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100 justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate('/my-reservations')}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-black uppercase tracking-wider transition-colors"
                                >
                                    Volver
                                </button>
                                <button
                                    type="submit"
                                    disabled={profileSaving}
                                    className="px-5 py-2.5 bg-armada-navy hover:bg-armada-navy/90 border-b-2 border-armada-gold text-white rounded text-xs font-black uppercase tracking-wider transition-colors disabled:bg-slate-300"
                                >
                                    {profileSaving ? 'Guardando...' : 'Confirmar y Continuar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

