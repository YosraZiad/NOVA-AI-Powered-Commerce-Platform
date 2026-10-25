<?php

return [
    /*
    |--------------------------------------------------------------------------
    | NOVA Deployment Mode
    |--------------------------------------------------------------------------
    | 'standalone': Client-owned, independently deployed single-store installation.
    | 'hosted': Centrally managed multi-tenant store rental service.
    |
    */
    'deployment_mode' => env('NOVA_DEPLOYMENT_MODE', 'hosted'),

    /*
    |--------------------------------------------------------------------------
    | Default Store Currency
    |--------------------------------------------------------------------------
    */
    'default_currency' => env('NOVA_DEFAULT_CURRENCY', 'SAR'),

    /*
    |--------------------------------------------------------------------------
    | NOVA Customer AI Assistant Configuration
    |--------------------------------------------------------------------------
    | 'auto': Uses OpenAI if configured, otherwise Gemini if configured,
    |         otherwise falls back cleanly to the local deterministic shopping engine.
    | 'openai': Uses OpenAI chat completions API.
    | 'gemini': Uses Google Gemini REST API.
    | 'deterministic': Uses verified local catalog reasoning engine.
    |
    */
    'ai' => [
        'provider' => env('NOVA_AI_PROVIDER', 'auto'),
        'openai_api_key' => env('OPENAI_API_KEY'),
        'openai_model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
        'gemini_api_key' => env('GEMINI_API_KEY'),
        'gemini_model' => env('GEMINI_MODEL', 'gemini-1.5-flash'),
        'max_tokens' => (int) env('NOVA_AI_MAX_TOKENS', 600),
        'temperature' => (float) env('NOVA_AI_TEMPERATURE', 0.4),
        'timeout' => (int) env('NOVA_AI_TIMEOUT', 10),
        'rate_limit' => (int) env('NOVA_AI_RATE_LIMIT', 30),
    ],
];
