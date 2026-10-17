FROM php:8.2-cli-alpine

# Install system dependencies & PHP extensions
RUN apk add --no-cache \
    curl \
    git \
    nodejs \
    npm \
    sqlite \
    sqlite-dev \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_sqlite bcmath

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Install Node dependencies and compile frontend Vite assets
RUN npm install && npm run build

# Setup SQLite database and file permissions
RUN touch database/database.sqlite \
    && chmod -R 777 storage bootstrap/cache database

# Environment variables
ENV PORT=10000
ENV DB_CONNECTION=sqlite
ENV APP_ENV=production
ENV APP_DEBUG=false

EXPOSE 10000

# Run migrations, seeders, and start the application
CMD php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=${PORT}
