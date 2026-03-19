import { useState, useEffect } from 'react';
import { ShieldCheck, Users, Home, CalendarX, Activity, LayoutList, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import ReservationsTab from '../components/admin/ReservationsTab';
import UsersTab from '../components/admin/UsersTab';
import CabinsTab from '../components/admin/CabinsTab';
import LocationsTab from '../components/admin/LocationsTab';
import BlockedDatesTab from '../components/admin/BlockedDatesTab';
import LogsTab from '../components/admin/LogsTab';
import EstivalTab from '../components/admin/EstivalTab';



type Tab = 'reservations' | 'users' | 'locations' | 'cabins' | 'blocked_dates' | 'estival_periods' | 'logs';


export default function AdminPanel() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('reservations');
    const [stats, setStats] = useState({ 
        pendingReservationIds: [] as string[], 
        pendingUserIds: [] as string[], 
        cancelledReservationIds: [] as string[] 
    });
    const [viewedItems, setViewedItems] = useState<string[]>([]);

    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        const stored = localStorage.getItem('biena_viewedItems');
        if (stored) setViewedItems(JSON.parse(stored));

        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                console.log("DEBUG: Admin Stats Fetched:", res.data);
                setStats({
                    pendingReservationIds: (res.data.pendingReservationIds || []).map((id: string) => `req_${id}`),
                    cancelledReservationIds: (res.data.cancelledReservationIds || []).map((id: string) => `can_${id}`),
                    pendingUserIds: (res.data.pendingUserIds || []).map((id: string) => `usr_${id}`)
                });
            } catch (error) {
                console.error("Error fetching admin stats:", error);
            }
        };
        fetchStats();
        const intervalId = setInterval(fetchStats, 60000); // Act. cada 1 minuto
        return () => clearInterval(intervalId);
    }, []);

    const markAsViewed = (id: string) => {
        if (!viewedItems.includes(id)) {
            const newViewed = [...viewedItems, id];
            setViewedItems(newViewed);
            localStorage.setItem('biena_viewedItems', JSON.stringify(newViewed));
        }
    };



    const unseenPendingReservations = stats.pendingReservationIds?.filter((id: string) => !viewedItems.includes(id)) || [];
    const unseenPendingUsers = stats.pendingUserIds?.filter((id: string) => !viewedItems.includes(id)) || [];
    const unseenCancelledReservations = stats.cancelledReservationIds?.filter((id: string) => !viewedItems.includes(id)) || [];
    
    // Notificaciones totales para Solicitudes (Pendientes + Anuladas)
    const totalReservationAlerts = unseenPendingReservations.length + unseenCancelledReservations.length;

    return (
        <div className="w-full space-y-8 md:space-y-10 py-4 md:py-8 px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end border-b-4 border-armada-gold pb-6 gap-4 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    <div className="bg-armada-navy p-3 rounded shadow-xl border border-armada-gold/30 shrink-0">
                        <ShieldCheck className="text-armada-gold" size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-armada-navy uppercase tracking-tighter">Estado Mayor de Reservas</h2>
                        <p className="text-slate-500 font-medium text-[10px] md:text-sm uppercase tracking-widest mt-1">Control y Gestión de Viviendas Vacacionales</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <button
                    onClick={() => setActiveTab('reservations')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all relative ${activeTab === 'reservations' ? 'bg-armada-navy text-armada-gold shadow-lg transform -translate-y-1' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        }`}
                >
                    <LayoutList size={16} /> Solicitudes
                    {totalReservationAlerts > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-bold border-2 border-white animate-pulse shadow-md">
                            {totalReservationAlerts}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all relative ${activeTab === 'users' ? 'bg-armada-navy text-armada-gold shadow-lg transform -translate-y-1' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        }`}
                >
                    <Users size={16} /> Usuarios
                    {unseenPendingUsers.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-bold border-2 border-white shadow-md">
                            {unseenPendingUsers.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('cabins')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'cabins' ? 'bg-armada-navy text-armada-gold shadow-lg transform -translate-y-1' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        }`}
                >
                    <Home size={16} /> Unidades
                </button>
                {isSuperAdmin && (
                    <button
                        onClick={() => setActiveTab('locations')}
                        className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'locations' ? 'bg-armada-navy text-armada-gold shadow-lg transform -translate-y-1' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                            }`}
                    >
                        <MapPin size={16} /> Destinos
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('blocked_dates')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'blocked_dates' ? 'bg-armada-navy text-armada-gold shadow-lg transform -translate-y-1' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        }`}
                >
                    <CalendarX size={16} /> Bloqueos
                </button>
                <button
                    onClick={() => setActiveTab('estival_periods' as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'estival_periods' ? 'bg-armada-navy text-armada-gold shadow-lg transform -translate-y-1' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        }`}
                >
                    <Activity size={16} /> Temporadas
                </button>
                {isSuperAdmin && (
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-armada-navy text-armada-gold shadow-lg transform -translate-y-1' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                            }`}
                    >
                        <Activity size={16} /> Auditoría
                    </button>
                )}
            </div>

            <div className="pt-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                {activeTab === 'reservations' && (
                    <ReservationsTab 
                        unseenIds={[...unseenPendingReservations, ...unseenCancelledReservations]} 
                        markAsViewed={markAsViewed}
                    />
                )}
                {activeTab === 'users' && (
                    <UsersTab 
                        unseenIds={unseenPendingUsers} 
                        markAsViewed={markAsViewed} 
                    />
                )}
                {activeTab === 'locations' && isSuperAdmin && <LocationsTab />}
                {activeTab === 'cabins' && <CabinsTab />}
                {activeTab === 'blocked_dates' && <BlockedDatesTab />}
                {activeTab === 'estival_periods' && <EstivalTab />}
                {activeTab === 'logs' && isSuperAdmin && <LogsTab />}
            </div>

            <p className="text-center text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] pt-4 italic">
                Operaciones Logísticas de Bienestar · Armada Nacional de Uruguay
            </p>
        </div>
    );
}
