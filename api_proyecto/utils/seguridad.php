<?php
declare(strict_types=1);
final class Response { public static function json(mixed $data, int $status=200): never { http_response_code($status); header('Content-Type: application/json; charset=utf-8'); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; } }
final class Hash { public static function crear(string $clave): string { return password_hash($clave, PASSWORD_DEFAULT); } public static function verificar(string $clave,string $hash): bool { return password_verify($clave,$hash); } }
final class Jwt {
    private static function secret(): string { return getenv('JWT_SECRET') ?: 'pipboy-clave-local-cambiar'; }
    public static function crear(array $payload): string { $h=self::b64(json_encode(['alg'=>'HS256','typ'=>'JWT'])); $p=self::b64(json_encode($payload)); $s=self::b64(hash_hmac('sha256', "$h.$p", self::secret(), true)); return "$h.$p.$s"; }
    public static function verificar(string $token): ?array { $partes=explode('.', $token); if(count($partes)!==3) return null; [$h,$p,$s]=$partes; $esperada=self::b64(hash_hmac('sha256', "$h.$p", self::secret(), true)); if(!hash_equals($esperada,$s)) return null; $data=json_decode(self::unb64($p),true); if(!$data || (($data['exp'] ?? 0) < time())) return null; return $data; }
    private static function b64(string $v): string { return rtrim(strtr(base64_encode($v), '+/', '-_'), '='); } private static function unb64(string $v): string { return base64_decode(strtr($v, '-_', '+/')) ?: ''; }
}
