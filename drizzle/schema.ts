import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

/** Usuario técnico de Manus OAuth, conservado para la infraestructura del proyecto. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const tiendaUsuarios = mysqlTable("usuarios", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 180 }).notNull(),
  rol: mysqlEnum("rol", ["usuario", "admin"]).default("usuario").notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

export const canciones = mysqlTable("canciones", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 180 }).notNull(),
  artista: varchar("artista", { length: 180 }).notNull(),
  album: varchar("album", { length: 180 }),
  genero: varchar("genero", { length: 80 }).notNull(),
  duracionSegundos: int("duracion_segundos").default(180).notNull(),
  precio: decimal("precio", { precision: 10, scale: 2 }).default("0.00").notNull(),
  imagenPortada: text("imagen_portada"),
  audioUrl: text("audio_url"),
  descripcion: text("descripcion"),
  activo: int("activo").default(1).notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
  actualizadoEn: timestamp("actualizado_en").defaultNow().onUpdateNow().notNull(),
});

export const favoritos = mysqlTable("favoritos", {
  usuarioId: int("usuario_id").notNull(),
  cancionId: int("cancion_id").notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
}, table => ({ favoritoUnico: unique("favorito_unico").on(table.usuarioId, table.cancionId) }));

export const carritos = mysqlTable("carritos", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuario_id").notNull(),
  estado: mysqlEnum("estado", ["activo", "cerrado"]).default("activo").notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
  actualizadoEn: timestamp("actualizado_en").defaultNow().onUpdateNow().notNull(),
});

export const carritoItems = mysqlTable("carrito_items", {
  carritoId: int("carrito_id").notNull(),
  cancionId: int("cancion_id").notNull(),
  cantidad: int("cantidad").default(1).notNull(),
  precioUnitario: decimal("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  agregadoEn: timestamp("agregado_en").defaultNow().notNull(),
}, table => ({ itemUnico: unique("item_unico").on(table.carritoId, table.cancionId) }));

export const compras = mysqlTable("compras", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuario_id").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  estado: mysqlEnum("estado", ["pagada", "cancelada"]).default("pagada").notNull(),
  codigoTicket: varchar("codigo_ticket", { length: 80 }).notNull().unique(),
  compradoEn: timestamp("comprado_en").defaultNow().notNull(),
});

export const compraItems = mysqlTable("compra_items", {
  id: int("id").autoincrement().primaryKey(),
  compraId: int("compra_id").notNull(),
  cancionId: int("cancion_id").notNull(),
  titulo: varchar("titulo", { length: 180 }).notNull(),
  artista: varchar("artista", { length: 180 }).notNull(),
  precioUnitario: decimal("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  cantidad: int("cantidad").default(1).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type TiendaUsuario = typeof tiendaUsuarios.$inferSelect;
export type Cancion = typeof canciones.$inferSelect;
export type Favorito = typeof favoritos.$inferSelect;
export type Compra = typeof compras.$inferSelect;
