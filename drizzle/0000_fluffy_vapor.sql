CREATE TABLE `canciones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(180) NOT NULL,
	`artista` varchar(180) NOT NULL,
	`album` varchar(180),
	`genero` varchar(80) NOT NULL,
	`duracion_segundos` int NOT NULL DEFAULT 180,
	`precio` decimal(10,2) NOT NULL DEFAULT '0.00',
	`imagen_portada` text,
	`audio_url` text,
	`descripcion` text,
	`activo` int NOT NULL DEFAULT 1,
	`creado_en` timestamp NOT NULL DEFAULT (now()),
	`actualizado_en` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `canciones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `carrito_items` (
	`carrito_id` int NOT NULL,
	`cancion_id` int NOT NULL,
	`cantidad` int NOT NULL DEFAULT 1,
	`precio_unitario` decimal(10,2) NOT NULL,
	`agregado_en` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `item_unico` UNIQUE(`carrito_id`,`cancion_id`)
);
--> statement-breakpoint
CREATE TABLE `carritos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`estado` enum('activo','cerrado') NOT NULL DEFAULT 'activo',
	`creado_en` timestamp NOT NULL DEFAULT (now()),
	`actualizado_en` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carritos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compra_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`compra_id` int NOT NULL,
	`cancion_id` int NOT NULL,
	`titulo` varchar(180) NOT NULL,
	`artista` varchar(180) NOT NULL,
	`precio_unitario` decimal(10,2) NOT NULL,
	`cantidad` int NOT NULL DEFAULT 1,
	CONSTRAINT `compra_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`estado` enum('pagada','cancelada') NOT NULL DEFAULT 'pagada',
	`codigo_ticket` varchar(80) NOT NULL,
	`comprado_en` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compras_id` PRIMARY KEY(`id`),
	CONSTRAINT `compras_codigo_ticket_unique` UNIQUE(`codigo_ticket`)
);
--> statement-breakpoint
CREATE TABLE `favoritos` (
	`usuario_id` int NOT NULL,
	`cancion_id` int NOT NULL,
	`creado_en` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorito_unico` UNIQUE(`usuario_id`,`cancion_id`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(120) NOT NULL,
	`email` varchar(320) NOT NULL,
	`password_hash` varchar(180) NOT NULL,
	`rol` enum('usuario','admin') NOT NULL DEFAULT 'usuario',
	`creado_en` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `usuarios_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
