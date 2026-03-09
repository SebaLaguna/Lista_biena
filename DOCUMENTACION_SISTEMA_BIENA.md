# SISTEMA BIENA
## Documentación del Sistema de Reservas de Viviendas Vacacionales
### Armada Nacional de Uruguay

---

**Versión:** 1.0  
**Fecha:** Marzo 2026  
**Clasificación:** Uso Interno

---

## 1. Introducción

El Sistema BIENA es una plataforma web desarrollada para la Armada Nacional de Uruguay, destinada a gestionar de manera digital y ordenada las solicitudes de reserva de viviendas vacacionales disponibles para el personal de la institución.

A través de este sistema, el personal puede consultar la disponibilidad de cabañas en distintas ubicaciones, realizar solicitudes de reserva y hacer seguimiento del estado de las mismas, todo desde un entorno seguro y accesible.

---

## 2. Objetivo del Sistema

El Sistema BIENA tiene como objetivo principal reemplazar los procesos manuales o informales de reserva de viviendas vacacionales, centralizando toda la gestión en una plataforma digital institucional.

El sistema permite:

- Que el personal solicite reservas de cabañas de forma rápida y ordenada.
- Que los administradores revisen, aprueben o rechacen las solicitudes.
- Que todos los movimientos queden registrados con trazabilidad completa.
- Reducir errores, superposiciones de reservas y comunicaciones informales.

---

## 3. Tipos de Usuarios

El sistema contempla tres tipos de usuarios, cada uno con distintos niveles de acceso y responsabilidades.

### 3.1 Usuario

Es el personal de la Armada que utiliza el sistema para solicitar reservas de viviendas vacacionales.

**Puede:**
- Registrarse e iniciar sesión en el sistema.
- Consultar las ubicaciones y cabañas disponibles.
- Realizar solicitudes de reserva.
- Ver el estado de sus propias reservas (pendiente, aprobada, rechazada, cancelada).

**No puede:**
- Ver las reservas de otros usuarios.
- Aprobar ni rechazar solicitudes.
- Acceder al panel de administración.

---

### 3.2 Administrador de Reservas

Es el responsable operativo de gestionar las solicitudes de reserva dentro del sistema.

**Puede:**
- Hacer todo lo que puede hacer un Usuario.
- Acceder al panel de administración de reservas.
- Revisar todas las solicitudes pendientes.
- Aprobar o rechazar solicitudes de reserva.
- Consultar el historial de reservas de cualquier usuario.

---

### 3.3 Administrador

Es el usuario con el nivel más alto de acceso al sistema. Tiene control total sobre la plataforma.

**Puede:**
- Hacer todo lo que puede hacer un Administrador de Reservas.
- Gestionar usuarios del sistema (altas, bajas, modificaciones).
- Configurar parámetros del sistema.
- Acceder a todos los registros y reportes disponibles.

---

## 4. Proceso General del Sistema

El flujo general del sistema sigue los siguientes pasos:

1. **El usuario se registra** en el sistema con sus datos personales e institucionales.
2. **Inicia sesión** con su correo institucional y contraseña.
3. **Accede al panel principal** donde puede ver las opciones disponibles.
4. **Realiza una solicitud de reserva**, seleccionando la ubicación, la cabaña y la semana deseada.
5. **La solicitud queda en estado "Pendiente"** hasta que un administrador la revise.
6. **El administrador aprueba o rechaza** la solicitud desde el panel de administración.
7. **El usuario puede consultar el estado** de su solicitud en cualquier momento desde su perfil.

---

## 5. Registro de Usuarios

Para acceder al sistema, el personal debe registrarse completando un formulario con los siguientes datos:

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Nombre del funcionario |
| **Apellido** | Apellido del funcionario |
| **Cédula de Identidad** | Número de cédula uruguaya |
| **Legajo** | Número de legajo institucional |
| **Correo institucional** | Dirección de correo electrónico de la Armada |
| **Teléfono** | Número de teléfono de contacto (opcional) |

> **Importante:** La cédula de identidad y el número de legajo son únicos en el sistema. No puede haber dos usuarios registrados con el mismo número de cédula ni con el mismo legajo.

Una vez registrado, el usuario puede iniciar sesión de inmediato.

---

## 6. Inicio de Sesión

Para acceder al sistema, el usuario debe:

1. Ingresar a la dirección web del sistema.
2. Completar su **correo institucional** y su **contraseña**.
3. Presionar el botón de inicio de sesión.

