# SISTEMA BIENA
## Documentación del Sistema de Reservas de Viviendas Vacacionales
### Armada Nacional de Uruguay

---

**Versión:** 2.0  
**Fecha:** Marzo 2026  
**Clasificación:** Uso Interno

---

## 1. Introducción

El Sistema BIENA es una plataforma web desarrollada para la Armada Nacional de Uruguay, destinada a gestionar de manera digital y ordenada las solicitudes de reserva de viviendas vacacionales disponibles para el personal de la institución. En su versión 2.0, el sistema incorpora roles avanzados, auditoría completa, gestión de disponibilidad dinámica y validación estricta de condiciones de uso.

---

## 2. Objetivo del Sistema

El Sistema BIENA tiene como objetivo principal digitalizar y auditar integralmente la gestión de reservas de viviendas vacacionales.

El sistema permite:
- Solicitar reservas de cabañas de forma rápida y controlada (de 1 a 7 días).
- Especificar la cantidad de ocupantes respetando aforos definidos.
- Gestionar aprobaciones, roles y unidades (cabañas) mediante administradores.
- Auditar todas las operaciones de los usuarios en tiempo real.
- Notificar por correo electrónico los cambios de estado al personal.

---

## 3. Tipos de Usuarios y Roles

### 3.1 Usuario Base
Personal de la Armada que solicita reservas. Nuevos registros ingresan en estado "Pendiente". Sus capacidades son:
- Consultar disponibilidad de cabañas.
- Solicitar reservas (sujeto a la aceptación de las Condiciones de Uso).
- Consultar el historial y estado de sus reservas.
- Recibir correos electrónicos con comprobantes y actualizaciones de estado.

### 3.2 Administrador de Reservas (Admin BIENA)
Responsable operativo de la gestión de viviendas. Puede:
- Aprobar altas de nuevos usuarios al sistema.
- Aprobar o rechazar solicitudes de reserva (exigiendo un motivo en caso de rechazo).
- Gestionar unidades habitacionales (modificar capacidad, identificador o marcar "En mantenimiento" / "Fuera de servicio").
- Registrar bloqueos de fechas (globales o por cabaña).
- Todas las funciones del Usuario Base.

### 3.3 Super Administrador
Usuario con acceso total y capacidades técnicas de auditoría. Puede:
- Consultar el Historial de Auditoría Global (Sistema de Logs).
- Eliminar usuarios definitivamente del padrón.
- Otorgar y revocar privilegios y roles (ascender usuarios a Administradores).
- Todas las funciones del Administrador BIENA.

---

## 4. Proceso de Reservas Inteligente

### 4.1 Selección y Filtros
El sistema presenta un catálogo de Destinos Navales y Unidades Habitacionales. La disponibilidad cuenta con validaciones estrictas:
- **Fechas Habilitadas:** El calendario desactiva automáticamente las fechas que ya están ocupadas o bloqueadas operativamente por BIENA.
- **Rango Flexible:** Las reservas se realizan seleccionando desde 1 hasta un máximo de 7 días consecutivos.
- **Aforo:** El usuario debe declarar la cantidad de ocupantes. El sistema restringe el ingreso si supera la capacidad de la unidad solicitada.

### 4.2 Autorización y Rechazo
- Una reserva ingresada queda en estado **Pendiente**.
- El Mando Administrativo aprueba o rechaza la orden.
- Si se **rechaza**, el sistema exige ingresar un comentario oficial fundamentando la decisión.
- El solicitante recibe un correo electrónico automatizado con la resolución (aprobación o rechazo con su respectivo motivo).

---

## 5. Panel de Administración y Control

La interfaz "Estado Mayor de Reservas" ha sido reformulada para incluir múltiples módulos (Tabs) con filtros de búsqueda avanzada:

1. **Solicitudes:** Control de los estados de reserva.
2. **Usuarios:** Aprobación de altas, control de estados (Aprobado/Inactivo) y designación de roles (acceso VIP).
3. **Unidades (Cabañas):** Edición directa de información y condición operativa.
4. **Bloqueos:** Registro de indisponibilidad temporal para unidades individuales o para toda la red de viviendas por factores de servicio.
5. **Auditoría (Logs):** Exclusivo para Super Admins, enlista todas las acciones relevantes ejecutadas en el sistema (identificación de IP, usuario, operación y marca temporal).

---

## 6. Seguridad y Envío de Correos Institucionales

- **Trazabilidad:** Cada cambio de estado de usuario, reserva o infraestructura habitacional es inyectado de forma inmutable a la base de registros.
- **Estado Inicial:** Un funcionario recién matriculado no puede usar el sistema hasta que el Mando Administrativo corrobore sus datos (Legajo / Matrícula) y autorice su alta.
- **NodeMailer:** Integración activa para enviar al usuario confirmaciones de registro, y las resoluciones vinculadas a su solicitud habitacional de manera inmediata y automatizada.

---

## 7. Términos y Condiciones
Todo usuario está supeditado a la "Ordenanza de Reservas". Para procesar una solicitud, es mandatorio marcar la aceptación de las Condiciones de Uso vigentes, mitigando reclamos legales sobre reglamentaciones internas.

---
*Documento autogenerado para uso de la Armada Nacional de Uruguay.*  
*Sistema BIENA — Bienestar del Personal v2.0*
