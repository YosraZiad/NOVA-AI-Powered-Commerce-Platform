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
];
