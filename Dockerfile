# Multi-stage Dockerfile para Frontend React + Vite

# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies para el build)
RUN npm install

# Copiar código fuente
COPY . .

# Build args para variables de entorno (se pasan desde docker-compose)
ARG VITE_API_URL=http://localhost:5000
ARG VITE_RUBRIC_WEBHOOK_URL
ARG VITE_GRADING_WEBHOOK_URL
ARG VITE_SPREADSHEET_WEBHOOK_URL
ARG VITE_BATCH_GRADING_WEBHOOK_URL

# Setear variables de entorno para el build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RUBRIC_WEBHOOK_URL=$VITE_RUBRIC_WEBHOOK_URL
ENV VITE_GRADING_WEBHOOK_URL=$VITE_GRADING_WEBHOOK_URL
ENV VITE_SPREADSHEET_WEBHOOK_URL=$VITE_SPREADSHEET_WEBHOOK_URL
ENV VITE_BATCH_GRADING_WEBHOOK_URL=$VITE_BATCH_GRADING_WEBHOOK_URL

# Compilar aplicación
RUN npm run build

# ============================================
# Stage 2: Production (nginx)
# ============================================
FROM nginx:alpine

# Copiar archivos compilados desde el stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Nginx corre en foreground por defecto
CMD ["nginx", "-g", "daemon off;"]
