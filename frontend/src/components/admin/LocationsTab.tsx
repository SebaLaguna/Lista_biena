import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Location {
    id: string;
    name: string;
    description: string;
    mando?: 'COMFLO' | 'DIMAT' | 'PRENA' | null;
    _count?: {
        cabins: number;
    };
}

export default function LocationsTab() {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingLoc, setEditingLoc] = useState<Location | null>(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        mando: ''
    });

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/locations');
            setLocations(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingLoc) {
                await api.patch(`/admin/locations/${editingLoc.id}`, formData);
            } else {
                await api.post('/admin/locations', formData);
            }

            setShowModal(false);
            setFormData({ name: '', description: '', mando: '' });
            setEditingLoc(null);
            fetchLocations();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al procesar la solicitud');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Está seguro de eliminar la sede "${name}"? Esta acción no se puede deshacer y fallará si existen unidades asociadas.`)) return;

        try {
            await api.delete(`/admin/locations/${id}`);
            fetchLocations();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al eliminar');
        }
    };

    const filteredLocations = locations.filter(loc =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {isSuperAdmin && (
                <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded institutional-card">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="BUSCAR DESTINO NAVAL / SEDE..."
                            className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm uppercase tracking-widest"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingLoc(null);
                            setFormData({ name: '', description: '', mando: '' });
                            setShowModal(true);
                        }}
                        className="flex items-center justify-center gap-3 bg-armada-navy text-armada-gold px-6 py-3 rounded font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg border border-armada-gold/30 shrink-0"
                    >
                        <Plus size={18} /> AGREGAR DESTINO
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-armada-navy" size={40} />
                    <p className="font-black text-armada-navy text-sm uppercase tracking-[0.3em]">Cargando Inventario Territorial...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {filteredLocations.map(loc => (
                        <div key={loc.id} className="bg-white rounded institutional-card group border-l-4 border-armada-navy">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-slate-50 rounded">
                                        <MapPin className="text-armada-navy" size={24} />
                                    </div>
                                    {isSuperAdmin && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingLoc(loc);
                                                    setFormData({ name: loc.name, description: loc.description, mando: loc.mando || '' });
                                                    setShowModal(true);
                                                }}
                                                className="p-3 text-slate-400 hover:text-armada-navy transition-colors bg-slate-50 hover:bg-slate-100 rounded-lg"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(loc.id, loc.name)}
                                                className="p-3 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <h4 className="font-black text-armada-navy uppercase tracking-tighter text-xl mb-1">{loc.name}</h4>
                                <p className="text-sm text-slate-500 font-bold mb-4 line-clamp-2">{loc.description}</p>
                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                                    <span>CABANAS REGISTRADAS</span>
                                    <span className="bg-armada-navy text-armada-gold px-3 py-1 rounded-full">{loc._count?.cabins || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-armada-navy/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded shadow-2xl overflow-hidden border-2 border-armada-navy">
                        <div className="bg-armada-navy p-6 flex justify-between items-center">
                            <h3 className="text-armada-gold font-black uppercase tracking-widest italic">{editingLoc ? 'EDITAR DESTINO' : 'NUEVO DESTINO NAVAL'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-white hover:text-armada-gold transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-700 p-4 rounded flex items-center gap-3 border border-red-100">
                                    <AlertCircle size={18} />
                                    <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-armada-navy uppercase tracking-widest italic block">Nombre de la Sede</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: BAEN, SANTA TERESA..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-armada-navy uppercase tracking-widest italic block">Descripción</label>
                                <textarea
                                    className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50 h-32 resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detalles sobre la ubicación..."
                                />
                            </div>


                            <button
                                type="submit"
                                className="w-full bg-armada-navy text-armada-gold py-4 rounded font-black text-sm uppercase tracking-[0.2em] transition-all hover:shadow-xl active:scale-[0.98] mt-4"
                            >
                                {editingLoc ? 'ACTUALIZAR SEDE' : 'REGISTRAR SEDE'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
