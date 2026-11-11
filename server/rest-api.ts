import { createHash, randomBytes, randomUUID, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import type { Express, NextFunction, Request, RequestHandler, Response } from "express";
import express from "express";
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { jwtVerify, SignJWT } from "jose";
import { storagePut } from "./storage";

const scrypt = promisify(nodeScrypt);
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || "pipboy-local-secret-change-me");
const uploadDirectory = path.resolve(process.cwd(), "uploads", "covers");

let pool: Pool | undefined;

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type DbUser = RowDataPacket & {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol: "usuario" | "admin";
  creado_en: Date;
};

type DbSong = RowDataPacket & {
  id: number;
  titulo: string;
  artista: string;
  album: string | null;
  genero: string;
  duracion_segundos: number;
  precio: number;
  imagen_portada: string | null;
  audio_url: string | null;
  descripcion: string | null;
  activo: number;
};

type DbCartItem = RowDataPacket & {
  cancion_id: number;
  titulo: string;
  artista: string;
  genero: string;
  precio_unitario: number;
  cantidad: number;
  imagen_portada: string | null;
};

type AuthUser = Pick<DbUser, "id" | "nombre" | "email" | "rol">;
type AuthRequest = Request & { authUser?: AuthUser };

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function asyncRoute(handler: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new ApiError(503, "La base de datos no está configurada. Definí DATABASE_URL.");
  }
  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 10,
      waitForConnections: true,
      decimalNumbers: true,
      charset: "utf8mb4",
    });
  }
  return pool;
}

async function rows<T extends RowDataPacket>(sql: string, values: unknown[] = []): Promise<T[]> {
  const [result] = await getPool().execute(sql, values as any[]);
  return result as T[];
}

async function execute(sql: string, values: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await getPool().execute(sql, values as any[]);
  return result as ResultSetHeader;
}

function publicUser(user: DbUser | AuthUser): AuthUser {
  return { id: Number(user.id), nombre: user.nombre, email: user.email, rol: user.rol };
}

function publicSong(song: DbSong, favorite = false) {
  return {
    id: Number(song.id),
    title: song.titulo,
    artist: song.artista,
    album: song.album,
    genre: song.genero,
    durationSeconds: Number(song.duracion_segundos),
    price: Number(song.precio),
    coverImage: song.imagen_portada,
    audioUrl: song.audio_url,
    description: song.descripcion,
    favorite,
  };
}

function parsePositiveInt(value: unknown, fallback = 1): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function requireBodyString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `El campo ${field} es obligatorio.`);
  }
  return value.trim();
}

function getBearerToken(req: Request): string {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new ApiError(401, "Iniciá sesión para continuar.");
  return header.slice("Bearer ".length);
}

async function getAuthUser(req: Request): Promise<AuthUser> {
  const token = getBearerToken(req);
  try {
    const verified = await jwtVerify(token, jwtSecret, { algorithms: ["HS256"] });
    const userId = Number(verified.payload.sub);
    if (!userId) throw new Error("Token sin usuario");
    const result = await rows<DbUser>("SELECT id, nombre, email, password_hash, rol, creado_en FROM usuarios WHERE id = ? LIMIT 1", [userId]);
    if (!result[0]) throw new Error("Usuario inexistente");
    return publicUser(result[0]);
  } catch {
    throw new ApiError(401, "Sesión inválida o vencida.");
  }
}

async function requireAuth(req: Request): Promise<AuthUser> {
  const user = await getAuthUser(req);
  (req as AuthRequest).authUser = user;
  return user;
}

async function requireAdmin(req: Request): Promise<AuthUser> {
  const user = await requireAuth(req);
  if (user.rol !== "admin") throw new ApiError(403, "Se requiere una cuenta administradora.");
  return user;
}

async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ nombre: user.nombre, email: user.email, rol: user.rol })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtSecret);
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const actual = derived.toString("hex");
  return createHash("sha256").update(actual).digest("hex") === createHash("sha256").update(expected).digest("hex");
}

async function favoriteIds(userId: number): Promise<Set<number>> {
  const result = await rows<RowDataPacket & { cancion_id: number }>("SELECT cancion_id FROM favoritos WHERE usuario_id = ?", [userId]);
  return new Set(result.map(row => Number(row.cancion_id)));
}

