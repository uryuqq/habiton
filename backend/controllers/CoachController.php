<?php

class CoachController
{
    private Qwen $qwen;
    private Dialogue $dialogues;
    private Admin $admin;
    private Habit $habits;
    private PDO $connect;

    public function __construct(PDO $connect, Qwen $qwen, Dialogue $dialogues, Admin $admin, Habit $habits)
    {
        $this->connect = $connect;
        $this->qwen = $qwen;
        $this->dialogues = $dialogues;
        $this->admin = $admin;
        $this->habits = $habits;
    }

    public function send(int $userId, array $data): string
    {
        if (time() - ($_SESSION['last_ai'] ?? 0) < 4) {
            throw new RuntimeException('Подождите несколько секунд перед повтором.', 429);
        }
        $text = field($data, 'text', 500);
        $item = isset($data['id']) ? $this->dialogues->find($userId, itemId($data))
            : $this->dialogues->create($userId, mb_substr($text, 0, 80), 10);
        if ($item['saved']) {
            $item = $this->dialogues->create($userId, mb_substr($text, 0, 80), $item['minutes']);
        }
        $_SESSION['last_ai'] = time();
        $item['messages'][] = ['id' => newId(), 'role' => 'user', 'text' => $text];
        $this->dialogues->save($userId, $item);
        $prompt = $this->admin->instruction() . "\nПиши весь текст по-русски, используй кириллицу, цифры и обычные знаки препинания. Не вставляй иероглифы. Возвращай только JSON: "
            . '{"reply":"текст ответа","goal":"актуальная цель до 80 символов","plan":[{"title":"до 80 символов","note":"до 160 символов","category":"Обучение","days":[0,1,2,3,4,5,6],"time":"09:00"}]}. '
            . 'Если нужно уточнение, верни пустой plan. Когда данных достаточно, предложи 2–4 привычки. '
            . 'Поле goal должно описывать цель, которой соответствует предложенный план. Учитывай последние уточнения пользователя. '
            . 'Если пользователь явно сменил цель, используй новую. Если он уточнил время или расписание, сохрани смысл цели. '
            . 'category: Обучение, Движение, Отдых или Самочувствие. 0 — понедельник. '
            . 'Ранее указанная цель (может измениться): ' . $item['title'] . '. Доступно минут в день: ' . $item['minutes'] . '.';
        $messages = [['role' => 'system', 'content' => $prompt]];
        foreach (array_slice($item['messages'], -12) as $message) {
            $messages[] = ['role' => $message['role'], 'content' => $message['text']];
        }
        $start = microtime(true);
        $status = 'Успешно';
        try {
            $answer = $this->qwen->ask($messages);
            $plan = $answer['plan'] ?? [];
            if (!is_array($plan) || count($plan) > 4) {
                throw new RuntimeException('Qwen вернул непонятный план.', 502);
            }
            $item['plan'] = [];
            foreach ($plan as $entry) {
                try {
                    $item['plan'][] = habitFields(is_array($entry) ? $entry : []) + ['id' => newId(), 'selected' => true];
                } catch (RuntimeException $error) {
                    throw new RuntimeException('Qwen вернул непонятный план.', 502);
                }
            }
            $goal = is_string($answer['goal'] ?? null) ? Qwen::cleanText($answer['goal']) : '';
            if ($goal !== '') {
                $item['title'] = mb_substr($goal, 0, 80);
            }
            $item['planGoal'] = $item['plan'] && $goal !== '' ? $item['title'] : null;
            $item['messages'][] = ['id' => newId(), 'role' => 'assistant', 'text' => mb_substr(trim($answer['reply']), 0, 2000)];
            $this->dialogues->save($userId, $item);
        } catch (RuntimeException $error) {
            $status = $error->getCode() === 504 ? 'Тайм-аут' : 'Ошибка';
            throw $error;
        } finally {
            $this->admin->event((int) ((microtime(true) - $start) * 1000), $status);
        }
        return $item['id'];
    }

    public function plan(int $userId, array $data, bool $save): void
    {
        $id = itemId($data);
        $this->connect->beginTransaction();
        try {
            $item = $this->dialogues->find($userId, $id, true);
            if ($item['saved'] || !$item['plan']) {
                throw new RuntimeException('Нет плана для изменения.', 409);
            }
            if ($save) {
                $selected = array_filter($item['plan'], function ($entry) { return $entry['selected']; });
                if (!$selected) {
                    throw new RuntimeException('Выберите хотя бы одну привычку.', 422);
                }
                foreach ($selected as $entry) {
                    unset($entry['id']);
                    $this->habits->save($userId, $entry, today($data));
                }
                $item['saved'] = true;
            } else {
                $entries = $data['plan'] ?? [];
                if (!is_array($entries) || count($entries) !== count($item['plan'])) {
                    throw new RuntimeException('Некорректный план.', 422);
                }
                $plan = [];
                foreach (array_values($entries) as $index => $entry) {
                    if (!is_array($entry) || itemId($entry) !== $item['plan'][$index]['id']) {
                        throw new RuntimeException('Некорректный пункт плана.', 422);
                    }
                    $plan[] = habitFields($entry) + ['id' => itemId($entry), 'selected' => ($entry['selected'] ?? false) === true];
                }
                $item['plan'] = $plan;
            }
            $this->dialogues->save($userId, $item);
            $this->connect->commit();
        } catch (Throwable $error) {
            $this->connect->rollBack();
            throw $error;
        }
    }
}
