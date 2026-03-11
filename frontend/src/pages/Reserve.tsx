import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';
import { eachDayOfInterval, differenceInDays } from 'date-fns';
import { MapPin, Calendar, ChevronRight, Info, AlertCircle, CheckCircle2, Users, X } from 'lucide-react';
import CompassLogo from '../components/CompassLogo';

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
    const [locations, setLocations] = useState<Location[]>([]);
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
        // Traemos datos desde hoy hasta 1 año adelante
        const today = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(today.getFullYear() + 1);

        try {
            const res = await api.get(`/reservations/availability?location_id=${selectedLocation}&start_date=${today.toISOString()}&end_date=${nextYear.toISOString()}`);
            const { reservations, blockedDates } = res.data;

            let disabled: Date[] = [];
            let approved: Date[] = [];
            let bienaBlocked: Date[] = [];
            let pending: Date[] = [];

            // Blocked from reservations
            reservations.forEach((r: any) => {
                if (r.cabin_id === selectedCabin) {
                    const rStart = new Date(r.start_date);
                    const rEnd = new Date(r.end_date);
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
                    const bStart = new Date(b.start_date);
                    const bEnd = new Date(b.end_date);
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

    const handleBooking = async () => {
        if (!selectedCabin || !startDate || !endDate) return;
        if (!acceptedTerms) {
            setError('Debe aceptar las Condiciones de Uso para solicitar la reserva.');
            return;
        }

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
        <div className="w-full space-y-8 md:space-y-12 py-4 md:py-8 px-4 sm:px-6 lg:px-10">
            <header className="border-b-4 border-armada-gold pb-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    <div className="bg-armada-navy p-3 rounded shadow-xl shrink-0">
                        <CompassLogo className="text-armada-gold" size={32} bgColor="white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-black text-armada-navy uppercase tracking-tighter">Nueva Solicitud de Reserva</h2>
                        <div className="h-0.5 w-full max-w-[12rem] bg-armada-gold my-2 mx-auto sm:mx-0" />
                        <p className="text-slate-500 font-medium text-[10px] md:text-sm italic uppercase tracking-widest">Formulario Oficial de Alojamiento — Servicio de Bienestar</p>
                    </div>
                </div>
            </header>

            {/* Alerta Flotante */}
            {error && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-fade-in">
                    <div className="bg-red-50 text-red-700 p-4 rounded border-l-8 border-red-500 shadow-2xl flex items-center gap-4 relative">
                        <AlertCircle size={24} className="shrink-0" />
                        <span className="font-bold text-xs md:text-sm uppercase tracking-tight pr-8">{error}</span>
                        <button
                            onClick={() => setError('')}
                            className="absolute right-2 top-2 p-1 hover:bg-red-100 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {success && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-fade-in">
                    <div className="bg-green-50 text-green-700 p-4 rounded border-l-8 border-green-500 shadow-2xl flex items-center gap-4">
                        <CheckCircle2 size={24} className="shrink-0" />
                        <span className="font-bold text-xs md:text-sm uppercase tracking-tight">{success}</span>
                    </div>
                </div>
            )}

            <div className="space-y-10 md:space-y-16">
                {/* Paso 1: Ubicación */}
                <section className="relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-armada-navy text-armada-gold flex items-center justify-center font-black text-md md:text-lg border-2 border-armada-gold shadow-md shrink-0">1</div>
                        <h3 className="text-xs md:text-sm font-black text-armada-navy uppercase tracking-[0.2em] italic">Elegir Destino Naval</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {locations.map(loc => (
                            <button
                                key={loc.id}
                                onClick={() => { setSelectedLocation(loc.id); setSelectedCabin(''); }}
                                className={`p-5 md:p-6 rounded institutional-card text-left transition-all relative overflow-hidden group ${selectedLocation === loc.id
                                    ? 'border-armada-navy ring-2 ring-armada-gold/20 bg-slate-50'
                                    : 'border-slate-200 hover:border-armada-gold opacity-80 hover:opacity-100 bg-white'
                                    }`}
                            >
                                <MapPin size={20} className={`mb-3 transition-colors ${selectedLocation === loc.id ? 'text-armada-gold' : 'text-slate-300'}`} />
                                <div className="font-black text-sm md:text-base text-armada-navy uppercase tracking-tight">{loc.name}</div>
                                {selectedLocation === loc.id && (
                                    <div className="absolute top-4 right-4 text-armada-gold">
                                        <CompassLogo size={14} bgColor="transparent" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Paso 2: Cabaña */}
                {selectedLocation && (
                    <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-armada-navy text-armada-gold flex items-center justify-center font-black text-md md:text-lg border-2 border-armada-gold shadow-md shrink-0">2</div>
                            <h3 className="text-xs md:text-sm font-black text-armada-navy uppercase tracking-[0.2em] italic">Seleccionar Unidad Habitacional</h3>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded institutional-card grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-3">
                            {selectedLocData?.cabins
                                .filter(c => c.status === 'disponible')
                                .sort((a, b) => a.identifier.localeCompare(b.identifier, undefined, { numeric: true, sensitivity: 'base' }))
                                .map(cabin => (
                                    <button
                                        key={cabin.id}
                                        onClick={() => setSelectedCabin(cabin.id)}
                                        className={`py-3 px-3 rounded font-black text-[10px] md:text-xs transition-all border-2 uppercase tracking-tighter ${selectedCabin === cabin.id
                                            ? 'bg-armada-navy text-armada-gold border-armada-gold shadow-lg'
                                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'
                                            }`}
                                    >
                                        <div>{cabin.identifier}</div>
                                        <div className={`text-[8px] mt-1 opacity-70 ${selectedCabin === cabin.id ? 'text-white' : 'text-slate-500'}`}>Max: {cabin.capacity}</div>
                                    </button>
                                ))}
                        </div>
                    </section>
                )}

                {/* Paso 3: Calendario y Datos Adicionales */}
                {selectedCabin && (
                    <section className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-armada-navy text-armada-gold flex items-center justify-center font-black text-md md:text-lg border-2 border-armada-gold shadow-md shrink-0">3</div>
                            <h3 className="text-xs md:text-sm font-black text-armada-navy uppercase tracking-[0.2em] italic">Cronograma y Ocupantes</h3>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-armada-navy font-black animate-pulse italic text-xs md:text-sm">Verificando bases de datos de ocupación para la unidad {selectedCabinData?.identifier}...</div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* Calendario - Ocupa 8 columnas en lg */}
                                <div className="lg:col-span-8 bg-white p-6 rounded institutional-card">
                                    <div className="flex items-center justify-between gap-2 mb-4">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic">
                                            <Calendar size={14} className="text-armada-gold" />
                                            Seleccionar Rango de Estancia (1 - 7 Días)
                                        </label>
                                        {(startDate || endDate) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStartDate(null);
                                                    setEndDate(null);
                                                    setShowPendingWarning(false);
                                                }}
                                                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-300 rounded px-3 py-1.5 transition-all shrink-0"
                                            >
                                                <X size={10} strokeWidth={3} /> Borrar selección
                                            </button>
                                        )}
                                    </div>
                                    <div className="custom-datepicker flex justify-center">
                                        <DatePicker
                                            selected={startDate}
                                            onChange={onChangeDates}
                                            startDate={startDate}
                                            endDate={endDate}
                                            selectsRange
                                            inline
                                            locale={es}
                                            minDate={new Date()}
                                            excludeDates={disabledDates}
                                            highlightDates={[
                                                { "react-datepicker__day--highlight-approved": approvedDates },
                                                { "react-datepicker__day--highlight-biena-blocked": bienaBlockedDates },
                                                { "react-datepicker__day--highlight-pending": pendingDates }
                                            ]}
                                            monthsShown={window.innerWidth > 768 ? 2 : 1}
                                        />
                                    </div>

                                    {showPendingWarning && (
                                        <div className="mt-4 bg-amber-50 text-amber-800 p-3 rounded border-l-4 border-amber-500 text-xs md:text-sm flex items-start gap-3 animate-fade-in">
                                            <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
                                            <div>
                                                <strong className="block mb-1">Aviso de Sobre-demanda</strong>
                                                Algunos días seleccionados ya tienen solicitudes de reserva de otros camaradas en estado "Pendiente". Puedes continuar, pero tu solicitud entrará en cola de revisión administrativa.
                                            </div>
                                        </div>
                                    )}

                                    {/* Leyenda de colores */}
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Leyenda del Calendario</p>
                                        <div className="flex flex-wrap gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-green-100 border border-green-400 shadow-sm shrink-0"></div>
                                                <span className="text-[10px] font-bold text-slate-600">Disponible</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-blue-500 shadow-sm shrink-0"></div>
                                                <span className="text-[10px] font-bold text-slate-600">Tu Selección</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-red-200 border border-red-400 shadow-sm shrink-0"></div>
                                                <span className="text-[10px] font-bold text-slate-600">Reservado (Aprobado)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-orange-100 border border-orange-400 shadow-sm shrink-0"></div>
                                                <span className="text-[10px] font-bold text-slate-600">Bloqueado por BIENA</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-yellow-200 border border-yellow-400 shadow-sm shrink-0"></div>
                                                <span className="text-[10px] font-bold text-slate-600">Solicitud Pendiente</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Ocupantes y Confirmación - Ocupa 4 columnas en lg */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-white p-6 rounded institutional-card">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic mb-4">
                                            <Users size={14} className="text-armada-gold" />
                                            Cantidad de Ocupantes
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setOccupants(Math.max(1, occupants - 1))}
                                                className="w-10 h-10 rounded bg-slate-100 text-armada-navy font-black text-lg hover:bg-armada-gold transition-colors"
                                            >-</button>
                                            <input
                                                type="number"
                                                readOnly
                                                value={occupants}
                                                onKeyDown={(e) => {
                                                    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className="flex-1 text-center bg-transparent border-b-2 border-armada-navy py-2 font-black text-xl outline-none"
                                            />
                                            <button
                                                onClick={() => setOccupants(Math.min(selectedCabinData?.capacity || 10, occupants + 1))}
                                                className="w-10 h-10 rounded bg-slate-100 text-armada-navy font-black text-lg hover:bg-armada-gold transition-colors"
                                            >+</button>
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-4 text-center font-bold uppercase tracking-widest">
                                            Capacidad máxima permitida: {selectedCabinData?.capacity} ocupantes.
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded border border-slate-200 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                id="terms"
                                                checked={acceptedTerms}
                                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                                className="w-5 h-5 mt-0.5 text-armada-gold accent-armada-gold bg-white border-slate-300 rounded cursor-pointer"
                                            />
                                            <label htmlFor="terms" className="text-[11px] md:text-xs font-bold text-armada-navy leading-tight cursor-pointer">
                                                He leído y acepto las <Link to="/terms" target="_blank" className="text-armada-gold underline hover:text-armada-navy transition-colors">Condiciones de Uso</Link> vigentes para el alojamiento naval.
                                            </label>
                                        </div>
                                    </div>

                                    <div className="bg-armada-navy/5 p-4 rounded-lg flex items-start gap-3 border-l-4 border-armada-gold">
                                        <Info className="text-armada-navy shrink-0 mt-0.5" size={16} />
                                        <p className="text-[10px] text-slate-600 font-medium leading-tight">
                                            <span className="font-black text-armada-navy block mb-1">RECORDATORIO:</span>
                                            Las solicitudes están sujetas a revisión del Mando Administrativo de BIENA. Solo una solicitud pendiente por funcionario.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Confirmación Final */}
                {selectedCabin && startDate && endDate && (
                    <div className="pt-8 pb-12 flex flex-col items-center animate-fade-in">
                        <div className="h-[2px] w-full bg-slate-100 mb-8" />
                        <button
                            onClick={handleBooking}
                            disabled={loading || !acceptedTerms}
                            className="btn-armada flex items-center gap-6 py-5 px-12 group shadow-2xl disabled:opacity-50 w-full md:w-auto justify-center"
                        >
                            <span className="text-sm md:text-xl font-black italic tracking-[0.2em] underline underline-offset-8 decoration-armada-gold/50 group-hover:decoration-armada-gold">
                                {loading ? 'REMITIENDO...' : 'REMITIR SOLICITUD A BIENA'}
                            </span>
                            <ChevronRight className="group-hover:translate-x-3 transition-transform text-armada-gold" size={28} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
