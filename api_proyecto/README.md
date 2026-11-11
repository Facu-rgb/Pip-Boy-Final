# API REST PHP MVC — Radio Vault-Tec

Backend compatible con la actividad final: PHP nativo, MVC, MySQL, JWT, productos, carrito, favoritos, compras, tickets y endpoints admin.

## Ejecución local

1. Crear la base e importar `crear_base_tienda.sql` en MySQL.
2. Configurar `DATABASE_URL` y `JWT_SECRET` o editar `config/Bd.php`.
3. Desde la raíz del proyecto ejecutar:

```powershell
php -S localhost:8000 -t api_proyecto/public
```

La API queda disponible en `http://localhost:8000`.

## Frontend

Desde otra terminal:

```powershell
npm install --legacy-peer-deps
$env:NODE_ENV="development"
npx tsx watch server/_core/index.ts
```

El servicio Angular usa `http://localhost:8000` por defecto. Para cambiarlo, definir antes de cargar la aplicación:

```js
globalThis.PIPBOY_API_URL = 'http://localhost:8000';
```

## Rutas principales

- `POST /usuarios/registro`
- `POST /usuarios/login`
- `GET /productos?buscar=texto`
- `POST|PUT|DELETE /productos` (admin)
- `GET|POST|DELETE /favoritos`
- `GET|POST|PUT|DELETE /carrito`
- `POST /compras/finalizar`
- `GET /compras`
- `GET /tickets/{id}`
