<?php

class Qwen
{
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public static function cleanText(string $text): string
    {
        $text = preg_replace('/[\p{Han}\p{Hiragana}\p{Katakana}\p{Hangul}]+/u', ' ', $text);
        $text = preg_replace('/[ \t]+/u', ' ', $text);
        return trim(preg_replace('/ +([.,!?;:])/u', '$1', $text));
    }

    public function ask(array $messages): array
    {
        $url = $this->config['qwen_url'];
        $key = trim($this->config['qwen_key']);
        if (!$key || parse_url($url, PHP_URL_SCHEME) !== 'https') {
            throw new RuntimeException('На сервере не настроен Qwen.', 503);
        }
        $payload = [
            'model' => $this->config['qwen_model'],
            'messages' => $messages,
            'response_format' => ['type' => 'json_object'],
            'max_tokens' => 1200,
            'stream' => false,
        ];
        if (parse_url($url, PHP_URL_HOST) === 'api.groq.com') {
            $payload['reasoning_effort'] = 'none';
        } else {
            $payload['enable_thinking'] = false;
        }
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $key],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 25,
        ]);
        $body = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlCode = curl_errno($curl);
        $timedOut = $curlCode === CURLE_OPERATION_TIMEDOUT;
        curl_close($curl);
        if ($timedOut) {
            throw new RuntimeException('Qwen не успел ответить. Попробуйте ещё раз.', 504);
        }
        if ($status === 429) {
            throw new RuntimeException('Лимит запросов к Qwen исчерпан. Попробуйте позже.', 502);
        }
        if ($body === false) {
            error_log('Qwen connection failed: curl=' . $curlCode);
            throw new RuntimeException('Нет соединения с Qwen (cURL ' . $curlCode . ').', 502);
        }
        if ($status === 401) {
            throw new RuntimeException('Сервис Qwen отклонил API-ключ. Проверьте ключ на хостинге.', 502);
        }
        if ($status === 403) {
            throw new RuntimeException('Сервис Qwen запретил доступ с сервера (HTTP 403).', 502);
        }
        if ($status === 404) {
            throw new RuntimeException('Не найден адрес API или модель Qwen (HTTP 404).', 502);
        }
        if ($status === 400) {
            throw new RuntimeException('Qwen отклонил параметры запроса (HTTP 400).', 502);
        }
        if ($body === false || $status !== 200) {
            throw new RuntimeException('Qwen сейчас недоступен (HTTP ' . $status . '). Попробуйте позже.', 502);
        }
        $result = json_decode($body, true);
        $content = $result['choices'][0]['message']['content'] ?? '';
        $answer = is_string($content) ? json_decode($content, true) : null;
        if (is_array($answer) && is_string($answer['reply'] ?? null)) {
            $answer['reply'] = self::cleanText($answer['reply']);
        }
        if (!is_array($answer) || !is_string($answer['reply'] ?? null) || $answer['reply'] === '') {
            throw new RuntimeException('Qwen вернул непонятный ответ.', 502);
        }
        if (is_array($answer['plan'] ?? null)) {
            foreach ($answer['plan'] as &$item) {
                foreach (['title', 'note', 'category'] as $field) {
                    if (is_array($item) && is_string($item[$field] ?? null)) {
                        $item[$field] = self::cleanText($item[$field]);
                    }
                }
            }
            unset($item);
        }
        return $answer;
    }
}
