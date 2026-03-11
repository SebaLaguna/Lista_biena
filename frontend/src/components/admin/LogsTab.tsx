import { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, Clock, Search } from 'lucide-react';

export default function LogsTab() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('todos');

    useEffect(() => {
        api.get('/logs')
            .then(res => setLogs(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filteredLogs = logs.filter(log => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;

        const dateStr = format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es }).toLowerCase();
        const operatorStr = `${log.user.nombre} ${log.user.apellido} ${log.user.legajo}`.toLowerCase();
        const actionStr = log.action.toLowerCase();
        const entityStr = log.entity_type.toLowerCase();

        switch (searchType) {
            case 'fecha': return dateStr.includes(term);
            case 'operador': return operatorStr.includes(term);
            case 'accion': return actionStr.includes(term);
            case 'entidad': return entityStr.includes(term);
            default:
                return dateStr.includes(term) || operatorStr.includes(term) || actionStr.includes(term) || entityStr.includes(term);
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
                        <option value="fecha">Fecha/Hora</option>
                        <option value="operador">Operador (Nombre/Legajo)</option>
                        <option value="accion">Acción Registrada</option>
                        <option value="entidad">Entidad Modificada</option>
                    </select>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="BUSCAR EN LA AUDITORÍA..."
                            className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-xs uppercase tracking-widest"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="institutional-card overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                    <Activity size={20} className="text-armada-gold" />
                    <div>
                        <h3 className="text-sm font-black text-armada-navy uppercase tracking-widest">Auditoría del Sistema</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Acceso Exclusivo Super Administrador</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Fecha/Hora</th>
                                <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Operador</th>
                                <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Acción</th>
                                <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Entidad Mód.</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Clock size={12} className="text-slate-400" />
                                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="text-xs font-black text-armada-navy uppercase">{log.user.nombre} {log.user.apellido}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">L: {log.user.legajo} | Rol: {log.user.role}</div>
                                    </td>
                                    <td className="px-5 py-4 text-xs font-bold text-slate-700 uppercase">
                                        {log.action}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-[10px] text-slate-500 uppercase font-bold">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded">{log.entity_type} <span className="opacity-50">#{log.entity_id}</span></span>
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                        No hay registros en el historial.
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
