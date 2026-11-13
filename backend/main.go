package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/shanteve/go-bottle-api/handlers"
	"github.com/shanteve/go-bottle-api/models"
)

func main() {
	ocean := models.NewOcean()
	h := handlers.NewHandler(ocean)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/throw", h.ThrowHandler)
	mux.HandleFunc("/api/catch", h.CatchHandler)
	mux.HandleFunc("/api/stats", h.StatsHandler)
	mux.HandleFunc("/api/health", h.HealthHandler)

	handler := handlers.CORSMiddleware(mux)

	server := &http.Server{
		Addr:         ":8080",
		Handler:      handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	go func() {
		log.Println("Bottle api запущен на :8080")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Получен сигнал завершения, graceful shutdown...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server shutdown error: %v", err)
	}
	log.Println("Сервер остановлен")
}
