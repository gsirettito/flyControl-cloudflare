# FlyControl — adaptación candidata para Cloudflare Workers

Copia independiente del ZIP original. NO es un artefacto compilado ni un ZIP de Pages Direct Upload. No se han ejecutado migraciones ni se ha conectado la base de datos real. Se conserva el diseño, los módulos y el esquema Prisma original. El cron se entrega DESACTIVADO para no modificar reservas reales durante las pruebas.

## 1. Subir el código

Descomprime el ZIP. Crea un repositorio privado nuevo en GitHub (por ejemplo `flycontrol-cloudflare`), y sube **el contenido de la carpeta**, incluyendo los archivos de configuración ocultos. No sustituyas el repositorio de producción. Desde Cloudflare selecciona Compute > Workers & Pages > Create application > Connect GitHub, autoriza solo ese repositorio. No selecciones Pages Direct Upload.

Configuración de compilación (Workers Builds):
- Nombre del Worker: `flycontrol` (debe coincidir con wrangler.jsonc; cambia ambos si ya existe).
- Rama: main; directorio raíz: `/`.
- Variable de compilación: `SKIP_DEPENDENCY_INSTALL=1`.
- Comando de compilación: `npm install --include=dev && npm run cf:build`.
- Comando de despliegue: `npx opennextjs-cloudflare deploy`.
- Node 22 (archivo .node-version). No uses npm ci hasta regenerar el package-lock.json: el lockfile original se conserva y npm install añadirá las dependencias nuevas. Guarda el lock actualizado tras una compilación exitosa.
- Configura `NEXTAUTH_URL` también como variable de compilación si la generación estática lo requiere; debe ser la URL de prueba HTTPS real. Nunca utilices credenciales de producción en el entorno de prueba.

Alternativa desde un ordenador con Node 22: `npm install --include=dev`, `npm run cf:typecheck`, `npm run cf:build`, `npm run cf:preview`, `npx wrangler login`, `npx opennextjs-cloudflare deploy`. No ejecutar los scripts de migración automática.

## 2. Variables y servicios

En el Worker > Settings > Variables and Secrets, configura las variables de texto y los secretos. Usa valores reales propios; los ejemplos del repositorio no son credenciales.

| Variable | Tipo / finalidad |
|---|---|
| NEXTAUTH_URL | URL HTTPS de prueba, luego https://flycontrol.toursofgracellc.com |
| AUTH_SECRET | Secreto aleatorio fuerte; mantener separado del entorno original |
| DATABASE_URL | Secreto: conexión PostgreSQL de prueba con TLS, accesible desde Workers |
| AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET | ID y secreto OAuth, alternativamente GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET |
| RESEND_API_KEY | Secreto: API de envío HTTPS |
| RESEND_FROM | Remitente autorizado por Resend, p. ej. FlyControl <notificaciones@dominio-verificado> |
| CRON_SECRET_TOKEN | Secreto independiente de alta entropía |
| MINIO_URL / MINIO_PUBLIC_URL | URLs HTTPS del almacenamiento propio compatible S3 |
| MINIO_ACCESS_KEY / MINIO_SECRET_KEY | Secretos de almacenamiento |
| BUCKET_MEDIA | Nombre del bucket de prueba |
| OTP_SMS_TOKEN_SECRET | Secreto para SMS, si se utiliza |
| IMAGE_PROXY_HOSTS | Lista separada por comas de hosts públicos de imágenes autorizados, sin URLs |
| REGISTRATION_ALERT_EMAIL | Opcional; solo correo corporativo autorizado. Si no está, no se envían alertas de nuevos usuarios OAuth. |

Consulta `.env.example` para las demás integraciones. No pegues secretos en GitHub ni en variables NEXT_PUBLIC. Verifica el remitente de Resend (DNS y políticas del servicio), y añade la URL exacta `https://TU-HOST/api/auth/callback/google` al cliente OAuth de Google. El correo de activación sigue siendo obligatorio. Para reenviar un enlace, repite el registro con el mismo correo y contraseña tras un minuto; cuentas invitadas sin contraseña deben usar Google. No existe aún activación administrativa manual.

PostgreSQL: usa una base clonada o vacía preparada con las migraciones originales por un administrador. No ejecutar `prisma migrate dev` en producción. El adaptador pg original se conserva para la conexión directa: su comportamiento en Workers debe verificarse, incluyendo TLS, límites de conexiones y posibles restricciones de red. Si falla, configurar Hyperdrive y adaptar el ciclo de vida de Prisma antes del despliegue definitivo.

