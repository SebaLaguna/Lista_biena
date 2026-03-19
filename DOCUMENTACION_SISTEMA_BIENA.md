# SISTEMA BIENA
## Documentación del Sistema de Reservas de Viviendas Vacacionales
### Armada Nacional de Uruguay

---

**Versión:** 2.0.1  
**Fecha:** Marzo 2026  
**Clasificación:** Uso Interno

---

## 1. Introducción

El Sistema BIENA es la plataforma oficial de la Armada Nacional de Uruguay para la gestión integral de viviendas vacacionales. Esta versión introduce un motor de reglas basado en jerarquías navales, políticas de anticipación diferenciadas y gestión de temporadas estivales con restricciones de cancelación especiales.

---

## 2. Gestión de Usuarios y Jerarquías

### 2.1 Identificación Única
El campo **"Legajo"** ha sido actualizado a **"ID de Funcionario (Legajo)"**. Este identificador es el principal del sistema, separándose de la Cédula de Identidad para mayor claridad administrativa.

### 2.2 Proceso de Alta (Pendiente de Aprobación)
El registro inicial no habilita el acceso inmediato.
1. El funcionario se registra con sus datos y selecciona su **Jerarquía Detallada** (16 niveles disponibles).
2. El usuario entra en estado **"Pendiente"**.
3. BIENA debe validar los datos y **Aprobar** el alta.
4. Una vez aprobado, el usuario puede iniciar sesión.

### 2.3 Jerarquías Soportadas (Niveles Reales)
El sistema utiliza el escalafón completo de la Armada Nacional:
- **Oficiales Superiores:** ALM, CN, CF, CC.
- **Oficiales Jefes y Subalternos:** TN, TF, AN, GM.
- **Personal Subalterno:** SOA, SO, S1, S2, C1, C2, M1, M2.

---

## 3. Roles Administrativos (Normalizados)

### 3.1 Super Admin (`super_admin`)
- **Acceso Exclusivo:** Gestión de Destinos Navales (Sedes). 
- **Control Total:** Auditoría completa de Logs con filtrado por rango de fechas.
- **Gestión Estructural:** Configuración de Temporadas Estivales y alta/baja de unidades.

### 3.2 Administrador BIENA (`admin_biena`)
- **Gestión Operativa:** Aprobación/Rechazo de solicitudes de reserva (con comentarios obligatorios).
- **Personal:** Aprobación de nuevos usuarios del sistema.
- **Mantenimiento:** Registro y levantamiento de **Bloqueos Temporarios** por unidad o globales.
- **Visualización:** Inventario de unidades y sedes (solo lectura).

### 3.3 Usuario Común (`common_user`)
- **Solicitante:** Realización de reservas según reglas de anticipación y jerarquía.
- **Perfil:** Visualización de sus propias credenciales y estado de cuenta.

---

## 4. Motor de Reservas y Reglas de Negocio

### 4.1 Anticipación por Jerarquía
El sistema restringe la fecha máxima de reserva según la condición del solicitante:
- **Personal Activo (Oficiales y Subalternos):** Hasta **60 días** de anticipación.
- **Personal Retirado (RET):** Hasta **45 días** de anticipación.

### 4.2 Restricción de Acceso a Unidades
Cada cabaña o unidad puede tener configuradas **Jerarquías Permitidas**.
- El solicitante solo visualizará y podrá reservar unidades que coincidan con su jerarquía.
- Si una unidad no tiene jerarquías especificadas, se considera de acceso general.

### 4.3 Duración y Aforo
- **Estancia:** Mínimo 1 día, Máximo **7 días** consecutivos.
- **Ocupantes:** No puede exceder la capacidad nominal de la unidad.

### 4.4 Temporadas Estivales
BIENA define períodos específicos (verano, semana de turismo, etc.) como "Temporada Estival".
- Las reservas que caigan dentro de estas fechas están sujetas a una **Política de Cancelación Restrictiva**.
- La cancelación debe realizarse con al menos **10 días** de antelación. Fuera de estas fechas, rige la política estándar.

---

## 5. Panel de Control "Estado Mayor"

Módulos integrados para la gestión eficiente:
1. **Solicitudes:** Gestión de flujo de aprobación con comentarios obligatorios en rechazos.
2. **Usuarios:** Dashboard de aprobación de personal y filtrado por jerarquía.
3. **Unidades (Cabañas):** Configuración de aforo y permisos por jerarquía.
4. **Bloqueos:** Inhabilitación de fechas por razones de servicio o mantenimiento.
5. **Temporadas:** Definición de períodos con reglas de cancelación especiales.
6. **Auditoría:** Registro inmutable de toda la actividad del sistema.

---

## 6. Condiciones de Uso y Notificaciones

- **Transparencia:** Es mandatorio aceptar los términos y condiciones antes de cada solicitud.
- **Comunicación:** El sistema envía correos automáticos (vía NodeMailer) para:
  - Confirmación de registro pendiente.
  - Notificación de alta aprobada.
  - Resolución de solicitud de reserva (Aprobada / Rechazada con motivo).

---

## 7. Escalabilidad y Optimización Arquitectónica (v2.1+)

Para asegurar un rendimiento sostenido ante el incremento de usuarios y datos históricos, la arquitectura contempla estrategias proactivas:

### 7.1 Rendimiento del Lado del Cliente (Frontend)
- **Gestión Inteligente de Disponibilidad:** Las consultas al motor de disponibilidad desde el panel de reservas priorizan ventanas de tiempo específicas (cargando datos en bloques en lugar de ciclos anuales), previniendo saturación de memoria (*Memory Leaks* y *Array Spread Overload*) en los componentes del calendario.

### 7.2 Motores de Base de Datos y Consultas
- **Índices Estratégicos:** Se contempla el uso de índices compuestos `@@index([start_date, end_date])` en Reservas y Bloqueos para evitar escaneos secuenciales y garantizar una respuesta de consulta en milisegundos.
- **Paginación Restricta:** Los endpoints críticos del Estado Mayor (ej. listado general de solicitudes) se diseñan para soportar lotes limitados, previniendo cuellos de botella en la renderización del servidor.

---
*Documento autogenerado para uso de la Armada Nacional de Uruguay.*  
*Sistema BIENA — Bienestar del Personal v2.1.1 (Marzo 2026)*
