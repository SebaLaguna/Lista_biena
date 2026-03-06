import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Anchor, ShieldCheck, Mail, Lock, ChevronRight, Loader2 } from 'lucide-react';

export default function Login() {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { correo, password });
            login(response.data.token, response.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-armada-navy relative overflow-hidden font-sans p-6">
            {/* Elementos decorativos de fondo */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-armada-gold/20 to-transparent" />
                <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-armada-gold blur-[100px]" />
                <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-armada-gold blur-[100px]" />
            </div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-white mb-6 border-[6px] border-armada-gold shadow-[0_0_50px_rgba(212,175,55,0.3)] animate-fade-in">
                        <Anchor size={56} className="text-armada-navy" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-[0.2em] uppercase mb-1 drop-shadow-lg">Armada Nacional</h1>
                    <div className="h-[2px] w-[260px] bg-armada-gold mx-auto mb-3" />
                    <p className="text-armada-gold-light/70 font-semibold uppercase text-[10px] tracking-[0.15em]">SISTEMA DE RESERVAS DE VIVIENDAS VACACIONALES</p>
                </div>

                <div className="institutional-card overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-8 py-5 flex items-center gap-3">
                        <ShieldCheck size={24} className="text-armada-gold" />
                        <h2 className="text-lg font-bold text-armada-navy uppercase tracking-wider">Acceso al Portal</h2>
                    </div>

                    <div className="p-8 sm:p-10 bg-white">
                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-8 text-sm border-l-4 border-red-500 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Correo Institucional</label>
                                <div className="relative group">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-armada-gold transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-armada-gold/20 focus:border-armada-gold outline-none transition-all text-armada-navy font-medium placeholder:text-slate-300"
                                        placeholder="ejemplo@armada.mil.uy"
                                        value={correo}
                                        onChange={(e) => setCorreo(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Contraseña</label>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-armada-gold transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-armada-gold/20 focus:border-armada-gold outline-none transition-all text-armada-navy font-medium placeholder:text-slate-300"
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-armada flex items-center justify-center gap-3 group py-4 mt-4 shadow-lg shadow-armada-navy/20 disabled:opacity-70"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <span className="tracking-[0.15em] font-black italic">ENTRAR AL PORTAL</span>
                                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform text-armada-gold" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-400 font-medium">
                                ¿No posee una cuenta aún? {' '}
                                <Link to="/register" className="text-armada-navy font-bold hover:text-armada-gold transition-colors underline underline-offset-4 decoration-armada-gold/30">
                                    Regístrese aquí
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-8 text-white/30 text-[9px] font-black uppercase tracking-[0.3em] font-sans">
                    Fuerza de Mar · Protectora de la Soberanía Nacional
                </p>
            </div>
        </div>
    );
}
