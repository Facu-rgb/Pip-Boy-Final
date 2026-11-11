<?php
declare(strict_types=1);

final class Bd {
    private static ?PDO $pdo = null;
    public static function conectar(): PDO {
        if (self::$pdo) return self::$pdo;
        $dsn = getenv('DATABASE_URL') ?: 'mysql:host=127.0.0.1;dbname=tienda;charset=utf8mb4';
        if (str_starts_with($dsn, 'mysql://')) {
            $u = parse_url($dsn);
            $dsn = 'mysql:host='.($u['host'] ?? '127.0.0.1').';port='.($u['port'] ?? 3306).';dbname='.ltrim($u['path'] ?? '/tienda','/').';charset=utf8mb4';
            self::$pdo = new PDO($dsn, $u['user'] ?? 'root', $u['pass'] ?? '', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
        } else {
            self::$pdo = new PDO($dsn, getenv('DB_USER') ?: 'root', getenv('DB_PASSWORD') ?: '', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
        }
        return self::$pdo;
    }
}
