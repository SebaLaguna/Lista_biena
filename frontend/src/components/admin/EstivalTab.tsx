import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Trash2, Plus, AlertCircle, RefreshCw, Search, Edit } from 'lucide-react';
import { formatDateSafe, getYearSafe } from '../../utils/dateUtils';

interface EstivalPeriod {
    id: string;
    start_date: string;
    end_date: string;
    description: string | null;
}

export default function EstivalTab() {
    const [periods, setPeriods] = useState<EstivalPeriod[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('todos');
    const [selectedYears, setSelectedYears] = useState<number[]>([]);

    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        description: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const loadPeriods = () => {
        setLoading(true);
        api.get('/admin/estival-periods')
            .then(res => setPeriods(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadPeriods();
    }, []);

    const handleYearsToggle = (year: number) => {
        setSelectedYears(prev => 
            prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
        );
    };

    const uniqueYears = Array.from(new Set(periods.map(p => getYearSafe(p.start_date)))).sort((a,b) => b-a);

    const filteredPeriods = periods.filter(p => {
        const term = searchTerm.toLowerCase();
        const year = getYearSafe(p.start_date);

        if (searchType === 'descripcion' && term) {
            if (!p.description?.toLowerCase().includes(term)) return false;
        }

        if (searchType === 'año' && selectedYears.length > 0) {
            if (!selectedYears.includes(year)) return false;
        }

        if (searchType === 'todos' && term) {
            if (!p.description?.toLowerCase().includes(term)) return false;
        }

        return true;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (editingId) {
                await api.put(`/admin/estival-periods/${editingId}`, formData);
            } else {
                await api.post('/admin/estival-periods', formData);
            }
            setShowAddForm(false);
            setEditingId(null);
            setFormData({ start_date: '', end_date: '', description: '' });
            loadPeriods();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al procesar período');
        }
    };

    const handleEdit = (p: EstivalPeriod) => {
        setFormData({
            start_date: new Date(p.start_date).toISOString().split('T')[0],
            end_date: new Date(p.end_date).toISOString().split('T')[0],
            description: p.description || ''
        });
        setEditingId(p.id);
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este período estival? Las reservas en estas fechas volverán a la política estándar.')) return;
        try {
            await api.delete(`/admin/estival-periods/${id}`);
            loadPeriods();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al eliminar período');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded institutional-card">
                <div>
                    <h2 className="text-xl font-black text-armada-navy uppercase tracking-tighter">Temporadas Estivales</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración de períodos con política de cancelación especial (10 días)</p>
                </div>
                <button
                    onClick={() => {
                        if (showAddForm) {
                            setEditingId(null);
                            setFormData({ start_date: '', end_date: '', description: '' });
                            setShowAddForm(false);
                        } else {
                            setShowAddForm(true);
                        }
                    }}
                    className="flex items-center justify-center gap-3 bg-armada-navy text-armada-gold px-6 py-3 rounded font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg border border-armada-gold/30"
                >
                    {showAddForm ? 'CANCELAR' : <><Plus size={18} /> AGREGAR PERÍODO</>}
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded institutional-card border-l-4 border-armada-gold animate-fade-in-down">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-armada-navy uppercase tracking-widest">Fecha Inicio</label>
                            <input
                                required
                                type="date"
                                className="w-full px-3 py-2 border-2 border-slate-100 rounded outline-none focus:border-armada-navy font-bold text-xs"
                                value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-armada-navy uppercase tracking-widest">Fecha Fin</label>
                            <input
                                required
                                type="date"
                                className="w-full px-3 py-2 border-2 border-slate-100 rounded outline-none focus:border-armada-navy font-bold text-xs"
                                value={formData.end_date}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-armada-navy uppercase tracking-widest">Descripción</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border-2 border-slate-100 rounded outline-none focus:border-armada-navy font-bold text-xs"
                                placeholder="Ej: Temporada 2025"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-armada-navy text-armada-gold px-4 py-3 rounded font-black text-[10px] uppercase tracking-widest hover:bg-armada-black transition-all shadow-lg border border-armada-gold/30 h-[40px] flex items-center justify-center"
                        >
                            {editingId ? 'ACTUALIZAR' : 'GUARDAR'}
                        </button>
                    </form>
                    {error && (
                        <div className="mt-4 bg-red-50 text-red-700 p-3 rounded flex items-center gap-3 border border-red-100">
                            <AlertCircle size={16} />
                            <p className="text-[10px] font-black uppercase tracking-tight">{error}</p>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white p-6 rounded institutional-card shadow-sm border border-slate-100 mb-6">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex flex-col gap-1 md:w-64">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar Períodos</label>
                            <select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                                className="border-2 border-slate-100 rounded focus:border-armada-navy px-4 py-2.5 font-bold text-[11px] uppercase text-armada-navy outline-none transition-all w-full bg-slate-50/50"
                            >
                                <option value="todos">Todos los registros</option>
                                <option value="descripcion">Búsqueda por Nombre</option>
                                <option value="año">Filtrar por Año</option>
                            </select>
                        </div>

                        {(searchType === 'todos' || searchType === 'descripcion') && (
                            <div className="flex-1 flex flex-col gap-1 w-full animate-fade-in">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de Temporada</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="EJ: VERANO 2025..."
                                        className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-black text-[11px] uppercase tracking-widest bg-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 self-end">
                            <button
                                onClick={loadPeriods}
                                className="bg-armada-navy text-armada-gold px-6 py-3 rounded font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg border border-armada-gold/30 shrink-0 flex items-center gap-2"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> ACTUALIZAR
                            </button>
                            {(searchTerm || selectedYears.length > 0) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedYears([]);
                                    }}
                                    className="px-4 py-3 rounded font-black text-[9px] uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {searchType === 'año' && (
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded border border-slate-100 animate-fade-in-up">
                            <div className="w-full mb-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Seleccionar Años:</span>
                            </div>
                            {uniqueYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => handleYearsToggle(year)}
                                    className={`px-4 py-2 rounded text-[10px] font-black transition-all border ${selectedYears.includes(year)
                                        ? 'bg-armada-gold text-armada-navy border-armada-gold shadow-md scale-105'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-armada-gold'
                                        }`}
                                >
                                    {year}
                                </button>
                            ))}
                            {uniqueYears.length === 0 && (
                                <span className="text-[10px] font-bold text-slate-400 italic">No hay registros para categorizar por año.</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPeriods.map(p => (
                    <div key={p.id} className="institutional-card p-6 border-t-4 border-armada-navy hover:border-armada-gold transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-armada-navy/5 p-3 rounded-full">
                                <Calendar className="text-armada-navy" size={24} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(p)} className="text-slate-300 hover:text-armada-navy transition-colors p-1" title="Editar este período">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(p.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Eliminar período">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h4 className="font-black text-armada-navy uppercase text-sm tracking-tight mb-1">{p.description || 'Período Estival'}</h4>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                                <span>Desde:</span>
                                <span>{formatDateSafe(p.start_date)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                                <span>Hasta:</span>
                                <span>{formatDateSafe(p.end_date)}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <span className="text-[9px] font-black text-armada-gold uppercase tracking-[0.2em] italic">Política Restrictiva Activa</span>
                        </div>
                    </div>
                ))}

                {filteredPeriods.length === 0 && !loading && (
                    <div className="col-span-full institutional-card py-20 text-center">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">No se han detectado períodos con estos criterios.</p>
                    </div>
                )}
            </div>

            {loading && periods.length === 0 && (
                <div className="flex justify-center py-10">
                    <RefreshCw className="text-armada-navy animate-spin" size={32} />
                </div>
            )}
        </div>
    );
}
