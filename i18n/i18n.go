package i18n

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"sync"
)

type Translations map[string]map[string]string

var (
	translations Translations
	mu           sync.RWMutex
)

// LoadTranslations charge les fichiers de traductions
func LoadTranslations(filePath string) error {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return err
	}

	translations = make(Translations)
	if err := json.Unmarshal(data, &translations); err != nil {
		return err
	}

	log.Println("✓ Traductions chargées:", len(translations), "langues disponibles")
	return nil
}

// GetLanguage extrait la langue de la requête
// Priorité: paramètre ?lang, cookie, header Accept-Language, défaut 'fr'
func GetLanguage(r *http.Request) string {
	// Vérifier le paramètre ?lang
	if lang := r.URL.Query().Get("lang"); lang != "" {
		if isValidLanguage(lang) {
			return lang
		}
	}

	// Vérifier le cookie
	if cookie, err := r.Cookie("lang"); err == nil && cookie.Value != "" {
		if isValidLanguage(cookie.Value) {
			return cookie.Value
		}
	}

	// Vérifier Accept-Language header
	if acceptLang := r.Header.Get("Accept-Language"); acceptLang != "" {
		if lang := parseAcceptLanguage(acceptLang); isValidLanguage(lang) {
			return lang
		}
	}

	// Défaut: français
	return "fr"
}

// isValidLanguage vérifie si la langue est disponible
func isValidLanguage(lang string) bool {
	mu.RLock()
	defer mu.RUnlock()
	_, exists := translations[lang]
	return exists
}

// parseAcceptLanguage extrait la langue depuis Accept-Language header
func parseAcceptLanguage(acceptLang string) string {
	parts := strings.Split(acceptLang, ",")
	if len(parts) > 0 {
		langPart := strings.TrimSpace(parts[0])
		if idx := strings.Index(langPart, ";"); idx > 0 {
			langPart = langPart[:idx]
		}
		langPart = strings.TrimSpace(langPart)
		if idx := strings.Index(langPart, "-"); idx > 0 {
			langPart = langPart[:idx]
		}
		return strings.ToLower(strings.TrimSpace(langPart))
	}
	return "fr"
}

// Get récupère une traduction pour une clé donnée et une langue
func Get(lang, key string) string {
	mu.RLock()
	defer mu.RUnlock()

	if langMap, ok := translations[lang]; ok {
		if value, ok := langMap[key]; ok {
			return value
		}
	}

	// Fallback à français
	if langMap, ok := translations["fr"]; ok {
		if value, ok := langMap[key]; ok {
			return value
		}
	}

	// Fallback à la clé elle-même
	return key
}

// GetAll retourne toutes les traductions pour une langue
func GetAll(lang string) map[string]string {
	mu.RLock()
	defer mu.RUnlock()

	if langMap, ok := translations[lang]; ok {
		return langMap
	}

	// Fallback à français
	if langMap, ok := translations["fr"]; ok {
		return langMap
	}

	return make(map[string]string)
}

// SetCookieLanguage définit le cookie de langue
func SetCookieLanguage(w http.ResponseWriter, lang string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "lang",
		Value:    lang,
		Path:     "/",
		MaxAge:   86400 * 30, // 30 jours
		HttpOnly: true,
	})
}
