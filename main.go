package main

import (
	"log"
	"os"

	"github.com/RandyTembe/Groupie-Tracker/server"
)

func main() {
	godotenv.Load()   
    InitDatabase()     
	

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000" 
	}

	addr := "0.0.0.0:" + port 
	log.Println("Starting server on", addr)

	s := server.NewServer(addr)
	if err := s.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
	http.HandleFunc("/favorites", favoritesPage)
    http.HandleFunc("/favorites/add", addFavorite)
    http.HandleFunc("/favorites/remove", removeFavorite)
}