## 3. Prueba obligatoria antes de activar el cron o vincular el dominio

1. Verificar instalación de dependencias, generación Prisma, comprobación de tipos y compilación OpenNext.
2. Abrir el Worker de prueba sin datos reales; probar registro, envío de correo, enlace válido, enlace vencido, reenvío con misma contraseña, correo incorrecto y login Google. Confirmar que el enlace usa el host de prueba.
3. Comprobar que un gestor no puede modificar usuarios de otra compañía, escalar a superadmin ni ver contraseñas. No permitir cambios de correo desde la API de gestores; el cambio de identidad necesita un proceso separado.
4. Probar reservas, PDF, logos, facturas, almacenamiento y API de vuelos; verificar que los objetos que contienen datos de pasajeros NO son accesibles públicamente sin autorización. Se conserva la arquitectura S3 original y sus permisos requieren revisión independiente. No introducir pasaportes reales hasta entonces.
5. Probar correo y SMS únicamente con destinatarios de prueba. Los endpoints de prueba quedan restringidos a superadministradores.
6. Probar cron con reservas ficticias, estados, avisos, ventanas de 24h/4h y expiración. El wrapper incluye el controlador scheduled, pero `triggers.crons` permanece vacío a propósito. Solo después de detener el cron original para esa base de datos, cambiar a `"crons": ["* * * * *"]` en wrangler.jsonc y desplegar. El cron anterior puede seguir funcionando con la aplicación original en otra base.
7. Confirmar tiempos CPU, tamaño comprimido del Worker y consumo. Workers Free tiene límites estrictos (10 ms CPU por invocación y 3 MiB comprimidos); esta aplicación grande, bcrypt y PDF podrían excederlos. NO contratar Workers Paid ni otros servicios sin autorización.
8. Una vez todo aprobado, conectar Custom Domain `flycontrol.toursofgracellc.com` al Worker cuando el dominio esté activo en Cloudflare. Actualizar NEXTAUTH_URL y Google OAuth. Probar desde Cuba sin VPN. No cambiar la página comercial ni su DNS.

## 4. Cambios y límites de esta revisión

- Registro comprueba el resultado de email, permite reenvío con contraseña correcta, aplica bloqueo por correo en PostgreSQL y espera de un minuto; el límite de solicitudes global y protección antibots siguen pendientes.
- Activación en transacción y token de uso único; los tokens originales siguen siendo compatibles. No se migró a tokens almacenados como hash.
- Google OAuth exige correo verificado, state/PKCE, y bloquea la vinculación de cuentas con contraseña no verificada. Se eliminó el destinatario externo fijo de alertas y se sustituyó por variable opcional.
- Gestores: aislamiento por compañía en cambios y borrados, protección contra escalada, exclusión de contraseña en respuestas seleccionadas. Se impide el cambio de correo por gestores. Falta auditoría integral de todos los permisos y sesiones.
- Carga de imágenes autenticada y con tipo/tamaño declarados restringidos; proxy de imágenes limitado a hosts autorizados, sin redirecciones ni SVG. No es un análisis completo de todas las entradas de archivos ni de todas las descargas de logos del sistema.
- Se usa Resend cuando está configurado; no se intenta SMTP desde Workers sin Resend. SMTP local conserva su funcionamiento. Las plantillas se incorporan en un módulo generado; si se modifica una plantilla, regenerar el módulo.
- Cron corregido anterior: autenticación obligatoria, estados condicionales, recordatorios reales con margen de recuperación y bloqueos de PostgreSQL. Reactiva el correo de cancelación. No hay garantía de entrega exactamente una vez ni reintentos persistentes de cancelación.
- Se adaptaron lecturas de aeropuertos y logos locales a assets; archivos nuevos van a MinIO/S3. Se conserva la integración PDF y proveedores externos; no se ha validado su compatibilidad real con Workers. Los limitadores existentes en memoria no son globales entre instancias.
- Las comprobaciones de sintaxis no equivalen a compilación ni pruebas de ejecución. En el entorno de preparación npm no pudo resolver registry.npmjs.org; no se descargaron dependencias ni se generó el bundle. Next.js 16, OpenNext, Prisma, pg, generación PDF, OAuth y servicios externos requieren pruebas reales. No se garantiza el coste cero ni que el ZIP sea desplegable sin ajustes.

Documentación oficial: https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/ ; https://opennext.js.org/cloudflare/howtos/custom-worker ; https://developers.cloudflare.com/workers/ci-cd/builds/build-image/ ; https://developers.cloudflare.com/workers/platform/limits/ .
