# Pip-Boy Radio Store

Aplicación Angular con estética Pip-Boy, API REST en Express, JWT, MySQL/MariaDB y catálogo de canciones comprables.

## Instalación

```bash
npm install --legacy-peer-deps
```

Crear un archivo `.env` local (no se sube al repositorio):

```env
DATABASE_URL=mysql://usuario:clave@localhost:3306/pipboy_radio
JWT_SECRET=una-clave-larga-y-segura
PORT=3000
```

Ejecutar `crear_base_tienda.sql` en la base indicada por `DATABASE_URL`. Para promover un usuario a administrador:

```sql
UPDATE usuarios SET rol = 'admin' WHERE email = 'tu-correo@ejemplo.com';
```

Iniciar en desarrollo:

```bash
npm run dev
```

La interfaz Angular y la API se sirven juntas desde `http://localhost:3000`.

## Funcionalidades

- Registro e inicio de sesión con JWT Bearer.
- Catálogo de canciones de radio con búsqueda y filtro por género.
- Favoritos persistidos por usuario.
- Carrito persistido en la base de datos.
- Compra de canciones, historial y ticket PDF descargable.
- CRUD de canciones para administradores.
- Subida de portada mediante imagen codificada desde el formulario; en WebDev usa almacenamiento remoto y en local usa `uploads/covers`.
- Colección de Postman en `postman/PipBoy-Radio-API.postman_collection.json`.

## Endpoints principales

`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/canciones`, `GET/POST/DELETE /api/favoritos`, `GET/POST/PATCH/DELETE /api/carrito`, `POST/GET /api/compras`, `GET /api/compras/:id/ticket`, y CRUD admin en `/api/admin/canciones`.