async function findSong(id: number): Promise<DbSong> {
  const result = await rows<DbSong>("SELECT * FROM canciones WHERE id = ? LIMIT 1", [id]);
  if (!result[0]) throw new ApiError(404, "Canción no encontrada.");
  return result[0];
}

async function cartIdFor(userId: number): Promise<number> {
  const existing = await rows<RowDataPacket & { id: number }>("SELECT id FROM carritos WHERE usuario_id = ? AND estado = 'activo' LIMIT 1", [userId]);
  if (existing[0]) return Number(existing[0].id);
  const created = await execute("INSERT INTO carritos (usuario_id, estado) VALUES (?, 'activo')", [userId]);
  return Number(created.insertId);
}

async function readCart(userId: number) {
  const cartId = await cartIdFor(userId);
  const items = await rows<DbCartItem>(
    `SELECT ci.cancion_id, c.titulo, c.artista, c.genero, c.imagen_portada,
            ci.precio_unitario, ci.cantidad
       FROM carrito_items ci
       JOIN canciones c ON c.id = ci.cancion_id
      WHERE ci.carrito_id = ?
      ORDER BY ci.agregado_en DESC`,
    [cartId],
  );
  const mapped = items.map(item => ({
    songId: Number(item.cancion_id),
    title: item.titulo,
    artist: item.artista,
    genre: item.genero,
    coverImage: item.imagen_portada,
    unitPrice: Number(item.precio_unitario),
    quantity: Number(item.cantidad),
    subtotal: Number(item.precio_unitario) * Number(item.cantidad),
  }));
  return { items: mapped, total: mapped.reduce((sum, item) => sum + item.subtotal, 0) };
}

function pdfEscape(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "?").replace(/[()\\]/g, character => `\\${character}`);
}

function createTicketPdf(lines: string[]): Buffer {
  const commands = ["BT", "/F1 16 Tf", "50 790 Td"];
  lines.forEach((line, index) => {
    if (index > 0) commands.push("0 -28 Td");
    commands.push(`(${pdfEscape(line)}) Tj`);
  });
  commands.push("ET");
  const stream = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

async function normalizeCoverImage(value: unknown): Promise<string | null> {
  if (typeof value !== "string" || value.trim() === "") return null;
  const input = value.trim();
  if (!input.startsWith("data:")) return input;
  const match = input.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new ApiError(400, "La portada debe ser una imagen válida.");
  const contentType = match[1];
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 4 * 1024 * 1024) throw new ApiError(413, "La portada no puede superar los 4 MB.");

  try {
    if (process.env.BUILT_IN_FORGE_API_URL && process.env.BUILT_IN_FORGE_API_KEY) {
      const extension = contentType.split("/")[1] || "png";
      const uploaded = await storagePut(`pipboy-covers/${randomUUID()}.${extension}`, bytes, contentType);
      return uploaded.url;
    }
  } catch (error) {
    console.warn("[Storage] No se pudo usar almacenamiento remoto; se usa almacenamiento local.", error);
  }

  await fs.mkdir(uploadDirectory, { recursive: true });
  const extension = contentType.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const filename = `${randomUUID()}.${extension}`;
  await fs.writeFile(path.join(uploadDirectory, filename), bytes);
  return `/uploads/covers/${filename}`;
}

