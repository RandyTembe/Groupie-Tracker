package main

import (
    "log"
    "github.com/RandyTembe/Groupie-Tracker/server"
)

func main() {
    s := server.NewServer(":8080")
    if err := s.Start(); err != nil {
        log.Fatalf("server error: %v", err)
    }
}