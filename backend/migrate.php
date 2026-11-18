<?php
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require __DIR__ . '/classes/Database.php';
$file = is_file(__DIR__ . '/config.php') ? '/config.php' : '/config.environment.php';
try {
    $connect = (new Database())->connect(require __DIR__ . $file);
    $schema = file_get_contents(__DIR__ . '/schema.sql');
    // База уже создана Railway. Создаём только отсутствующие таблицы.
    $schema = preg_replace('/^CREATE DATABASE[^;]*;\s*USE[^;]*;/s', '', $schema);
    $connect->exec($schema);
    echo "Таблицы Хабитона готовы.\n";
} catch (Throwable $error) {
    fwrite(STDERR, "Не удалось подготовить таблицы. Проверьте DB_HOST, DB_PORT, DB_NAME, DB_USER и DB_PASSWORD.\n");
    exit(1);
}
