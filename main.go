package main

// Import du package qui gère le serveur
import (
	src "Groupie-Tracker/src/go" // Package contenant la logique du serveur
)

// Fonction principale - lance simplement le serveur
func main() {
	// Appelle la fonction qui démarre tout
	src.StartServer()
}
