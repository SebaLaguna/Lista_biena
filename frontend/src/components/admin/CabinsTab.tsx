import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Edit2, Check, X, Home, MapPin, Trash2, Plus, AlertCircle, Search } from 'lucide-react';

interface Cabin {
    id: string;
    identifier: string;
    capacity: number;
    status: string;
    location_id: string;
}

interface Location {
    id: string;
    name: string;
    cabins: Cabin[];
}

export default function CabinsTab() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('todos');
    const [editingCabin, setEditingCabin] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedLocForAdd, setSelectedLocForAdd] = useState<string>('');
    const [editForm, setEditForm] = useState({ identifier: '', capacity: 4, status: 'disponible' });
    const [error, setError] = useState('');

    const loadCabins = () => {
        setLoading(true);
        api.get('/cabins')
            .then(res => setLocations(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadCabins();
    }, []);

    const startEditing = (cabin: Cabin) => {
        setEditingCabin(cabin.id);
        setEditForm({
            identifier: cabin.identifier,
            capacity: cabin.capacity,
            status: cabin.status
        });
    };

    const cancelEditing = () => {
        setEditingCabin(null);
    };

    const saveCabin = async (id: string) => {
        try {
            await api.patch(`/admin/cabins/${id}`, editForm);
            setEditingCabin(null);
            loadCabins();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al actualizar cabaña');
        }
    };

    const handleDelete = async (id: string, identifier: string) => {
        if (!confirm(`¿Está seguro de eliminar la unidad "${identifier}"? Esta acción fallará si existen reservas asociadas.`)) return;
        try {
            await api.delete(`/admin/cabins/${id}`);
            loadCabins();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al eliminar unidad');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!selectedLocForAdd) {
            setError('Debe seleccionar un destino naval');
            return;
        }
        try {
            await api.post('/admin/cabins', {
                ...editForm,
                location_id: selectedLocForAdd
            });
            setShowAddModal(false);
            setEditForm({ identifier: '', capacity: 4, status: 'disponible' });
            setSelectedLocForAdd('');
            loadCabins();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al crear unidad');
        }
    };

    const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
        if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
            e.preventDefault();
        }
    };

    const filteredLocations = locations.map(loc => ({
        ...loc,
        cabins: loc.cabins.filter(c => {
            const term = searchTerm.toLowerCase();
            if (!term) return true;

            const identStr = c.identifier.toLowerCase();
            const sedeStr = loc.name.toLowerCase();

            switch (searchType) {
                case 'identificador': return identStr.includes(term);
                case 'sede': return sedeStr.includes(term);
                default: return identStr.includes(term) || sedeStr.includes(term);
            }
        })
    })).filter(loc => loc.cabins.length > 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded institutional-card">
                <div className="flex-1 flex flex-col md:flex-row gap-3">
                    <select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="border-2 border-slate-100 rounded focus:border-armada-navy px-4 py-3 font-bold text-xs uppercase text-slate-500 outline-none transition-all md:w-48 bg-slate-50/50"
                    >
                        <option value="todos">Todos los campos</option>
                        <option value="identificador">Identificador</option>
                        <option value="sede">Destino Naval</option>
                    </select>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="BUSCAR UNIDADES HABITACIONALES..."
                            className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-xs uppercase tracking-widest"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedLocForAdd('');
                        setEditForm({ identifier: '', capacity: 4, status: 'disponible' });
                        setShowAddModal(true);
                    }}
                    className="flex items-center justify-center gap-3 bg-armada-navy text-armada-gold px-6 py-3 rounded font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg border border-armada-gold/30 shrink-0"
                >
                    <Plus size={18} /> AGREGAR UNIDAD
                </button>
            </div>

            {filteredLocations.map(loc => (
                <div key={loc.id} className="institutional-card overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MapPin size={20} className="text-armada-gold" />
                            <h3 className="text-sm font-black text-armada-navy uppercase tracking-widest">{loc.name}</h3>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 tracking-widest bg-slate-200/50 px-2 py-1 rounded">
                            {loc.cabins.length} UNIDADES
                        </span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {loc.cabins
                            .sort((a, b) => a.identifier.localeCompare(b.identifier, undefined, { numeric: true, sensitivity: 'base' }))
                            .map(cabin => (
                                <div key={cabin.id} className={`border-2 rounded p-4 relative transition-all group ${editingCabin === cabin.id ? 'border-armada-navy shadow-inner' :
                                    cabin.status === 'disponible' ? 'border-green-100 bg-white hover:border-green-200' :
                                        cabin.status === 'en mantenimiento' ? 'border-yellow-100 bg-yellow-50/20' :
                                            'border-red-100 bg-red-50/20'
                                    }`}>
                                    {editingCabin === cabin.id ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400">Identificador</label>
                                                <input
                                                    type="text"
                                                    value={editForm.identifier}
                                                    onChange={e => setEditForm({ ...editForm, identifier: e.target.value })}
                                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400">Capacidad</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={editForm.capacity}
                                                    onKeyDown={handleNumericKeyDown}
                                                    onChange={e => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 1 })}
                                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400">Estado</label>
                                                <select
                                                    value={editForm.status}
                                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold uppercase"
                                                >
                                                    <option value="disponible">Disponible</option>
                                                    <option value="en mantenimiento">En Mantenimiento</option>
                                                    <option value="fuera de servicio">Fuera de Servicio</option>
                                                </select>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                                <button onClick={cancelEditing} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded">
                                                    <X size={16} />
                                                </button>
                                                <button onClick={() => saveCabin(cabin.id)} className="p-1.5 text-white bg-armada-navy hover:bg-slate-800 rounded shadow-sm border border-armada-gold/30">
                                                    <Check size={16} className="text-armada-gold" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Home size={16} className="text-armada-navy" />
                                                    <span className="font-black text-armada-navy text-sm uppercase tracking-tighter">{cabin.identifier}</span>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEditing(cabin)} className="p-1 text-slate-400 hover:text-armada-gold hover:bg-slate-50 rounded">
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button onClick={() => handleDelete(cabin.id, cabin.identifier)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Capacidad: <span className="text-armada-navy font-black">{cabin.capacity}</span></div>
                                                <div className="text-[9px] font-black uppercase flex items-center gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded-sm tracking-widest ${cabin.status === 'disponible' ? 'bg-green-100 text-green-700' :
                                                        cabin.status === 'en mantenimiento' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {cabin.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            ))}

            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-armada-navy/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded shadow-2xl overflow-hidden border-2 border-armada-navy">
                        <div className="bg-armada-navy p-5 flex justify-between items-center">
                            <h3 className="text-armada-gold font-black uppercase tracking-widest italic text-xs">Nueva Unidad Habitacional</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-white hover:text-armada-gold transition-colors">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-5">
                            {error && (
                                <div className="bg-red-50 text-red-700 p-3 rounded flex items-center gap-3 border border-red-100">
                                    <AlertCircle size={16} />
                                    <p className="text-[10px] font-black uppercase tracking-tight">{error}</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-armada-navy uppercase tracking-widest block">Sede / Destino</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50 uppercase"
                                    value={selectedLocForAdd}
                                    onChange={(e) => setSelectedLocForAdd(e.target.value)}
                                >
                                    <option value="" disabled>Seleccione un destino naval...</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1 mt-3">
                                <label className="text-[9px] font-black text-armada-navy uppercase tracking-widest block">Identificador (Nombre/Número)</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50"
                                    value={editForm.identifier}
                                    onChange={(e) => setEditForm({ ...editForm, identifier: e.target.value })}
                                    placeholder="Ej: BAEN 6, SANTA TERESA 4..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-armada-navy uppercase tracking-widest block">Capacidad</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        onKeyDown={handleNumericKeyDown}
                                        className="w-full px-3 py-2 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50"
                                        value={editForm.capacity}
                                        onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-armada-navy uppercase tracking-widest block">Estado Inicial</label>
                                    <select
                                        className="w-full px-3 py-2 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50 uppercase"
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    >
                                        <option value="disponible">Disponible</option>
                                        <option value="en mantenimiento">Mantenimiento</option>
                                        <option value="fuera de servicio">Fuera Servicio</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-armada-navy text-armada-gold py-3 rounded font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-slate-800 border border-armada-gold/30 mt-2"
                            >
                                Registrar Unidad
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {loading && <div className="text-center text-slate-400 text-xs font-black uppercase animate-pulse">Cargando unidades...</div>}
            {!loading && filteredLocations.length === 0 && (
                <div className="text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] py-12">
                    No hay unidades que coincidan con la búsqueda.
                </div>
            )}
        </div>
    );
}
