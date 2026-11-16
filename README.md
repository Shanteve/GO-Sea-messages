# 🌊 Sea messages

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Prometheus](https://img.shields.io/badge/Metrics-Prometheus-E6522C?style=flat&logo=prometheus)](https://prometheus.io/)

Инфраструктурный проект, демонстрирующий production-ready подход к разработке микросервисов с упором на DevOps best practices (наблюдаемость и безопасность).

## Данный проект задеплоен на мой личный сервер
Ссылка: https://deepsea.shanteve.tech/

## О проекте
Цель проекта - это API для имитации отложенной доставки сообщений через метафору "послания в бутылке". Сообщения не доставляются мгновенно: они проходят через этап "дрейфа" (5-30 секунд), управляемый TTL в Redis или горутинами Go, прежде чем стать доступными для получения.
Цель проекта: площадка для отработки архитектурных паттернов и инфраструктурных решений, которые встречаются в реальных продакшен-системах. Проект демонстрирует, как должен выглядеть современный микросервис:
- **Безопасность:** Бэкенд полностью скрыт за Nginx Reverse Proxy. Пользователь не имеет прямого доступа к Go-порту.
- **Защита от перегрузок:** Собственный Rate Limiter на уровне приложения (3 сек/IP).
- **Наблюдаемость:** Нативная интеграция с Prometheus (счетчики, gauge, гистограммы времени ответа).
- **Ресурсоэффективность:** Multistage Docker build (Alpine), non-root пользователь, строгие resource limits в Docker Compose.
- **Надежность:** Graceful shutdown для корректного завершения активных запросов при деплое.

## Архитектура
```text
[User Browser] 
      ↓ (HTTP/HTTPS)
[Nginx Reverse Proxy] ← (Rate Limiting, Gzip, Caching, Security Headers)
      ↓ (Internal Docker Network)
[Go API Server] ←→ [Redis] (TTL-based delayed queue persistence)
      ↓ (Scraping)
[Prometheus] (Metrics collection)
```

## Технический стек
- Backend: Go 1.22+ — http-сервер 
- Cache/Queue: Redis 7 — TTL-based отложенная очередь
- Metrics: Prometheus — мониторинг
- Reverse Proxy: Nginx — обратный прокси, безопасность и кэширование
- Frontend: React 18 + Vite 5 — современный UI
- Containerization: Docker Compose — изоляция проекта, multistage builds

## Как запустить локально
```bash
# Клонируем репозиторий
git clone https://github.com/Shanteve/GO-Sea-messages.git
cd GO-Sea-messages

# Запускаем весь стек
docker compose up --build -d

# Проверяем статус контейнеров
docker compose ps
```

Доступные эндпоинты:
- Frontend: http://localhost:81
- Backend: http://localhost:81/api
- Health Check: http://localhost:81/api/health