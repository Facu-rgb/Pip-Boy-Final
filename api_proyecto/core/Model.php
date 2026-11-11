<?php
declare(strict_types=1);
require_once __DIR__.'/../config/Bd.php';
abstract class Model { protected PDO $pdo; public function __construct(){ $this->pdo=Bd::conectar(); } }
