package main

import (
    "encoding/json"
    "html/template"
    "log"
    "net/http"
)

// Structure correspondant au JSON de l’API
type Artist struct {
    ID           int      `json:"id"`
    Image        string   `json:"image"`
    Name         string   `json:"name"`
    Members      []string `json:"members"`
    CreationDate int      `json:"creationDate"`
    FirstAlbum   string   `json:"firstAlbum"`
    Locations    string   `json:"locations"`
    ConcertDates string   `json:"concertDates"`
    Relations    string   `json:"relations"`
}

func main() {
    http.HandleFunc("/", homeHandler)

    // Pour les fichiers statiques (CSS)
    http.Handle("/api/", http.StripPrefix("/api/", http.FileServer(http.Dir("api"))))

    log.Println("Server started on http://localhost:8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    resp, err := http.Get("http://localhost:8080/api/artists.json")
    if err != nil {
        http.Error(w, "Erreur API", http.StatusInternalServerError)
        return
    }
    defer resp.Body.Close()

    var artists []Artist
    if err := json.NewDecoder(resp.Body).Decode(&artists); err != nil {
        http.Error(w, "Erreur JSON", http.StatusInternalServerError)
        return
    }

    tmpl, err := template.ParseFiles("templates/index.html")
    if err != nil {
        http.Error(w, "Erreur template", http.StatusInternalServerError)
        return
    }

    tmpl.Execute(w, artists)
}
