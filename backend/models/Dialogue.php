<?php

class Dialogue extends Model
{
    public function all(int $userId): array
    {
        $rows = $this->query('SELECT details FROM dialogues WHERE user_id = ? ORDER BY created_at DESC, id', [$userId])->fetchAll();
        return array_map(function ($row) { return json_decode($row['details'], true); }, $rows);
    }

    public function find(int $userId, string $id, bool $lock = false): array
    {
        $sql = 'SELECT details FROM dialogues WHERE user_id = ? AND id = ?';
        if ($lock) {
            $sql .= ' FOR UPDATE';
        }
        $row = $this->query($sql, [$userId, $id])->fetch();
        if (!$row) {
            throw new RuntimeException('Диалог не найден.', 404);
        }
        return json_decode($row['details'], true);
    }

    public function create(int $userId, string $title, int $minutes): array
    {
        $item = [
            'id' => newId(), 'title' => $title, 'minutes' => $minutes,
            'messages' => [], 'plan' => [], 'saved' => false, 'createdAt' => gmdate(DATE_ATOM)
        ];
        $this->query('INSERT INTO dialogues (user_id, id, details) VALUES (?, ?, ?)', [
            $userId, $item['id'], json_encode($item, JSON_UNESCAPED_UNICODE)
        ]);
        return $item;
    }

    public function save(int $userId, array $item): void
    {
        $this->query('UPDATE dialogues SET details = ? WHERE user_id = ? AND id = ?', [
            json_encode($item, JSON_UNESCAPED_UNICODE), $userId, $item['id']
        ]);
    }
}
