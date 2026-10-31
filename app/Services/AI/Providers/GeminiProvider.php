<?php

namespace App\Services\AI\Providers;

use App\Services\AI\Contracts\AIProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class GeminiProvider implements AIProviderInterface
{
    protected ?string $apiKey;
    protected string $model;
    protected int $timeout;
    protected int $maxTokens;
    protected float $temperature;

    public function __construct(array $config = [])
    {
        $this->apiKey = $config['gemini_api_key'] ?? config('nova.ai.gemini_api_key');
        $this->model = $config['gemini_model'] ?? config('nova.ai.gemini_model', 'gemini-1.5-flash');
        $this->timeout = (int) ($config['timeout'] ?? config('nova.ai.timeout', 10));
        $this->maxTokens = (int) ($config['max_tokens'] ?? config('nova.ai.max_tokens', 600));
        $this->temperature = (float) ($config['temperature'] ?? config('nova.ai.temperature', 0.4));
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && is_string($this->apiKey) && strlen($this->apiKey) > 10;
    }

    public function getName(): string
    {
        return 'gemini';
    }

    public function chat(string $systemPrompt, array $messages, array $options = []): array
    {
        if (!$this->isConfigured()) {
            return [
                'content' => '',
                'provider' => $this->getName(),
                'model' => $this->model,
                'status' => 'error',
                'error' => 'Gemini API key is missing or not configured.',
            ];
        }

        $contents = [];
        foreach ($messages as $msg) {
            $contents[] = [
                'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [
                    ['text' => (string) ($msg['content'] ?? '')],
                ],
            ];
        }

        $payload = [
            'system_instruction' => [
                'parts' => [
                    ['text' => $systemPrompt],
                ],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'maxOutputTokens' => $this->maxTokens,
                'temperature' => $this->temperature,
            ],
        ];

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent";

        try {
            $response = Http::withHeaders([
                    'x-goog-api-key' => $this->apiKey,
                ])
                ->timeout($this->timeout)
                ->acceptJson()
                ->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();
                $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

                return [
                    'content' => trim($reply),
                    'provider' => $this->getName(),
                    'model' => $this->model,
                    'status' => 'success',
                    'error' => null,
                ];
            }

            Log::warning('Gemini API request failed with status: ' . $response->status());

            return [
                'content' => '',
                'provider' => $this->getName(),
                'model' => $this->model,
                'status' => 'error',
                'error' => 'Gemini API returned status ' . $response->status(),
            ];
        } catch (Throwable $e) {
            Log::warning('Gemini connection exception occurred during chat request.');

            return [
                'content' => '',
                'provider' => $this->getName(),
                'model' => $this->model,
                'status' => 'error',
                'error' => 'Connection or timeout error while contacting Gemini API.',
            ];
        }
    }
}
