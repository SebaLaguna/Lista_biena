import { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarX, Trash2, Plus } from 'lucide-react';

export default function BlockedDatesTab() {
    const [blockedDates, setBlockedDates] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [newBlock, setNewBlock] = useState({
        cabin_id: '',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [blocksRes, cabinsRes] = await Promise.all([
                api.get('/admin/blocked-dates'),
                api.get('/cabins')
            ]);
            setBlockedDates(blocksRes.data);
            setLocations(cabinsRes.data);
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

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="institutional-card bg-white p-6">
                <h3 className="text-sm font-black text-armada-navy uppercase tracking-widest border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
                    <CalendarX size={18} className="text-armada-gold" />
                    Registrar Nuevo Bloqueo Temporario
                </h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Unidad (Opcional)</label>
                        <select
                            value={newBlock.cabin_id}
                            onChange={e => setNewBlock({ ...newBlock, cabin_id: e.target.value })}
                            className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-bold uppercase overflow-hidden text-ellipsis"
                        >
                            <option value="">Todas (Bloqueo Global)</option>
                            {locations.map(loc => (
                                <optgroup key={loc.id} label={loc.name}>
                                    {loc.cabins.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.identifier}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Desde</label>
                        <input
                            type="date"
                            required
                            value={newBlock.start_date}
                            onChange={e => setNewBlock({ ...newBlock, start_date: e.target.value })}
                            className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-bold"
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Hasta</label>
                        <input
                            type="date"
                            required
                            value={newBlock.end_date}
                            onChange={e => setNewBlock({ ...newBlock, end_date: e.target.value })}
                            className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-bold"
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Motivo / Orden</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Mantenimiento Anual"
                            value={newBlock.reason}
                            onChange={e => setNewBlock({ ...newBlock, reason: e.target.value })}
                            className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-bold"
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <button type="submit" className="w-full btn-armada py-2 flex items-center justify-center gap-2">
                            <Plus size={16} /> APLICAR
                        </button>
                    </div>
                </form>
            </div>

            <div className="institutional-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Alcance</th>
                                <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Período</th>
                                <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Causa</th>
                                <th className="px-5 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {blockedDates.map(b => (
                                <tr key={b.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-4">
                                        {b.cabin ? (
                                            <div className="text-xs font-black text-armada-navy uppercase">{b.cabin.identifier} <span className="text-[9px] text-slate-400">({b.cabin.location.name})</span></div>
                                        ) : (
                                            <div className="text-xs font-black text-red-600 uppercase bg-red-50 inline-block px-2 py-0.5 rounded">Global (Todas las unidades)</div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-[10px] font-bold uppercase text-slate-600">
                                        {format(new Date(b.start_date), "dd/MM/yyyy", { locale: es })} — {format(new Date(b.end_date), "dd/MM/yyyy", { locale: es })}
                                    </td>
                                    <td className="px-5 py-4 text-xs italic text-slate-500">{b.reason}</td>
                                    <td className="px-5 py-4 text-right">
                                        <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded" title="Levantar Bloqueo">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {blockedDates.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">No hay bloqueos activos registrados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
