# NOVA — Backup, Recovery & Maintenance Guide

This document describes the operational procedures for data protection, automated backups, disaster recovery, and system maintenance for the **NOVA — AI-Powered Commerce Platform**.

---

## 1. Backup Strategy Overview

A production NOVA deployment requires backing up two distinct components:
1. **Relational Database:** Stores tenants, users, roles, categories, products, variants, orders, order items, and audit records.
2. **File Storage:** Stores user-uploaded product images, catalog media, and tenant branding assets located in `storage/app/public`.

---

## 2. Automated Database Backup

NOVA includes an automated Artisan command designed for secure, database-agnostic snapshot generation:

```bash
php artisan nova:backup --retention-days=14
```

### Key Characteristics:
- **Location:** Snapshots are written to `storage/app/backups/nova_db_backup_YYYY-MM-DD_HHmmss.json`.
- **Security:** The `storage/app/backups` directory is strictly outside the web root (`public/`) and inaccessible via HTTP.
- **Automated Pruning:** Automatically deletes snapshots older than the specified retention threshold (default: 7 days).

### Scheduled Daily Backup (Cron)
Add the command to the Laravel scheduler or system crontab:
```cron
0 2 * * * cd /var/www/nova && php artisan nova:backup --retention-days=14 >> /var/www/nova/storage/logs/backup.log 2>&1
```

---

## 3. Native MySQL Backup (Recommended for High Volume)

In production environments with large product catalogs or high order volumes, MySQL native utilities (`mysqldump`) should be scheduled:

### Execution Command:
```bash
mysqldump -u nova_user -p --single-transaction --quick --routines --triggers \
    nova_production | gzip > /var/backups/nova/nova_db_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

### Why `--single-transaction`:
Ensures consistent read snapshots without locking database tables, allowing checkout and storefront browsing to continue uninterrupted during backup operations.

---

## 4. Media & Storage Backup

Uploaded product images and tenant assets must be backed up incrementally using `rsync` or cloud storage sync:

```bash
# Sync local media to offsite backup directory
rsync -avz --delete /var/www/nova/storage/app/public/ /var/backups/nova/media/
```

If utilizing AWS S3 or compatible object storage, enable S3 Object Versioning and Lifecycle Rules for automated retention.

---

## 5. Recovery & Restore Procedures

### Restoring Database from JSON Snapshot:
To restore data from a NOVA Artisan snapshot in a clean environment:
```bash
# Clear existing tables (staging/recovery environment)
php artisan migrate:fresh --force

# Seed base roles and permissions
php artisan db:seed --class=RolesAndPermissionsSeeder --force
```

### Restoring Database from MySQL Dump:
```bash
gunzip < /var/backups/nova/nova_db_20261107_020000.sql.gz | mysql -u nova_user -p nova_production
```

### Restoring Storage Media:
```bash
rsync -avz /var/backups/nova/media/ /var/www/nova/storage/app/public/
php artisan storage:link
```

---

## 6. Disaster Recovery & Health Verification

Following any database restoration or server failover, verify the system state:

```bash
# 1. Run production health check
php artisan nova:health

# 2. Re-cache application configurations
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 3. Test storefront status
curl -k -I https://your-domain.com/up
```

### Recommended Recovery Objectives:
- **Recovery Point Objective (RPO):** Maximum 24 hours (daily snapshot) or 1 hour if binary logging / WAL is enabled.
- **Recovery Time Objective (RTO):** Under 30 minutes to restore MySQL dump and reload web workers.
