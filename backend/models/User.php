<?php

class User extends Model
{
    public function findByEmail(string $email)
    {
        return $this->query('SELECT * FROM users WHERE email = ?', [$email])->fetch();
    }

    public function findById(int $id)
    {
        return $this->query('SELECT id, name, email, role, blocked FROM users WHERE id = ?', [$id])->fetch();
    }

    public function create(string $name, string $email, string $password): int
    {
        $this->query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [
            $name, $email, password_hash($password, PASSWORD_DEFAULT)
        ]);
        return (int) $this->connect->lastInsertId();
    }

    public function rename(int $id, string $name): void
    {
        $this->query('UPDATE users SET name = ? WHERE id = ?', [$name, $id]);
    }
}
