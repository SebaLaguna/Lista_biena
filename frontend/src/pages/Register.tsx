import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Anchor, ShieldAlert, CheckCircle, User, Mail, Phone, Lock, Hash } from 'lucide-react';

export default function Register() {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        cedula: '',
        legajo: '',
        correo: '',
        telefono: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/auth/register', formData);
            navigate('/login', { state: { message: 'REGISTRO PROCESADO. DEBE SER AUTORIZADO POR EL ADMINISTRADOR.' } });
        } catch (err: any) {
            setError(err.response?.data?.error || 'ERROR EN EL REGISTRO DE PERSONAL');
        } finally {
            setLoading(false);
        }
    };

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
                            <Anchor className="text-armada-gold" size={32} />
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
                                <input required type="text" name="cedula" value={formData.cedula} onChange={handleChange} className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50" placeholder="Ej: 1.234.567-8" />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic ml-1">
                                    <Hash size={12} className="text-armada-gold" />
                                    Nro. de Legajo
                                </label>
                                <input required type="text" name="legajo" value={formData.legajo} onChange={handleChange} className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50" placeholder="Ej: 987654" />
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
                                <input required type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50" placeholder="Ej: 099 123 456" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-armada-navy uppercase tracking-widest italic ml-1">
                                <Lock size={12} className="text-armada-gold" />
                                Contraseña de Acceso
                            </label>
                            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 border-2 border-slate-100 rounded focus:border-armada-navy outline-none transition-all font-bold text-sm bg-slate-50/50" />
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
