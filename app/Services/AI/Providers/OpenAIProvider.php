<?php

namespace App\Services\AI\Providers;

use App\Services\AI\Contracts\AIProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class OpenAIProvider implements AIProviderInterface
{
    protected ?string $apiKey;
    protected string $model;
    protected int $timeout;
    protected int $maxTokens;
    protected float $temperature;

    public function __construct(array $config = [])
    {
        $this->apiKey = $config['openai_api_key'] ?? config('nova.ai.openai_api_key');
        $this->model = $config['openai_model'] ?? config('nova.ai.openai_model', 'gpt-4o-mini');
        $this->timeout = (int) ($config['timeout'] ?? config('nova.ai.timeout', 10));
        $this->maxTokens = (int) ($config['max_tokens'] ?? config('nova.ai.max_tokens', 600));
        $this->temperature = (float) ($config['temperature'] ?? config('nova.ai.temperature', 0.4));
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && is_string($this->apiKey) && str_starts_with($this->apiKey, 'sk-');
    }

    public function getName(): string
    {
        return 'openai';
    }

    public function chat(string $systemPrompt, array $messages, array $options = []): array
    {
        if (!$this->isConfigured()) {
            return [
                'content' => '',
                'provider' => $this->getName(),
                'model' => $this->model,
                'status' => 'error',
                'error' => 'OpenAI API key is missing or not configured.',
            ];
        }

        $formattedMessages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        foreach ($messages as $msg) {
            $formattedMessages[] = [
                'role' => $msg['role'] === 'assistant' ? 'assistant' : 'user',
                'content' => (string) ($msg['content'] ?? ''),
            ];
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout($this->timeout)
                ->acceptJson()
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $options['model'] ?? $this->model,
                    'messages' => $formattedMessages,
                    'max_tokens' => $this->maxTokens,
                    'temperature' => $this->temperature,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $reply = $data['choices'][0]['message']['content'] ?? '';

                return [
                    'content' => trim($reply),
                    'provider' => $this->getName(),
                    'model' => $data['model'] ?? $this->model,
                    'status' => 'success',
                    'error' => null,
                ];
            }

            Log::warning('OpenAI API request failed with status: ' . $response->status());

            return [
                'content' => '',
                'provider' => $this->getName(),
                'model' => $this->model,
                'status' => 'error',
                'error' => 'OpenAI API returned status ' . $response->status(),
            ];
        } catch (Throwable $e) {
            Log::warning('OpenAI connection exception occurred during chat request.');

            return [
                'content' => '',
                'provider' => $this->getName(),
                'model' => $this->model,
                'status' => 'error',
                'error' => 'Connection or timeout error while contacting OpenAI API.',
            ];
        }
    }
}
