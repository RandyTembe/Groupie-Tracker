package main

import (
    "log"
    "os"

    "github.com/RandyTembe/Groupie-Tracker/server"
)

func main() {
    // Récupère le port fourni par Scalingo
    port := os.Getenv("PORT")
    if port == "" {
        port = "3000" // fallback local pour tester en local
    }

    log.Println("BOOTING on port", port)

    s := server.NewServer(":" + port)
    if err := s.Start(); err != nil {
        log.Fatalf("server error: %v", err)
    }
}
