<?php

class Model
{
    protected PDO $connect;

    public function __construct(PDO $connect)
    {
        $this->connect = $connect;
    }

    protected function query(string $sql, array $values = []): PDOStatement
    {
        $statement = $this->connect->prepare($sql);
        $statement->execute($values);
        return $statement;
    }
}
