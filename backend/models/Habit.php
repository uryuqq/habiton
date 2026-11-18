<?php

class Habit extends Model
{
    public function all(int $userId): array
    {
        $rows = $this->query('SELECT details FROM habits WHERE user_id = ?', [$userId])->fetchAll();
        return array_map(function ($row) { return json_decode($row['details'], true); }, $rows);
    }

    public function logs(int $userId): array
    {
        return $this->query('SELECT habit_id AS habitId, date FROM logs WHERE user_id = ?', [$userId])->fetchAll();
    }

    public function find(int $userId, string $id): array
    {
        $row = $this->query('SELECT details FROM habits WHERE user_id = ? AND id = ?', [$userId, $id])->fetch();
        if (!$row) {
            throw new RuntimeException('Привычка не найдена.', 404);
        }
        return json_decode($row['details'], true);
    }

    public function save(int $userId, array $data, string $day): string
    {
        $habit = habitFields($data);
        $id = isset($data['id']) ? itemId($data) : newId();
        $previous = isset($data['id']) ? $this->find($userId, $id) : null;
        if ($previous && $previous['archivedOn']) {
            throw new RuntimeException('Сначала восстановите привычку.', 409);
        }
        $schedules = [];
        $yesterday = gmdate('Y-m-d', strtotime($day . ' UTC') - 86400);
        foreach ($previous['schedules'] ?? [] as $schedule) {
            if ($schedule['from'] >= $day) {
                continue;
            }
            $schedule['to'] = $schedule['to'] ?? $yesterday;
            $schedules[] = $schedule;
        }
        $schedules[] = ['from' => $day, 'to' => null, 'days' => $habit['days'], 'time' => $habit['time']];
        $habit += ['id' => $id, 'createdOn' => $previous['createdOn'] ?? $day, 'archivedOn' => null, 'schedules' => $schedules];
        $json = json_encode($habit, JSON_UNESCAPED_UNICODE);
        if ($previous) {
            $this->query('UPDATE habits SET details = ? WHERE user_id = ? AND id = ?', [$json, $userId, $id]);
        } else {
            $this->query('INSERT INTO habits (user_id, id, details) VALUES (?, ?, ?)', [$userId, $id, $json]);
        }
        return $id;
    }

    public function archive(int $userId, string $id, string $day, bool $restore): void
    {
        $habit = $this->find($userId, $id);
        if ($restore === !$habit['archivedOn']) {
            return;
        }
        if ($restore) {
            $habit['schedules'][] = ['from' => $day, 'to' => null, 'days' => $habit['days'], 'time' => $habit['time']];
        } else {
            foreach ($habit['schedules'] as &$schedule) {
                if (!$schedule['to']) {
                    $schedule['to'] = gmdate('Y-m-d', strtotime($day . ' UTC') - 86400);
                }
            }
            unset($schedule);
        }
        $habit['archivedOn'] = $restore ? null : $day;
        $this->query('UPDATE habits SET details = ? WHERE user_id = ? AND id = ?', [
            json_encode($habit, JSON_UNESCAPED_UNICODE), $userId, $id
        ]);
    }

    public function mark(int $userId, string $id, string $day, bool $done): void
    {
        $habit = $this->find($userId, $id);
        if ($done) {
            $weekday = (int) gmdate('N', strtotime($day . ' UTC')) - 1;
            $planned = false;
            foreach ($habit['schedules'] as $schedule) {
                if ($day >= $schedule['from'] && (!$schedule['to'] || $day <= $schedule['to'])
                    && in_array($weekday, $schedule['days'], true)) {
                    $planned = true;
                }
            }
            if (!$planned || $habit['archivedOn']) {
                throw new RuntimeException('Привычка не запланирована на сегодня.', 422);
            }
            $this->query('INSERT INTO logs (user_id, habit_id, date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE date = logs.date', [$userId, $id, $day]);
        } else {
            $this->query('DELETE FROM logs WHERE user_id = ? AND habit_id = ? AND date = ?', [$userId, $id, $day]);
        }
    }
}
