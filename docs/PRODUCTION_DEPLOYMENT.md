# NOVA — Production Deployment Guide

This guide provides practical, step-by-step procedures to deploy **NOVA — AI-Powered Commerce Platform** to a real-world Linux / Ubuntu production server (NGINX, PHP 8.2+ FPM, MySQL 8.0, Redis).

---

## 1. Server Prerequisites

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Operating System** | Ubuntu 22.04 LTS or 24.04 LTS | Ubuntu 24.04 LTS |
| **CPU / RAM** | 2 vCPU, 4 GB RAM | 4 vCPU, 8 GB RAM |
| **PHP** | PHP 8.2 or 8.3 with FPM | PHP 8.2/8.3 with OPcache |
| **Database** | MySQL 8.0+ or MariaDB 10.11+ | Managed MySQL 8.0 with automated backups |
| **Web Server** | NGINX 1.18+ | NGINX with HTTP/2 and Brotli/Gzip |
| **Node.js** | Node.js 20.x LTS + NPM 10+ | Node.js 20.x LTS |
| **Extensions** | `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `json`, `mbstring`, `openssl`, `pcre`, `pdo_mysql`, `tokenizer`, `xml` |

---

## 2. Server Provisioning & Installation

### Step 1: Install System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx mysql-server git curl unzip ufw \
    php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-bcmath \
    php8.2-curl php8.2-zip php8.2-intl php8.2-redis
```

### Step 2: Install Composer
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### Step 3: Install Node.js & NPM
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 3. Application Deployment

### Step 1: Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/YosraZiad/NOVA-AI-Powered-Commerce-Platform.git nova
cd /var/www/nova
```

### Step 2: Configure Environment
```bash
sudo cp .env.example .env
sudo nano .env
```
Ensure the following production settings are set:
```dotenv
APP_NAME="NOVA — AI-Powered Commerce Platform"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nova_production
DB_USERNAME=nova_user
DB_PASSWORD="STRONG_DATABASE_PASSWORD"

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax

NOVA_DEPLOYMENT_MODE=hosted # or standalone
NOVA_DEFAULT_CURRENCY=SAR

NOVA_AI_PROVIDER=auto
OPENAI_API_KEY=sk-... # or leave blank for local deterministic engine
GEMINI_API_KEY=AIzaSy... # or leave blank
```

### Step 3: Install Backend Dependencies
```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate --force
```

### Step 4: Run Migrations & Seed Baseline Roles
```bash
php artisan migrate --force
php artisan db:seed --class=RolesAndPermissionsSeeder --force
```

### Step 5: Build Production Frontend Assets
```bash
npm ci
npm run build
```

### Step 6: Set Directory Permissions
```bash
sudo chown -R www-data:www-data /var/www/nova
sudo find /var/www/nova -type f -exec chmod 644 {} \;
sudo find /var/www/nova -type d -exec chmod 755 {} \;
sudo chmod -R 775 /var/www/nova/storage /var/www/nova/bootstrap/cache
```

### Step 7: Optimize Laravel Cache
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 4. NGINX & SSL Configuration

Create `/etc/nginx/sites-available/nova.conf`:
```nginx
server {
    listen 80;
    server_name your-domain.com *.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com *.your-domain.com;
    root /var/www/nova/public;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    index index.php index.html;
    charset utf-8;

    # Security Headers (Supplements application headers)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    # Deny access to sensitive files
    location ~ /\.(?!well-known).* {
        deny all;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
}
```

Enable site and restart NGINX:
```bash
sudo ln -s /etc/nginx/sites-available/nova.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Obtain SSL Certificate using Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d *.your-domain.com
```

---

## 5. Queue Workers & Scheduled Tasks

### Cron / Scheduled Tasks
Edit the crontab for `www-data`:
```bash
sudo crontab -u www-data -e
```
Add:
```cron
* * * * * cd /var/www/nova && php artisan schedule:run >> /dev/null 2>&1
```

### Queue Supervisor Configuration
Create `/etc/supervisor/conf.d/nova-worker.conf`:
```ini
[program:nova-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/nova/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/nova/storage/logs/worker.log
stopwaitsecs=3600
```
Update and start supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start nova-worker:*
```

---

## 6. Post-Deployment Verification

Execute the built-in production health check:
```bash
php artisan nova:health
```
Verify that:
1. `Environment` reports `production`.
2. `Debug Mode` reports `Disabled`.
3. `Database Connection` reports `Connected`.
4. `Local Storage Disk` reports `Writable & Readable`.
5. `AI Subsystem` reports active status.
