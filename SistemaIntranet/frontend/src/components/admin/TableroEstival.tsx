import { useState, useEffect } from 'react';
import { 
    Search, 
    Loader2, 
    AlertCircle, 
    Home, 
    Users, 
    Calendar, 
    X, 
    Check, 
    FileText 
} from 'lucide-react';
import api from '../../services/api';

interface User {
    id: string;
    nombre: string;
    apellido: string;
    cedula: string;
    legajo: string;
    jerarquia: string;
    cuerpo?: string | null;
    correo: string;
    telefono?: string | null;
    role: string;
    status: string;
}

interface Cabin {
    id: string;
    location_id: string;
    identifier: string;
    capacity?: number | null;
    status: string;
    location?: {
        id: string;
        name: string;
    };
}

interface Reservation {
    id: string;
    user_id: string;
    cabin_id?: string | null;
    location_id?: string | null;
    start_date: string;
    end_date: string;
    occupants: number;
    status: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
    priority?: number | null;
    application_group?: string | null;
    comments?: string | null;
    user: User;
    cabin?: Cabin | null;
    location?: {
        id: string;
        name: string;
    } | null;
}

interface Location {
    id: string;
    name: string;
    description?: string | null;
}

interface EstivalPeriod {
    id: string;
    start_date: string;
    end_date: string;
    description?: string | null;
}

// Timezone-safe date parser
const parseUTCDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
};

const formatDateShort = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
};

