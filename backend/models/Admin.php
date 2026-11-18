<?php

class Admin extends Model
{
    public function instruction(): string
    {
        return $this->query("SELECT value FROM settings WHERE name = 'instruction'")->fetchColumn()
            ?: 'Помогай формировать небольшие привычки. Не давай медицинских рекомендаций.';
    }

    public function event(int $duration, string $status): void
    {
        $this->query('INSERT INTO ai_events (duration_ms, status) VALUES (?, ?)', [$duration, $status]);
    }

    public function data(): array
    {
        $templates = $this->query('SELECT details FROM templates ORDER BY id')->fetchAll();
        return [
            'users' => $this->query('SELECT id, email, role, blocked FROM users ORDER BY id')->fetchAll(),
            'templates' => array_map(function ($row) { return json_decode($row['details'], true); }, $templates),
            'audit' => $this->query("SELECT id, created_at AS date, action, 'Успешно' AS result FROM audit ORDER BY id DESC LIMIT 100")->fetchAll(),
            'aiEvents' => $this->query("SELECT id, CONCAT(ROUND(duration_ms / 1000, 2), ' с') AS duration, status, created_at AS date FROM ai_events ORDER BY id DESC LIMIT 100")->fetchAll(),
            'instruction' => $this->instruction(),
        ];
    }

    public function change(int $actor, string $action, array $data): void
    {
        if ($action === 'block') {
            $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);
            if (!$id || $id === $actor || !is_bool($data['blocked'] ?? null)) {
                throw new RuntimeException('Нельзя изменить эту учётную запись.', 422);
            }
            $row = $this->query("SELECT email FROM users WHERE id = ? AND role = 'user'", [$id])->fetch();
            if (!$row) {
                throw new RuntimeException('Пользователь не найден.', 404);
            }
            $this->query('UPDATE users SET blocked = ? WHERE id = ?', [(int) $data['blocked'], $id]);
            $message = ($data['blocked'] ? 'Блокировка ' : 'Разблокировка ') . $id;
        } elseif ($action === 'instruction') {
            $value = field($data, 'instruction', 4000);
            $this->query("INSERT INTO settings (name, value) VALUES ('instruction', ?) ON DUPLICATE KEY UPDATE value = ?", [$value, $value]);
            $message = 'Изменение инструкции ИИ';
        } else {
            $template = habitFields($data);
            $id = isset($data['id']) ? itemId($data) : newId();
            $template += ['id' => $id, 'active' => ($data['active'] ?? true) === true];
            $json = json_encode($template, JSON_UNESCAPED_UNICODE);
            $this->query('INSERT INTO templates (id, details) VALUES (?, ?) ON DUPLICATE KEY UPDATE details = ?', [$id, $json, $json]);
            $message = 'Сохранение шаблона «' . $template['title'] . '»';
        }
        $this->query('INSERT INTO audit (user_id, action) VALUES (?, ?)', [$actor, $message]);
    }
}
