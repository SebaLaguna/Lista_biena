import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha proveniente del servidor (YYYY-MM-DD o ISO) 
 * evitando el desplazamiento por zona horaria local.
 */
export const formatDateSafe = (dateStr: string, formatStr: string = 'dd/MM/yyyy') => {
    if (!dateStr) return '';
    
    // Si contiene solo fecha (YYYY-MM-DD), extraemos sus componentes
    // Si es ISO completa, nos interesa también solo la fecha para este sistema administrativo
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Creamos un objeto Date local con esos valores exactos (mes 0-indexado)
    const localDate = new Date(year, month - 1, day);
    
    return format(localDate, formatStr, { locale: es });
};

/**
 * Convierte una cadena YYYY-MM-DD o ISO en un objeto Date LOCAL (medianoche).
 */
export const parseDateSafe = (dateStr: string) => {
    if (!dateStr) return new Date();
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
};

/**
 * Extrae el año de una cadena de fecha sin errores de zona horaria.
 */
export const getYearSafe = (dateStr: string) => {
    if (!dateStr) return new Date().getFullYear();
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    return parseInt(datePart.split('-')[0]);
};
