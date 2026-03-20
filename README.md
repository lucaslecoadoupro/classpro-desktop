# ClassPro Desktop

Logiciel parent de ClassPro — application Electron pour Windows & macOS.

## Présentation

ClassPro Desktop est l'application de bureau complémentaire à [ClassPro](https://github.com/...) (l'interface web utilisée en classe sur clé USB). Elle permet de :

- **Importer** le fichier JSON exporté depuis ClassPro
- **Visualiser** l'ensemble des données (classes, séances, bulletins, EDT…)
- **Éditer** les données hors-ligne : suivi de classe, carnet de bord, travaux non rendus, progression annuelle
- **Préparer** ses cours en avance avec un éditeur de fiches riche
- **Planifier** son emploi du temps avec import PDF Pronote et liaison EDT ↔ cours
- **Générer des PDF** : progression annuelle, carnet de bord, bulletins conseil de classe
- **Re-exporter** le JSON mis à jour pour ClassPro

## Flux de travail

```
ClassPro (clé USB)  →  💾 Exporter JSON  →  ClassPro Desktop (maison)
                                                    ↓ édite, prépare, génère PDF
ClassPro (clé USB)  ←  📂 Importer JSON  ←  ClassPro Desktop (maison)
```

## Modules disponibles

### Vue générale
| Module | Statut | Description |
|---|---|---|
| 🏠 Accueil | ✅ | Dashboard, import/export JSON, création nouveau profil, fichiers récents |
| 📊 Données importées | ✅ | Visualisation complète du JSON (classes, séances, bulletins, EDT) |

### Gestion administrative
| Module | Statut | Description |
|---|---|---|
| 👥 Classes & élèves | ✅ | Création de classes, import liste depuis PRONOTE, gestion des élèves |
| 📅 Emploi du temps | ✅ | Grille hebdomadaire, import PDF Pronote, semaines A/B, automatisation fiches+suivi |

### Préparer
| Module | Statut | Description |
|---|---|---|
| ✏️ Créer un cours | ✅ | Éditeur de fiches (Markdown, drag & drop sections, pièces jointes, aperçu) |
| 📆 Progression annuelle | ✅ | Tableau libre avec colonnes personnalisables par classe |
| 🪑 Plan de classe | ✅ | Canvas drag & drop, placement élèves, tirage aléatoire, marquage binômes |

### Suivi pédagogique
| Module | Statut | Description |
|---|---|---|
| 👁️ Suivi de classe | ✅ | Observations par séance, gestion des élèves, bilan individuel |
| 📓 Carnet de bord | ✅ | Fiches de cours par classe (objectifs, activités, absents, devoirs…) |
| 📋 Travaux non rendus | ✅ | Suivi du rendu des devoirs par élève |
| 🎓 Conseil de classe | ✅ | Tableau récap moyennes, fiche élève, vue par matière |

### Génération PDF
| Module | Statut | Description |
|---|---|---|
| 📄 PDF Carnet de bord | ✅ | Export PDF (1 fiche/page ou 4 fiches/page) |
| 📄 PDF Progression | ✅ | Export PDF paysage A4 par classe |
| 📄 PDF Bulletins | ✅ | Export PDF avec sélection élèves et options de contenu |

### ClassPro Académie
| Module | Statut | Description |
|---|---|---|
| 🎓 Centre d'aide | ✅ | 10 guides interactifs avec moteur de recherche |

## Installation

### Prérequis