function body(req: Request): Record<string, unknown> {
  return (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;
}

export function registerRestApi(app: Express): void {
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, servicio: "Pip-Boy Radio API", fecha: new Date().toISOString() });
  });

  app.post("/api/auth/register", asyncRoute(async (req, res) => {
    const data = body(req);
    const nombre = requireBodyString(data, "nombre");
    const email = requireBodyString(data, "email").toLowerCase();
    const password = requireBodyString(data, "password");
    if (password.length < 6) throw new ApiError(400, "La contraseña debe tener al menos 6 caracteres.");
    const duplicate = await rows<RowDataPacket & { id: number }>("SELECT id FROM usuarios WHERE email = ? LIMIT 1", [email]);
    if (duplicate[0]) throw new ApiError(409, "Ya existe una cuenta con ese correo.");
    const result = await execute("INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, 'usuario')", [nombre, email, await hashPassword(password)]);
    const userRows = await rows<DbUser>("SELECT * FROM usuarios WHERE id = ? LIMIT 1", [result.insertId]);
    const user = publicUser(userRows[0]);
    res.status(201).json({ user, token: await createToken(user) });
  }));

  app.post("/api/auth/login", asyncRoute(async (req, res) => {
    const data = body(req);
    const email = requireBodyString(data, "email").toLowerCase();
    const password = requireBodyString(data, "password");
    const found = await rows<DbUser>("SELECT * FROM usuarios WHERE email = ? LIMIT 1", [email]);
    if (!found[0] || !(await verifyPassword(password, found[0].password_hash))) throw new ApiError(401, "Correo o contraseña incorrectos.");
    const user = publicUser(found[0]);
    res.json({ user, token: await createToken(user) });
  }));

  app.get("/api/auth/me", asyncRoute(async (req, res) => {
    res.json({ user: await requireAuth(req) });
  }));

  app.get("/api/canciones", asyncRoute(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const genre = typeof req.query.genre === "string" ? req.query.genre.trim() : "";
    const favoriteOnly = req.query.favoritas === "true";
    const maybeUser = req.headers.authorization ? await getAuthUser(req).catch(() => undefined) : undefined;
    const filters: string[] = ["activo = 1"];
    const values: unknown[] = [];
    if (search) {
      filters.push("(titulo LIKE ? OR artista LIKE ? OR album LIKE ?)");
      const like = `%${search}%`;
      values.push(like, like, like);
    }
    if (genre) {
      filters.push("genero = ?");
      values.push(genre);
    }
    if (favoriteOnly) {
      if (!maybeUser) throw new ApiError(401, "Iniciá sesión para ver tus favoritos.");
      filters.push("id IN (SELECT cancion_id FROM favoritos WHERE usuario_id = ?)");
      values.push(maybeUser.id);
    }
    const found = await rows<DbSong>(`SELECT * FROM canciones WHERE ${filters.join(" AND ")} ORDER BY artista, titulo`, values);
    const favorites = maybeUser ? await favoriteIds(maybeUser.id) : new Set<number>();
    res.json({ canciones: found.map(song => publicSong(song, favorites.has(Number(song.id)))) });
  }));

  app.get("/api/canciones/:id", asyncRoute(async (req, res) => {
    const song = await findSong(parsePositiveInt(req.params.id));
    const maybeUser = req.headers.authorization ? await getAuthUser(req).catch(() => undefined) : undefined;
    const favorites = maybeUser ? await favoriteIds(maybeUser.id) : new Set<number>();
    res.json({ cancion: publicSong(song, favorites.has(Number(song.id))) });
  }));

  app.get("/api/favoritos", asyncRoute(async (req, res) => {
    const user = await requireAuth(req);
    const found = await rows<DbSong>(
      "SELECT c.* FROM canciones c JOIN favoritos f ON f.cancion_id = c.id WHERE f.usuario_id = ? ORDER BY f.creado_en DESC",
      [user.id],
    );
    res.json({ favoritos: found.map(song => publicSong(song, true)) });
  }));

  app.post("/api/favoritos/:songId", asyncRoute(async (req, res) => {
    const user = await requireAuth(req);
    const song = await findSong(parsePositiveInt(req.params.songId));
    await execute("INSERT IGNORE INTO favoritos (usuario_id, cancion_id) VALUES (?, ?)", [user.id, song.id]);
    res.status(201).json({ ok: true, favorita: true });
  }));

  app.delete("/api/favoritos/:songId", asyncRoute(async (req, res) => {
    const user = await requireAuth(req);
    await execute("DELETE FROM favoritos WHERE usuario_id = ? AND cancion_id = ?", [user.id, parsePositiveInt(req.params.songId)]);
    res.json({ ok: true, favorita: false });
  }));

  app.get("/api/carrito", asyncRoute(async (req, res) => {
    res.json(await readCart((await requireAuth(req)).id));
  }));

  app.post("/api/carrito/items", asyncRoute(async (req, res) => {
    const user = await requireAuth(req);
    const data = body(req);
    const song = await findSong(parsePositiveInt(data.songId));
    const quantity = Math.min(99, parsePositiveInt(data.quantity));
    const cartId = await cartIdFor(user.id);
    await execute(
      `INSERT INTO carrito_items (carrito_id, cancion_id, cantidad, precio_unitario)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad), precio_unitario = VALUES(precio_unitario)`,
      [cartId, song.id, quantity, song.precio],
    );
    res.status(201).json(await readCart(user.id));
  }));

  app.patch("/api/carrito/items/:songId", asyncRoute(async (req, res) => {
    const user = await requireAuth(req);
    const quantity = Number(body(req).quantity);
    const cartId = await cartIdFor(user.id);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      await execute("DELETE FROM carrito_items WHERE carrito_id = ? AND cancion_id = ?", [cartId, parsePositiveInt(req.params.songId)]);
    } else {
      await execute("UPDATE carrito_items SET cantidad = ? WHERE carrito_id = ? AND cancion_id = ?", [Math.min(quantity, 99), cartId, parsePositiveInt(req.params.songId)]);
    }
    res.json(await readCart(user.id));
  }));

  app.delete("/api/carrito/items/:songId", asyncRoute(async (req, res) => {
    const user = await requireAuth(req);
    await execute("DELETE FROM carrito_items WHERE carrito_id = ? AND cancion_id = ?", [await cartIdFor(user.id), parsePositiveInt(req.params.songId)]);
    res.json(await readCart(user.id));
  }));

  app.post("/api/compras", asyncRoute(async (req, res) => {
    const user = await requireAuth(req);
    const database = getPool();
    const connection = await database.getConnection();
    try {
      await connection.beginTransaction();
      const [cartRows] = await connection.execute<DbCartItem[]>(
        `SELECT ci.cancion_id, c.titulo, c.artista, ci.precio_unitario, ci.cantidad
           FROM carrito_items ci JOIN carritos ca ON ca.id = ci.carrito_id
           JOIN canciones c ON c.id = ci.cancion_id
          WHERE ca.usuario_id = ? AND ca.estado = 'activo'`,
        [user.id],
      );
      const items = cartRows as DbCartItem[];
      if (items.length === 0) throw new ApiError(400, "El carrito está vacío.");
      const total = items.reduce((sum, item) => sum + Number(item.precio_unitario) * Number(item.cantidad), 0);
      const ticket = `PIP-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
      const [purchaseResult] = await connection.execute<ResultSetHeader>("INSERT INTO compras (usuario_id, total, estado, codigo_ticket) VALUES (?, ?, 'pagada', ?)", [user.id, total, ticket]);
      const purchaseId = Number(purchaseResult.insertId);
      for (const item of items) {
        await connection.execute("INSERT INTO compra_items (compra_id, cancion_id, titulo, artista, precio_unitario, cantidad) VALUES (?, ?, ?, ?, ?, ?)", [purchaseId, item.cancion_id, item.titulo, item.artista, item.precio_unitario, item.cantidad]);
      }
      await connection.execute("DELETE ci FROM carrito_items ci JOIN carritos ca ON ca.id = ci.carrito_id WHERE ca.usuario_id = ? AND ca.estado = 'activo'", [user.id]);
      await connection.commit();
      res.status(201).json({ compra: { id: purchaseId, total, ticketCode: ticket, purchasedAt: new Date().toISOString() } });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }));

  app.get("/api/compras", asyncRoute(async (req, res) => {
    const user = await requireAuth(req);
    const purchases = await rows<RowDataPacket & { id: number; total: number; estado: string; codigo_ticket: string; comprado_en: Date }>("SELECT id, total, estado, codigo_ticket, comprado_en FROM compras WHERE usuario_id = ? ORDER BY comprado_en DESC", [user.id]);
    const result = [];
    for (const purchase of purchases) {
      const items = await rows<RowDataPacket & { titulo: string; artista: string; cantidad: number; precio_unitario: number }>("SELECT titulo, artista, cantidad, precio_unitario FROM compra_items WHERE compra_id = ?", [purchase.id]);
      result.push({ id: Number(purchase.id), total: Number(purchase.total), status: purchase.estado, ticketCode: purchase.codigo_ticket, purchasedAt: purchase.comprado_en, items });
    }
    res.json({ compras: result });
  }));

  app.get("/api/compras/:id/ticket", asyncRoute(async (req, res) => {
    const user = await requireAuth(req);
    const purchaseId = parsePositiveInt(req.params.id);
    const purchase = await rows<RowDataPacket & { id: number; total: number; codigo_ticket: string; comprado_en: Date }>("SELECT id, total, codigo_ticket, comprado_en FROM compras WHERE id = ? AND usuario_id = ? LIMIT 1", [purchaseId, user.id]);
    if (!purchase[0]) throw new ApiError(404, "Compra no encontrada.");
    const items = await rows<RowDataPacket & { titulo: string; artista: string; cantidad: number; precio_unitario: number }>("SELECT titulo, artista, cantidad, precio_unitario FROM compra_items WHERE compra_id = ?", [purchaseId]);
    const lines = ["VAULT-TEC // TICKET DE COMPRA", `CODIGO: ${purchase[0].codigo_ticket}`, `OPERADOR: ${user.nombre}`, `FECHA: ${new Date(purchase[0].comprado_en).toLocaleString("es-AR")}`, "------------------------------"];
    items.forEach(item => lines.push(`${item.cantidad} x ${item.titulo} - ${item.artista}`));
    lines.push("------------------------------", `TOTAL: $${Number(purchase[0].total).toFixed(2)}`, "GRACIAS POR USAR RADIO VAULT-TEC");
    const pdf = createTicketPdf(lines);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=ticket-${purchaseId}.pdf`);
    res.send(pdf);
  }));

  app.get("/api/admin/canciones", asyncRoute(async (req, res) => {
    await requireAdmin(req);
    const found = await rows<DbSong>("SELECT * FROM canciones ORDER BY id DESC");
    res.json({ canciones: found.map(song => publicSong(song)) });
  }));

  app.post("/api/admin/canciones", asyncRoute(async (req, res) => {
    await requireAdmin(req);
    const data = body(req);
    const titulo = requireBodyString(data, "title");
    const artista = requireBodyString(data, "artist");
    const genero = requireBodyString(data, "genre");
    const album = typeof data.album === "string" ? data.album.trim() : null;
    const duracion = Math.max(1, Number(data.durationSeconds) || 180);
    const precio = Math.max(0, Number(data.price) || 0);
    const portada = await normalizeCoverImage(data.coverImage);
    const result = await execute("INSERT INTO canciones (titulo, artista, album, genero, duracion_segundos, precio, imagen_portada, audio_url, descripcion, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)", [titulo, artista, album, genero, duracion, precio, portada, typeof data.audioUrl === "string" ? data.audioUrl : null, typeof data.description === "string" ? data.description : null]);
    res.status(201).json({ cancion: publicSong(await findSong(Number(result.insertId))) });
  }));

  app.put("/api/admin/canciones/:id", asyncRoute(async (req, res) => {
    await requireAdmin(req);
    const current = await findSong(parsePositiveInt(req.params.id));
    const data = body(req);
    const updates: string[] = [];
    const values: unknown[] = [];
    const fields: Array<[string, unknown]> = [
      ["titulo", data.title], ["artista", data.artist], ["album", data.album], ["genero", data.genre], ["duracion_segundos", data.durationSeconds], ["precio", data.price], ["audio_url", data.audioUrl], ["descripcion", data.description], ["activo", data.active],
    ];
    for (const [field, value] of fields) {
      if (value !== undefined) { updates.push(`${field} = ?`); values.push(value); }
    }
    if (data.coverImage !== undefined) { updates.push("imagen_portada = ?"); values.push(await normalizeCoverImage(data.coverImage)); }
    if (updates.length === 0) throw new ApiError(400, "No se enviaron cambios.");
    values.push(current.id);
    await execute(`UPDATE canciones SET ${updates.join(", ")} WHERE id = ?`, values);
    res.json({ cancion: publicSong(await findSong(current.id)) });
  }));

  app.delete("/api/admin/canciones/:id", asyncRoute(async (req, res) => {
    await requireAdmin(req);
    const song = await findSong(parsePositiveInt(req.params.id));
    await execute("UPDATE canciones SET activo = 0 WHERE id = ?", [song.id]);
    res.json({ ok: true, mensaje: "Canción archivada." });
  }));

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Error interno del servidor.";
    if (status === 500) console.error("[REST API]", error);
    res.status(status).json({ error: message });
  });
}
