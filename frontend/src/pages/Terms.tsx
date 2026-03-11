import { Shield, BookOpen } from 'lucide-react';

export default function Terms() {
    return (
        <div className="w-full max-w-4xl mx-auto py-8 px-4 md:px-8 animate-fade-in-up">
            <header className="border-b-4 border-armada-gold pb-6 mb-8 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="bg-armada-navy p-4 rounded shadow-xl">
                        <BookOpen className="text-armada-gold" size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-armada-navy uppercase tracking-tighter">Condiciones de Uso</h2>
                        <div className="h-0.5 w-16 bg-armada-gold my-2 mx-auto md:mx-0" />
                        <p className="text-slate-500 font-medium text-xs md:text-sm italic uppercase tracking-widest">Sistema de Reservas - Bienestar de la Armada</p>
                    </div>
                </div>
            </header>

            <article className="prose prose-slate max-w-none text-slate-700 space-y-6">
                <section className="bg-white p-6 md:p-8 rounded institutional-card">
                    <h3 className="text-lg font-black text-armada-navy uppercase flex items-center gap-2 mb-4">
                        <Shield className="text-armada-gold" size={20} />
                        1. Aceptación de los Términos
                    </h3>
                    <p className="leading-relaxed text-sm md:text-base">
                        Al utilizar este Sistema de Reservas, el usuario acepta todas las condiciones estipuladas por la Dirección de Bienestar de la Armada Nacional. El incumplimiento de cualquiera de estas normas puede derivar en la cancelación inmediata de la reserva y posibles sanciones administrativas.
                    </p>
                </section>

                <section className="bg-white p-6 md:p-8 rounded institutional-card">
                    <h3 className="text-lg font-black text-armada-navy uppercase flex items-center gap-2 mb-4">
                        <Shield className="text-armada-gold" size={20} />
                        2. Uso de Unidades Habitacionales
                    </h3>
                    <p className="leading-relaxed text-sm md:text-base">
                        Las cabañas son propiedad del Estado Uruguayo y deben cuidarse rigurosamente. Cualquier daño o faltante reportado durante el inventario de salida será responsabilidad del funcionario que solicitó la reserva.
                    </p>
                    <ul className="list-disc pl-5 mt-4 space-y-2 text-sm md:text-base">
                        <li>Está terminantemente prohibido superar la capacidad máxima de ocupantes de la cabaña.</li>
                        <li>No se admiten reservas para terceros no vinculados familiarmente de manera directa con el funcionario.</li>
                        <li>Las reservas pueden cancelarse por disposición de la Superioridad en caso de necesidades del servicio.</li>
                    </ul>
                </section>

                <section className="bg-white p-6 md:p-8 rounded institutional-card">
                    <h3 className="text-lg font-black text-armada-navy uppercase flex items-center gap-2 mb-4">
                        <Shield className="text-armada-gold" size={20} />
                        3. Aprobación y Cancelación
                    </h3>
                    <p className="leading-relaxed text-sm md:text-base">
                        Toda solicitud de reserva se encuentra en estado <b>"Pendiente"</b> hasta ser analizada y aprobada por los administradores de BIENA. No se considera válida ninguna reserva sin la previa notificación formal de su estado aprobado.
                    </p>
                </section>

                <p className="text-xs text-slate-400 font-medium text-center italic mt-8">
                    Última actualización: Marzo 2026. Este documento es editable por el Administrador de BIENA a partir de futuras gestiones de contenido.
                </p>
            </article>
        </div>
    );
}
