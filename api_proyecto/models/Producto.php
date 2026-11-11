<?php
declare(strict_types=1);
require_once __DIR__.'/../core/Model.php';
final class Producto extends Model {
 public function listar(?string $buscar=null): array { $sql='SELECT * FROM productos'; $args=[]; if($buscar){$sql.=' WHERE nombre LIKE :q OR descripcion LIKE :q';$args['q']="%$buscar%";} $sql.=' ORDER BY nombre'; $q=$this->pdo->prepare($sql);$q->execute($args);return $q->fetchAll(); }
 public function uno(int $id): ?array {$q=$this->pdo->prepare('SELECT * FROM productos WHERE id=?');$q->execute([$id]);return $q->fetch()?:null;}
 public function crear(array $d): int {$q=$this->pdo->prepare('INSERT INTO productos(nombre,descripcion,precio,imagen,creado) VALUES(?,?,?,?,NOW())');$q->execute([$d['nombre'],$d['descripcion']??'',(float)$d['precio'],$d['imagen']??null]);return (int)$this->pdo->lastInsertId();}
 public function editar(int $id,array $d): void {$q=$this->pdo->prepare('UPDATE productos SET nombre=?,descripcion=?,precio=?,imagen=? WHERE id=?');$q->execute([$d['nombre'],$d['descripcion']??'',(float)$d['precio'],$d['imagen']??null,$id]);}
 public function eliminar(int $id): void {$this->pdo->prepare('DELETE FROM productos WHERE id=?')->execute([$id]);}
}
