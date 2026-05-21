import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, ShieldCheck, Menu, X, User } from 'lucide-react';
import CompassLogo from './CompassLogo';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMenuOpen(false);
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    if (!user) return null;

    const isAdmin = user.role === 'super_admin' || user.role === 'admin_biena';

    const navLinks = [];
    if (user.role !== 'admin_biena') {
        navLinks.push({ to: "/reserve", icon: <CompassLogo size={18} bgColor="transparent" />, label: "NUEVA RESERVA" });
        navLinks.push({ to: "/my-reservations", icon: <LayoutDashboard size={18} />, label: "MIS RESERVAS" });
    }

    if (isAdmin) {
        navLinks.push({ to: "/admin", icon: <ShieldCheck size={18} />, label: "PANEL ADMINISTRATIVO" });
    }

    return (
        <nav className="bg-armada-navy text-white border-b-2 border-armada-gold sticky top-0 z-50 shadow-2xl">
            <div className="w-full px-4 sm:px-6 lg:px-10">
                <div className="flex justify-between h-20">
                    <div className="flex items-center">
                        <Link to="/dashboard" className="flex items-center gap-3 group">
                            <div className="bg-white p-2 rounded-full border-2 border-armada-gold group-hover:scale-110 transition-transform">
                                <CompassLogo size={22} className="text-armada-navy" bgColor="white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-sm tracking-[0.2em] uppercase leading-none">Armada Nacional</span>
                                <span className="text-[10px] text-armada-gold font-bold uppercase tracking-widest mt-1">Uruguay</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden lg:flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:text-armada-gold transition-colors border-r border-white/5 last:border-0 ${link.label === 'PANEL ADMINISTRATIVO' ? 'text-[#facc15]' : ''}`}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 bg-white/5 pl-6 rounded-full border border-white/10 py-1 pr-1">
                            <div className="flex flex-col items-end">
                                <span className="text-[11px] font-black uppercase tracking-wider">{user.nombre} {user.apellido}</span>
                                <span className="text-[9px] text-armada-gold italic tracking-tight font-medium capitalize opacity-80">{user.role}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-red-500 transition-colors group"
                                title="Cerrar sesión Oficial"
                            >
                                <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center">
                        <button
                            onClick={toggleMenu}
                            className="p-2 rounded-md text-white hover:bg-white/10 transition-colors"
                        >
                            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="lg:hidden bg-armada-navy border-t border-white/10 animate-fade-in shadow-inner">
                    <div className="px-4 py-6 space-y-4">
                        <div className="flex items-center gap-4 px-4 pb-6 border-b border-white/10">
                            <div className="w-12 h-12 flex items-center justify-center bg-armada-gold/20 rounded-full border border-armada-gold/30">
                                <User className="text-armada-gold" size={24} />
                            </div>
                            <div>
                                <div className="text-sm font-black uppercase tracking-tight">{user.nombre} {user.apellido}</div>
                                <div className="text-[10px] font-bold text-armada-gold uppercase tracking-[0.2em]">{user.role}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 px-4 py-4 rounded font-black text-xs tracking-[0.2em] hover:bg-white/5 hover:text-armada-gold transition-all uppercase"
                                >
                                    <span className="text-armada-gold">{link.icon}</span>
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-4 w-full px-4 py-4 rounded font-black text-xs tracking-[0.2em] text-red-400 hover:bg-red-500/10 transition-all uppercase"
                            >
                                <LogOut size={18} />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
