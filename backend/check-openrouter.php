<?php
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
echo "API-ключ OpenRouter (ввод скрыт): ";
system('stty -echo');
try {
    $key = trim(fgets(STDIN));
} finally {
    system('stty echo');
    echo PHP_EOL;
}
if ($key === '') exit("Ключ не введён.\n");
$curl = curl_init('https://openrouter.ai/api/v1/chat/completions');
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $key],
    CURLOPT_POSTFIELDS => json_encode([
        'model' => 'openrouter/free',
        'messages' => [
            ['role' => 'system', 'content' => 'Верни только JSON: {"reply":"короткое приветствие по-русски","plan":[]}'],
            ['role' => 'user', 'content' => 'Привет'],
        ],
        'response_format' => ['type' => 'json_object'],
        'max_tokens' => 500,
        'provider' => ['require_parameters' => true],
    ], JSON_UNESCAPED_UNICODE),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 60,
]);
$body = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
echo 'HTTP ', $status, PHP_EOL;
$result = json_decode($body ?: '', true);
if (isset($result['error'])) {
    echo str_replace($key, '[скрыто]', json_encode($result['error'], JSON_UNESCAPED_UNICODE)), PHP_EOL;
} elseif (isset($result['choices'][0]['message']['content'])) {
    $answer = json_decode($result['choices'][0]['message']['content'], true);
    echo 'Модель: ', $result['model'] ?? 'не указана', PHP_EOL;
    echo 'JSON для Хабитона: ', is_array($answer) && is_string($answer['reply'] ?? null) && is_array($answer['plan'] ?? null) ? 'корректный' : 'некорректный', PHP_EOL;
} else {
    echo 'Неожиданный ответ.', PHP_EOL;
}
if (curl_errno($curl)) echo 'cURL: ', curl_errno($curl), PHP_EOL;
curl_close($curl);
