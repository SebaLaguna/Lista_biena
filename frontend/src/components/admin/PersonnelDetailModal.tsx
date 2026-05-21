import { X, User, Mail, Phone, Shield, Calendar, CreditCard, Hash } from 'lucide-react';

interface PersonnelDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        nombre: string;
        apellido: string;
        jerarquia: string;
        cuerpo?: string | null;
        legajo: string;
        cedula: string;
        correo: string;
        telefono: string;
        role: string;
        status: string;
        created_at?: string;
    } | null;
}

export default function PersonnelDetailModal({ isOpen, onClose, user }: PersonnelDetailModalProps) {
    if (!isOpen || !user) return null;

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'super_admin': return 'Super Administrador';
            case 'admin_biena': return 'Administrador BIENA';
            default: return 'Usuario Base';
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-armada-navy/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-in">
                {/* Header */}
                <div className="bg-armada-navy p-6 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <User size={120} className="text-white" />
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="bg-white/10 p-3 rounded-full border border-white/20 backdrop-blur-sm">
                            <User size={24} className="text-armada-gold" />
                        </div>
                        <div>
                            <h3 className="text-white font-black uppercase tracking-widest text-xl leading-none">Ficha del Funcionario</h3>
                            <p className="text-armada-gold/80 text-xs font-bold uppercase tracking-[0.2em] mt-1">Expediente Digital Armada Nacional</p>
                        </div>
                    </div>
                    
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors relative z-10">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="flex flex-col gap-8">
                        {/* Name and Hierarchy */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-3xl font-black text-armada-navy uppercase tracking-tight leading-tight">
                                    {user.nombre} {user.apellido}
                                </h2>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="bg-slate-800 text-armada-gold px-3 py-1 rounded text-xs font-black border border-armada-gold/30 shadow-sm">
                                        {user.jerarquia || 'S/G'}
                                    </span>
                                    {user.cuerpo && (
                                        <span className="bg-armada-navy/10 text-armada-navy px-3 py-1 rounded text-xs font-black border border-armada-navy/10 shadow-sm">
                                            {user.cuerpo}
                                        </span>
                                    )}
                                    <span className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                        user.status === 'aprobado' ? 'bg-green-50 text-green-700 border-green-200' : 
                                        user.status === 'pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                        'bg-red-50 text-red-700 border-red-200'
                                    } border shadow-sm`}>
                                        {user.status === 'aprobado' ? 'Cuenta Activa / Aprobada' : 
                                         user.status === 'pendiente' ? 'Cuenta en Revisión' : 
                                         user.status === 'inactivo' ? 'Cuenta Suspendida' :
                                         `Estado: ${user.status || 'Desconocido'}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Grid Data */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Hash size={12} /> Legajo Personal
                                </label>
                                <p className="text-armada-navy font-black text-lg uppercase tracking-tight font-mono">{user.legajo}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <CreditCard size={12} /> Cédula Identidad
                                </label>
                                <p className="text-armada-navy font-black text-lg uppercase tracking-tight font-mono">{user.cedula}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Shield size={12} /> Cuerpo
                                </label>
                                <p className="text-slate-600 font-bold text-base uppercase">{user.cuerpo || 'SIN CUERPO'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Shield size={12} /> Rol de Sistema
                                </label>
                                <p className="text-slate-600 font-bold text-base uppercase">{getRoleLabel(user.role)}</p>
                            </div>
                            {user.created_at && (
                                <div className="space-y-1 col-span-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <Calendar size={12} /> Fecha Alta
                                    </label>
                                    <p className="text-slate-600 font-bold text-base uppercase">{new Date(user.created_at).toLocaleDateString()}</p>
                                </div>
                            )}
                        </div>

                        {/* Contact Info */}
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-2 rounded border border-slate-200 text-armada-navy shadow-sm">
                                    <Mail size={16} />
                                </div>
                                <div className="overflow-hidden">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Correo Electrónico</label>
                                    <p className="text-sm font-bold text-armada-navy break-all">{user.correo}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-2 rounded border border-slate-200 text-armada-navy shadow-sm">
                                    <Phone size={16} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Teléfono de Contacto</label>
                                    <p className="text-sm font-bold text-armada-navy">{user.telefono}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="bg-white text-slate-600 px-8 py-3 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-slate-100 border border-slate-200 transition-all shadow-sm"
                    >
                        Cerrar Ficha
                    </button>
                </div>
            </div>
        </div>
    );
}
