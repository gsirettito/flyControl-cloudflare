# FlyControl - Flight Management System

**FlyControl** es un sistema integral para la gestión de reservas de vuelos, diseñado para agencias de viajes y operadores turísticos. Permite administrar aerolíneas, vuelos, pasajeros y reservas de forma eficiente, con soporte para itinerarios de múltiples escalas, generación de boletos en PDF, notificaciones multicanal y control de estados en tiempo real.

## 🚀 Propósito

Centralizar y automatizar las operaciones diarias de reserva de vuelos, ofreciendo una interfaz intuitiva tanto para gestores como para administradores. El sistema facilita la búsqueda de vuelos reales vía API, la construcción de rutas paso a paso y la confirmación de reservas con asignación de PNR y número de ticket.

## ✨ Características principales

- **Autenticación con Google** – Acceso seguro mediante cuentas de Google.
- **Gestión de compañías** – Cada compañía tiene su propia configuración (colores, prefijo de reservas, horas de expiración de pre-reserva).
- **Catálogo de aerolíneas y vuelos** – ABM completo con datos reales (códigos IATA/ICAO, logos, horarios y zonas horarias).
- **Registro de clientes (pasajeros)** – Almacena pasaporte, nacionalidad, fechas de nacimiento y datos de contacto.
- **Creación de reservas** – Interfaz diseñada para construir itinerarios de ida y/o vuelta con múltiples escalas, buscando vuelos reales desde la base de datos local o vía API externa.
- **Generación de boletos PDF** – Documento profesional con todos los detalles del viaje, código QR, condiciones y datos del pasajero.
- **Confirmación de reservas** – El gestor ingresa el PNR y número de ticket, actualizando el estado de la reserva.
- **Notificaciones multicanal** – Envío automático de correos electrónicos y **mensajes de texto (SMS)** al pasajero cuando se confirma la reserva.
- **Panel de control inteligente** – Métricas en tiempo real de reservas, clientes, vuelos y aerolíneas. Acceso rápido a las últimas reservas y próximos vuelos.
- **Vistas de detalle interactivas** – Paneles laterales (Drawers) que permiten ver el detalle completo de un cliente, vuelo o reserva sin salir de la página actual, manteniendo el contexto de la tabla.
- **Diseño responsivo y moderno** – Utiliza Mantine UI y está optimizado tanto para escritorio como para dispositivos móviles, con soporte para modo claro/oscuro.

## 🛠️ Tecnologías utilizadas

- **Next.js 16** con App Router y TypeScript
- **Autenticación**: NextAuth.js con proveedor de Google
- **Base de datos**: PostgreSQL con Prisma ORM
- **Estilos y componentes**: Mantine UI v9
- **Almacenamiento de archivos**: MinIO / AWS S3 (para logos, PDFs)
- **Generación de PDF**: `@react-pdf/renderer`
- **Notificaciones**: Nodemailer (SMTP) y API de NoxCreation (SMS)
- **Consultas a APIs externas**: AeroDataBox / FlightRadar24 (información de vuelos)
- **Iconos**: react-icons (Feather, Ionicons)

## 📦 Entorno de desarrollo

1. Clonar el repositorio.
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno (`.env.local`): credenciales de Google, URL de base de datos, claves de API (SMTP, MinIO, SMS), etc.
4. Ejecutar migraciones de Prisma: `npx prisma migrate dev`
5. Iniciar el servidor de desarrollo: `npm run dev`

## 📄 Licencia

Proyecto de uso interno – todos los derechos reservados.

---

*FlyControl – Simplifica la gestión de tus vuelos.*