Si los datos son correctos, el sistema redirige al usuario a la página principal. En caso de error, se mostrará un mensaje indicando que las credenciales son incorrectas.

---

## 7. Panel Principal

Luego de iniciar sesión, el usuario accede a la **página principal del sistema**, desde donde puede:

- Iniciar una nueva solicitud de reserva.
- Consultar sus reservas activas y su historial.
- Cerrar sesión de forma segura.

Los usuarios con roles de administrador también verán accesos directos al **panel de gestión de reservas**.

---

## 8. Sistema de Reservas

El proceso para realizar una solicitud de reserva es el siguiente:

### Paso 1 — Seleccionar ubicación
El usuario elige entre las ubicaciones disponibles: Santa Teresa, La Paloma o Baen.

### Paso 2 — Seleccionar semana
El sistema muestra un calendario con las semanas disponibles. El usuario elige la semana en la que desea reservar.

> **Nota:** Las reservas siempre corresponden a una **semana completa**, de **lunes a lunes**. No es posible reservar períodos parciales o fechas sueltas.

### Paso 3 — Confirmar solicitud
El usuario revisa los datos de la reserva y presiona el botón **"REMITIR SOLICITUD A BIENA"** para enviar la solicitud.

### Paso 4 — Confirmación
El sistema confirma que la solicitud fue enviada y el usuario puede verla en su historial con estado **"Pendiente"**.

---

## 9. Ubicaciones Disponibles

El sistema gestiona reservas en las siguientes ubicaciones:

| Ubicación | Cantidad de Cabañas | Capacidad por Cabaña |
|-----------|---------------------|----------------------|
| Santa Teresa | 3 cabañas | 4 personas |
| La Paloma | 10 cabañas | 4 personas |
| Baen | 5 cabañas | 4 personas |

Cada cabaña tiene un identificador único dentro del sistema (por ejemplo: *La Paloma 3*, *Santa Teresa 1*, etc.).

---

## 10. Proceso de Aprobación

Una vez que el usuario envía una solicitud, entra en el proceso de revisión administrativa.

### Estados posibles de una reserva

| Estado | Descripción |
|--------|-------------|
| **Pendiente** | La solicitud fue enviada y está esperando revisión. |
| **Aprobada** | La solicitud fue revisada y autorizada por un administrador. |
| **Rechazada** | La solicitud fue denegada. El usuario puede volver a intentarlo. |
| **Cancelada** | La reserva fue anulada administrativamente. |

### Cómo aprueba el administrador

1. El administrador accede al **panel de administración**.
2. Visualiza todas las solicitudes en estado "Pendiente".
3. Revisa los datos del solicitante, la ubicación y las fechas.
4. Presiona el botón de **aprobación** (✓) o **rechazo** (✗).
5. El sistema solicita confirmación antes de aplicar el cambio.
6. La reserva cambia de estado y el registro queda guardado en el historial.

---

## 11. Historial de Reservas

Cada usuario puede consultar el historial completo de sus propias reservas desde el panel principal, donde se muestra:

- La ubicación y cabaña reservada.
- Las fechas de la reserva.
- El estado actual de la solicitud.
- La fecha en que fue creada.

Los **administradores** tienen acceso al historial de reservas de todos los usuarios del sistema, lo que permite auditar y controlar el uso de las viviendas vacacionales.

---

## 12. Seguridad y Control

El sistema incorpora los siguientes mecanismos de seguridad y control:

- **Autenticación segura:** Cada usuario accede con correo y contraseña. Las contraseñas se almacenan de forma encriptada.
- **Control de acceso por roles:** Cada tipo de usuario solo puede acceder a las funciones que le corresponden. Un usuario común no puede acceder al panel de administración.
- **Datos únicos:** El sistema impide el registro de dos personas con la misma cédula o legajo.
- **Trazabilidad:** Cada cambio de estado en una reserva queda registrado con fecha, hora y responsable.
- **Prevención de superposición:** El sistema controla que no se generen dos reservas para la misma cabaña en las mismas fechas.

---

## 13. Futuras Ampliaciones

Esta sección está reservada para documentar las funcionalidades que se incorporarán al sistema en futuras versiones.

| Funcionalidad | Estado |
|---------------|--------|
| *(Pendiente de definición)* | Planificado |

---

*Documento generado para uso interno de la Armada Nacional de Uruguay.*  
*Sistema BIENA — Bienestar del Personal*
