import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield, Search, RefreshCw, Key, Trash2, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UsersTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'administrador';

    const loadUsers = () => {
        setLoading(true);
        api.get('/users')
            .then(res => setUsers(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        if (!window.confirm(`¿Cambiar estado del usuario a ${newStatus.toUpperCase()}?`)) return;
        try {
            await api.patch(`/users/${id}/status`, { status: newStatus });
            loadUsers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al actualizar usuario');
        }
    };

    const handleRoleUpdate = async (id: string, newRole: string) => {
        if (!window.confirm(`¿Cambiar rol del usuario a ${newRole.toUpperCase()}?`)) return;
        try {
            await api.patch(`/users/${id}/role`, { role: newRole });
            loadUsers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al actualizar rol');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿ELIMINAR DEFINITIVAMENTE ESTE USUARIO? Esta acción no se puede deshacer.')) return;
        try {
            await api.delete(`/users/${id}`);
            loadUsers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al eliminar usuario');
        }
    };

    const [searchType, setSearchType] = useState('todos');

    const filteredUsers = users.filter(u => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;

        const nombreStr = `${u.nombre} ${u.apellido}`.toLowerCase();
        const docStr = `${u.cedula} ${u.legajo}`.toLowerCase();
        const roleStr = u.role.toLowerCase();

        switch (searchType) {
            case 'nombre': return nombreStr.includes(term);
            case 'documento': return docStr.includes(term);
            case 'rol': return roleStr.includes(term);
            default:
                return nombreStr.includes(term) || docStr.includes(term) || roleStr.includes(term);
        }
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded institutional-card">
                <div className="flex-1 flex flex-col md:flex-row gap-3">
                    <select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="border-2 border-slate-100 rounded focus:border-armada-navy px-4 py-3 font-bold text-xs uppercase text-slate-500 outline-none transition-all md:w-48 bg-slate-50/50"
                    >
                        <option value="todos">Todos los campos</option>
                        <option value="nombre">Nombre / Apellido</option>
                        <option value="documento">CI / Legajo</option>
                        <option value="rol">Rol</option>
                    </select>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="BUSCAR EN EL PADRÓN..."
                            className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-xs uppercase tracking-widest"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={loadUsers}
                    className="flex items-center justify-center gap-3 bg-armada-navy text-armada-gold px-6 py-3 rounded font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg border border-armada-gold/30 shrink-0"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> ACTUALIZAR
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map((u) => (
                    <div key={u.id} className="institutional-card p-6 flex flex-col relative group animate-fade-in transition-all hover:border-armada-gold">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest self-start ${u.status === 'aprobado' ? 'bg-green-100 text-green-700' :
                                    u.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {u.status}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">{u.role}</span>
                            </div>
                            {isSuperAdmin && u.id !== currentUser?.id && (
                                <button onClick={() => handleDelete(u.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Eliminar Expediente">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>

                        <div className="mb-4">
                            <h4 className="font-black text-armada-navy uppercase text-sm tracking-tight leading-tight">{u.nombre} {u.apellido}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Shield className="text-armada-gold" size={10} />
                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-tighter">LM: {u.legajo}</span>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6 flex-1">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Mail size={12} className="shrink-0" />
                                <span className="text-[10px] font-medium truncate">{u.correo}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                                <Phone size={12} className="shrink-0" />
                                <span className="text-[10px] font-medium">{u.telefono}</span>
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase mt-2">CI: {u.cedula}</div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                                {u.status === 'pendiente' && (
                                    <button onClick={() => handleStatusUpdate(u.id, 'aprobado')} className="flex-1 text-green-600 hover:bg-green-50 font-black uppercase text-[9px] tracking-widest py-2 border border-green-100 rounded transition-colors">
                                        Autorizar Alta
                                    </button>
                                )}
                                {u.status === 'aprobado' && u.id !== currentUser?.id && (
                                    <button onClick={() => handleStatusUpdate(u.id, 'inactivo')} className="flex-1 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 font-black uppercase text-[9px] tracking-widest py-2 border border-slate-100 rounded transition-colors">
                                        Suspender
                                    </button>
                                )}
                                {u.status === 'inactivo' && (
                                    <button onClick={() => handleStatusUpdate(u.id, 'aprobado')} className="flex-1 text-green-600 hover:bg-green-50 font-black uppercase text-[9px] tracking-widest py-2 border border-green-100 rounded transition-colors">
                                        Reactivar
                                    </button>
                                )}
                            </div>

                            {isSuperAdmin && u.id !== currentUser?.id && (
                                <div className="flex items-center gap-2 pt-1">
                                    <Key size={12} className="text-slate-300" />
                                    <select
                                        value={u.role}
                                        onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                        className="flex-1 text-[9px] font-bold uppercase bg-slate-50 border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-armada-gold transition-all"
                                    >
                                        <option value="usuario">Usuario Base</option>
                                        <option value="administrador_reservas">Admin BIENA</option>
                                        <option value="administrador">Super Admin</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && !loading && (
                <div className="institutional-card py-20 text-center animate-fade-in">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">No se han encontrado expedientes de personal con ese criterio</p>
                </div>
            )}
        </div>
    );
}
