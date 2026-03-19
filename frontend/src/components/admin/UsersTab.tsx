import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield, Search, RefreshCw, Key, Trash2, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UsersTabProps {
    unseenIds?: string[];
    markAsViewed?: (id: string) => void;
}

export default function UsersTab({ unseenIds = [], markAsViewed = () => {} }: UsersTabProps) {
    const [usersList, setUsersList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('todos');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedHierarchies, setSelectedHierarchies] = useState<string[]>([]);
    const [onlyNew, setOnlyNew] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'super_admin';

    const loadUsers = () => {
        setLoading(true);
        api.get('/users')
            .then(res => setUsersList(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        if (!window.confirm(`¿Cambiar estado del usuario a ${newStatus.toUpperCase()}?`)) return;
        setActionLoading(id);
        try {
            await api.patch(`/users/${id}/status`, { status: newStatus });
            loadUsers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al actualizar usuario');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleUpdate = async (id: string, newRole: string) => {
        if (!window.confirm(`¿Cambiar rol del usuario a ${newRole.toUpperCase()}?`)) return;
        setActionLoading(id);
        try {
            await api.patch(`/users/${id}/role`, { role: newRole });
            loadUsers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al actualizar rol');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿ELIMINAR DEFINITIVAMENTE ESTE USUARIO? Esta acción no se puede deshacer.')) return;
        setActionLoading(id);
        try {
            await api.delete(`/users/${id}`);
            loadUsers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al eliminar usuario');
        } finally {
            setActionLoading(null);
        }
    };

    const handleStatusToggle = (status: string) => {
        setSelectedStatuses(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const handleRoleToggle = (role: string) => {
        setSelectedRoles(prev => 
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleHierarchyToggle = (hie: string) => {
        setSelectedHierarchies(prev => 
            prev.includes(hie) ? prev.filter(h => h !== hie) : [...prev, hie]
        );
    };

    const filteredUsers = usersList.filter(u => {
        // 1. Estados (Dashboard persistente)
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(u.status)) return false;

        // 2. Roles (Dashboard persistente)
        if (selectedRoles.length > 0 && !selectedRoles.includes(u.role)) return false;

        // 3. Jerarquías (Dashboard persistente)
        if (selectedHierarchies.length > 0 && !selectedHierarchies.includes(u.jerarquia)) return false;

        // 4. Solo Nuevos (Globito rojo)
        if (onlyNew && !unseenIds.includes(`usr_${u.id}`)) return false;

        // 5. Búsqueda por Texto
        const term = searchTerm.toLowerCase();
        if (!term) return true;

        const nombreStr = `${u.nombre} ${u.apellido} ${u.jerarquia}`.toLowerCase();
        const docStr = `${u.cedula} ${u.legajo}`.toLowerCase();

        switch (searchType) {
            case 'nombre': return nombreStr.includes(term);
            case 'documento': return docStr.includes(term);
            default:
                return nombreStr.includes(term) || docStr.includes(term);
        }
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* DASHBOARD DE FILTROS PERSISTENTES */}
            <div className="bg-white p-6 rounded institutional-card shadow-sm border border-slate-100">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-100">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de los Usuarios</label>
                            <div className="flex flex-wrap gap-2 items-center">
                                {[
                                    {id: 'aprobado', label: 'Aprobados', color: 'bg-green-100 text-green-700 border-green-500'},
                                    {id: 'pendiente', label: 'Pendientes', color: 'bg-yellow-100 text-yellow-700 border-yellow-500'},
                                    {id: 'inactivo', label: 'Inactivos', color: 'bg-slate-200 text-slate-600 border-slate-400'}
                                ].map(st => (
                                    <button
                                        key={st.id}
                                        onClick={() => handleStatusToggle(st.id)}
                                        className={`px-4 py-2.5 rounded text-[10px] font-black transition-all border uppercase tracking-wider ${selectedStatuses.includes(st.id) ? st.color + ' shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-armada-gold'}`}
                                    >
                                        {st.label}
                                    </button>
                                ))}

                                <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>

                                <button
                                    onClick={() => setOnlyNew(!onlyNew)}
                                    className={`px-4 py-2.5 rounded text-[9px] font-black transition-all border uppercase tracking-widest flex items-center gap-2 ${onlyNew ? 'bg-red-500 text-white border-red-600 shadow-md transform scale-105' : 'bg-white text-slate-400 border-slate-200 hover:border-red-500'}`}
                                    title="Ver solo usuarios con notificaciones pendientes"
                                >
                                    <div className={`w-2 h-2 rounded-full ${onlyNew ? 'bg-white animate-pulse' : 'bg-red-500'}`}></div>
                                    Solo Nuevos
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Rol</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    {id: 'super_admin', label: 'Super Admin', color: 'bg-armada-navy text-armada-gold border-armada-gold font-black'},
                                    {id: 'admin_biena', label: 'Admin BIENA', color: 'bg-blue-100 text-blue-700 border-blue-500'},
                                    {id: 'common_user', label: 'Usuario', color: 'bg-slate-100 text-slate-600 border-slate-400'}
                                ].map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => handleRoleToggle(r.id)}
                                        className={`px-4 py-2.5 rounded text-[10px] font-black transition-all border uppercase tracking-wider ${selectedRoles.includes(r.id) ? r.color + ' shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-armada-gold'}`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Jerarquía</label>
                        <div className="flex flex-wrap gap-2 content-start h-full max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                            {['ALM', 'CA', 'CN', 'CF', 'CC', 'TN', 'AN', 'AF', 'GM', 'SOC', 'SOP', 'SOS', 'CP', 'CS', 'MP', 'RET'].map(h => (
                                <button
                                    key={h}
                                    onClick={() => handleHierarchyToggle(h)}
                                    className={`px-3 py-1.5 rounded text-[9px] font-black transition-all border ${selectedHierarchies.includes(h) ? 'bg-slate-800 text-white border-armada-gold shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-armada-navy'}`}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* BARRA DE BÚSQUEDA DE TEXTO */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex flex-col gap-1 w-full md:w-64">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar por Campo</label>
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="border-2 border-slate-100 rounded focus:border-armada-navy px-4 py-2.5 font-bold text-[11px] uppercase text-slate-500 outline-none transition-all bg-slate-50/50"
                        >
                            <option value="todos">Cualquier Campo</option>
                            <option value="nombre">Nombre / Apellido</option>
                            <option value="documento">CI / Legajo</option>
                        </select>
                    </div>

                    <div className="flex-1 flex flex-col gap-1 w-full">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Término de Búsqueda</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="ESCRIBA PARA BUSCAR..."
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-black text-[11px] uppercase tracking-widest bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 self-end shrink-0 pb-1">
                        <button
                            onClick={loadUsers}
                            className="flex items-center justify-center gap-2 bg-armada-navy text-armada-gold px-6 py-2.5 rounded font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow border border-armada-gold/30 shrink-0"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> REFRESCAR
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map((u) => {
                    const isUnseen = unseenIds.includes(`usr_${u.id}`);
                    return (
                    <div
                        key={u.id}
                        className="institutional-card p-6 flex flex-col relative group animate-fade-in transition-all hover:border-armada-gold"
                        onMouseEnter={() => {
                            if (isUnseen && markAsViewed) markAsViewed(`usr_${u.id}`);
                        }}
                    >
                        {isUnseen && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center animate-pulse z-10"></div>
                        )}
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
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="bg-slate-800 text-armada-gold px-1.5 py-0.5 rounded text-[9px] font-black border border-armada-gold/30">{u.jerarquia || 'S/G'}</span>
                                <div className="flex items-center gap-1">
                                    <Shield className="text-slate-400" size={10} />
                                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-tighter">LM: {u.legajo}</span>
                                </div>
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
                                    <button onClick={() => handleStatusUpdate(u.id, 'aprobado')} disabled={actionLoading === u.id} className="flex-1 text-green-600 hover:bg-green-50 font-black uppercase text-[9px] tracking-widest py-2 border border-green-100 rounded transition-colors disabled:opacity-50">
                                        Autorizar Alta
                                    </button>
                                )}
                                {u.status === 'aprobado' && u.id !== currentUser?.id && (
                                    <button onClick={() => handleStatusUpdate(u.id, 'inactivo')} disabled={actionLoading === u.id} className="flex-1 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 font-black uppercase text-[9px] tracking-widest py-2 border border-slate-100 rounded transition-colors disabled:opacity-50">
                                        Suspender
                                    </button>
                                )}
                                {u.status === 'inactivo' && (
                                    <button onClick={() => handleStatusUpdate(u.id, 'aprobado')} disabled={actionLoading === u.id} className="flex-1 text-green-600 hover:bg-green-50 font-black uppercase text-[9px] tracking-widest py-2 border border-green-100 rounded transition-colors disabled:opacity-50">
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
                                        disabled={actionLoading === u.id}
                                        className="flex-1 text-[9px] font-bold uppercase bg-slate-50 border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-armada-gold transition-all disabled:opacity-50"
                                    >
                                        <option value="common_user">Usuario Base</option>
                                        <option value="admin_biena">Admin BIENA</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            </div>

            {filteredUsers.length === 0 && !loading && (
                <div className="institutional-card py-20 text-center animate-fade-in">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">No se han encontrado expedientes de personal con ese criterio</p>
                </div>
            )}
        </div>
    );
}
