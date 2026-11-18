<?php

class Request
{
    public function json(): array
    {
        if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
            throw new RuntimeException('Ожидается JSON.', 415);
        }
        $raw = file_get_contents('php://input', false, null, 0, 100001);
        $data = json_decode($raw, true);
        if (strlen($raw) > 100000 || !is_array($data)) {
            throw new RuntimeException('Некорректный запрос.', 400);
        }
        return $data;
    }
}
