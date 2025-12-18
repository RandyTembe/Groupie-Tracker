
package server

import (
	"encoding/json"
	"io"
	"html/template"
	"log"
	"net/http"
	"net/url"
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
	Musique      string   `json:"musique"`
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
	// Try to load artists from api/artists.json so API data matches the homepage
	dataPath := filepath.Join(".", "api", "artists.json")
	if b, err := os.ReadFile(dataPath); err == nil {
		var artists []Artist
		if err := json.Unmarshal(b, &artists); err == nil && len(artists) > 0 {
			artistsStore.Lock()
			artistsStore.items = artists
			// compute next id
			maxID := 0
			for _, a := range artists {
				if a.ID > maxID {
					maxID = a.ID
				}
			}
			artistsStore.next = maxID + 1
			artistsStore.Unlock()
			return
		}
	}

	// Fallback: seed sample data if loading failed or file missing
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
	mux.HandleFunc("/groupes", groupesHandler)
	mux.HandleFunc("/historique", historiqueHandler)
	// Removed artist detail routes; we keep only modal on listing page
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir(filepath.Join(".", "static")))))
	mux.HandleFunc("/api", apiInfoHandler)
	mux.HandleFunc("/api/artists", artistsCollectionHandler)
	mux.HandleFunc("/api/artists/", artistsItemHandler)
	mux.HandleFunc("/api/i18n", i18nHandler)
	mux.HandleFunc("/api/proxy", proxyHandler)

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
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	// Servir la page d'accueil
	tmplPath := filepath.Join("templates", "home.html")
	http.ServeFile(w, r, tmplPath)
}

func groupesHandler(w http.ResponseWriter, r *http.Request) {
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

func historiqueHandler(w http.ResponseWriter, r *http.Request) {
	tmplPath := filepath.Join("templates", "historique.html")
	http.ServeFile(w, r, tmplPath)
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
		"proxy":   "/api/proxy?url=...",
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(info)
}

func i18nHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"lang":         "en",
		"translations": map[string]string{},
	})
}

// Artist detail page removed – kept via modal on listing

// proxyHandler sécurise l'accès aux endpoints externes nécessaires (dates/locations)
func proxyHandler(w http.ResponseWriter, r *http.Request) {
	raw := r.URL.Query().Get("url")
	if raw == "" {
		writeJSONError(w, http.StatusBadRequest, "missing url")
		return
	}
	u, err := url.Parse(raw)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid url")
		return
	}
	// Autoriser seulement l'API groupietrackers
	if u.Scheme != "https" || u.Host != "groupietrackers.herokuapp.com" || !strings.HasPrefix(u.Path, "/api/") {
		writeJSONError(w, http.StatusForbidden, "forbidden target")
		return
	}
	resp, err := http.Get(u.String())
	if err != nil {
		writeJSONError(w, http.StatusBadGateway, "upstream error")
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}
