import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDateSafe } from '../../utils/dateUtils';
import { CalendarX, Trash2, Plus, RefreshCw, MapPin, Home, Calendar, Activity } from 'lucide-react';

export default function BlockedDatesTab() {
    const [blockedDates, setBlockedDates] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchType, setSearchType] = useState('todos');
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedCabins, setSelectedCabins] = useState<string[]>([]);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const [newBlock, setNewBlock] = useState({
        cabin_id: '',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const handleLocationsToggle = (id: string) => {
        setSelectedLocations(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleCabinsToggle = (id: string) => {
        setSelectedCabins(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const safeFormat = (dateStr: string) => {
        return formatDateSafe(dateStr);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [blocksRes, locationsRes] = await Promise.all([
                api.get('/admin/blocked-dates'),
                api.get('/admin/locations')
            ]);
            setBlockedDates(blocksRes.data);
            setLocations(locationsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = { ...newBlock };
            if (!data.cabin_id) delete (data as any).cabin_id; // Si está vacío, es global

            await api.post('/admin/blocked-dates', data);
            setNewBlock({ cabin_id: '', start_date: '', end_date: '', reason: '' });
            loadData();
            alert('Bloqueo registrado correctamente.');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al crear bloqueo');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Levantar este bloqueo de fechas?')) return;
        try {
            await api.delete(`/admin/blocked-dates/${id}`);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al eliminar bloqueo');
        }
    };

    const filteredBlocks = blockedDates.filter(b => {
        // Filtro especializado: Sede
        if (searchType === 'sede' && selectedLocations.length > 0) {
            if (!b.cabin || !selectedLocations.includes(b.cabin.location_id)) return false;
        }

        // Filtro especializado: Unidad
        if (searchType === 'unidad' && selectedCabins.length > 0) {
            if (!b.cabin || !selectedCabins.includes(b.cabin_id)) return false;
        }

        // Filtro especializado: Fecha
        if (searchType === 'fecha') {
            if (filterStartDate && new Date(b.end_date) < new Date(filterStartDate)) return false;
            if (filterEndDate && new Date(b.start_date) > new Date(filterEndDate)) return false;
        }

        // Filtro especializado: Alcance (Global vs Específico)
        if (searchType === 'alcance') {
            const onlyGlobal = selectedLocations.includes('global');
            const onlySpecific = selectedLocations.includes('especifico');
            if (onlyGlobal && b.cabin_id) return false;
            if (onlySpecific && !b.cabin_id) return false;
        }

        return true;
    });

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="institutional-card bg-white p-6">
                <h3 className="text-sm font-black text-armada-navy uppercase tracking-widest border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
                    <CalendarX size={18} className="text-armada-gold" />
                    Registrar Nuevo Bloqueo Temporario
                </h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Unidad (Opcional)</label>
                        <select
                            value={newBlock.cabin_id}
                            onChange={e => setNewBlock({ ...newBlock, cabin_id: e.target.value })}
                            className="w-full border-2 border-slate-100 rounded px-3 py-2 text-sm font-bold uppercase overflow-hidden text-ellipsis focus:border-armada-navy transition-all bg-slate-50/50"
                        >
                            <option value="">Todas (Bloqueo Global)</option>
                            {locations.map(loc => (
                                <optgroup key={loc.id} label={loc.name}>
                                    {loc.cabins?.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.identifier}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Desde</label>
                        <input
                            type="date"
                            required
                            value={newBlock.start_date}
                            onChange={e => setNewBlock({ ...newBlock, start_date: e.target.value })}
                            className="w-full border-2 border-slate-100 rounded px-3 py-2 text-sm font-bold focus:border-armada-navy transition-all bg-slate-50/50"
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Hasta</label>
                        <input
                            type="date"
                            required
                            value={newBlock.end_date}
                            onChange={e => setNewBlock({ ...newBlock, end_date: e.target.value })}
                            className="w-full border-2 border-slate-100 rounded px-3 py-2 text-sm font-bold focus:border-armada-navy transition-all bg-slate-50/50"
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Motivo / Orden</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Mantenimiento Anual"
                            value={newBlock.reason}
                            onChange={e => setNewBlock({ ...newBlock, reason: e.target.value })}
                            className="w-full border-2 border-slate-100 rounded px-3 py-2 text-sm font-bold focus:border-armada-navy transition-all bg-slate-50/50"
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <button type="submit" className="w-full btn-armada py-2.5 flex items-center justify-center gap-2">
                            <Plus size={16} /> APLICAR BLOQUEO
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded institutional-card shadow-sm border border-slate-100">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex flex-col gap-1 md:w-64">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Criterio de Búsqueda de Bloqueos</label>
                            <select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                                className="border-2 border-slate-100 rounded focus:border-armada-navy px-4 py-2.5 font-bold text-xs uppercase text-armada-navy outline-none transition-all w-full bg-slate-50/50"
                            >
                                <option value="todos">Todos los registros</option>
                                <option value="sede">Sede / Destino</option>
                                <option value="unidad">Unidad Específica</option>
                                <option value="fecha">Rango de Fecha</option>
                                <option value="alcance">Alcance del Bloqueo</option>
                            </select>
                        </div>

                        {searchType === 'fecha' && (
                            <div className="flex-1 flex flex-col md:flex-row gap-4 w-full animate-fade-in">
                                <div className="flex-1 flex flex-col gap-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-xs"
                                        value={filterStartDate}
                                        onChange={(e) => setFilterStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-xs"
                                        value={filterEndDate}
                                        onChange={(e) => setFilterEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 self-end">
                            <button
                                onClick={loadData}
                                className="bg-armada-navy text-armada-gold px-6 py-3 rounded font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg border border-armada-gold/30 shrink-0 flex items-center gap-2"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> ACTUALIZAR LISTA
                            </button>
                        </div>
                    </div>

                    {searchType === 'sede' && (
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded border border-slate-100 animate-fade-in-up">
                            <div className="w-full mb-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Filtrar por Destinos:</span>
                            </div>
                            {locations.map(loc => (
                                <button
                                    key={loc.id}
                                    onClick={() => handleLocationsToggle(loc.id)}
                                    className={`px-3 py-1.5 rounded text-[10px] font-black transition-all border ${selectedLocations.includes(loc.id)
                                        ? 'bg-armada-gold text-armada-navy border-armada-gold shadow-md scale-105'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-armada-gold'
                                        }`}
                                >
                                    {loc.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {searchType === 'unidad' && (
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded border border-slate-100 animate-fade-in-up">
                            {locations.map(loc => (
                                <div key={loc.id} className="w-full mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin size={12} className="text-armada-gold" />
                                        <span className="text-[9px] font-black text-armada-navy uppercase tracking-widest">{loc.name}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {loc.cabins?.map((c: any) => (
                                            <button
                                                key={c.id}
                                                onClick={() => handleCabinsToggle(c.id)}
                                                className={`px-3 py-1.5 rounded text-[9px] font-black transition-all border ${selectedCabins.includes(c.id)
                                                    ? 'bg-armada-navy text-armada-gold border-armada-navy shadow-md scale-105'
                                                    : 'bg-white text-slate-400 border-slate-200 hover:border-armada-navy'
                                                    }`}
                                            >
                                                {c.identifier}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {searchType === 'alcance' && (
                        <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded border border-slate-100 animate-fade-in-up">
                            {[
                                { id: 'global', label: 'Bloqueos Globales' },
                                { id: 'especifico', label: 'Bloqueos por Unidad' }
                            ].map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => handleLocationsToggle(a.id)}
                                    className={`px-4 py-2 rounded text-[10px] font-black transition-all border flex items-center gap-2 ${selectedLocations.includes(a.id)
                                        ? 'bg-armada-navy text-armada-gold border-armada-navy shadow-lg scale-105'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-armada-navy'
                                        }`}
                                >
                                    {a.label.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="institutional-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alcance del Bloqueo</th>
                                <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Período de Vigencia</th>
                                <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Observación / Causa</th>
                                <th className="px-5 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {filteredBlocks.map(b => (
                                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-4">
                                        {b.cabin ? (
                                            <div className="flex flex-col">
                                                <div className="text-sm font-black text-armada-navy uppercase flex items-center gap-2">
                                                    <Home size={14} className="text-slate-400" />
                                                    {b.cabin.identifier}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-1">
                                                    <MapPin size={10} /> {b.cabin.location?.name || 'Sede N/A'}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-[10px] font-black text-red-600 uppercase bg-red-50 border border-red-100 inline-flex items-center gap-2 px-3 py-1 rounded">
                                                <Activity size={12} /> Bloqueo Global (Todas las Unidades)
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-600">
                                            <Calendar size={14} className="text-armada-gold" />
                                            {safeFormat(b.start_date)} <span className="text-slate-300 mx-1">—</span> {safeFormat(b.end_date)}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="text-xs italic text-slate-500 max-w-xs">{b.reason}</div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all" title="Levantar Bloqueo">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredBlocks.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <CalendarX size={32} className="text-slate-200" />
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">No se han detectado bloqueos activos con estos criterios.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
