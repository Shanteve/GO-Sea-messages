package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"time"
	"unicode/utf8"

	"github.com/shanteve/go-bottle-api/internal/models"
)

type Handler struct {
	ocean *models.Ocean
}

func NewHandler(ocean *models.Ocean) *Handler {
	return &Handler{ocean: ocean}
}

// Тело POST запроса - /throw
type ThrowRequest struct {
	Message string `json:"message"`
	Author  string `json:"author"`
}

func (h *Handler) ThrowHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ThrowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Message == "" {
		http.Error(w, "Message is required", http.StatusBadRequest)
		return
	}

	if utf8.RuneCountInString(req.Message) > 800 {
		http.Error(w, "Message cannot be longer than 800 chars", http.StatusBadRequest)
		return
	}

	idBytes := make([]byte, 8)
	rand.Read(idBytes)
	id := hex.EncodeToString(idBytes)

	bottle := &models.Bottle{
		ID:        id,
		Message:   req.Message,
		Author:    req.Author,
		CreatedAt: time.Now(),
	}

	h.ocean.Throw(bottle)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":         bottle.ID,
		"status":     "floating",
		"message":    "Бутылка брошена в океан! Ждите, пока доплывёт",
		"created_at": bottle.CreatedAt,
	})
}

func (h *Handler) CatchHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	bottle, found := h.ocean.Catch()

	if !found {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Океан пуст. Бросьте бутылку или подождите",
		})
		return
	}

	json.NewEncoder(w).Encode(bottle)
}

func (h *Handler) StatsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(h.ocean.Stats())
}

func (h *Handler) HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}

func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "https://deepsea.shanteve.tech")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		log.Printf("Host: %s | url: %s ", r.Host, r.URL.Path)

		next.ServeHTTP(w, r)
	})
}
