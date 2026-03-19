# ClassPro Desktop

Logiciel parent de ClassPro — application Electron pour Windows & macOS.

## Présentation

ClassPro Desktop est l'application de bureau complémentaire à [ClassPro](https://github.com/...) (l'interface web utilisée en classe sur clé USB). Elle permet de :

- **Importer** le fichier JSON exporté depuis ClassPro
- **Visualiser** l'ensemble des données (classes, séances, bulletins, EDT…)
- **Éditer** les données hors-ligne sur sa machine personnelle *(en développement)*
- **Générer des PDF** : progression annuelle, carnet de bord, bulletins… *(en développement)*
- **Re-exporter** le JSON mis à jour pour ClassPro

## Flux de travail

```
ClassPro (clé USB)  →  💾 Exporter JSON  →  ClassPro Desktop (maison)
                                                    ↓ édite, génère PDF
ClassPro (clé USB)  ←  📂 Importer JSON  ←  ClassPro Desktop (maison)
```

## Installation

### Prérequis

- [Node.js](https://nodejs.org/) 18+ et npm

### 1. Cloner / décompresser le projet

```bash
cd classpro-desktop
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Lancer en mode développement

```bash
npm start
# ou avec DevTools ouvertes :
npm run dev
```

## Compiler une version distribuable

### Windows (.exe installeur)

```bash
npm run build:win
```

### macOS (.dmg)

```bash
npm run build:mac
```

### Les deux à la fois

```bash
npm run build:all
```

Les fichiers compilés sont générés dans le dossier `dist/`.

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
│       └── app.js         ← Application React
├── assets/
│   ├── icon.ico           ← Icône Windows (à fournir)
│   └── icon.icns          ← Icône macOS (à fournir)
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

### Étape 1 ✅ — Scaffold de base
- Shell Electron (main + preload + renderer)
- Import / re-export JSON ClassPro
- Vue des données importées (lecture)
- Design system fidèle à ClassPro

### Étape 2 — Éditeur de données *(en cours)*
- Édition des classes et élèves
- Édition des séquences de progression
- Édition des fiches carnet de bord

### Étape 3 — Génération PDF Progression *(en cours)*
- Récapitulatif de progression annuelle par classe
- Export PDF mise en page propre

### Étape 4 — Génération PDF Carnet de bord *(en cours)*
- PDF des fiches séance
- Personnalisation de la mise en page

### Étape 5 — PDF Bulletins & Plan de classe *(en cours)*
- Export bulletins conseil de classe
- Plan de classe imprimable

### Étape 6 — Créer un cours 
- Possibilité d'ajouter des documents et de préparer le support de cours en avance 
- Exporter le support en PDF 

### Étape 7 — Gestion des paquets et BetaTest 
- Test de la simplicité de l'utilisation 
- Retour user et correctifs sous la dénomination 1.0.X 

## Pour la 1.1 

### Étape 8 — Profil du professeur 
- Activer des modules en fonction de la discipline enseignée 
- Module ClassMath pour pouvoir faire des équations ou de la géométrie, Module ClassScience pour faire des schémas techniques, Modules ClassLangue pour faire des outils de langue, ... 

### Étape 9 — R&D pour la sortie d'un module élève ? 
- Cette étape reste conditionnelle ; je ne sais pas si je vais la mener à terme 

---

© 2026 Lucas Le Coadou 
