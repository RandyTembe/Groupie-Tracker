// i18n client-side module for language management

class I18n {
  constructor() {
    this.currentLang = 'fr';
    this.translations = {};
    this.init();
  }

  async init() {
    try {
      const response = await fetch('/api/i18n');
      if (response.ok) {
        const data = await response.json();
        this.currentLang = data.lang;
        this.translations = data.translations;
        localStorage.setItem('lang', this.currentLang);
        this.applyTranslations();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des traductions:', error);
    }
  }

  /**
   * Récupère une traduction
   * @param {string} key - La clé de la traduction
   * @param {string} lang - La langue (optionnel, utilise la langue actuelle)
   * @returns {string} La traduction ou la clé si non trouvée
   */
  t(key, lang = null) {
    const language = lang || this.currentLang;
    return this.translations[key] || key;
  }

  /**
   * Change la langue et recharge les traductions
   * @param {string} lang - Le code de langue (ex: 'fr', 'en', 'es')
   */
  setLanguage(lang) {
    if (lang !== this.currentLang) {
      this.currentLang = lang;
      localStorage.setItem('lang', lang);
      // Rediriger avec le paramètre de langue
      const url = new URL(window.location);
      url.searchParams.set('lang', lang);
      window.location.href = url.toString();
    }
  }

  /**
   * Applique les traductions à la page actuelle
   */
  applyTranslations() {
    // Mettre à jour le titre de la page
    document.title = this.t('title');

    // Mettre à jour les éléments avec l'attribut data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const text = this.t(key);
      
      // Ne pas modifier les liens (balises <a>)
      if (element.tagName === 'A') {
        if (element.hasAttribute('href')) {
          // Pour les liens, on ne change que le texte si ce n'est pas déjà un href valide
          element.textContent = text;
        }
      } else if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
        if (element.hasAttribute('placeholder')) {
          element.placeholder = text;
        } else {
          element.textContent = text;
        }
      } else {
        element.textContent = text;
      }
    });

    // Mettre à jour les attributs aria-label
    const ariaElements = document.querySelectorAll('[data-i18n-aria]');
    ariaElements.forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      element.setAttribute('aria-label', this.t(key));
    });
  }

  /**
   * Crée un sélecteur de langue
   * @returns {HTMLElement} L'élément du sélecteur de langue
   */
  createLanguageSwitcher() {
    const container = document.createElement('div');
    container.id = 'language-switcher';
    container.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      z-index: 2000;
      display: flex;
      gap: 8px;
      background: rgba(51, 51, 51, 0.9);
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #555;
    `;

    const languages = [
      { code: 'fr', label: '🇫🇷 FR' },
      { code: 'en', label: '🇬🇧 EN' },
      
    ];

    languages.forEach(lang => { // Créer un bouton pour chaque langue
      const button = document.createElement('button');
      button.textContent = lang.label;
      button.style.cssText = `
        background: ${lang.code === this.currentLang ? '#667eea' : 'transparent'};
        border: 1px solid ${lang.code === this.currentLang ? '#667eea' : '#555'};
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      `;
      button.addEventListener('click', () => this.setLanguage(lang.code));
      button.addEventListener('mouseenter', () => {
        button.style.background = '#667eea';
        button.style.borderColor = '#667eea';
      });
      button.addEventListener('mouseleave', () => {
        button.style.background = lang.code === this.currentLang ? '#667eea' : 'transparent';
        button.style.borderColor = lang.code === this.currentLang ? '#667eea' : '#555';
      });
      container.appendChild(button);
    });

    return container;
  }

  /**
   * Ajoute le sélecteur de langue à la page
   */
  addLanguageSwitcher() {
    const switcher = this.createLanguageSwitcher();
    document.body.insertBefore(switcher, document.body.firstChild);
  }
}

// Créer une instance globale
window.i18n = new I18n();