import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ShieldAlert, CheckCircle, User, Mail, Phone, Lock, Hash } from 'lucide-react';
import CompassLogo from '../components/CompassLogo';

export default function Register() {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        cedula: '',
        legajo: '',
        jerarquia: '',
        cuerpo: '',
        correo: '',
        telefono: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Permitir números, backspace, tab, flechas, etc.
        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
        if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/auth/register', formData);
            setShowSuccess(true);
            // window.scrollTo(0, 0); // Opcional: subir al principio
        } catch (err: any) {
            setError(err.response?.data?.error || 'ERROR EN EL REGISTRO DE PERSONAL');
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="flex items-center justify-center min-h-screen py-10 px-4 bg-armada-navy relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-armada-gold/20 to-transparent" />
                    <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-armada-gold blur-[100px]" />
                    <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-armada-gold blur-[100px]" />
                </div>

                <div className="w-full max-w-xl bg-white rounded shadow-2xl p-12 text-center z-10 animate-scale-in border-t-8 border-armada-gold">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-100 p-4 rounded-full">
                            <CheckCircle size={48} className="text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-armada-navy uppercase tracking-tighter mb-4">Solicitud de Alta Enviada</h2>
                    <div className="h-1 w-24 bg-armada-gold mx-auto mb-6" />
                    <p className="text-slate-600 font-bold text-sm uppercase leading-relaxed mb-8">
                        Su registro ha sido procesado exitosamente. <br />
                        <span className="text-armada-navy">Su solicitud será revisada por el Mando Administrativo.</span> <br />
                        Se le enviará un correo electrónico una vez que su acceso haya sido autorizado.
                    </p>
                    <Link
                        to="/login"
                        className="btn-armada inline-flex items-center gap-3 px-8 py-3 text-sm font-black italic tracking-widest"
                    >
                        VOLVER AL INICIO
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen py-10 px-4 bg-armada-navy relative overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-armada-gold/20 to-transparent" />
                <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-armada-gold blur-[100px]" />
                <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-armada-gold blur-[100px]" />
            </div>

            <div className="w-full max-w-2xl bg-white rounded shadow-[0_20px_60px_rgba(0,26,61,0.15)] overflow-hidden border-t-8 border-armada-navy z-10 animate-fade-in">
                <div className="bg-armada-navy p-8 text-center relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm mb-4 border border-white/20">
                            <CompassLogo className="text-armada-gold" size={48} bgColor="white" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Armada Nacional</h2>
                        <div className="h-[2px] w-[260px] bg-armada-gold my-3" />
                        <p className="text-armada-gold-light/70 font-bold text-[10px] uppercase tracking-[0.3em] italic">Portal de Reclutamiento — Registro de Personal</p>
                    </div>
                </div>

                <div className="p-10">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded border-l-4 border-red-500 mb-8 flex items-center gap-3 animate-shake">
                            <ShieldAlert size={20} />
                            <span className="text-xs font-black uppercase tracking-tight">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic ml-1">
                                    <User size={12} className="text-armada-gold" />
                                    Nombres
                                </label>
                                <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50" placeholder="Ej: JUAN PEDRO" />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic ml-1">
                                    <User size={12} className="text-armada-gold" />
                                    Apellidos
                                </label>
                                <input required type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50" placeholder="Ej: PÉREZ" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic ml-1">
                                    <Hash size={12} className="text-armada-gold" />
                                    Cédula de Identidad
                                </label>
                                <input required type="text" name="cedula" value={formData.cedula} onChange={handleChange} onKeyDown={handleNumericKeyDown} className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50" placeholder="Ej: 12345678" />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic ml-1">
                                    <Hash size={12} className="text-armada-gold" />
                                    Nro. de Legajo / Matrícula
                                </label>
                                <input required type="text" name="legajo" value={formData.legajo} onChange={handleChange} onKeyDown={handleNumericKeyDown} className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50" placeholder="Ej: 987654" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic ml-1">
                                    <ShieldAlert size={12} className="text-armada-gold" />
                                    Jerarquía / Grado
                                </label>
                                <select
                                    required
                                    name="jerarquia"
                                    value={formData.jerarquia}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50"
                                >
                                    <option value="">Seleccione jerarquía...</option>
                                    <option value="ALM">Almirante (ALM)</option>
                                    <option value="CA">Contraalmirante (CA)</option>
                                    <option value="CN">Capitán de Navío (CN)</option>
                                    <option value="CF">Capitán de Fragata (CF)</option>
                                    <option value="CC">Capitán de Corbeta (CC)</option>
                                    <option value="TN">Teniente de Navío (TN)</option>
                                    <option value="AN">Alférez de Navío (AN)</option>
                                    <option value="AF">Alférez de Fragata (AF)</option>
                                    <option value="GM">Guardiamarina (GM)</option>
                                    <option value="SOC">Suboficial de Cargo (SOC)</option>
                                    <option value="SOP">Suboficial de Primera (SOP)</option>
                                    <option value="SOS">Suboficial de Segunda (SOS)</option>
                                    <option value="CP">Cabo de Primera (CP)</option>
                                    <option value="CS">Cabo de Segunda (CS)</option>
                                    <option value="MP">Marinero de Primera (MP)</option>
                                    <option value="RET">Retirado (RET)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic ml-1">
                                    <ShieldAlert size={12} className="text-armada-gold" />
                                    Cuerpo
                                </label>
                                <select
                                    required
                                    name="cuerpo"
                                    value={formData.cuerpo}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50"
                                >
                                    <option value="">Seleccione cuerpo...</option>
                                    <option value="CG">Cuerpo General (CG)</option>
                                    <option value="CIME">Ingeniería de Máquinas y Electricidad (CIME)</option>
                                    <option value="CP">Cuerpo de Prefectura (CP)</option>
                                    <option value="CAA">Administración y Abastecimiento (CAA)</option>
                                    <option value="RN">Reserva Naval (RN)</option>
                                    <option value="MED">Servicio de Sanidad (MED)</option>
                                    <option value="CC">Cuerpo Complementario (CC)</option>
                                    <option value="S/C">Sin Cuerpo / Otro (S/C)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic ml-1">
                                    <Mail size={12} className="text-armada-gold" />
                                    Correo Institucional
                                </label>
                                <input required type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50" placeholder="usuario@armada.mil.uy" />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic ml-1">
                                    <Phone size={12} className="text-armada-gold" />
                                    Teléfono de Contacto
                                </label>
                                <input required type="text" name="telefono" value={formData.telefono} onChange={handleChange} onKeyDown={handleNumericKeyDown} className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50" placeholder="Ej: 099123456" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic ml-1">
                                    <Lock size={12} className="text-armada-gold" />
                                    Contraseña de Acceso
                                </label>
                                <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50" />
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded border border-slate-100">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    required
                                    className="w-5 h-5 mt-0.5 text-armada-gold accent-armada-gold bg-white border-slate-300 rounded cursor-pointer"
                                />
                                <label htmlFor="terms" className="text-[11px] font-bold text-armada-navy leading-tight cursor-pointer">
                                    Confirmo que los datos proporcionados son veraces y acepto las <Link to="/terms" target="_blank" className="text-armada-gold underline hover:text-armada-navy transition-colors">Condiciones de Uso</Link> del sistema.
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-armada w-full py-4 mt-4 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <CheckCircle size={20} className="text-armada-gold" />
                            <span className="text-lg font-black italic tracking-widest">
                                {loading ? 'PROCESANDO REGISTRO...' : 'REMITIR SOLICITUD DE ALTA'}
                            </span>
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            ¿YA POSEE CREDENCIALES?{' '}
                            <Link to="/login" className="text-armada-navy hover:text-armada-gold transition-colors underline decoration-armada-gold/30 underline-offset-4 decoration-2">
                                INGRESAR AL SISTEMA
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-6 text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] pointer-events-none">
                Uruguay · Armada Nacional · Servicio de Bienestar
            </div>
        </div>
    );
}
