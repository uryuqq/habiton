<?php

function field(array $data, string $key, int $max, bool $required = true): string
{
    $value = $data[$key] ?? '';
    if (!is_string($value) || mb_strlen($value) > $max || ($required && trim($value) === '')) {
        throw new RuntimeException("Проверьте поле: $key.", 422);
    }
    return trim($value);
}

function itemId(array $data): string
{
    $id = field($data, 'id', 36);
    if (!preg_match('/^[a-zA-Z0-9-]+$/D', $id)) {
        throw new RuntimeException('Некорректный идентификатор.', 422);
    }
    return $id;
}

function habitFields(array $data): array
{
    $days = $data['days'] ?? null;
    $time = field($data, 'time', 5, false);
    if (!is_array($days) || !$days || count($days) > 7) {
        throw new RuntimeException('Выберите дни недели.', 422);
    }
    foreach ($days as $day) {
        if (!is_int($day) || $day < 0 || $day > 6) {
            throw new RuntimeException('Некорректные дни недели.', 422);
        }
    }
    if ($time !== '' && !preg_match('/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/D', $time)) {
        throw new RuntimeException('Введите корректное время.', 422);
    }
    $category = field($data, 'category', 40);
    if (!in_array($category, ['Самочувствие', 'Обучение', 'Движение', 'Отдых'], true)) {
        throw new RuntimeException('Выберите направление.', 422);
    }
    return [
        'title' => field($data, 'title', 80),
        'note' => field($data, 'note', 160, false),
        'category' => $category,
        'symbol' => field($data, 'symbol', 20, false) ?: 'book',
        'days' => array_values(array_unique($days)),
        'time' => $time,
    ];
}

function today(array $data): string
{
    $timezone = $data['timezone'] ?? 'Europe/Moscow';
    if (!in_array($timezone, ['Europe/Moscow', 'Europe/Kaliningrad', 'Asia/Yekaterinburg', 'Asia/Novosibirsk'], true)) {
        throw new RuntimeException('Неизвестный часовой пояс.', 422);
    }
    return (new DateTimeImmutable('now', new DateTimeZone($timezone)))->format('Y-m-d');
}

function newId(): string
{
    return bin2hex(random_bytes(16));
}
