import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { startOfWeek, addWeeks, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Calendar, ChevronRight, Anchor, Compass, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Cabin {
    id: string;
    identifier: string;
    capacity: number;
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
    const [availableWeeks, setAvailableWeeks] = useState<{ start: Date; end: Date; available: boolean }[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);

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
            generateWeeksList();
        }
    }, [selectedLocation, selectedCabin]);

    const generateWeeksList = async () => {
        setLoading(true);
        const today = new Date();
        const currentMonday = startOfWeek(today, { weekStartsOn: 1 });
        const nextMonday = addWeeks(currentMonday, 1);

        let weeks = [];
        for (let i = 0; i < 12; i++) {
            const start = addWeeks(nextMonday, i);
            const end = addWeeks(start, 1);
            weeks.push({ start, end, available: true });
        }

        try {
            const start_date = weeks[0].start.toISOString();
            const end_date = weeks[weeks.length - 1].end.toISOString();

            const res = await api.get(`/reservations/availability?location_id=${selectedLocation}&start_date=${start_date}&end_date=${end_date}`);
            const reservations = res.data;

            const bookedStartDatesForCabin = reservations
                .filter((r: any) => r.cabin_id === selectedCabin)
                .map((r: any) => new Date(r.start_date).getTime());

            weeks = weeks.map(w => {
                const isBooked = bookedStartDatesForCabin.some((time: number) => {
                    return isSameDay(new Date(time), w.start);
                });
                return { ...w, available: !isBooked };
            });

            setAvailableWeeks(weeks);
        } catch (err) {
            console.error(err);
            setError('No se pudo cargar la disponibilidad oficial.');
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async () => {
        if (!selectedCabin || !selectedWeek) return;

        setLoading(true);
        setError('');

        const start = selectedWeek;
        const end = addWeeks(start, 1);

        try {
            await api.post('/reservations', {
                cabin_id: selectedCabin,
                start_date: start.toISOString(),
                end_date: end.toISOString()
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

    const selectedLocData = locations.find(l => l.id === selectedLocation);

    return (
        <div className="w-full space-y-8 md:space-y-12 py-4 md:py-8 px-4 sm:px-6 lg:px-10">
            <header className="border-b-4 border-armada-gold pb-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    <div className="bg-armada-navy p-3 rounded shadow-xl shrink-0">
                        <Compass className="text-armada-gold" size={32} />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-black text-armada-navy uppercase tracking-tighter">Nueva Solicitud de Reserva</h2>
                        <div className="h-0.5 w-full max-w-[12rem] bg-armada-gold my-2 mx-auto sm:mx-0" />
                        <p className="text-slate-500 font-medium text-[10px] md:text-sm italic uppercase tracking-widest">Formulario Oficial de Alojamiento — Servicio de Bienestar</p>
                    </div>
                </div>
            </header>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 md:p-5 rounded border-l-8 border-red-500 shadow-sm flex items-center gap-4 animate-shake">
                    <AlertCircle size={24} className="shrink-0" />
                    <span className="font-bold text-xs md:text-sm uppercase tracking-tight">{error}</span>
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-700 p-4 md:p-5 rounded border-l-8 border-green-500 shadow-sm flex items-center gap-4 animate-fade-in">
                    <CheckCircle2 size={24} className="shrink-0" />
                    <span className="font-bold text-xs md:text-sm uppercase tracking-tight">{success}</span>
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
                                onClick={() => { setSelectedLocation(loc.id); setSelectedCabin(''); setSelectedWeek(null); }}
                                className={`p-5 md:p-6 rounded institutional-card text-left transition-all relative overflow-hidden group ${selectedLocation === loc.id
                                    ? 'border-armada-navy ring-2 ring-armada-gold/20 bg-slate-50'
                                    : 'border-slate-200 hover:border-armada-gold opacity-80 hover:opacity-100 bg-white'
                                    }`}
                            >
                                <MapPin size={20} className={`mb-3 transition-colors ${selectedLocation === loc.id ? 'text-armada-gold' : 'text-slate-300'}`} />
                                <div className="font-black text-sm md:text-base text-armada-navy uppercase tracking-tight">{loc.name}</div>
                                {selectedLocation === loc.id && (
                                    <div className="absolute top-4 right-4 text-armada-gold">
                                        <Anchor size={14} />
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
                            {selectedLocData?.cabins.map(cabin => (
                                <button
                                    key={cabin.id}
                                    onClick={() => { setSelectedCabin(cabin.id); setSelectedWeek(null); }}
                                    className={`py-2.5 px-3 rounded font-black text-[10px] md:text-xs transition-all border-2 uppercase tracking-tighter ${selectedCabin === cabin.id
                                        ? 'bg-armada-navy text-armada-gold border-armada-gold shadow-lg'
                                        : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'
                                        }`}
                                >
                                    {cabin.identifier}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Paso 3: Calendario */}
                {selectedCabin && (
                    <section className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-armada-navy text-armada-gold flex items-center justify-center font-black text-md md:text-lg border-2 border-armada-gold shadow-md shrink-0">3</div>
                            <h3 className="text-xs md:text-sm font-black text-armada-navy uppercase tracking-[0.2em] italic">Cronograma de Disponibilidad</h3>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-armada-navy font-black animate-pulse italic text-xs md:text-sm">Verificando bases de datos de ocupación para la unidad {selectedLocData?.cabins.find(c => c.id === selectedCabin)?.identifier}...</div>
                        ) : (
                            <div className="space-y-6 md:space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                    {availableWeeks.map((week, i) => (
                                        <button
                                            key={i}
                                            disabled={!week.available}
                                            onClick={() => setSelectedWeek(week.start)}
                                            className={`p-5 md:p-6 rounded institutional-card text-left transition-all border-2 relative ${!week.available
                                                ? 'border-slate-100 bg-slate-50/50 opacity-40 cursor-not-allowed scale-95 grayscale'
                                                : selectedWeek === week.start
                                                    ? 'border-armada-navy ring-2 ring-armada-gold/40 bg-slate-50'
                                                    : 'border-slate-200 hover:border-armada-navy bg-white hover:bg-slate-50/30'
                                                }`}
                                        >
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                                                <Calendar size={12} />
                                                Período Semanal
                                            </div>
                                            <div className="text-xs md:text-sm font-black text-armada-navy uppercase tracking-tighter leading-tight">
                                                {format(week.start, "dd'/'MMM", { locale: es })} — {format(week.end, "dd'/'MMM'/'yy", { locale: es })}
                                            </div>
                                            <div className={`mt-3 text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${week.available ? 'text-green-600' : 'text-red-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${week.available ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {week.available ? 'CUPOS DISPONIBLES' : 'SECTOR BLOQUEADO'}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-slate-50 p-4 md:p-6 rounded border border-slate-200 flex items-start gap-3 md:gap-4">
                                    <Info className="text-armada-navy shrink-0 mt-0.5" size={18} />
                                    <div className="space-y-1">
                                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-armada-navy underline decoration-armada-gold underline-offset-4">Ordenanza de Reservas</p>
                                        <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed italic">
                                            Las reservas se realizan estrictamente de Lunes a Lunes (7 días). Solo se permite una solicitud por funcionario para el mismo período.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Confirmación */}
                {selectedWeek && (
                    <div className="pt-8 pb-12 flex flex-col items-center gap-6 animate-fade-in">
                        <div className="h-[2px] w-full bg-slate-100" />
                        <button
                            onClick={handleBooking}
                            disabled={loading}
                            className="btn-armada flex items-center gap-4 py-4 md:py-5 px-8 md:px-12 group shadow-[0_10px_40px_rgba(0,26,61,0.2)] disabled:opacity-50 w-full sm:w-auto justify-center"
                        >
                            <span className="text-sm md:text-lg font-black italic tracking-widest underline underline-offset-8 decoration-armada-gold/50 group-hover:decoration-armada-gold leading-none">
                                {loading ? 'PROCESANDO...' : 'REMITIR SOLICITUD A BIENA'}
                            </span>
                            <ChevronRight className="group-hover:translate-x-2 transition-transform text-armada-gold hidden sm:block" size={24} />
                        </button>
                        <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center max-w-sm leading-relaxed">
                            Al enviar esta solicitud, usted confirma el conocimiento de las normativas vigentes por el Servicio de Bienestar de la Armada.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
