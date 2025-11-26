package server

import (
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

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

type Server struct {
	srv *http.Server
}

var (
	artistsStore = struct {
		sync.Mutex
		items []Artist
		next  int
	}{
		items: nil,
		next:  1,
	}
)

func writeJSONError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

func init() {
	// Seed sample data si vide
	if len(artistsStore.items) == 0 {
		artistsStore.items = []Artist{
			{ID: 1, Image: "", Name: "Queen", Members: []string{"Freddie Mercury", "Brian May", "John Deacon", "Roger Taylor"}, CreationDate: 1970, FirstAlbum: "Queen", Locations: "London, UK", ConcertDates: "1973-07-13", Relations: "none"},
			{ID: 2, Image: "", Name: "Linkin Park", Members: []string{"Chester Bennington", "Mike Shinoda", "Brad Delson", "Dave Farrell", "Rob Bourdon", "Joe Hahn"}, CreationDate: 1996, FirstAlbum: "Hybrid Theory", Locations: "Agoura Hills, California, USA", ConcertDates: "2000-10-24", Relations: "nu metal"},
		}
		artistsStore.next = 3
	}
}

func NewServer(addr string) *Server {
	mux := http.NewServeMux()
	mux.HandleFunc("/", homeHandler)
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir(filepath.Join(".", "static")))))
	mux.HandleFunc("/api", apiInfoHandler)
	mux.HandleFunc("/api/artists", artistsCollectionHandler)
	mux.HandleFunc("/api/artists/", artistsItemHandler)

	srv := &http.Server{
		Addr:         addr,
		Handler:      corsMiddleware(mux),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}
	return &Server{srv: srv}
}

func (s *Server) Start() error {
	log.Printf("Server started on http://localhost%s", s.srv.Addr)
	return s.srv.ListenAndServe()
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	data, err := os.ReadFile(filepath.Join(".", "api", "artists.json"))
	if err != nil {
		http.Error(w, "Impossible de lire api/artists.json", http.StatusInternalServerError)
		return
	}
	var artists []Artist
	if err := json.Unmarshal(data, &artists); err != nil {
		http.Error(w, "Erreur JSON", http.StatusInternalServerError)
		return
	}

	tmpl, err := template.ParseFiles(filepath.Join("templates", "index.html"))
	if err != nil {
		http.Error(w, "Erreur template", http.StatusInternalServerError)
		return
	}

	_ = tmpl.Execute(w, artists)
}

func artistsCollectionHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		q := r.URL.Query().Get("name")
		artistsStore.Lock()
		list := make([]Artist, 0, len(artistsStore.items))
		for _, a := range artistsStore.items {
			if q == "" || strings.Contains(strings.ToLower(a.Name), strings.ToLower(q)) {
				list = append(list, a)
			}
		}
		artistsStore.Unlock()
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(list)
	case http.MethodPost:
		var a Artist
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid json")
			return
		}
		artistsStore.Lock()
		a.ID = artistsStore.next
		artistsStore.next++
		artistsStore.items = append(artistsStore.items, a)
		artistsStore.Unlock()
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(a)
	default:
		writeJSONError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func artistsItemHandler(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/artists/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id")
		return
	}
	switch r.Method {
	case http.MethodGet:
		artistsStore.Lock()
		defer artistsStore.Unlock()
		for _, a := range artistsStore.items {
			if a.ID == id {
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				_ = json.NewEncoder(w).Encode(a)
				return
			}
		}
		writeJSONError(w, http.StatusNotFound, "not found")
	case http.MethodPut:
		var updated Artist
		if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid json")
			return
		}
		artistsStore.Lock()
		defer artistsStore.Unlock()
		for i, a := range artistsStore.items {
			if a.ID == id {
				updated.ID = id
				artistsStore.items[i] = updated
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				_ = json.NewEncoder(w).Encode(updated)
				return
			}
		}
		writeJSONError(w, http.StatusNotFound, "not found")
	case http.MethodDelete:
		artistsStore.Lock()
		defer artistsStore.Unlock()
		for i, a := range artistsStore.items {
			if a.ID == id {
				artistsStore.items = append(artistsStore.items[:i], artistsStore.items[i+1:]...)
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}
		writeJSONError(w, http.StatusNotFound, "not found")
	default:
		writeJSONError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func apiInfoHandler(w http.ResponseWriter, r *http.Request) {
	info := map[string]string{
		"base":    "/api",
		"artists": "/api/artists",
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(info)
}