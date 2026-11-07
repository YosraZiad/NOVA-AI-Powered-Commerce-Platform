# NOVA — Customer Handover & Ownership Transfer Guide

This document provides a complete checklist and procedure for transferring operational ownership of a **NOVA Commerce Platform** installation to the client or delivery partner.

---

## 1. Handover Checklist

| Item | Description | Responsible Party | Status |
| :--- | :--- | :--- | :---: |
| **Domain Control** | DNS management, registrar login, nameservers, SSL certificate renewal. | Client IT | [ ] |
| **Server Infrastructure** | Cloud/VPS root credentials, SSH keys, firewall rules, hosting billing. | Client Ops | [ ] |
| **Database Credentials** | MySQL root password, application database user, automated backup storage. | Client Ops | [ ] |
| **Platform Administrator** | Initial Platform Admin email, secure password reset, removal of vendor temporary keys. | Client Admin | [ ] |
| **AI Provider Keys** | Client OpenAI or Google Gemini account keys configured in `.env`. | Client Admin | [ ] |
| **SMTP / Mail Service** | Transactional email provider credentials (e.g., Mailgun, Postmark, Amazon SES). | Client Ops | [ ] |
| **Source Code Repository** | GitHub/GitLab repository ownership transfer or code archive delivery. | Client Lead | [ ] |

---

## 2. Administrator Account Transfer Procedure

### Step 1: Create the Client's Platform Admin Account
Run via Artisan CLI or use the secure seeder:
```bash
php artisan tinker
```
```php
$user = \App\Models\User::create([
    'name' => 'Owner Admin',
    'email' => 'client-admin@customer-domain.com',
    'password' => bcrypt('INITIAL_TEMPORARY_STRONG_PASSWORD'),
]);
$user->assignRole('Platform Admin');
```

### Step 2: Client Password Reset
1. Have the client log in at `/platform` and immediately update their password.
2. Confirm the client can access store metrics, tenant management, and user roles.

### Step 3: Decommission Vendor Accounts
Remove any temporary development accounts or rotate existing development passwords:
```php
\App\Models\User::where('email', 'dev-vendor@example.com')->delete();
```

---

## 3. Environment & Integration Credentials

The client must maintain a secure record of the following `.env` settings:
- `APP_KEY`: Application encryption key (never alter once orders exist).
- `DB_PASSWORD`: MySQL database password.
- `OPENAI_API_KEY` / `GEMINI_API_KEY`: Third-party AI model billing credentials.
- `MAIL_PASSWORD`: Transactional email delivery password.

---

## 4. Estimated Recurring Third-Party Costs

NOVA itself has **zero mandatory recurring software license fees**. The client is responsible only for infrastructure consumption:

| Service | Purpose | Estimated Monthly Cost |
| :--- | :--- | :--- |
| **VPS / Cloud Hosting** | 2–4 vCPU, 4–8 GB RAM (DigitalOcean, AWS, Hetzner) | \$15 – \$40 / month |
| **Domain Registration** | Store domain name (.com, .sa) | \$15 – \$35 / year |
| **Transactional Email** | Order confirmations & notifications (Postmark / SES) | Free – \$10 / month |
| **AI API Usage (Optional)** | OpenAI GPT-4o-mini / Google Gemini 1.5 Flash | Pay-as-you-go (\$1 – \$10 / month for typical volume) |
| **Deterministic AI (Local)** | Built-in offline AI fallback engine | **\$0 (Free / No External Cost)** |

---

## 5. Maintenance & Support Responsibilities

### Client Responsibilities:
- Monitoring server disk usage and log rotation (`storage/logs/laravel.log`).
- Ensuring database backup snapshots execute on schedule.
- Applying OS security updates (`sudo apt update && sudo apt upgrade`).
- Renewing domain registration and monitoring SSL certificate validity.

### Operational Escalation:
In the event of an operational issue, the client should run:
```bash
php artisan nova:health
```
If errors are reported in the diagnostic output, reference [`docs/PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) and [`docs/BACKUP_AND_RECOVERY.md`](./BACKUP_AND_RECOVERY.md) for corrective actions.
