<?php

namespace App\Services\AI\Contracts;

interface AIProviderInterface
{
    /**
     * Send chat prompt and message history to the AI provider.
     *
     * @param string $systemPrompt
     * @param array $messages Array of ['role' => 'user'|'assistant', 'content' => string]
     * @param array $options Model, temperature, max_tokens, etc.
     * @return array ['content' => string, 'provider' => string, 'model' => string, 'status' => 'success'|'error', 'error' => string|null]
     */
    public function chat(string $systemPrompt, array $messages, array $options = []): array;

    /**
     * Check if the provider has valid configuration / API keys.
     */
    public function isConfigured(): bool;

    /**
     * Get the human-readable identifier of this provider.
     */
    public function getName(): string;
}
