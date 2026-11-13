package models

import (
	"math/rand"
	"sync"
	"time"
)

type Bottle struct {
	ID        string    `json:"id"`
	Message   string    `json:"message"`
	Author    string    `json:"author"`
	CreatedAt time.Time `json:"create_at"`
	Floating  bool      `json:"floating"`
}

type Ocean struct {
	mu       sync.RWMutex
	floating map[string]*Bottle
	drifted  map[string]*Bottle
}

func NewOcean() *Ocean {
	return &Ocean{
		floating: make(map[string]*Bottle),
		drifted:  make(map[string]*Bottle),
	}
}

func (o *Ocean) Throw(b *Bottle) {
	o.mu.Lock()
	b.Floating = true
	o.floating[b.ID] = b
	o.mu.Unlock()

	go func() {
		driftDuration := time.Duration(5+rand.Intn(26)) * time.Second
		time.Sleep(driftDuration)

		o.mu.Lock()
		defer o.mu.Unlock()
		if bottle, exists := o.floating[b.ID]; exists {
			bottle.Floating = false
			o.drifted[b.ID] = bottle
			delete(o.floating, b.ID)
		}
	}()
}

func (o *Ocean) Catch() (*Bottle, bool) {
	o.mu.Lock()
	defer o.mu.Unlock()

	for id, bottle := range o.drifted {
		delete(o.drifted, id)
		return bottle, true
	}
	return nil, false
}

func (o *Ocean) Stats() map[string]int {
	o.mu.RLock()
	defer o.mu.RUnlock()
	return map[string]int{
		"floating": len(o.floating),
		"drifted":  len(o.drifted),
		"total":    len(o.floating) + len(o.drifted),
	}
}
