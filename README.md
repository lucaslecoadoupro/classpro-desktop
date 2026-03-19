# ClassPro Desktop

Logiciel parent de ClassPro — application Electron pour Windows & macOS.

## Présentation

ClassPro Desktop est l'application de bureau complémentaire à [ClassPro](https://github.com/...) (l'interface web utilisée en classe sur clé USB). Elle permet de :

- **Importer** le fichier JSON exporté depuis ClassPro
- **Visualiser** l'ensemble des données (classes, séances, bulletins, EDT…)
- **Éditer** les données hors-ligne : suivi de classe, carnet de bord, travaux non rendus, progression annuelle
- **Générer des PDF** : progression annuelle, carnet de bord, bulletins conseil de classe
- **Re-exporter** le JSON mis à jour pour ClassPro

## Flux de travail

```
ClassPro (clé USB)  →  💾 Exporter JSON  →  ClassPro Desktop (maison)
                                                    ↓ édite, génère PDF
ClassPro (clé USB)  ←  📂 Importer JSON  ←  ClassPro Desktop (maison)
```

## Modules disponibles

| Module | Statut | Description |
|---|---|---|
| 🏠 Accueil | ✅ | Dashboard, import/export JSON, fichiers récents |
| 📊 Données importées | ✅ | Visualisation complète du JSON (classes, séances, bulletins, EDT) |
| 👥 Suivi de classe | ✅ | Observations par séance, gestion des élèves, bilan individuel |
| 📓 Carnet de bord | ✅ | Fiches de cours par classe (objectifs, activités, absents, devoirs…) |
| 📋 Travaux non rendus | ✅ | Suivi du rendu des devoirs par élève |
| 📆 Progression annuelle | ✅ | Tableau libre avec colonnes personnalisables par classe |
| 🎓 Conseil de classe | ✅ | Tableau récap moyennes, fiche élève, vue par matière |
| 📄 PDF Carnet de bord | ✅ | Export PDF (1 fiche/page ou 4 fiches/page) |
| 📄 PDF Progression | ✅ | Export PDF paysage A4 par classe |
| 📄 PDF Bulletins | ✅ | Export PDF avec sélection élèves et options de contenu |

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
│       ├── app.js         ← Application React (3000+ lignes)
│       └── vendor/        ← Bibliothèques front-end (React, Babel, jsPDF)
├── assets/
│   ├── icons/
│   │   ├── mac/icon.icns  ← Icône macOS
│   │   ├── win/icon.ico   ← Icône Windows
│   │   └── png/           ← Icônes PNG toutes tailles
│   └── icon.png           ← Icône source 512×512
├── scripts/
│   └── make-icon.js       ← Générateur d'icône SVG
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
    "sc-classes":     "{...}",   // classes suivi
    "sc-sessions":    "{...}",   // séances suivi
    "cdc-devoirs":    "{...}",   // travaux non rendus
    "cdc-fiches":     "{...}",   // carnet de bord
    "cdc-plans":      "{...}",   // plan de classe
    "cdc-progs":      "{...}",   // progression annuelle
    "cdc-programmes": "{...}",   // thèmes programme
    "cdc-edt":        "{...}",   // emploi du temps
    "cdc-edt-refA":   "...",     // référence semaine A/B
    "cdc-liens":      "{...}",   // liens & raccourcis
    "dash-notes":     "{...}",   // notes tableau de bord
    "dash-taches":    "{...}"    // tâches tableau de bord
  }
}
```

## Roadmap

### ✅ Étape 1 — Scaffold de base
- Shell Electron (main + preload + renderer)
- Import / re-export JSON ClassPro
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

### 🔄 Étape 4 — À venir
- Précompilation JSX (Babel CLI) pour supprimer la dépendance vendor
- Modules PDF supplémentaires
- Synchronisation avancée avec ClassPro

### 📋 Étape 5 — Modules PDF complémentaires
- Modules PDF supplémentaires à définir

### 📋 Étape 6 — Créer un cours
- Possibilité d'ajouter des documents et de préparer le support de cours en avance
- Exporter le support en PDF

### 📋 Étape 7 — Gestion des paquets et BetaTest
- Test de la simplicité de l'utilisation
- Retour utilisateur et correctifs sous la dénomination **1.0.X**

---

## Pour la version 1.1

### 📋 Étape 8 — Profil du professeur
- Activer des modules en fonction de la discipline enseignée
- **ClassMath** — équations et géométrie
- **ClassScience** — schémas techniques
- **ClassLangue** — outils dédiés aux langues

### 🔬 Étape 9 — R&D module élève *(conditionnel)*
- Cette étape reste conditionnelle ; à définir selon les retours utilisateurs

---

© 2026 Lucas Le Coadou · Collège Alfred Crouzet, Servian
