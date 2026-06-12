import { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, Clock, Search, RefreshCw, Download } from 'lucide-react';

export default function LogsTab() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('todos');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedActions, setSelectedActions] = useState<string[]>([]);
    const [selectedEntities, setSelectedEntities] = useState<string[]>([]);

    const actionTypes = ["LOGIN", "CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT", "CANCEL"];
    const entities = ["User", "Reservation", "Cabin", "Location", "BlockedDate", "EstivalPeriod"];

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = () => {
        setLoading(true);
        api.get('/logs')
            .then(res => setLogs(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const exportToCSV = () => {
        if (filteredLogs.length === 0) return alert("No hay datos para exportar");

        const headers = ["Fecha", "Hora", "Operador", "Legajo", "Rol", "Accion", "Entidad", "ID Entidad", "Detalles"];
        
        const rows = filteredLogs.map(log => [
            format(new Date(log.created_at), "dd/MM/yyyy"),
            format(new Date(log.created_at), "HH:mm:ss"),
            log.user ? `"${log.user.nombre} ${log.user.apellido}"` : `"SISTEMA"`,
            log.user ? log.user.legajo : "N/A",
            log.user ? log.user.role : "SISTEMA",
            log.action,
            log.entity_type,
            log.entity_id,
            `"${log.details?.replace(/"/g, '""') || ''}"`
        ]);
        
        const csvContent = [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
        const blob = new Blob(["\uFEFF"+csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `auditoria_biena_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleActionsToggle = (a: string) => {
        setSelectedActions(prev => 
            prev.includes(a) ? prev.filter(item => item !== a) : [...prev, a]
        );
    };

    const handleEntitiesToggle = (e: string) => {
        setSelectedEntities(prev => 
            prev.includes(e) ? prev.filter(item => item !== e) : [...prev, e]
        );
    };

    const filteredLogs = logs.filter(log => {
        const term = searchTerm.toLowerCase();
        const logDate = new Date(log.created_at);

        // Date Range Filter (Always active if dates are set)
        if (startDate && logDate < new Date(startDate)) return false;
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (logDate > end) return false;
        }

        // Filtro por tipo de buscador principal
        if (searchType === 'todos' || searchType === 'operador') {
            if (term) {
                const operatorStr = log.user
                    ? `${log.user.nombre} ${log.user.apellido} ${log.user.legajo}`.toLowerCase()
                    : "sistema";
                if (!operatorStr.includes(term)) return false;
            }
        }

        // Filtro especializado: Acción
        if (searchType === 'accion' && selectedActions.length > 0) {
            const actionMatch = selectedActions.some(a => log.action.toUpperCase().includes(a));
            if (!actionMatch) return false;
        }

        // Filtro especializado: Entidad
        if (searchType === 'entidad' && selectedEntities.length > 0) {
            if (!selectedEntities.includes(log.entity_type)) return false;
        }

        return true;
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white p-6 rounded institutional-card shadow-sm border border-slate-100">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex flex-col gap-1 md:w-64">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Criterio de Auditoría</label>
                            <select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                                className="border-2 border-slate-100 rounded focus:border-armada-navy px-4 py-2.5 font-bold text-xs uppercase text-armada-navy outline-none transition-all w-full bg-slate-50/50"
                            >
                                <option value="todos">Todos los registros</option>
                                <option value="operador">Operador (Nombre/Legajo)</option>
                                <option value="accion">Tipo de Acción</option>
                                <option value="entidad">Entidad Afectada</option>
                                <option value="fecha">Rango de Fechas</option>
                            </select>
                        </div>

                        {(searchType === 'todos' || searchType === 'operador') && (
                            <div className="flex-1 flex flex-col gap-1 w-full animate-fade-in">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar por Operador</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="EJ: PÉREZ, 1234567..."
                                        className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-black text-xs uppercase tracking-widest bg-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {searchType === 'fecha' && (
                            <div className="flex-1 flex flex-col md:flex-row gap-4 w-full animate-fade-in">
                                <div className="flex-1 flex flex-col gap-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-[11px]"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-[11px]"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 self-end">
                            <button
                                onClick={exportToCSV}
                                className="bg-emerald-600 text-white px-4 md:px-6 py-3 rounded font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg border border-emerald-400/50 shrink-0 flex items-center gap-2"
                                title="Exportar Vista Actual a CSV (Reporte para Excel)"
                            >
                                <Download size={16} /> <span className="hidden md:inline">EXPORTAR CSV</span>
                            </button>
                            <button
                                onClick={loadLogs}
                                className="bg-armada-navy text-armada-gold px-4 md:px-6 py-3 rounded font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg border border-armada-gold/30 shrink-0 flex items-center gap-2"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> <span className="hidden md:inline">ACTUALIZAR</span>
                            </button>
                            {(searchTerm || startDate || endDate || selectedActions.length > 0 || selectedEntities.length > 0) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStartDate('');
                                        setEndDate('');
                                        setSelectedActions([]);
                                        setSelectedEntities([]);
                                    }}
                                    className="px-4 py-3 rounded font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {searchType === 'accion' && (
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded border border-slate-100 animate-fade-in-up">
                            <div className="w-full mb-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Filtrar por Acciones:</span>
                            </div>
                            {actionTypes.map(a => (
                                <button
                                    key={a}
                                    onClick={() => handleActionsToggle(a)}
                                    className={`px-3 py-1.5 rounded text-[10px] font-black transition-all border ${selectedActions.includes(a)
                                        ? 'bg-armada-gold text-armada-navy border-armada-gold shadow-md scale-105'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-armada-gold'
                                        }`}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    )}

                    {searchType === 'entidad' && (
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded border border-slate-100 animate-fade-in-up">
                            <div className="w-full mb-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Filtrar por Entidades:</span>
                            </div>
                            {entities.map(e => (
                                <button
                                    key={e}
                                    onClick={() => handleEntitiesToggle(e)}
                                    className={`px-3 py-1.5 rounded text-[10px] font-black transition-all border ${selectedEntities.includes(e)
                                        ? 'bg-armada-gold text-armada-navy border-armada-gold shadow-md scale-105'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-armada-gold'
                                        }`}
                                >
                                    {e.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="institutional-card overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Activity size={20} className="text-armada-gold" />
                        <div>
                            <h3 className="text-sm font-black text-armada-navy uppercase tracking-widest">Auditoría del Sistema</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Acceso Exclusivo Super Administrador</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registros:</span>
                        <span className="bg-armada-navy text-armada-gold px-2 py-0.5 rounded text-xs font-black border border-armada-gold/20 shadow-sm">
                            {filteredLogs.length} / {logs.length}
                        </span>
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
                                    <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Clock size={14} className="text-slate-400" />
                                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="text-xs font-black text-armada-navy uppercase">{log.user ? `${log.user.nombre} ${log.user.apellido}` : 'SISTEMA'}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">L: {log.user ? log.user.legajo : 'N/A'} | Rol: {log.user ? log.user.role : 'SISTEMA'}</div>
                                    </td>
                                    <td className="px-5 py-4 text-xs font-bold text-slate-700 uppercase">
                                        {log.action}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 uppercase font-bold">
                                        <span className="bg-slate-100 px-2 py-1 rounded">{log.entity_type} <span className="opacity-50">#{log.entity_id}</span></span>
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
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
