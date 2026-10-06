# Ibarra Instruments

Aplicación Next.js para registrar instrumentos, asociarlos con un usuario y consultar el inventario. Las fotos se almacenan en Vercel Blob y los datos en PostgreSQL de Neon, disponible como integración de Vercel Marketplace.

## Desarrollo local

Requiere Node.js 20 o posterior. Instala dependencias con `npm install`, copia `.env.example` a `.env.local` y completa las variables descritas abajo. Después ejecuta `npm run dev`.

## Variables de entorno

- `DATABASE_URL`: cadena de conexión de PostgreSQL. Crea o conecta una base Neon desde el Marketplace del proyecto en Vercel y asigna su cadena a esta variable.
- `BLOB_READ_WRITE_TOKEN`: token de lectura/escritura que Vercel genera al conectar un almacén Blob.

La tabla `instruments` se crea automáticamente al consultar o guardar el primer registro. No hace falta ejecutar una migración manual.

## Despliegue en Vercel

Importa este repositorio en Vercel, conecta una base de datos Neon desde Storage/Marketplace y crea un almacén Blob en el proyecto. Confirma que `DATABASE_URL` y `BLOB_READ_WRITE_TOKEN` estén disponibles en los entornos que vas a desplegar y vuelve a desplegar. El build usa `npm run build`.