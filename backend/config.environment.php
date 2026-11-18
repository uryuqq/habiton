<?php
return [
    'db_host' => getenv('DB_HOST') ?: '',
    'db_port' => (int) (getenv('DB_PORT') ?: 3306),
    'db_name' => getenv('DB_NAME') ?: '',
    'db_user' => getenv('DB_USER') ?: '',
    'db_password' => getenv('DB_PASSWORD') ?: '',
    'qwen_url' => getenv('QWEN_URL') ?: 'https://api.groq.com/openai/v1/chat/completions',
    'qwen_key' => getenv('QWEN_KEY') ?: '',
    'qwen_model' => getenv('QWEN_MODEL') ?: 'qwen/qwen3.8-27b',
];
