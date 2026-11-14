FROM golang:1.26-alpine3.24 AS builder

WORKDIR /build

COPY go.mod go.sum* ./
RUN go mod download && go mod verify

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 \
    go build -o bottle-api ./cmd/app/

FROM alpine:3.24

RUN addgroup -S appgroup && adduser -S appuser -G appgroup -H -s /sbin/nologin

COPY --from=builder --chown=appuser:appgroup /build/bottle-api /app/bottle-api

USER appuser
WORKDIR /app
EXPOSE 8080

ENTRYPOINT [ "/app/bottle-api" ]