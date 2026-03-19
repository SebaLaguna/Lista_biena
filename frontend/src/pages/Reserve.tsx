import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';
import { addDays, eachDayOfInterval, differenceInDays } from 'date-fns';
import { parseDateSafe } from '../utils/dateUtils';
import { MapPin, ChevronRight, Info, AlertCircle, CheckCircle2, X } from 'lucide-react';
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
    cabins: Cabin[];
}

export default function Reserve() {
    const { user } = useAuth();
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
        if (selectedLocation && selectedCabin) {
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
    }, [selectedLocation, selectedCabin]);

    const fetchAvailability = async () => {
        setLoading(true);
        // OPTIMIZACIÓN CRÍTICA: En lugar de pedir 1 año completo, solo pedimos hasta el límite de anticipación + margen
        const today = new Date();
        const maxFetchDate = addDays(today, anticipationDays + 15); // +15 días para cubrir cierre de mes

        try {
            const res = await api.get(`/reservations/availability?location_id=${selectedLocation}&start_date=${today.toISOString()}&end_date=${maxFetchDate.toISOString()}`);
            const { reservations, blockedDates } = res.data;

            let disabled: Date[] = [];
            let approved: Date[] = [];
            let bienaBlocked: Date[] = [];
            let pending: Date[] = [];

            // Blocked from reservations
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

            // Blocked by BIENA administration
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
        }

        if (start && end) {
            const diffDays = differenceInDays(end, start);
            if (diffDays > 7) {
                setError('Las reservas no pueden superar los 7 días consecutivos.');
                setEndDate(null);
            } else {
                // Check if any selected day overlaps with a pending date
                const selectedDays = eachDayOfInterval({ start, end });
                const hasPendingOverlap = selectedDays.some(day =>
                    pendingDates.some(pDate => pDate.getTime() === day.getTime())
                );
                if (hasPendingOverlap) {
                    setShowPendingWarning(true);
                }
            }
        }
    };

    const selectedLocData = locations.find(l => l.id === selectedLocation);
    const selectedCabinData = selectedLocData?.cabins.find(c => c.id === selectedCabin);

    // Cálculos para el resumen
    const reservationDuration = (startDate && endDate) ? differenceInDays(endDate, startDate) : 0;
    const canSubmit = selectedCabin && startDate && endDate && acceptedTerms && !loading;

    const handleBooking = async () => {
        if (!canSubmit) return;
        
        if (selectedCabinData && occupants > selectedCabinData.capacity) {
            setError(`La capacidad máxima de la cabaña es de ${selectedCabinData.capacity} ocupantes.`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/reservations', {
                cabin_id: selectedCabin,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                occupants
            });
            setSuccess('Solicitud de reserva enviada a BIENA exitosamente.');
            setTimeout(() => {
                navigate('/my-reservations');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'No se pudo completar la orden de reserva.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto py-4 md:py-6 px-4 sm:px-6 lg:px-8">
            <header className="border-b-2 border-armada-gold pb-4 mb-8 animate-fade-in-up">
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
                                        (Anticipación permitida: {anticipationDays} días para {user?.jerarquia})
                                    </span>
                                </div>
                                {(startDate || endDate) && (
                                    <button onClick={() => { setStartDate(null); setEndDate(null); }} className="text-[9px] font-black text-red-500 uppercase hover:underline">Limpiar Fechas</button>
                                )}
                            </div>

                            {/* LEYENDA ARRIBA */}
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
                                    excludeDates={disabledDates}
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

                                        if (isApproved || isBiena || isPast || isTooFar) return "cursor-not-allowed opacity-50";
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
                                        if (isTooFar) tooltip = `Límite de anticipación excedido (${anticipationDays} días para su jerarquía)`;

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
                </div>

                {/* COLUMNA DERECHA: RESUMEN Y ACCIÓN */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                    
                    {/* CARD DE RESUMEN */}
                    <div className="bg-armada-navy text-white p-6 rounded-lg shadow-2xl border-b-4 border-armada-gold animate-fade-in">
                        <h3 className="text-xs font-black text-armada-gold uppercase tracking-[0.2em] mb-6 border-b border-white/10 pb-2 italic">Resumen de Reserva</h3>
                        
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

                            {/* Temporada */}
                            {startDate && endDate && (
                                (() => {
                                    const isEstivalSelection = estivalPeriods.some(ep => {
                                        const epStart = parseDateSafe(ep.start_date);
                                        const epEnd = parseDateSafe(ep.end_date);
                                        return startDate <= epEnd && endDate >= epStart;
                                    });
                                    return (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Temporada</span>
                                            <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded border border-white/10 ${isEstivalSelection ? 'bg-[#8B5A2B] text-[#FDF5E6]' : 'bg-slate-500/20 text-slate-300'}`}>
                                                {isEstivalSelection ? 'Estival' : 'Normal'}
                                            </span>
                                        </div>
                                    );
                                })()
                            )}

                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duración</span>
                                <span className="text-sm font-black text-white">{reservationDuration > 0 ? `${reservationDuration} Noches` : '---'}</span>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <label className="flex items-center justify-between mb-3">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ocupantes</span>
                                    <div className="flex items-center gap-3 bg-white/5 rounded p-1">
                                        <button onClick={() => setOccupants(Math.max(1, occupants - 1))} className="w-6 h-6 rounded bg-white/10 hover:bg-armada-gold text-white font-black text-xs transition-colors">-</button>
                                        <span className="w-4 text-center font-black text-sm">{occupants}</span>
                                        <button onClick={() => setOccupants(Math.min(selectedCabinData?.capacity || 10, occupants + 1))} className="w-6 h-6 rounded bg-white/10 hover:bg-armada-gold text-white font-black text-xs transition-colors">+</button>
                                    </div>
                                </label>
                                {selectedCabinData && (
                                    <p className="text-[8px] text-slate-400 text-right uppercase font-bold italic">Capacidad Máxima: {selectedCabinData.capacity} Personas</p>
                                )}
                            </div>
                        </div>
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
                        
                        {!canSubmit && selectedCabin && startDate && (
                            <div className="text-center mb-4 p-2 bg-red-50 rounded border border-red-100 animate-pulse">
                                <p className="text-[8px] font-black text-red-600 uppercase tracking-wider">Debe completar fechas y aceptar términos</p>
                            </div>
                        )}

                        <button
                            onClick={handleBooking}
                            disabled={!canSubmit}
                            className={`w-full py-4 rounded-lg flex items-center justify-center gap-3 transition-all group ${canSubmit 
                                ? 'bg-armada-navy text-white hover:bg-armada-black shadow-xl scale-100 hover:scale-[1.02]' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            }`}
                        >
                            <span className="font-black text-xs uppercase tracking-[0.2em] italic">Confirmar Reserva a Biena</span>
                            <ChevronRight size={20} className={canSubmit ? 'text-armada-gold group-hover:translate-x-1 transition-transform' : 'text-slate-300'} />
                        </button>
                    </div>

                    <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] italic px-4">
                        La confirmación está sujeta a aprobación del Estado Mayor de Bienestar Social.
                    </p>
                </div>
            </div>
        </div>
    );
}
