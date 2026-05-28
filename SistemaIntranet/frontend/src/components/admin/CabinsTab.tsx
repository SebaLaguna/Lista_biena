import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Edit2, Check, X, Home, MapPin, Trash2, Plus, AlertCircle, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Cabin {
    id: string;
    identifier: string;
    capacity: number;
    status: string;
    location_id: string;
    allowed_hierarchies: string[] | null;
}

interface Location {
    id: string;
    name: string;
    cabins: Cabin[];
}

export default function CabinsTab() {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin_biena';
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('todos');
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [minCapacity, setMinCapacity] = useState<number>(0);
    const [editingCabin, setEditingCabin] = useState<string | null>(null);

    const handleLocationsToggle = (id: string) => {
        setSelectedLocations(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleStatusesToggle = (s: string) => {
        setSelectedStatuses(prev => 
            prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
        );
    };

    const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
        if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
            e.preventDefault();
        }
    };

    const statuses = [
        { id: 'disponible', label: 'Disponible' },
        { id: 'en mantenimiento', label: 'En Mantenimiento' },
        { id: 'fuera de servicio', label: 'Fuera de Servicio' }
    ];
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedLocForAdd, setSelectedLocForAdd] = useState<string>('');
    const [editForm, setEditForm] = useState<{
        identifier: string;
        capacity: number;
        status: string;
        allowed_hierarchies: string[];
    }>({ 
        identifier: '', 
        capacity: 4, 
        status: 'disponible',
        allowed_hierarchies: []
    });
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
            capacity: cabin.capacity || 4,
            status: cabin.status,
            allowed_hierarchies: cabin.allowed_hierarchies || []
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
            setEditForm({ 
                identifier: '', 
                capacity: 4, 
                status: 'disponible',
                allowed_hierarchies: []
            });
            setSelectedLocForAdd('');
            loadCabins();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al crear unidad');
        }
    };

    const filteredLocations = locations.map(loc => ({
        ...loc,
        cabins: loc.cabins.filter(c => {
            const term = searchTerm.toLowerCase();
            
            // Filtro por tipo de buscador principal
            if (searchType === 'todos' || searchType === 'identificador') {
                if (term) {
                    const identStr = c.identifier.toLowerCase();
                    if (!identStr.includes(term)) return false;
                }
            }

            // Filtro especializado: Sede
            if (searchType === 'sede' && selectedLocations.length > 0) {
                if (!selectedLocations.includes(loc.id)) return false;
            }

            // Filtro especializado: Estado
            if (searchType === 'estado' && selectedStatuses.length > 0) {
                if (!selectedStatuses.includes(c.status)) return false;
            }

            // Filtro especializado: Capacidad
            if (searchType === 'capacidad' && minCapacity > 0) {
                if (c.capacity < minCapacity) return false;
            }

            return true;
        })
    })).filter(loc => loc.cabins.length > 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded institutional-card shadow-sm border border-slate-100">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex flex-col gap-1 md:w-64">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Criterio de Búsqueda</label>
                            <select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                                className="border-2 border-slate-100 rounded focus:border-armada-navy px-4 py-2.5 font-bold text-xs uppercase text-armada-navy outline-none transition-all w-full bg-slate-50/50"
                            >
                                <option value="todos">Todos los campos</option>
                                <option value="identificador">Identificador</option>
                                <option value="sede">Destino Naval</option>
                                <option value="estado">Estado de Unidad</option>
                                <option value="capacidad">Capacidad Mínima</option>
                            </select>
                        </div>

                        {(searchType === 'todos' || searchType === 'identificador') && (
                            <div className="flex-1 flex flex-col gap-1 w-full animate-fade-in">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Identificador</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="EJ: BAEN 6, SANTA TERESA 4..."
                                        className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-black text-xs uppercase tracking-widest bg-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {searchType === 'capacidad' && (
                            <div className="flex-1 flex flex-col gap-1 w-full animate-fade-in">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacidad Mínima de Ocupantes</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="EJ: 4"
                                    className="w-full px-4 py-2.5 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-black text-xs bg-white"
                                    value={minCapacity || ''}
                                    onChange={(e) => setMinCapacity(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        )}

                        <div className="flex gap-2 self-end">
                            <button
                                onClick={loadCabins}
                                className="bg-armada-navy text-armada-gold px-6 py-3 rounded font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg border border-armada-gold/30 shrink-0 flex items-center gap-2"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> ACTUALIZAR
                            </button>
                            {isSuperAdmin && (
                                <button
                                    onClick={() => {
                                        setSelectedLocForAdd('');
                                        setEditForm({
                                            identifier: '',
                                            capacity: 4,
                                            status: 'disponible',
                                            allowed_hierarchies: []
                                        });
                                        setShowAddModal(true);
                                    }}
                                    className="flex items-center justify-center gap-3 bg-white text-armada-navy px-6 py-3 rounded font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow border-2 border-armada-navy/10 shrink-0"
                                >
                                    <Plus size={16} /> NUEVA UNIDAD
                                </button>
                            )}
                        </div>
                    </div>

                    {searchType === 'sede' && (
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded border border-slate-100 animate-fade-in-up">
                            <div className="w-full mb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Filtrar por Sedes:</span>
                            </div>
                            {locations.map(loc => (
                                <button
                                    key={loc.id}
                                    onClick={() => handleLocationsToggle(loc.id)}
                                    className={`px-3 py-1.5 rounded text-xs font-black transition-all border ${selectedLocations.includes(loc.id)
                                        ? 'bg-armada-gold text-armada-navy border-armada-gold shadow-md scale-105'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-armada-gold'
                                        }`}
                                >
                                    {loc.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {searchType === 'estado' && (
                        <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded border border-slate-100 animate-fade-in-up">
                            <div className="w-full mb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Filtrar por Estado de Unidad:</span>
                            </div>
                            {statuses.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => handleStatusesToggle(s.id)}
                                    className={`px-4 py-2 rounded text-xs font-black transition-all border flex items-center gap-2 ${selectedStatuses.includes(s.id)
                                        ? 'bg-armada-navy text-armada-gold border-armada-navy shadow-lg scale-105'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-armada-navy'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${s.id === 'disponible' ? 'bg-green-500' : s.id === 'en mantenimiento' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                    {s.label.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
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
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
                                                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400">Capacidad</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={editForm.capacity === 0 ? '' : editForm.capacity}
                                                    onKeyDown={handleNumericKeyDown}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value);
                                                        setEditForm({ ...editForm, capacity: isNaN(val) ? 0 : val });
                                                    }}
                                                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400">Estado</label>
                                                <select
                                                    value={editForm.status}
                                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm font-bold uppercase"
                                                >
                                                    <option value="disponible">Disponible</option>
                                                    <option value="en mantenimiento">En Mantenimiento</option>
                                                    <option value="fuera de servicio">Fuera de Servicio</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-armada-navy uppercase tracking-widest italic block mb-3">Jerarquías Autorizadas</label>
                                                <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded border border-slate-100 shadow-inner">
                                                    {[
                                                        { id: 'ALM', label: 'Alm.' }, { id: 'CA', label: 'C.A.' }, { id: 'CN', label: 'C.N.' },
                                                        { id: 'CF', label: 'C.F.' }, { id: 'CC', label: 'C.C.' }, { id: 'TN', label: 'T.N.' },
                                                        { id: 'AN', label: 'A.N.' }, { id: 'AF', label: 'A.F.' }, { id: 'GM', label: 'G.M.' },
                                                        { id: 'SOC', label: 'SOC' }, { id: 'SOP', label: 'SOP' }, { id: 'SOS', label: 'SOS' },
                                                        { id: 'CP', label: 'C.P.' }, { id: 'CS', label: 'C.S.' }, { id: 'MP', label: 'M.P.' },
                                                        { id: 'RET', label: 'RET' }
                                                    ].map(h => (
                                                        <label key={h.id} className="flex items-center gap-2 cursor-pointer group">
                                                            <div className="relative flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded checked:bg-armada-navy checked:border-armada-navy transition-all"
                                                                    checked={editForm.allowed_hierarchies.includes(h.id)}
                                                                    onChange={(e) => {
                                                                        const newH = e.target.checked
                                                                            ? [...editForm.allowed_hierarchies, h.id]
                                                                            : editForm.allowed_hierarchies.filter(x => x !== h.id);
                                                                        setEditForm({ ...editForm, allowed_hierarchies: newH });
                                                                    }}
                                                                />
                                                                <Check className="absolute w-3.5 h-3.5 text-armada-gold opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-armada-navy transition-colors">{h.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <p className="text-[8px] text-slate-400 italic mt-1">* Si no selecciona ninguna, todas están permitidas.</p>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                                <button onClick={cancelEditing} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                                                    <X size={20} />
                                                </button>
                                                <button onClick={() => saveCabin(cabin.id)} className="p-2 text-white bg-armada-navy hover:bg-slate-800 rounded-lg shadow-md border border-armada-gold/30 transition-all active:scale-95">
                                                    <Check size={20} className="text-armada-gold" />
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
                                                    {isSuperAdmin && (
                                                        <>
                                                            <button onClick={() => startEditing(cabin)} className="p-1.5 text-slate-400 hover:text-armada-gold hover:bg-slate-50 rounded">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(cabin.id, cabin.identifier)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[11px] font-bold text-slate-400 uppercase">Capacidad: <span className="text-armada-navy font-black">{cabin.capacity}</span></div>
                                                <div className="text-xs font-black uppercase flex items-center gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded-sm tracking-widest ${cabin.status === 'disponible' ? 'bg-green-100 text-green-700' :
                                                        cabin.status === 'en mantenimiento' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {cabin.status}
                                                    </span>
                                                </div>
                                                {cabin.allowed_hierarchies && cabin.allowed_hierarchies.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {cabin.allowed_hierarchies.map(h => (
                                                            <span key={h} className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-[2px] text-[9px] font-black">{h}</span>
                                                        ))}
                                                    </div>
                                                )}
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
                                        value={editForm.capacity === 0 ? '' : editForm.capacity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setEditForm({ ...editForm, capacity: isNaN(val) ? 0 : val });
                                        }}
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
