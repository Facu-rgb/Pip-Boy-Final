<?php
declare(strict_types=1);
require_once __DIR__.'/../core/Model.php'; require_once __DIR__.'/../utils/seguridad.php';
final class Usuario extends Model {
 public function crear(string $nombre,string $email,string $clave): array { $q=$this->pdo->prepare('INSERT INTO usuarios (nombre,email,contrasena,rol,creado) VALUES (:nombre,:email,:clave,\'user\',NOW())'); $q->execute(['nombre'=>$nombre,'email'=>$email,'clave'=>Hash::crear($clave)]); return $this->porId((int)$this->pdo->lastInsertId()); }
 public function porEmail(string $email): ?array { $q=$this->pdo->prepare('SELECT id,nombre,email,contrasena,rol FROM usuarios WHERE email=?'); $q->execute([$email]); return $q->fetch() ?: null; }
 public function porId(int $id): ?array { $q=$this->pdo->prepare('SELECT id,nombre,email,rol FROM usuarios WHERE id=?'); $q->execute([$id]); return $q->fetch() ?: null; }
 public function todos(): array { return $this->pdo->query('SELECT id,nombre,email,rol,creado FROM usuarios ORDER BY id DESC')->fetchAll(); }
}
