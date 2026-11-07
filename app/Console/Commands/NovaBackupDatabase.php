<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class NovaBackupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'nova:backup {--retention-days=7 : Number of days to retain backup snapshots}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a secure, timestamped backup snapshot of the database and prune old backups.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting NOVA database snapshot creation...');

        $backupDir = storage_path('app/backups');
        if (!File::isDirectory($backupDir)) {
            File::makeDirectory($backupDir, 0750, true);
        }

        $timestamp = date('Y-m-d_His');
        $backupFilename = "nova_db_backup_{$timestamp}.json";
        $backupPath = $backupDir . DIRECTORY_SEPARATOR . $backupFilename;

        try {
            $connection = DB::connection();
            $tables = Schema::getTableListing();
            $databaseName = $connection->getDatabaseName();

            $backupData = [
                'metadata' => [
                    'generated_at' => now()->toIso8601String(),
                    'database' => $databaseName,
                    'driver' => config('database.default'),
                    'app_version' => 'NOVA v1.0.0 (Production)',
                ],
                'tables' => [],
            ];

            foreach ($tables as $rawTableName) {
                if (!$rawTableName) continue;
                // Strip schema prefix if present (e.g. SQLite "main.tenants" -> "tenants")
                $cleanTableName = str_contains($rawTableName, '.') ? explode('.', $rawTableName)[1] : $rawTableName;
                $records = $connection->table($rawTableName)->get()->toArray();
                $backupData['tables'][$cleanTableName] = $records;
            }

            File::put($backupPath, json_encode($backupData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            $fileSize = round(File::size($backupPath) / 1024, 2);

            $this->info("Backup successfully generated: {$backupFilename} ({$fileSize} KB)");
            $this->line("Saved to: {$backupPath}");

            // Prune old backups older than retention days
            $retentionDays = (int) $this->option('retention-days');
            $cutoff = time() - ($retentionDays * 86400);
            $deletedCount = 0;

            foreach (File::files($backupDir) as $file) {
                if ($file->getMTime() < $cutoff) {
                    File::delete($file->getPathname());
                    $deletedCount++;
                }
            }

            if ($deletedCount > 0) {
                $this->info("Pruned {$deletedCount} expired backup file(s) older than {$retentionDays} days.");
            }

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Failed to create backup snapshot: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
