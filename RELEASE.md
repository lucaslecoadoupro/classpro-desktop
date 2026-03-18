# 🚀 Publier une nouvelle version de ClassPro Desktop

## La seule chose à faire pour sortir une release

### 1. Mettre à jour le numéro de version

Dans `package.json`, changer la ligne :
```json
"version": "1.0.0"
```
par la nouvelle version, ex :
```json
"version": "1.1.0"
```

### 2. Pousser le code + créer le tag

```bash
git add .
git commit -m "Release v1.1.0"
git tag v1.1.0
git push origin main --tags
```

### 3. C'est tout. ✅

GitHub Actions va automatiquement :
- Builder le `.exe` Windows sur une machine Windows
- Builder le `.dmg` macOS (Intel + Apple Silicon) sur une machine Mac
- Créer la Release sur GitHub avec les fichiers en téléchargement
- Rédiger les instructions de téléchargement pour les profs

**Délai : environ 5-10 minutes** après le `git push`.

---

## Où les profs téléchargent

Page Releases de ton repo GitHub :
```
https://github.com/TON_PSEUDO/classpro-desktop/releases/latest
```

Tu peux partager ce lien directement — il pointe toujours vers la dernière version.

---

## Numérotation des versions recommandée

| Type de changement | Exemple | Quand l'utiliser |
|---|---|---|
| Correctif / bugfix | `1.0.1` | Correction d'un bug sans nouvelle fonctionnalité |
| Nouvelle fonctionnalité | `1.1.0` | Ajout d'un module PDF, d'un éditeur… |
| Refonte majeure | `2.0.0` | Changement de format JSON, refonte complète |

---

## Note macOS — signature de l'app

Sans certificat Apple Developer (99$/an), le `.dmg` sera marqué "développeur non identifié".
Les profs devront faire **clic-droit → Ouvrir** la première fois seulement.

Pour lever cette contrainte à l'avenir : ajouter dans les secrets GitHub (`Settings → Secrets`) :
- `CSC_LINK` : certificat `.p12` encodé en base64
- `CSC_KEY_PASSWORD` : mot de passe du certificat

---

## Développement local (toi uniquement)

```bash
npm install    # une seule fois
npm start      # lancer l'app
npm run dev    # lancer avec DevTools ouvertes
```
