package i18n

import (
	"encoding/json"
	"net/http"
	"os"
)

type Translations map[string]map[string]string

var translations Translations

// LoadTranslations charge les traductions depuis le fichier JSON
func LoadTranslations(filePath string) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}
	
	return json.Unmarshal(data, &translations)
}

// Get retourne la traduction pour une clé et une langue données
func Get(lang, key string) string {
	if langMap, ok := translations[lang]; ok {
		if value, ok := langMap[key]; ok {
			return value
		}
	}
	return key // Retourne la clé si pas de traduction trouvée
}

// GetTranslations retourne toutes les traductions
func GetTranslations() Translations {
	return translations
}

// GetLanguage retourne la langue à partir de la requête HTTP (cookie ou header)
func GetLanguage(r *http.Request) string {
	// Vérifie le cookie
	if cookie, err := r.Cookie("language"); err == nil {
		return cookie.Value
	}
	
	// Par défaut, retourne le français
	return "fr"
}

// SetCookieLanguage définit un cookie de langue
func SetCookieLanguage(w http.ResponseWriter, lang string) {
	http.SetCookie(w, &http.Cookie{
		Name:   "language",
		Value:  lang,
		Path:   "/",
		MaxAge: 86400 * 365, // 1 an
	})
}

// GetAll retourne toutes les traductions pour toutes les langues
func GetAll() Translations {
	return translations
}
