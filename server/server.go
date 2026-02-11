package server

import (
    "log"
    "net/http"
    "time"
)

// NewServer crée un serveur HTTP sur l'adresse passée (ex: ":3000" ou ":"+PORT)
func NewServer(addr string) *http.Server {
    mux := http.NewServeMux()

    // Exemple de route principale
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello, Groupie Tracker!"))
    })

    s := &http.Server{
        Addr:         addr,     // <- important : utilise le port dynamique
        Handler:      mux,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    log.Printf("Server configured to listen on %s\n", addr)
    return s
}

// Start démarre le serveur
func (s *http.Server) Start() error {
    log.Printf("Starting HTTP server on %s\n", s.Addr)
    return s.ListenAndServe()
}