const formatDateFull = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export default function TableroEstival() {
    // UI state
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [cabins, setCabins] = useState<Cabin[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [estivalPeriods, setEstivalPeriods] = useState<EstivalPeriod[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Drag states
    const [draggedOverCell, setDraggedOverCell] = useState<{ cabinId: string; weekTime: number } | null>(null);
    const [draggedOverSuplenteWeek, setDraggedOverSuplenteWeek] = useState<number | null>(null);
    const [draggedOverSidebar, setDraggedOverSidebar] = useState(false);

    // Load static and transactional details
    const loadInitialData = async () => {
        setLoading(true);
        setError('');
        try {
            const [locsRes, periodsRes] = await Promise.all([
                api.get('/admin/locations'),
                api.get('/reservations/estival-periods')
            ]);
            
            setLocations(locsRes.data);
            setEstivalPeriods(periodsRes.data);

            if (locsRes.data.length > 0) {
                // Default to first location
                setSelectedLocationId(locsRes.data[0].id);
            }
        } catch (err: any) {
            console.error(err);
            setError('Error cargando los datos iniciales del planificador.');
        } finally {
            setLoading(false);
        }
    };

    // Load cabins and reservations for chosen location
    const loadLocationData = async () => {
        if (!selectedLocationId) return;
        setLoading(true);
        setError('');
        try {
            const [cabinsRes, resRes] = await Promise.all([
                api.get('/cabins'),
                api.get('/reservations/admin')
            ]);

            // Filter cabins by location
            const filteredCabins = cabinsRes.data.filter((c: Cabin) => c.location_id === selectedLocationId);
            setCabins(filteredCabins);
            
            // All reservations are saved in state; we will filter them in helper selectors
            setReservations(resRes.data);
        } catch (err: any) {
            console.error(err);
            setError('Error cargando las cabañas y solicitudes de la sede.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadLocationData();
    }, [selectedLocationId]);

    // Calculate all Mondays in the active estival periods
    const estivalWeeks = getEstivalWeeks(estivalPeriods);

    function getEstivalWeeks(periods: EstivalPeriod[]) {
        const weeks: Date[] = [];
        const seen = new Set<number>();
        
        periods.forEach(ep => {
            const start = parseUTCDate(ep.start_date);
            const end = parseUTCDate(ep.end_date);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

            let current = new Date(start);
            current.setHours(0, 0, 0, 0);
            
            // Go to first Monday
            while (current.getDay() !== 1 && current <= end) {
                current.setDate(current.getDate() + 1);
            }
            
            while (current <= end) {
                const time = current.getTime();
                if (!seen.has(time)) {
                    seen.add(time);
                    weeks.push(new Date(current));
                }
                current.setDate(current.getDate() + 7);
            }
        });

        return weeks.sort((a, b) => a.getTime() - b.getTime());
    }

    // Helpers to filter reservations
    // 1. Pending estival reservations for this location
    const pendingReservations = reservations.filter(r => {
        const isEstival = r.application_group !== null;
        const isPending = r.status === 'pendiente';
        const matchesLocation = r.location_id === selectedLocationId;
        
        if (!isEstival || !isPending || !matchesLocation) return false;

        // Filter by search term
        if (searchTerm.trim() !== '') {
            const search = searchTerm.toLowerCase();
            const fullName = `${r.user.nombre} ${r.user.apellido}`.toLowerCase();
            const legajo = r.user.legajo.toLowerCase();
            const cuerpo = (r.user.cuerpo || '').toLowerCase();
            const jerarquia = r.user.jerarquia.toLowerCase();
            return fullName.includes(search) || legajo.includes(search) || cuerpo.includes(search) || jerarquia.includes(search);
        }

        return true;
    });

    // 2. Approved (Titulares) reservations for this location (have cabin_id assigned)
    const approvedTitulares = reservations.filter(r => {
        return r.status === 'aprobada' && r.cabin_id !== null && r.location_id === selectedLocationId;
    });

    // 3. Approved (Suplentes) reservations for this location (cabin_id is null)
    const approvedSuplentes = reservations.filter(r => {
        return r.status === 'aprobada' && r.cabin_id === null && r.location_id === selectedLocationId;
    });

    // Get reservation duration in weeks (1 or 2 weeks)
    const getDurationWeeks = (res: Reservation) => {
        const start = parseUTCDate(res.start_date);
        const end = parseUTCDate(res.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 7 ? 2 : 1;
    };

    // Find reservation in cabin at specific week
    const getReservationInCell = (cabinId: string, weekDate: Date) => {
        const time = weekDate.getTime();
        return approvedTitulares.find(r => {
            if (r.cabin_id !== cabinId) return false;
            const start = parseUTCDate(r.start_date).getTime();
            const end = parseUTCDate(r.end_date).getTime();
            return time >= start && time < end;
        });
    };

    // Find suplentes for a specific week
    const getSuplentesInWeek = (weekDate: Date) => {
        const time = weekDate.getTime();
        return approvedSuplentes.filter(r => {
            const start = parseUTCDate(r.start_date).getTime();
            return start === time;
        });
    };

    // DRAG AND DROP HANDLERS
    const handleDragStart = (e: React.DragEvent, res: Reservation) => {
        e.dataTransfer.setData('text/plain', res.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    // Drop on Cabin + Week Cell
    const handleDropOnCell = async (e: React.DragEvent, cabinId: string, weekDate: Date) => {
        e.preventDefault();
        setDraggedOverCell(null);

        const resId = e.dataTransfer.getData('text/plain');
        if (!resId) return;

        const res = reservations.find(r => r.id === resId);
        if (!res) return;

        const durationWeeks = getDurationWeeks(res);
        const startDateStr = weekDate.toISOString().split('T')[0];
        const endDateStr = addDays(weekDate, durationWeeks * 7).toISOString().split('T')[0];

        // Validations
        // 1. Verify cabin capacity vs occupants
        const targetCabin = cabins.find(c => c.id === cabinId);
        if (targetCabin && targetCabin.capacity && res.occupants > targetCabin.capacity) {
            alert(`No es posible adjudicar: La cantidad de ocupantes (${res.occupants}) supera la capacidad máxima de la cabaña (${targetCabin.capacity}).`);
            return;
        }

        // 2. Check if the cabin is available for all required weeks
        for (let i = 0; i < durationWeeks; i++) {
            const targetWeek = addDays(weekDate, i * 7);
            
            // Check if week is within the estival weeks
            const isWeekValid = estivalWeeks.some(w => w.getTime() === targetWeek.getTime());
            if (!isWeekValid) {
                alert('No es posible adjudicar: La duración de la postulación excede el período estival configurado.');
                return;
            }

            // Check if cell is occupied by a different approved reservation
            const occupyingRes = getReservationInCell(cabinId, targetWeek);
            if (occupyingRes && occupyingRes.id !== res.id) {
                alert(`No es posible adjudicar: La cabaña está ocupada en la semana del ${formatDateFull(targetWeek)}.`);
                return;
            }
        }

        // Trigger updates in database
        setActionLoading(res.id);
        try {
            await api.put(`/reservations/admin/${res.id}/status`, {
                status: 'aprobada',
                cabin_id: cabinId,
                start_date: startDateStr,
                end_date: endDateStr
            });
            
            setSuccessMessage(`Adjudicación exitosa para ${res.user.nombre} ${res.user.apellido} en Cabaña ${targetCabin?.identifier || ''}.`);
            setTimeout(() => setSuccessMessage(''), 4000);
            
            // Refresh data
            loadLocationData();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al adjudicar la cabaña.');
        } finally {
            setActionLoading(null);
        }
    };

    // Drop on Suplentes
    const handleDropOnSuplentes = async (e: React.DragEvent, weekDate: Date) => {
        e.preventDefault();
        setDraggedOverSuplenteWeek(null);

        const resId = e.dataTransfer.getData('text/plain');
        if (!resId) return;

        const res = reservations.find(r => r.id === resId);
        if (!res) return;

        const durationWeeks = getDurationWeeks(res);
        const startDateStr = weekDate.toISOString().split('T')[0];
        const endDateStr = addDays(weekDate, durationWeeks * 7).toISOString().split('T')[0];

        setActionLoading(res.id);
        try {
            await api.put(`/reservations/admin/${res.id}/status`, {
                status: 'aprobada',
                cabin_id: null, // explicitly null for suplentes
                start_date: startDateStr,
                end_date: endDateStr
            });
            
            setSuccessMessage(`Aprobación en carácter de SUPLENTE exitosa para ${res.user.nombre} ${res.user.apellido}.`);
            setTimeout(() => setSuccessMessage(''), 4000);
            
            // Refresh data
            loadLocationData();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al aprobar como suplente.');
        } finally {
            setActionLoading(null);
        }
    };

    // Drop on Sidebar (Revert to pending)
    const handleDropOnSidebar = async (e: React.DragEvent) => {
        e.preventDefault();
        setDraggedOverSidebar(false);

        const resId = e.dataTransfer.getData('text/plain');
        if (!resId) return;

        const res = reservations.find(r => r.id === resId);
        if (!res) return;

        // If it's already pending, do nothing
        if (res.status === 'pendiente') return;

        if (!confirm(`¿Desea revocar la aprobación de la solicitud de ${res.user.nombre} ${res.user.apellido} y devolverla al estado pendiente? Esto también restablecerá automáticamente sus opciones alternativas.`)) {
            return;
        }

        setActionLoading(res.id);
        try {
            await api.put(`/reservations/admin/${res.id}/status`, {
                status: 'pendiente'
            });
            
            setSuccessMessage(`Solicitud de ${res.user.nombre} ${res.user.apellido} devuelta al estado pendiente.`);
            setTimeout(() => setSuccessMessage(''), 4000);
            
            // Refresh data
            loadLocationData();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al revertir la adjudicación.');
        } finally {
            setActionLoading(null);
        }
    };

    // Revert reservation quickly without drag
    const handleRevertClick = async (res: Reservation) => {
        if (!confirm(`¿Desea revocar la aprobación de la solicitud de ${res.user.nombre} ${res.user.apellido} y devolverla al estado pendiente? Esto también restablecerá automáticamente sus opciones alternativas.`)) {
            return;
        }
        setActionLoading(res.id);
        try {
            await api.put(`/reservations/admin/${res.id}/status`, {
                status: 'pendiente'
            });
            setSuccessMessage(`Solicitud de ${res.user.nombre} ${res.user.apellido} devuelta al estado pendiente.`);
            setTimeout(() => setSuccessMessage(''), 4000);
            loadLocationData();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al revertir la adjudicación.');
        } finally {
            setActionLoading(null);
        }
    };

    // GENERATE WORD REPORT (Circular DIPER)
    const handleGenerateReport = () => {
        // Group all approved estival reservations by Location/Sede name
        const approvedEstival = reservations.filter(r => r.status === 'aprobada' && r.application_group !== null);
        
        if (approvedEstival.length === 0) {
            alert('No hay solicitudes estivales aprobadas para incluir en el reporte.');
            return;
        }

        // Get unique locations in approved reservations
        const locationsMap: { [key: string]: Reservation[] } = {};
        approvedEstival.forEach(res => {
            const locName = res.location?.name || 'Sede no especificada';
            if (!locationsMap[locName]) {
                locationsMap[locName] = [];
            }
            locationsMap[locName].push(res);
        });

        const currentYear = new Date().getFullYear();

        // Build HTML content with Word styling
        let sectionsHtml = '';
        Object.keys(locationsMap).sort().forEach(locName => {
            const resList = locationsMap[locName];
            
            // Sort by: Estado (TITULAR first, then SUPLENTE), then Hierarchy index, then alphabet
            const sortedRes = [...resList].sort((a, b) => {
                // Titular first
                const aVal = a.cabin_id ? 0 : 1;
                const bVal = b.cabin_id ? 0 : 1;
                if (aVal !== bVal) return aVal - bVal;
                
                // Then hierarchy
                const hierOrder = ['ALM', 'CA', 'CN', 'CF', 'CC', 'TN', 'AN', 'AF', 'GM', 'SOC', 'SOP', 'SOS', 'CP', 'CS', 'MP', 'RET'];
                const aHier = hierOrder.indexOf(a.user.jerarquia);
                const bHier = hierOrder.indexOf(b.user.jerarquia);
                if (aHier !== bHier) return aHier - bHier;

                // Then last name
                return `${a.user.apellido} ${a.user.nombre}`.localeCompare(`${b.user.apellido} ${b.user.nombre}`);
            });

            let rowsHtml = '';
            sortedRes.forEach(res => {
                const legajo = res.user.legajo;
                const grado = res.user.jerarquia;
                const cuerpo = res.user.cuerpo || 'S/C';
                const nombreCompleto = `${res.user.nombre} ${res.user.apellido}`.toUpperCase();
                const cabina = res.cabin ? res.cabin.identifier.toUpperCase() : 'SUPLENTE';
                const start = parseUTCDate(res.start_date);
                const end = parseUTCDate(res.end_date);
                const periodo = `${formatDateShort(start)} AL ${formatDateShort(end)}`;
                const estado = res.cabin_id ? 'TITULAR' : 'SUPLENTE';

                rowsHtml += `
                    <tr style="mso-yfti-irow:1;height:18.0pt">
                        <td valign="middle" style="border:solid windowtext 1.0pt;padding:4.0pt 6.0pt;text-align:center;">
                            <span style="font-family:'Times New Roman',serif;font-size:10.0pt">${legajo}</span>
                        </td>
                        <td valign="middle" style="border:solid windowtext 1.0pt;border-left:none;padding:4.0pt 6.0pt;text-align:center;">
                            <span style="font-family:'Times New Roman',serif;font-size:10.0pt">${grado}</span>
                        </td>
                        <td valign="middle" style="border:solid windowtext 1.0pt;border-left:none;padding:4.0pt 6.0pt;text-align:center;">
                            <span style="font-family:'Times New Roman',serif;font-size:10.0pt">${cuerpo}</span>
                        </td>
                        <td valign="middle" style="border:solid windowtext 1.0pt;border-left:none;padding:4.0pt 6.0pt;">
                            <span style="font-family:'Times New Roman',serif;font-size:10.0pt">${nombreCompleto}</span>
                        </td>
                        <td valign="middle" style="border:solid windowtext 1.0pt;border-left:none;padding:4.0pt 6.0pt;text-align:center;">
                            <span style="font-family:'Times New Roman',serif;font-size:10.0pt">${cabina}</span>
                        </td>
                        <td valign="middle" style="border:solid windowtext 1.0pt;border-left:none;padding:4.0pt 6.0pt;text-align:center;">
                            <span style="font-family:'Times New Roman',serif;font-size:10.0pt">${periodo}</span>
                        </td>
                        <td valign="middle" style="border:solid windowtext 1.0pt;border-left:none;padding:4.0pt 6.0pt;text-align:center;font-weight:bold;">
                            <span style="font-family:'Times New Roman',serif;font-size:10.0pt">${estado}</span>
                        </td>
                    </tr>
                `;
            });

            sectionsHtml += `
                <div style="margin-top:24.0pt;page-break-inside:avoid">
                    <p style="margin:0cm;text-align:center;font-weight:bold;font-size:12.0pt;font-family:'Times New Roman',serif;color:#1e293b;text-decoration:underline;">
                        ${locName.toUpperCase()}
                    </p>
                    <table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:none;mso-border-alt:solid windowtext .5pt;width:100%;margin-top:8.0pt">
                        <thead>
                            <tr style="height:22.0pt;background:#f1f5f9">
                                <th style="border:solid windowtext 1.0pt;padding:4.0pt 6.0pt;width:12%;text-align:center;">
                                    <span style="font-family:'Times New Roman',serif;font-size:10.0pt;font-weight:bold">LEGAJO</span>
                                </th>
                                <th style="border:solid windowtext 1.0pt;border-left:none;padding:4.0pt 6.0pt;width:10%;text-align:center;">
                                    <span style="font-family:'Times New Roman',serif;font-size:10.0pt;font-weight:bold">GRADO</span>
                                </th>
                                <th style="border:solid windowtext 1.0pt;border-left:none;padding:4.0pt 6.0pt;width:10%;text-align:center;">
                                    <span style="font-family:'Times New Roman',serif;font-size:10.0pt;font-weight:bold">CUERPO</span>
                                </th>
                                <th style="border:solid windowtext 1.0pt;border-left:none;padding:4.0pt 6.0pt;width:33%;text-align:left;">
                                    <span style="font-family:'Times New Roman',serif;font-size:10.0pt;font-weight:bold">NOMBRE Y APELLIDO</span>
                                </th>
                                <th style="border:solid windowtext 1.0pt;border-left:none;padding:4.0pt 6.0pt;width:15%;text-align:center;">
                                    <span style="font-family:'Times New Roman',serif;font-size:10.0pt;font-weight:bold">VIVIENDA</span>
                                </th>
                                <th style="border:solid windowtext 1.0pt;border-left:none;padding:4.0pt 6.0pt;width:10%;text-align:center;">
                                    <span style="font-family:'Times New Roman',serif;font-size:10.0pt;font-weight:bold">PERIODO</span>
                                </th>
                                <th style="border:solid windowtext 1.0pt;border-left:none;padding:4.0pt 6.0pt;width:10%;text-align:center;">
                                    <span style="font-family:'Times New Roman',serif;font-size:10.0pt;font-weight:bold">ESTADO</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            `;
        });

        const template = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <title>Circular DIPER - Adjudicación Viviendas Vacacionales</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                        <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    p.MsoNormal, li.MsoNormal, div.MsoNormal {
                        margin: 0cm;
                        margin-bottom: .0001pt;
                        font-size: 11.0pt;
                        font-family: "Times New Roman", serif;
                    }
                    @page WordSection1 {
                        size: 595.3pt 841.9pt; /* A4 size */
                        margin: 70.85pt 70.85pt 70.85pt 70.85pt; /* 2.5cm margins */
                        mso-header-margin: 35.45pt;
                        mso-footer-margin: 35.45pt;
                        mso-paper-source: 0;
                    }
                    div.WordSection1 {
                        page: WordSection1;
                    }
                </style>
            </head>
            <body lang="ES-UY" style="tab-interval:35.4pt">
                <div class="WordSection1">
                    <!-- Membrete Oficial -->
                    <div align="center">
                        <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%">
                            <tr>
                                <td align="center" style="padding:6.0pt;">
                                    <p style="margin:0cm;text-align:center;font-size:12.0pt;font-family:'Times New Roman',serif;font-weight:bold;color:#0f172a;">
                                        REPUBLICA ORIENTAL DEL URUGUAY
                                    </p>
                                    <p style="margin:0cm;text-align:center;font-size:11.0pt;font-family:'Times New Roman',serif;font-weight:bold;color:#0f172a;">
                                        ARMADA NACIONAL
                                    </p>
                                    <p style="margin:0cm;text-align:center;font-size:10.0pt;font-family:'Times New Roman',serif;font-weight:bold;color:#1e3a8a;">
                                        DIRECCIÓN GENERAL DE PERSONAL NAVAL
                                    </p>
                                    <p style="margin:4.0pt 0cm 0cm 0cm;text-align:center;font-size:11.0pt;font-family:'Times New Roman',serif;font-weight:bold;font-style:italic;">
                                        CIRCULAR DIPER 18 I 5. 1/${currentYear}
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <hr size="2" width="100%" align="center" style="color:#475569;margin-top:12.0pt;margin-bottom:12.0pt;">

                    <!-- Info Encabezado -->
                    <div style="margin-left:0cm;font-family:'Times New Roman',serif;font-size:11.0pt;line-height:1.5;">
                        <p style="margin:3.0pt 0cm;"><b>DE:</b> Encargado de Despacho de la Dirección General de Personal Naval.</p>
                        <p style="margin:3.0pt 0cm;"><b>PARA:</b> Lista de Destinatarios.-</p>
                        <p style="margin:3.0pt 0cm;"><b>ASUNTO:</b> Viviendas Vacacionales, adjudicación.</p>
                        <p style="margin:3.0pt 0cm;"><b>REFERENCIAS:</b> Orden General COMAR 1815.1/24.-</p>
                        <p style="margin:3.0pt 0cm;"><b>ANEXO "ALFA":</b> Adjudicación de Viviendas Vacacionales por el periodo de Temporada Estival ${currentYear}-${currentYear+1}.</p>
                    </div>

                    <hr size="1" width="100%" align="center" style="color:#cbd5e1;margin-top:12.0pt;margin-bottom:18.0pt;">

                    <!-- Desarrollo circular -->
                    <div style="font-family:'Times New Roman',serif;font-size:11.0pt;line-height:1.4;text-align:justify;margin-bottom:18.0pt;">
                        <p style="text-indent:35.4pt;margin-bottom:8.0pt;">
                            1.- La Dirección General de Personal Naval exhorta a aquel Personal Superior designado Titular para ocupar vivienda vacacional, que por alguna razón no pueda hacer usufructo de la misma, comunique 96 horas antes de la ocupación a la Dirección de Bienestar Naval y al Área Vacacional respectiva.
                        </p>
                        <p style="text-indent:35.4pt;margin-bottom:8.0pt;">
                            2.- BIENA remitirá a las respectivas Áreas Vacacionales, el listado con los números de teléfono de los adjudicatarios, a fin de notificar de ser necesario, a los suplentes que puedan ocupar vivienda por renuncia de los titulares, asegurando así la totalidad de ocupación de las viviendas vacacionales.
                        </p>
                    </div>

                    <!-- Firmas -->
                    <div align="right" style="margin-top:24.0pt;margin-bottom:24.0pt;page-break-inside:avoid">
                        <table border="0" cellspacing="0" cellpadding="0" style="width:250.0pt;font-family:'Times New Roman',serif;font-size:11.0pt;">
                            <tr>
                                <td align="center">
                                    <p style="margin:0cm;font-weight:bold;">Capitán de Navío (CG)</p>
                                    <p style="margin:0cm;font-weight:bold;margin-top:40.0pt;text-decoration:overline;">Encargado de Despacho de la</p>
                                    <p style="margin:0cm;font-weight:bold;">Dirección General de Personal Naval</p>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="page-break-before:always"></div>

                    <!-- Anexo Alfa -->
                    <p style="margin:0cm;text-align:center;font-weight:bold;font-size:14.0pt;font-family:'Times New Roman',serif;text-transform:uppercase;color:#0f172a;letter-spacing:1px;">
                        ANEXO ALFA
                    </p>
                    <p style="margin:0cm;text-align:center;font-weight:bold;font-size:12.0pt;font-family:'Times New Roman',serif;text-transform:uppercase;color:#1e3a8a;margin-bottom:12.0pt;">
                        PLANIFICACIÓN DE ADJUDICACIÓN DE TEMPORADA ESTIVAL
                    </p>
                    
                    ${sectionsHtml}
                </div>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + template], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CIRCULAR_DIPER_VACACIONES_ESTIVALES_${currentYear}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="space-y-6 animate-fade-in text-slate-800">
            {/* Top Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 bg-white p-6 rounded shadow-sm border border-slate-100 items-stretch xl:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1 items-stretch sm:items-center">
                    <div className="w-full sm:w-72">
                        <label className="text-[10px] font-black text-armada-navy uppercase tracking-widest italic block mb-1">Destino Naval / Sede</label>
                        <select
                            value={selectedLocationId}
                            onChange={(e) => setSelectedLocationId(e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-slate-100 rounded focus:border-armada-navy outline-none font-bold text-sm bg-slate-50 uppercase text-slate-700"
                        >
                            <option value="">Seleccione destino...</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Filtrar Postulantes</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="BUSCAR POR NOMBRE, LEGAJO O CUERPO..."
                                className="w-full pl-9 pr-4 py-2 border-2 border-slate-100 rounded focus:border-armada-navy outline-none text-xs font-bold uppercase tracking-wider bg-slate-50/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')} 
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 items-end shrink-0 pt-2 xl:pt-0">
                    <button
                        onClick={handleGenerateReport}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3 rounded font-black text-[10px] uppercase tracking-widest hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shrink-0 border border-emerald-500/20"
                    >
                        <FileText size={15} /> GENERAR REPORTE DIPER (.DOC)
                    </button>
                </div>
            </div>

            {/* Error or Success alerts */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded flex items-center gap-3 border border-red-100">
                    <AlertCircle size={18} />
                    <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                </div>
            )}
            {successMessage && (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded flex items-center gap-3 border border-emerald-100 transition-all animate-bounce">
                    <Check size={18} className="text-emerald-600" />
                    <p className="text-xs font-bold uppercase tracking-tight">{successMessage}</p>
                </div>
            )}

            {/* Main Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-armada-navy" size={40} />
                    <p className="font-black text-armada-navy text-sm uppercase tracking-[0.3em]">Cargando Panel de Adjudicación...</p>
                </div>
            ) : !selectedLocationId ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Por favor, seleccione un Destino Naval en el menú superior para comenzar.
                </div>
            ) : (
                <div className="flex flex-col xl:flex-row gap-6 items-stretch">
                    {/* Sidebar: Pending Postulations */}
                    <div 
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDraggedOverSidebar(true);
                        }}
                        onDragLeave={() => setDraggedOverSidebar(false)}
                        onDrop={handleDropOnSidebar}
                        className={`w-full xl:w-96 bg-white border rounded shadow-sm flex flex-col shrink-0 transition-all duration-300 ${
                            draggedOverSidebar ? 'border-dashed border-red-500 bg-red-50/50 scale-[0.98]' : 'border-slate-100'
                        }`}
                    >
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-armada-navy" />
                                <span className="font-black text-xs text-armada-navy uppercase tracking-widest">Postulantes Pendientes</span>
                            </div>
                            <span className="bg-armada-navy text-armada-gold px-2.5 py-0.5 rounded-full text-[10px] font-black">
                                {pendingReservations.length}
                            </span>
                        </div>

                        {draggedOverSidebar && (
                            <div className="p-4 text-center text-red-600 bg-red-50 text-[10px] font-black uppercase tracking-widest border-b border-red-100 animate-pulse">
                                ¡Suelte aquí para revocar la adjudicación!
                            </div>
                        )}

                        <div className="p-4 space-y-3 overflow-y-auto max-h-[600px] flex-1 min-h-[300px]">
                            {pendingReservations.length === 0 ? (
                                <p className="text-center text-slate-400 font-bold text-xs uppercase tracking-widest py-10">
                                    No hay postulaciones pendientes.
                                </p>
                            ) : (
                                pendingReservations.map(res => {
                                    const durWeeks = getDurationWeeks(res);
                                    const isP1 = res.priority === 1;
                                    return (
                                        <div
                                            key={res.id}
                                            draggable="true"
                                            onDragStart={(e) => handleDragStart(e, res)}
                                            className={`p-3 rounded border bg-white shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all border-l-4 group relative ${
                                                isP1 ? 'border-l-amber-500 border-slate-200' : 'border-l-slate-400 border-slate-200'
                                            } ${actionLoading === res.id ? 'opacity-40 pointer-events-none' : ''}`}
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="bg-armada-navy text-white px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                                                            {res.user.jerarquia}
                                                        </span>
                                                        {res.user.cuerpo && (
                                                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-black border border-slate-200 uppercase">
                                                                {res.user.cuerpo}
                                                            </span>
                                                        )}
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                                            isP1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            Opción {res.priority}
                                                        </span>
                                                    </div>
                                                    <h5 className="font-black text-slate-800 uppercase tracking-tight text-xs mt-1.5">
                                                        {res.user.nombre} {res.user.apellido}
                                                    </h5>
                                                    <p className="text-[9px] text-slate-400 font-black mt-0.5">LEGAJO: {res.user.legajo}</p>
                                                </div>
                                            </div>

                                            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500 font-bold">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    <span>{formatDateShort(parseUTCDate(res.start_date))} al {formatDateShort(parseUTCDate(res.end_date))}</span>
                                                </div>
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-black">
                                                    {durWeeks} {durWeeks === 1 ? 'Semana' : 'Semanas'}
                                                </span>
                                            </div>
                                            
                                            {actionLoading === res.id && (
                                                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded">
                                                    <Loader2 className="animate-spin text-armada-navy" size={16} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Grid and Suplentes */}
                    <div className="flex-1 min-w-0 bg-white border border-slate-100 rounded shadow-sm p-6 flex flex-col gap-6">
                        {/* Interactive Grid Title */}
                        <div className="flex justify-between items-center">
                            <h4 className="font-black text-sm text-armada-navy uppercase tracking-widest flex items-center gap-2">
                                <Home size={18} /> Ocupación y Asignaciones
                            </h4>
                            <div className="flex gap-4 text-[9px] font-black uppercase text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></div>
                                    <span>Prioridad 1</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 bg-slate-400 rounded-sm"></div>
                                    <span>Prioridad 2</span>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable table container */}
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full border-collapse text-left min-w-[800px] table-fixed">
                                <thead>
                                    <tr className="bg-armada-navy border-b border-armada-gold/20 text-white">
                                        <th className="p-3 font-black text-[10px] tracking-wider uppercase text-left w-36 shrink-0 bg-armada-navy border-r border-armada-gold/10">
                                            Cabaña
                                        </th>
                                        {estivalWeeks.map(weekDate => {
                                            const startStr = formatDateShort(weekDate);
                                            const endStr = formatDateShort(addDays(weekDate, 7));
                                            return (
                                                <th 
                                                    key={weekDate.getTime()} 
                                                    className="p-3 font-black text-[9px] tracking-wider uppercase text-center border-r border-armada-gold/10"
                                                >
                                                    <div className="text-armada-gold">{weekDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</div>
                                                    <div className="text-[10px] font-extrabold mt-0.5">{startStr} al {endStr}</div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Cabins Rows */}
                                    {cabins.length === 0 ? (
                                        <tr>
                                            <td 
                                                colSpan={estivalWeeks.length + 1} 
                                                className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs"
                                            >
                                                No hay cabañas registradas para esta sede.
                                            </td>
                                        </tr>
                                    ) : (
                                        cabins.map(cabin => {
                                            let skipColumns = 0; // to track colSpans
                                            return (
                                                <tr key={cabin.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                                                    {/* Cabin name cell */}
                                                    <td className="p-3 font-black text-xs text-slate-700 bg-slate-50/50 uppercase border-r border-slate-100">
                                                        <div className="flex flex-col">
                                                            <span>{cabin.identifier}</span>
                                                            <span className="text-[9px] text-slate-400 font-extrabold mt-0.5">Cap: {cabin.capacity || 6} ocup.</span>
                                                        </div>
                                                    </td>

                                                    {/* Weeks cells */}
                                                    {estivalWeeks.map((weekDate) => {
                                                        const weekTime = weekDate.getTime();
                                                        
                                                        // Handle skipping because of colSpan from previous column
                                                        if (skipColumns > 0) {
                                                            skipColumns--;
                                                            return null;
                                                        }

                                                        const cellRes = getReservationInCell(cabin.id, weekDate);
                                                        
                                                        if (cellRes) {
                                                            const durationWeeks = getDurationWeeks(cellRes);
                                                            
                                                            // Set skipColumns for adjacent cells if duration is 2 weeks
                                                            const isExactStart = parseUTCDate(cellRes.start_date).getTime() === weekTime;
                                                            if (isExactStart && durationWeeks > 1) {
                                                                skipColumns = durationWeeks - 1;
                                                            }

                                                            // Only render cell if it is the starting week of the reservation
                                                            if (isExactStart) {
                                                                const isP1 = cellRes.priority === 1;
                                                                return (
                                                                    <td 
                                                                        key={weekTime} 
                                                                        colSpan={durationWeeks}
                                                                        className="p-2 border-r border-slate-100 align-middle"
                                                                    >
                                                                        <div 
                                                                            draggable="true"
                                                                            onDragStart={(e) => handleDragStart(e, cellRes)}
                                                                            className={`p-2.5 rounded border shadow-sm relative group bg-white hover:bg-slate-50/80 cursor-grab active:cursor-grabbing transition-all ${
                                                                                isP1 ? 'border-l-4 border-l-amber-500 border-slate-200' : 'border-l-4 border-l-slate-400 border-slate-200'
                                                                            } ${actionLoading === cellRes.id ? 'opacity-40 pointer-events-none' : ''}`}
                                                                        >
                                                                            {/* Remove/Revert action button */}
                                                                            <button
                                                                                onClick={() => handleRevertClick(cellRes)}
                                                                                title="Revocar adjudicación y devolver a pendientes"
                                                                                className="absolute right-1.5 top-1.5 p-1 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                                            >
                                                                                <X size={10} />
                                                                            </button>

                                                                            <div className="flex items-center gap-1 flex-wrap">
                                                                                <span className="bg-armada-navy text-white px-1 py-0 rounded-[3px] text-[7.5px] font-black">
                                                                                    {cellRes.user.jerarquia}
                                                                                </span>
                                                                                {cellRes.user.cuerpo && (
                                                                                    <span className="bg-slate-100 text-slate-600 px-1 py-0 rounded-[3px] text-[7.5px] font-black border border-slate-200">
                                                                                        {cellRes.user.cuerpo}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            
                                                                            <div className="font-extrabold text-[10px] text-slate-800 uppercase truncate pr-3 mt-1">
                                                                                {cellRes.user.nombre} {cellRes.user.apellido}
                                                                            </div>

                                                                            <div className="flex justify-between items-center text-[7.5px] text-slate-400 font-extrabold mt-1">
                                                                                <span>OCUP: {cellRes.occupants}</span>
                                                                                {durationWeeks > 1 && (
                                                                                    <span className="bg-amber-100 text-amber-700 px-1 rounded-sm uppercase tracking-tighter">
                                                                                        2 Semanas
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {actionLoading === cellRes.id && (
                                                                                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded">
                                                                                    <Loader2 className="animate-spin text-armada-navy" size={14} />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                );
                                                            }
                                                            
                                                            // If we somehow encounter an overlap check block that isn't covered by skipColumns, return empty
                                                            return <td key={weekTime} className="p-2 border-r border-slate-100 bg-red-50"></td>;
                                                        }

                                                        // Empty droppable cell
                                                        const isDraggedOver = draggedOverCell?.cabinId === cabin.id && draggedOverCell?.weekTime === weekTime;
                                                        return (
                                                            <td 
                                                                key={weekTime}
                                                                onDragOver={(e) => {
                                                                    e.preventDefault();
                                                                    if (draggedOverCell?.cabinId !== cabin.id || draggedOverCell?.weekTime !== weekTime) {
                                                                        setDraggedOverCell({ cabinId: cabin.id, weekTime });
                                                                    }
                                                                }}
                                                                onDragLeave={() => setDraggedOverCell(null)}
                                                                onDrop={(e) => handleDropOnCell(e, cabin.id, weekDate)}
                                                                className={`p-3 border-r border-slate-100 text-center transition-all cursor-crosshair ${
                                                                    isDraggedOver ? 'bg-amber-50 border-2 border-dashed border-amber-400' : 'bg-slate-50/20'
                                                                }`}
                                                            >
                                                                <span className={`text-[8px] font-black uppercase tracking-wider ${isDraggedOver ? 'text-amber-600 font-black scale-105 inline-block' : 'text-slate-300'}`}>
                                                                    {isDraggedOver ? 'Adjudicar aquí' : '+ Asignar'}
                                                                </span>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Seccion Cola de Suplentes por Semana */}
                        <div className="border-t border-slate-200 pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-black text-sm text-armada-navy uppercase tracking-widest flex items-center gap-2">
                                    <Users size={18} /> Cola de Suplentes por Semana
                                </h4>
                                <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                                    Total Suplentes: {approvedSuplentes.length}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold mb-4 uppercase tracking-wider leading-relaxed">
                                Arrastre solicitudes pendientes o titulares aquí para asignarlas como suplentes en una semana específica. También puede arrastrar suplentes hacia el tablero superior para promoverlos a titulares, o al panel izquierdo para dejarlos pendientes.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {estivalWeeks.map(weekDate => {
                                    const weekTime = weekDate.getTime();
                                    const suplentes = getSuplentesInWeek(weekDate);
                                    const isDraggedOver = draggedOverSuplenteWeek === weekTime;
                                    const startStr = formatDateShort(weekDate);
                                    const endStr = formatDateShort(addDays(weekDate, 7));

                                    return (
                                        <div
                                            key={weekTime}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                if (draggedOverSuplenteWeek !== weekTime) {
                                                    setDraggedOverSuplenteWeek(weekTime);
                                                }
                                            }}
                                            onDragLeave={() => setDraggedOverSuplenteWeek(null)}
                                            onDrop={(e) => handleDropOnSuplentes(e, weekDate)}
                                            className={`p-4 rounded border transition-all flex flex-col min-h-[150px] ${
                                                isDraggedOver 
                                                    ? 'bg-emerald-50 border-2 border-dashed border-emerald-400 scale-[1.02]' 
                                                    : 'bg-slate-50/50 border-slate-200'
                                            }`}
                                        >
                                            <div className="border-b border-slate-200 pb-2 mb-3">
                                                <div className="text-[9px] font-black text-armada-navy uppercase">
                                                    Semana de {weekDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
                                                </div>
                                                <div className="text-[10px] font-extrabold text-slate-600 mt-0.5">
                                                    {startStr} al {endStr}
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-2">
                                                {suplentes.length === 0 ? (
                                                    <div className="h-full flex items-center justify-center py-6 text-center text-[9px] font-black text-slate-300 uppercase tracking-wider">
                                                        {isDraggedOver ? 'Soltar para asignar' : 'Sin suplentes'}
                                                    </div>
                                                ) : (
                                                    suplentes.map(res => {
                                                        const isP1 = res.priority === 1;
                                                        return (
                                                            <div
                                                                key={res.id}
                                                                draggable="true"
                                                                onDragStart={(e) => handleDragStart(e, res)}
                                                                className={`p-2.5 rounded border bg-white shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all border-l-4 group relative ${
                                                                    isP1 ? 'border-l-amber-500 border-slate-200' : 'border-l-slate-400 border-slate-200'
                                                                } ${actionLoading === res.id ? 'opacity-40 pointer-events-none' : ''}`}
                                                            >
                                                                {/* Quick Revert */}
                                                                <button
                                                                    onClick={() => handleRevertClick(res)}
                                                                    title="Revocar aprobación y devolver a pendientes"
                                                                    className="absolute right-1 top-1 p-0.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                                >
                                                                    <X size={8} />
                                                                </button>

                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="bg-armada-navy text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                                                                        {res.user.jerarquia}
                                                                    </span>
                                                                    {res.user.cuerpo && (
                                                                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[7px] font-black border border-slate-200 uppercase">
                                                                            {res.user.cuerpo}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="font-black text-slate-800 uppercase tracking-tight text-[10px] mt-1.5 truncate pr-3">
                                                                    {res.user.nombre} {res.user.apellido}
                                                                </div>
                                                                <div className="flex justify-between items-center text-[7.5px] text-slate-400 font-extrabold mt-1">
                                                                    <span>LEGAJO: {res.user.legajo}</span>
                                                                    <span>Opción {res.priority}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}

                                                {isDraggedOver && suplentes.length > 0 && (
                                                    <div className="text-center py-2 rounded text-[7.5px] font-black uppercase text-emerald-700 bg-emerald-100/50 animate-pulse">
                                                        Soltar para agregar
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
