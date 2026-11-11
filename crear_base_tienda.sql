-- Base de datos para Radio Vault-Tec / Pip-Boy
-- Compatible con MySQL 8+ y MariaDB.
-- Ejecutar dentro de la base indicada por DATABASE_URL.

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(180) NOT NULL,
  rol ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS canciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(180) NOT NULL,
  artista VARCHAR(180) NOT NULL,
  album VARCHAR(180) NULL,
  genero VARCHAR(80) NOT NULL,
  duracion_segundos INT NOT NULL DEFAULT 180,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  imagen_portada TEXT NULL,
  audio_url TEXT NULL,
  descripcion TEXT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_canciones_filtro (artista, titulo, genero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id INT NOT NULL,
  cancion_id INT NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, cancion_id),
  CONSTRAINT fk_favoritos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_favoritos_cancion FOREIGN KEY (cancion_id) REFERENCES canciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS carritos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  estado ENUM('activo', 'cerrado') NOT NULL DEFAULT 'activo',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_carritos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_carritos_usuario_estado (usuario_id, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS carrito_items (
  carrito_id INT NOT NULL,
  cancion_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  agregado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (carrito_id, cancion_id),
  CONSTRAINT fk_carrito_items_carrito FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE,
  CONSTRAINT fk_carrito_items_cancion FOREIGN KEY (cancion_id) REFERENCES canciones(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado ENUM('pagada', 'cancelada') NOT NULL DEFAULT 'pagada',
  codigo_ticket VARCHAR(80) NOT NULL UNIQUE,
  comprado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_compras_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  INDEX idx_compras_usuario_fecha (usuario_id, comprado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compra_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  compra_id INT NOT NULL,
  cancion_id INT NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  artista VARCHAR(180) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_compra_items_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
  CONSTRAINT fk_compra_items_cancion FOREIGN KEY (cancion_id) REFERENCES canciones(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo inicial de radio para probar el frontend.
INSERT INTO canciones (titulo, artista, album, genero, duracion_segundos, precio, descripcion, activo)
SELECT * FROM (
  SELECT 'The Wanderer' AS titulo, 'Dion' AS artista, 'Vault Classics' AS album, 'CLÁSICOS' AS genero, 180 AS duracion_segundos, 120.00 AS precio, 'Una transmisión recuperada de antes de la guerra.' AS descripcion, 1 AS activo
  UNION ALL SELECT 'Maybe', 'The Ink Spots', 'Galaxy News', 'JAZZ', 165, 150.00, 'Señal suave para explorar el yermo.', 1
  UNION ALL SELECT 'Civilization', 'Danny Kaye', 'Radio Diamante', 'VARIEDADES', 190, 100.00, 'Registro sonoro con interferencia mínima.', 1
  UNION ALL SELECT 'Wanderer Protocol', 'Vault-Tec Orchestra', 'Protocolo 76', 'INSTRUMENTAL', 210, 200.00, 'Tema instrumental exclusivo del terminal.', 1
) AS inicial
WHERE NOT EXISTS (SELECT 1 FROM canciones LIMIT 1);

-- Para convertir un usuario en administrador:
-- UPDATE usuarios SET rol = 'admin' WHERE email = 'tu-correo@ejemplo.com';
