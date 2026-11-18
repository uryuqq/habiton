FROM node:24-bookworm-slim AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN VITE_USE_BACKEND=true npm run build

FROM php:8.4-apache-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends libonig-dev libcurl4-openssl-dev \
    && docker-php-ext-install pdo_mysql mbstring curl \
    && rm -rf /var/lib/apt/lists/* \
    && sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf \
    && sed -i 's/:80>/:8080>/' /etc/apache2/sites-available/000-default.conf
COPY backend/classes/ /var/www/backend/classes/
COPY backend/controllers/ /var/www/backend/controllers/
COPY backend/models/ /var/www/backend/models/
COPY backend/public/ /var/www/backend/public/
COPY backend/config.environment.php /var/www/backend/config.environment.php
COPY backend/schema.sql backend/migrate.php /var/www/backend/
COPY --from=frontend /build/dist/ /var/www/html/
COPY deploy/api.php /var/www/html/api/index.php
EXPOSE 8080
CMD ["apache2-foreground"]
