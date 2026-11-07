<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class NovaHealthCheck extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'nova:health';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform comprehensive production health check on database, storage, tenants, and AI services.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('====================================================');
        $this->info('   NOVA Commerce Platform — Production Health Check   ');
        $this->info('====================================================');

        $rows = [];
        $hasErrors = false;

        // 1. Environment & Mode
        $env = config('app.env');
        $debug = config('app.debug');
        $mode = config('nova.deployment_mode', 'hosted');
        $appKeySet = !empty(config('app.key'));

        $rows[] = ['Environment', $env, $env === 'production' ? 'OK' : 'Notice (Non-production)'];
        $rows[] = ['Debug Mode', $debug ? 'Enabled (Warning in Production)' : 'Disabled (Production-Safe)', $debug && $env === 'production' ? 'FAIL' : 'OK'];
        if ($debug && $env === 'production') $hasErrors = true;

        $rows[] = ['Application Key', $appKeySet ? 'Configured' : 'Missing', $appKeySet ? 'OK' : 'FAIL'];
        if (!$appKeySet) $hasErrors = true;

        $rows[] = ['Deployment Mode', $mode . ' (' . ($mode === 'standalone' ? 'Single Customer Store' : 'Centrally Hosted Multi-Tenant') . ')', 'OK'];

        // 2. Database Connectivity
        try {
            DB::connection()->getPdo();
            $tables = Schema::getTableListing();
            $tableCount = count($tables);
            $rows[] = ['Database Connection', 'Connected (' . config('database.default') . ')', 'OK'];
            $rows[] = ['Database Tables', $tableCount . ' tables present', $tableCount > 0 ? 'OK' : 'FAIL'];
            if ($tableCount === 0) $hasErrors = true;
        } catch (\Throwable $e) {
            $rows[] = ['Database Connection', 'Failed: ' . $e->getMessage(), 'FAIL'];
            $hasErrors = true;
        }

        // 3. Storage Writeability
        try {
            $testFilename = 'health_check_' . time() . '.tmp';
            Storage::disk('local')->put($testFilename, 'health_ok');
            $readBack = Storage::disk('local')->get($testFilename);
            Storage::disk('local')->delete($testFilename);

            $rows[] = ['Local Storage Disk', 'Writable & Readable', $readBack === 'health_ok' ? 'OK' : 'FAIL'];
            if ($readBack !== 'health_ok') $hasErrors = true;
        } catch (\Throwable $e) {
            $rows[] = ['Local Storage Disk', 'Storage Error: ' . $e->getMessage(), 'FAIL'];
            $hasErrors = true;
        }

        // 4. Multi-Tenant Status
        try {
            $activeTenants = Tenant::where('status', 'active')->count();
            $totalTenants = Tenant::count();
            $rows[] = ['Tenants', "{$activeTenants} active / {$totalTenants} total", $activeTenants > 0 ? 'OK' : 'Notice (Zero Active Tenants)'];
        } catch (\Throwable $e) {
            $rows[] = ['Tenants', 'Error querying tenants: ' . $e->getMessage(), 'FAIL'];
            $hasErrors = true;
        }

        // 5. AI Services Status
        $aiProvider = config('nova.ai.provider', 'auto');
        $hasOpenAi = !empty(config('nova.ai.openai_api_key'));
        $hasGemini = !empty(config('nova.ai.gemini_api_key'));

        $aiStatusDetail = "Mode: {$aiProvider} | OpenAI: " . ($hasOpenAi ? 'Configured' : 'None') . ' | Gemini: ' . ($hasGemini ? 'Configured' : 'None') . ' | Fallback: Deterministic Engine (Always Ready)';
        $rows[] = ['AI Subsystem', $aiStatusDetail, 'OK'];

        // Render Diagnostic Table
        $this->table(['Check Component', 'Status / Value', 'Result'], $rows);

        $this->newLine();
        if ($hasErrors) {
            $this->error('Health check completed with errors. Resolve reported items before production deployment.');
            return Command::FAILURE;
        }

        $this->info('All core production health checks passed successfully.');
        return Command::SUCCESS;
    }
}
