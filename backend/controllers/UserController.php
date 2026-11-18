<?php

class UserController
{
    private User $users;

    public function __construct(User $users)
    {
        $this->users = $users;
    }

    public function login(array $data, bool $signup): void
    {
        $email = strtolower(trim(is_string($data['email'] ?? null) ? $data['email'] : ''));
        $password = is_string($data['password'] ?? null) ? $data['password'] : '';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
            throw new RuntimeException('Введите корректный email.', 422);
        }
        if (mb_strlen($password) < 8 || strlen($password) > 72 || str_contains($password, "\0")) {
            throw new RuntimeException('Пароль должен содержать от 8 символов и не больше 72 байт.', 422);
        }
        $user = $this->users->findByEmail($email);
        if ($signup) {
            if ($user) {
                throw new RuntimeException('Этот email уже зарегистрирован.', 409);
            }
            $id = $this->users->create('Пользователь', $email, $password);
        } else {
            if (!$user || !password_verify($password, $user['password'])) {
                throw new RuntimeException('Неверная почта или пароль.', 401);
            }
            if ($user['blocked']) {
                throw new RuntimeException('Учётная запись заблокирована.', 403);
            }
            $id = $user['id'];
        }
        session_regenerate_id(true);
        $_SESSION['uid'] = $id;
    }

    public function current()
    {
        $user = isset($_SESSION['uid']) ? $this->users->findById($_SESSION['uid']) : false;
        if ($user && $user['blocked']) {
            unset($_SESSION['uid']);
            return false;
        }
        return $user;
    }
}
