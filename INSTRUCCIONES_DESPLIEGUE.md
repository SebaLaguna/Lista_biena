# Guía de Despliegue - Sistema BIENA
## Manual de Operaciones para Administración de Servidores (Entorno Intranet)

Esta guía detalla los pasos para desplegar la aplicación en el servidor IIS/Linux oficial de la Intranet de la Armada Nacional de Uruguay.

---

## 1. Estructura de la Aplicación
El proyecto unificado se compone de dos carpetas principales:
- `/backend`: Servidor de APIs en Node.js/Express.
- `/frontend`: Aplicación cliente Single Page Application (SPA) construida en React + Vite.

---

## 2. Configuración y Despliegue del Backend

1. **Requisitos Previos:**
   - Node.js (versión 18 o superior).
   - Servidor PostgreSQL instalado y accesible.

2. **Instalación de Dependencias:**
   Desde la consola en el directorio `/backend`:
   ```bash
   npm install
   ```

3. **Configuración de Variables de Entorno (.env):**
   Duplicar el archivo `.env.example` o editar el archivo `.env` existente y configurar las variables reales del entorno de producción:
   ```env
   # Puerto en el que corre la API (por defecto 5000)
   PORT=5000

   # URL de conexión a la base de datos PostgreSQL
   DATABASE_URL=postgresql://usuario:contraseña@servidor_db:5432/armada_reservas?schema=public

   # Clave secreta para la firma de tokens JWT
   JWT_SECRET="Colocar_Una_Cadena_Larga_Y_Aleatoria_De_Seguridad"

   # Configuración del servidor SMTP oficial
   SMTP_HOST=172.16.0.84
   SMTP_PORT=26
   SMTP_USER=biena_prueba@armada.mil.uy
   SMTP_PASS="contraseña_del_correo"
   SMTP_FROM=biena_prueba@armada.mil.uy
   ```

4. **Migración de Base de Datos (Prisma):**
   Para inicializar las tablas de la base de datos y la semilla de datos iniciales en PostgreSQL, ejecutar:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Iniciar el Servidor:**
   Para producción, se recomienda utilizar un gestor de procesos como `pm2` para garantizar alta disponibilidad:
   ```bash
   npm install -g pm2
   pm2 start src/index.ts --name "biena-backend"
   ```

---

## 3. Configuración y Compilación del Frontend (React/Vite)

1. **Requisitos Previos:**
   - Node.js (versión 18 o superior) en la máquina de compilación.

2. **Instalación de Dependencias:**
   Desde la consola en el directorio `/frontend`:
   ```bash
   npm install
   ```

3. **Configuración del Servidor de Producción (.env.production):**
   El archivo `/frontend/.env.production` define a qué servidor de API se conectará la interfaz.
   Asegúrese de que el archivo contiene la IP o dominio del servidor de producción:
   ```env
   VITE_API_URL=http://172.16.0.153/api
   ```
   *(Si el backend se aloja bajo otro puerto o subdominio en producción, modifique este valor según corresponda).*

4. **Compilar para Producción:**
   Ejecute el comando de construcción:
   ```bash
   npm run build
   ```
   Este comando compilará y minificará la aplicación en la carpeta `/frontend/dist/`. 
   Vite inyectará automáticamente la IP de la intranet (`http://172.16.0.153/api`) en los archivos estáticos de forma transparente.

5. **Publicación en el Servidor Web:**
   Copie el contenido completo de la carpeta `/frontend/dist/` a su servidor web (IIS, Nginx, o Apache) en la ruta raíz del sitio.

---

## 4. Preguntas Frecuentes y Soporte de Operaciones

* **¿Cómo cambio la IP de la intranet del frontend si cambia el servidor?**
  No es necesario modificar el código fuente. Simplemente edite la línea `VITE_API_URL` en el archivo `/frontend/.env.production`, guarde y vuelva a ejecutar `npm run build`.

* **¿Cómo cambio las credenciales del correo SMTP?**
  Edite las variables correspondientes (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) en el archivo `/backend/.env` y reinicie el proceso de Node.js (`pm2 restart biena-backend`).
