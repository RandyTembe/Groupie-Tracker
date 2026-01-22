# Groupie Tracker

Contexte & objectif du projet
Groupie Tracker est une application web permettant de consomse servir d'une API fournie et d’afficher des informations sur des artistes, leurs membres, leurs dates et lieux de concerts.

Le projet consiste à récupérer, structurer et visualiser ces données sous forme de pages, cartes, listes  interactives.
Il inclut également la mise en place d’événements client–serveur permettant de déclencher des actions côté client et d’obtenir des réponses du serveur.
L’objectif est de produire un site professionnel clair et simple d utilisation.



Prérequis-Langage : Go 1.25.0
Outils : Git, vscode Github, copilot
Dépendances externes : aucune (uniquement la standard library Go)
Formats manipulés : JSON, HTML, CSS, JavaScript


Installation & exécution
VScode -> lien : http://localhost:8080

Cloner le dépôt
git clone https://github.com/RandyTembe/Groupie-Tracker.git

Lancer le serveur
go run main.go

Lancer les tests
go run nomfichier.go

Structure du dépôt: 

GROUPIE-TRACKER/
├── api/
│   ├── artists.json
│   ├── dates.json
│   ├── location.json
│   └── relation.json
├── CSS/
│   ├── artist.css
│   ├── historique.css
│   ├── map.css
│   └── styles.css
├── docs/
│   ├── API_Groupie_Tracker.pdf
│   ├── Groupie_Tracker_filter.pdf
│   ├── Groupie_Tracker_Geolocalization.pdf
│   ├── Groupie_Tracker_search_bar.pdf
│   └── Groupie_Tracker_Subject.pdf
├── js/
│   ├── app.js
│   └── map.js
├── server/
│   └── server.go
├── static/
│   └── img/
│       └── pub.png
├── templates/
│   ├── artist.html
│   ├── historique.html
│   ├── index.html
│   └── map.html
├── go.mod
├── main.go
└── README.md

Fonctions clés :
- Fonction geocode(place) 
Rôle : La fonction est utilisée pour placer les marqueurs des concerts sur la carte interactive du projet.
Signature : async function.

- Fonction d'affichage des artistes dans la carte
rôle: Génère et affiche la liste des artistes dans le panneau latéral gauche de la carte.
signature : function renderList

- Fonction qui securise les informations
rôle : sert à sécuriser les chaînes (noms, dates, membres) avant de les mettre dans la memoire de la page html
signature : function escapeHtml


Architectures compromis techniques :
Le projet adopte une architecture modulaire séparant la logique métier, l’interface.
Le choix de Go garantit des performances élevées et une gestion simple des tests, mais limite l’accès à certaines bibliothèques graphiques. 


Qualité : 
Presence d une carte interactive pour savoir ou se trouve les concerts mais aussi d'ou viennent les groupes ( leur nationalité). Également on peut écouter un titre pour connaitre le style de musique de l'artiste si on ne le connaît pas. De plus le client peut aller reserver ses tickets pour les concerts annoncés en 2026.


Limites connues & pistes d’amélioration: 
Pas de pay-pal ni de site en public
Pas de securisation de l'url

Améliorations possibles :
Ajout d un pay-pal avec une base de données
Système de favoris
Mode sombre  ou clair.

Crédits & licence
Développé par l équipe Voynier Romain , Humbert Chloé dans le cadre du projet Groupie Tracker.
API fournie par l’équipe pédagogique.
Licence : GitHub 