- [Node.js](https://nodejs.org/) 18+ et npm

### 1. Cloner le projet

```bash
git clone https://github.com/lucaslecoadoupro/classpro-desktop.git
cd classpro-desktop
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Télécharger les bibliothèques front-end

Les fichiers suivants doivent être placés dans `src/renderer/vendor/` :

| Fichier | URL |
|---|---|
| `react.production.min.js` | https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js |
| `react-dom.production.min.js` | https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js |
| `babel.min.js` | https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js |
| `jspdf.umd.min.js` | https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js |
| `pdf.min.js` | https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js |
| `pdf.worker.min.js` | https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js |

> `pdf.min.js` et `pdf.worker.min.js` sont nécessaires pour l'import PDF Pronote dans l'Emploi du temps.

### 4. Générer les icônes

```bash
# Générer le SVG source
node scripts/make-icon.js

# Convertir en PNG (nécessite librsvg : brew install librsvg)
rsvg-convert -w 512 -h 512 scripts/assets/icon-source.svg -o assets/icon.png

# Générer icns / ico / png pour toutes les tailles
npx electron-icon-builder --input=assets/icon.png --output=assets/
```

### 5. Lancer en mode développement

```bash
npm start
# ou avec DevTools ouvertes :
npm run dev
```

## Compiler une version distribuable

### macOS (.dmg)

```bash
npm run build:mac
```

### Windows (.exe installeur)

```bash
npm run build:win
```

### Les deux à la fois

```bash
npm run build:all
```

Les fichiers compilés sont générés dans le dossier `dist/`.

> **Note :** Le nom "Electron" visible dans la barre de menu macOS en mode développement est normal. Il sera remplacé par "ClassPro Desktop" dans la version compilée distribuée aux utilisateurs.

## Structure du projet

```
classpro-desktop/
├── src/
│   ├── main/
│   │   ├── main.js        ← Processus principal Electron (Node.js)
│   │   └── preload.js     ← Pont sécurisé main ↔ renderer
│   └── renderer/
│       ├── index.html     ← Point d'entrée UI
│       ├── style.css      ← Design system ClassPro
│       ├── config.js      ← NAV, helpers globaux, Toast
│       ├── shell.js       ← Sidebar + Shell principal
│       ├── modules/       ← Un fichier par module
│       │   ├── accueil.js
│       │   ├── donnees.js
│       │   ├── suivi.js
│       │   ├── carnet.js
│       │   ├── devoirs.js
│       │   ├── progression.js
│       │   ├── conseil.js
│       │   ├── classes.js
│       │   ├── cours.js
│       │   ├── edt.js
│       │   ├── plan-classe.js
│       │   ├── pdf-carnet.js
│       │   ├── pdf-bulletins.js
│       │   ├── pdf-progression.js
│       │   └── academie.js
│       └── vendor/        ← Bibliothèques front-end (React, Babel, jsPDF, pdf.js)
├── assets/
│   ├── icons/
│   │   ├── mac/icon.icns  ← Icône macOS
│   │   ├── win/icon.ico   ← Icône Windows
│   │   └── png/           ← Icônes PNG toutes tailles
│   └── icon.png           ← Icône source 512×512
├── scripts/
│   ├── make-icon.js       ← Générateur d'icône SVG
│   └── obfuscate.js       ← Obfuscation optionnelle (npm run obfuscate)
├── package.json
└── README.md
```

## Format JSON ClassPro

Le fichier JSON échangé entre ClassPro et ClassPro Desktop a la structure suivante :

```json
{
  "version": "6.5",
  "date": "2025-01-15T08:30:00.000Z",
  "entries": {
    "cdc-profile":    "{...}",   // profil enseignant
    "cdc-theme":      "light",   // thème
    "cdc-data":       "{...}",   // bulletins conseil de classe
    "sc-classes":     "{...}",   // classes et élèves
    "sc-sessions":    "{...}",   // séances suivi de classe
    "cdc-devoirs":    "{...}",   // travaux non rendus
    "cdc-fiches":     "{...}",   // carnet de bord
    "cdc-plans":      "{...}",   // plan de classe
    "cdc-progs":      "{...}",   // progression annuelle
    "cdc-programmes": "{...}",   // thèmes programme
    "cdc-edt":        "{...}",   // emploi du temps
    "cdc-edt-refA":   "...",     // référence semaine A/B
    "cdc-cours":      "{...}",   // cours préparés
    "cdc-liens":      "{...}",   // liens & raccourcis
    "dash-notes":     "{...}",   // notes tableau de bord
    "dash-taches":    "{...}",   // tâches tableau de bord
    "cdc-vacances":   "{...}",   // périodes de vacances scolaires (localStorage)
    "cdc-jours-annules": "{...}" // journées annulées avec motif (localStorage)
  }
}
```

## Roadmap

### ✅ Étape 1 — Scaffold de base
- Shell Electron (main + preload + renderer)
- Import / re-export JSON ClassPro
- Création d'un profil sans clé USB
- Vue des données importées (lecture)
- Design system fidèle à ClassPro

### ✅ Étape 2 — Modules pédagogiques
- Suivi de classe avec observations par séance
- Carnet de bord (fiches séance)
- Travaux non rendus
- Progression annuelle (tableau personnalisable)
- Conseil de classe (récap bulletins)

### ✅ Étape 3 — Génération PDF
- PDF Carnet de bord (1 fiche/page ou 4 fiches/page)
- PDF Progression annuelle (paysage A4)
- PDF Bulletins conseil de classe (sélection élèves + options contenu)

### ✅ Étape 4 — Gestion administrative & Emploi du temps
- Module Classes & élèves (import liste PRONOTE)
- Emploi du temps hebdomadaire avec grille horaire
- Import PDF Pronote (parser automatique semaines A/B)
- Automatisation création fiches + séances depuis l'EDT
- Gestion des vacances scolaires (overlay + exclusion automatisation)
- Journées annulées avec motif (malade, formation, férié, autre) via clic droit

### ✅ Étape 5 — Créer un cours
- Éditeur de fiches de préparation (sections drag & drop)
- Mise en forme Markdown (gras, italique, listes, titres)
- Pièces jointes (images, PDF, liens)
- Mode aperçu style document
- Liaison EDT ↔ cours (clic droit sur un créneau)

### ✅ ClassPro Académie
- Centre d'aide intégré avec 10 guides interactifs
- Moteur de recherche temps réel dans tous les guides

### ✅ Étape 6 — Plan de classe & Refacto
- Canvas drag & drop pour placer les tables et les élèves
- Placement élèves avec tirage aléatoire
- Marquage binômes (à éviter / à rapprocher)
- Refactorisation : découpe de `app.js` en modules séparés

### ✅ Étape 7 — BetaTest, correctifs & UX v1.0

#### Navigation & interface
- Sidebar : sections repliables/dépliables avec persistance `localStorage`
- Visite guidée corrigée (tooltip positionné au-dessus de la zone cible)
- Header EDT réordonné (navigation → fiches → vacances → import → ajouter → purger)

#### Gamification & fidélisation (`onboarding.js`)
- Wizard d'onboarding au premier lancement (5 étapes animées : identité, matières, mémo)
- Profil enseignant persisté en `localStorage` (`cpd-user-profile`)
- Mémo sécurisé : identifiant poste, mot de passe (masqué + bouton œil), code photocopieuse
- Système XP + 5 niveaux progressifs (Stagiaire → Expert ClassPro)
- 16 badges débloquables sur les actions clés (import EDT, création classe, PDF…)
- Widget profil en bas de sidebar (avatar initiales, barre XP, compteur badges)
- Modale profil complète (3 onglets : Profil · Badges · Mémo)
- Animation récompense élégante (toast animé à chaque badge/niveau débloqué)
- Fonction globale `cpdUnlockBadge(id)` appelable depuis n'importe quel module

---

## Pour la version 1.1

### 📋 Étape 8 — Profil du professeur & modules disciplinaires
- Activer des modules en fonction de la discipline enseignée
- **ClassMath** — équations et géométrie
- **ClassScience** — schémas techniques
- **ClassLangue** — outils dédiés aux langues
- Déclencher les badges restants depuis les modules (edt.js, classes.js, progression.js…)

### 🔬 Étape 9 — R&D module élève *(conditionnel)*
- Cette étape reste conditionnelle ; à définir selon les retours utilisateurs

---

© 2026 Lucas Le Coadou · Collège Alfred Crouzet, Servian
