<?php

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method !== 'GET' && $method !== 'POST') {
        respond(['error' => 'Метод не поддерживается.'], 405);
    }
    $action = $_GET['action'] ?? 'state';
    if ($method === 'POST' && ($_SERVER['HTTP_X_HABITON'] ?? '') !== '1') {
        respond(['error' => 'Запрос отклонён.'], 403);
    }

    require __DIR__ . '/../classes/Database.php';
    require __DIR__ . '/../classes/Model.php';
    require __DIR__ . '/../classes/Request.php';
    require __DIR__ . '/../classes/Validation.php';
    require __DIR__ . '/../classes/Qwen.php';
    require __DIR__ . '/../models/User.php';
    require __DIR__ . '/../models/Habit.php';
    require __DIR__ . '/../models/Dialogue.php';
    require __DIR__ . '/../models/Admin.php';
    require __DIR__ . '/../controllers/UserController.php';
    require __DIR__ . '/../controllers/CoachController.php';

    $configFile = __DIR__ . '/../config.php';
    if (!is_file($configFile) && getenv('DB_HOST')) {
        $configFile = __DIR__ . '/../config.environment.php';
    }
    if (!is_file($configFile)) {
        respond(['error' => 'Скопируйте config.example.php в config.php на сервере.'], 503);
    }
    $config = require $configFile;
    $input = $method === 'POST' ? (new Request())->json() : [];
    session_name('habiton');
    session_start([
        'use_strict_mode' => true,
        'cookie_httponly' => true,
        'cookie_secure' => getenv('APP_HTTPS') === 'true' || (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'cookie_samesite' => 'Lax',
    ]);
    $connect = (new Database())->connect($config);
    $users = new User($connect);
    $userController = new UserController($users);
    $habits = new Habit($connect);
    $dialogues = new Dialogue($connect);
    $admin = new Admin($connect);
    $coach = new CoachController($connect, new Qwen($config), $dialogues, $admin, $habits);
    $savedId = null;

    if ($method === 'GET' && $action !== 'state') {
        respond(['error' => 'Маршрут не найден.'], 404);
    }
    if ($method === 'POST' && in_array($action, ['login', 'signup'], true)) {
        $userController->login($input, $action === 'signup');
    }
    if ($method === 'POST' && $action === 'logout') {
        $_SESSION = [];
        session_destroy();
        respond(['data' => null]);
    }
    $user = $userController->current();
    if (!$user) {
        if ($method === 'GET') {
            respond(['data' => null]);
        }
        respond(['error' => 'Войдите в аккаунт.'], 401);
    }
    $uid = (int) $user['id'];
    if ($method === 'POST') {
        switch ($action) {
            case 'login':
            case 'signup':
                break;
            case 'profile':
                $users->rename($uid, field($input, 'name', 60));
                $user = $users->findById($uid);
                break;
            case 'habit':
                $savedId = $habits->save($uid, $input, today($input));
                break;
            case 'archive':
                $habits->archive($uid, itemId($input), today($input), ($input['restore'] ?? false) === true);
                break;
            case 'mark':
                if (!is_bool($input['done'] ?? null)) {
                    respond(['error' => 'Укажите состояние отметки.'], 422);
                }
                $habits->mark($uid, itemId($input), today($input), $input['done']);
                break;
            case 'dialogue':
                $minutes = $input['minutes'] ?? 10;
                if (!in_array($minutes, [5, 10, 15], true)) {
                    respond(['error' => 'Выберите доступное время.'], 422);
                }
                $savedId = $dialogues->create($uid, field($input, 'title', 120), $minutes)['id'];
                break;
            case 'message':
                try {
                    $savedId = $coach->send($uid, $input);
                } catch (RuntimeException $error) {
                    if (!in_array($error->getCode(), [502, 503, 504], true)) {
                        throw $error;
                    }
                    respond(['error' => $error->getMessage(), 'dialogues' => $dialogues->all($uid)], $error->getCode());
                }
                break;
            case 'plan':
            case 'save-plan':
                $coach->plan($uid, $input, $action === 'save-plan');
                break;
            case 'block':
            case 'template':
            case 'instruction':
                if ($user['role'] !== 'admin') {
                    respond(['error' => 'Недостаточно прав.'], 403);
                }
                $admin->change($uid, $action, $input);
                break;
            default:
                respond(['error' => 'Маршрут не найден.'], 404);
        }
    }

    $data = [
        'profile' => $user,
        'habits' => $habits->all($uid),
        'logs' => $habits->logs($uid),
        'dialogues' => $dialogues->all($uid),
        'users' => [], 'templates' => [], 'audit' => [], 'aiEvents' => [], 'instruction' => '',
    ];
    if ($user['role'] === 'admin') {
        $data = array_replace($data, $admin->data());
    }
    respond(['data' => $data, 'id' => $savedId]);
} catch (PDOException $error) {
    if (($error->errorInfo[1] ?? null) === 1062) {
        respond(['error' => 'Такая запись уже существует.'], 409);
    }
    error_log($error->getMessage());
    respond(['error' => 'Ошибка базы данных.'], 500);
} catch (RuntimeException $error) {
    $status = $error->getCode();
    respond(['error' => $status >= 400 && $status <= 599 ? $error->getMessage() : 'Ошибка приложения.'], $status >= 400 && $status <= 599 ? $status : 500);
} catch (Throwable $error) {
    error_log($error->getMessage());
    respond(['error' => 'Ошибка приложения.'], 500);
}
