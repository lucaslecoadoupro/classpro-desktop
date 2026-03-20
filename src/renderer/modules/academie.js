// ── MODULE CLASSPRO ACADÉMIE ──────────────────────────────────────────────────

const GUIDES = [
  {
    id: 'demarrage',
    icon: '🚀',
    titre: 'Démarrage rapide',
    tags: ['début', 'premier lancement', 'installation', 'démarrage'],
    sections: [
      {
        titre: 'Bienvenue dans ClassPro Desktop',
        contenu: `ClassPro Desktop est le logiciel complémentaire à ClassPro (l'outil web utilisé en classe). Il vous permet de travailler sur vos données depuis votre ordinateur personnel, sans connexion internet, et de générer des documents PDF professionnels.`,
      },
      {
        titre: '1. Lancer l\'application',
        contenu: `Au premier lancement, vous arrivez sur l'écran d'accueil. Vous verrez deux options :\n\n• Ouvrir un fichier ClassPro — pour charger un JSON exporté depuis ClassPro\n• Nouveau fichier — bientôt disponible`,
      },
      {
        titre: '2. Naviguer dans l\'interface',
        contenu: `L'interface est divisée en deux parties :\n\n• La sidebar à gauche — contient toute la navigation organisée en sections : Vue générale, Modules pédagogiques, Génération PDF, et ClassPro Académie\n• La zone principale à droite — affiche le module sélectionné\n\nEn bas de l'écran, vous trouvez un bouton Sauvegarder JSON pour exporter vos modifications, et un bouton pour basculer entre le thème clair et sombre.`,
      },
      {
        titre: '3. Premier pas recommandé',
        contenu: `Commencez par importer votre fichier JSON depuis ClassPro, puis explorez vos données dans "Données importées". Vous pourrez ensuite utiliser les différents modules pour enrichir votre suivi pédagogique.`,
      },
    ],
  },
  {
    id: 'import',
    icon: '📂',
    titre: 'Importer un fichier JSON',
    tags: ['import', 'json', 'fichier', 'ouvrir', 'charger', 'classpro'],
    sections: [
      {
        titre: 'Qu\'est-ce que le fichier JSON ClassPro ?',
        contenu: `ClassPro (l'outil web sur clé USB) exporte toutes vos données dans un fichier JSON unique. Ce fichier contient : votre profil, vos classes, séances, fiches de cours, bulletins, progression, emploi du temps et plus encore.`,
      },
      {
        titre: 'Comment exporter depuis ClassPro',
        contenu: `Dans ClassPro (sur votre clé USB ou navigateur) :\n\n1. Allez dans les Paramètres ou le menu principal\n2. Cherchez "Exporter" ou "Sauvegarder"\n3. Téléchargez le fichier JSON sur votre ordinateur\n\nLe nom du fichier ressemble à : ClassPro_NOM_PRENOM_date.json`,
      },
      {
        titre: 'Importer dans ClassPro Desktop',
        contenu: `Depuis l'écran d'accueil :\n\n1. Cliquez sur "Ouvrir un fichier ClassPro"\n2. Une fenêtre de sélection s'ouvre — naviguez jusqu'à votre fichier JSON\n3. Sélectionnez-le et cliquez sur Ouvrir\n\nAlternativement, utilisez le menu Fichier → Ouvrir un JSON ClassPro… ou le raccourci Cmd+O (Mac) / Ctrl+O (Windows).`,
      },
      {
        titre: 'Après l\'import',
        contenu: `Une fois le fichier chargé, vous êtes redirigé vers l'Accueil avec un résumé de vos données. Le nom du fichier apparaît en bas de la sidebar.\n\nVos fichiers récents sont mémorisés pour un accès rapide lors des prochains lancements.`,
      },
      {
        titre: 'Sauvegarder vos modifications',
        contenu: `Après avoir édité vos données dans les différents modules, cliquez sur "Sauvegarder JSON" en bas de l'écran (ou Cmd+S). Cela crée un nouveau fichier JSON que vous pouvez réimporter dans ClassPro pour mettre à jour vos données sur la clé.`,
      },
    ],
  },
  {
    id: 'suivi',
    icon: '👥',
    titre: 'Suivi de classe',
    tags: ['suivi', 'classe', 'séance', 'observation', 'élève', 'comportement'],
    sections: [
      {
        titre: 'À quoi sert le Suivi de classe ?',
        contenu: `Le module Suivi de classe vous permet d'enregistrer des observations pour chaque élève, séance par séance. C'est un outil de suivi comportemental et participatif qui vous donne une vue d'ensemble en un coup d'œil.`,
      },
      {
        titre: 'Les 6 observations disponibles',
        contenu: `Pour chaque élève et chaque séance, vous pouvez activer jusqu'à 6 types d'observations :\n\n💬 Bavardage\n📚 Manque de travail\n😶 Dispersé\n✋ Participation\n👍 Bon comportement\n⭐ Excellent`,
      },
      {
        titre: 'Créer une classe',
        contenu: `1. Cliquez sur "+ Classe" en haut à droite\n2. Saisissez le nom de la classe (ex: 3A, 5B…)\n3. Cliquez sur Créer\n\nVous pouvez créer autant de classes que nécessaire. Elles apparaissent dans la sidebar gauche du module.`,
      },
      {
        titre: 'Ajouter des élèves',
        contenu: `Sélectionnez une classe, puis allez dans l'onglet "Élèves" :\n\n• Ajout manuel — saisissez NOM Prénom et appuyez sur Entrée\n• Import liste — collez une liste (un élève par ligne, format NOM Prénom)`,
      },
      {
        titre: 'Enregistrer une séance',
        contenu: `1. Sélectionnez la classe souhaitée\n2. Cliquez sur "+ Séance"\n3. Choisissez la date et un label (ex: Cours, Interro, TP…)\n4. Cliquez sur Créer\n\nLa séance apparaît comme une nouvelle colonne dans le tableau.`,
      },
      {
        titre: 'Saisir des observations',
        contenu: `Dans l'onglet Observations, le tableau affiche tous vos élèves en lignes et vos séances en colonnes. Pour chaque cellule, cliquez sur un emoji pour l'activer (il s'illumine) ou le désactiver.\n\nCliquez sur le nom d'un élève pour voir son bilan complet sur toutes les séances.`,
      },
    ],
  },
  {
    id: 'carnet',
    icon: '📓',
    titre: 'Carnet de bord',
    tags: ['carnet', 'fiche', 'cours', 'séance', 'objectif', 'activité', 'absent'],
    sections: [
      {
        titre: 'À quoi sert le Carnet de bord ?',
        contenu: `Le Carnet de bord est votre journal de cours numérique. Pour chaque séance, vous pouvez noter les objectifs, le déroulement, les devoirs donnés, les documents utilisés, les points à revoir, et marquer les élèves absents.`,
      },
      {
        titre: 'Créer une fiche de cours',
        contenu: `1. Sélectionnez une classe dans le menu déroulant (en haut de la sidebar gauche)\n2. Cliquez sur "+ Nouvelle fiche"\n3. Saisissez un titre (ex: Séance 1 — Le présent de l'indicatif)\n4. Choisissez la date\n5. Cliquez sur Créer la fiche`,
      },
      {
        titre: 'Remplir une fiche',
        contenu: `La fiche est organisée en 6 champs :\n\n🎯 Objectifs — ce que les élèves doivent apprendre\n📝 Activité / Déroulement — comment se déroule la séance\n📚 Devoirs donnés — le travail à faire à la maison\n📄 Documents / Supports — les ressources utilisées\n🔄 À revoir — les notions à consolider\n⚠️ Incidents / Observations — remarques particulières\n\nRemplissez les champs souhaités et cliquez sur Sauvegarder.`,
      },
      {
        titre: 'Marquer les absents',
        contenu: `Si vous avez des élèves enregistrés dans votre classe (via le Suivi de classe), ils apparaissent dans la section "Absents". Cliquez sur un nom pour le marquer absent (il devient rouge). Cliquez à nouveau pour annuler.`,
      },
      {
        titre: 'Retrouver une fiche',
        contenu: `Toutes vos fiches sont listées dans la sidebar gauche, triées par date (la plus récente en premier). Utilisez la barre de recherche pour filtrer par titre ou date.`,
      },
    ],
  },
  {
    id: 'progression',
    icon: '📆',
    titre: 'Progression annuelle',
    tags: ['progression', 'séquence', 'tableau', 'colonne', 'annuelle', 'planification'],
    sections: [
      {
        titre: 'À quoi sert la Progression annuelle ?',
        contenu: `Ce module vous permet de planifier et visualiser votre progression pédagogique sur l'année. Chaque classe dispose d'un tableau personnalisable où vous organisez vos séquences avec les colonnes de votre choix.`,
      },
      {
        titre: 'Créer une progression pour une classe',
        contenu: `1. Sélectionnez une classe dans la sidebar gauche\n2. Si aucune progression n'existe, cliquez sur "+ Créer la progression"\n3. Un tableau vide s'ouvre avec des colonnes par défaut`,
      },
      {
        titre: 'Colonnes par défaut',
        contenu: `Le tableau démarre avec ces colonnes :\n\nN° — numéro de séquence\nTitre — nom de la séquence\nObjectifs — compétences visées\nSupport — manuel ou ressource\nDébut — date de début\nFin — date de fin\nDurée (h) — nombre d'heures\nÉvaluation — type d'éval\nRemarques — notes libres`,
      },
      {
        titre: 'Personnaliser les colonnes',
        contenu: `• Ajouter une colonne — cliquez sur "+ Colonne" et saisissez un nom\n• Renommer une colonne — cliquez sur l'icône ✏️ dans l'en-tête\n• Supprimer une colonne — cliquez sur × dans l'en-tête (les données sont perdues)\n• Réinitialiser — remet les colonnes par défaut (efface toutes les données)`,
      },
      {
        titre: 'Saisir et éditer les données',
        contenu: `Cliquez directement dans une cellule pour la modifier. Les colonnes de type "date" affichent un sélecteur de date. Appuyez sur Tab pour passer à la cellule suivante.\n\nAjoutez une ligne avec "+ Séquence" (en haut à droite ou en bas du tableau). Supprimez une ligne avec l'icône 🗑️ en fin de ligne.`,
      },
    ],
  },
  {
    id: 'conseil',
    icon: '🎓',
    titre: 'Conseil de classe',
    tags: ['conseil', 'bulletin', 'moyenne', 'note', 'élève', 'trimestre', 'appréciation'],
    sections: [
      {
        titre: 'À quoi sert le Conseil de classe ?',
        contenu: `Ce module exploite les données de bulletins importées depuis ClassPro. Il vous offre une vue analytique complète de votre classe pour préparer le conseil de classe : moyennes, évolutions, appréciations et orientations.`,
      },
      {
        titre: 'Les trois vues disponibles',
        contenu: `📊 Tableau récap — liste tous les élèves avec leur moyenne T1, T2, l'évolution, les absences et l'orientation. Cliquez sur un élève pour accéder à sa fiche détaillée.\n\n👤 Fiche élève — vue complète d'un élève : toutes ses notes par matière (T1 et T2), l'évolution par discipline, et l'appréciation générale du conseil.\n\n📚 Par matière — grille élèves × matières avec code couleur des notes pour repérer d'un coup d'œil les forces et faiblesses de la classe.`,
      },
      {
        titre: 'Code couleur des moyennes',
        contenu: `Les notes sont colorées automatiquement :\n\n🟢 Vert — 16/20 et plus (très bien)\n🔵 Bleu — 12 à 16/20 (bien)\n🟡 Orange — 10 à 12/20 (passable)\n🔴 Rouge — moins de 10/20 (insuffisant)`,
      },
      {
        titre: 'Filtrer par pôle',
        contenu: `Dans les vues "Fiche élève" et "Par matière", un menu déroulant vous permet de filtrer les matières par pôle (artistique, littéraire, scientifique) pour une analyse ciblée.`,
      },
      {
        titre: 'Rechercher un élève',
        contenu: `La barre de recherche en haut à droite filtre les élèves en temps réel dans toutes les vues. Tapez quelques lettres du nom pour retrouver rapidement un élève.`,
      },
    ],
  },
  {
    id: 'pdf',
    icon: '📄',
    titre: 'Générer un PDF',
    tags: ['pdf', 'export', 'imprimer', 'bulletin', 'carnet', 'progression', 'génération'],
    sections: [
      {
        titre: 'Les trois modules PDF',
        contenu: `ClassPro Desktop propose trois générateurs PDF accessibles depuis la section "Génération PDF" de la sidebar :\n\n📄 PDF Progression — tableau de progression par classe (format paysage)\n📄 PDF Carnet de bord — fiches de cours (1 ou 4 par page)\n📄 PDF Bulletins — récapitulatif conseil de classe par élève`,
      },
      {
        titre: 'PDF Carnet de bord',
        contenu: `1. Sélectionnez la classe à exporter\n2. Choisissez le format :\n   • Une fiche par page — détaillé, idéal pour imprimer individuellement\n   • 4 fiches par page — compact, pratique pour avoir un aperçu\n3. Vérifiez la liste des fiches dans l'aperçu\n4. Cliquez sur "Générer le PDF"\n5. Choisissez où sauvegarder le fichier`,
      },
      {
        titre: 'PDF Progression',
        contenu: `1. Choisissez le mode d'export :\n   • Toutes les classes — un PDF avec une page par classe\n   • Sélection manuelle — cochez les classes souhaitées\n2. Les classes sans progression apparaissent grisées (non exportables)\n3. Cliquez sur "Générer le PDF"`,
      },
      {
        titre: 'PDF Bulletins',
        contenu: `1. Sélectionnez la classe (si vous avez plusieurs classes dans les bulletins)\n2. Choisissez le contenu à inclure en activant/désactivant les options :\n   Moyennes T1/T2, Notes par matière, Moyenne classe, Appréciation générale, Absences/Retards, Orientation\n3. Choisissez les élèves :\n   • Tous les élèves — export complet\n   • Sélection manuelle — cochez les élèves souhaités\n4. Cliquez sur "Générer le PDF"`,
      },
      {
        titre: 'Prérequis pour les PDF',
        contenu: `Les modules PDF nécessitent la bibliothèque jsPDF. Si le bouton "Générer" ne répond pas, vérifiez que le fichier vendor/jspdf.umd.min.js est bien présent dans src/renderer/vendor/ et qu'il est chargé dans index.html.`,
      },
    ],
  },
  {
    id: 'classes-eleves',
    icon: '👥',
    titre: 'Classes et élèves',
    tags: ['classe', 'eleve', 'liste', 'pronote', 'import', 'gestion'],
    sections: [
      {
        titre: 'À quoi sert ce module ?',
        contenu: `Le module Classes et élèves (Gestion administrative) vous permet de créer et gérer vos classes indépendamment de ClassPro sur clé USB. C'est le point de départ si vous utilisez ClassPro Desktop en premier, avant d'avoir exporté un JSON.`,
      },
      {
        titre: 'Créer une classe',
        contenu: `1. Cliquez sur "+ Nouvelle classe" en haut à droite\n2. Saisissez le nom de la classe (ex : 3A, 5B, Terminale)\n3. Cliquez sur "Créer la classe"\n4. Une fenêtre s'ouvre immédiatement pour importer la liste des élèves`,
      },
      {
        titre: 'Importer la liste depuis PRONOTE',
        contenu: `Après la création d'une classe, une fenêtre d'import s'ouvre automatiquement.\n\nComment récupérer la liste depuis PRONOTE :\n1. Allez sur PRONOTE (version web)\n2. Mes données → Liste d'élèves\n3. Sélectionnez la classe souhaitée\n4. Cliquez sur l'icône des carrés entremêlés (en haut à droite) pour copier le CSV\n5. Collez la première colonne (noms) dans le champ de ClassPro Desktop\n6. Cliquez sur Importer\n\nLe compteur d'élèves détectés s'affiche en temps réel pendant la saisie.`,
      },
      {
        titre: 'Ajouter des élèves manuellement',
        contenu: `Dans la zone principale, saisissez un nom dans le champ en haut (format NOM Prénom) et appuyez sur Entrée. L'élève est ajouté immédiatement à la liste.`,
      },
      {
        titre: 'Renommer ou supprimer une classe',
        contenu: `Dans la sidebar gauche, chaque classe a une icône ✏️ pour la renommer en ligne. Le bouton "Supprimer la classe" dans le header supprime la classe et tous ses élèves (confirmation demandée).`,
      },
    ],
  },
  {
    id: 'edt',
    icon: '📅',
    titre: 'Emploi du temps',
    tags: ['edt', 'emploi', 'temps', 'pronote', 'pdf', 'semaine', 'AB', 'cours', 'créneau'],
    sections: [
      {
        titre: 'À quoi sert ce module ?',
        contenu: `Le module Emploi du temps affiche votre planning hebdomadaire sous forme de grille horaire (lundi → vendredi, 8h → 18h). Il gère les semaines A/B et permet de lier chaque créneau à un cours préparé.`,
      },
      {
        titre: 'Importer depuis un PDF Pronote',
        contenu: `Cliquez sur "📄 Importer PDF Pronote" dans le header.\n\nComment exporter depuis Pronote :\n• Emploi du temps → Imprimer → Format PDF → Toutes semaines\n\nClassPro Desktop analyse le PDF et détecte automatiquement :\n• Les jours et horaires de chaque cours\n• Les semaines A et B\n• Le nom de chaque matière\n• La couleur assignée automatiquement\n\nUne prévisualisation s'affiche avant l'import. Vous pouvez vérifier tous les cours détectés avant de les ajouter. Les doublons sont automatiquement ignorés.`,
      },
      {
        titre: 'Ajouter un cours manuellement',
        contenu: `Cliquez sur "+ Ajouter un cours" pour saisir manuellement un créneau.\n\nChamps disponibles :\n• Matière / Titre — nom affiché sur la grille\n• Salle — optionnel, affiché sous le titre\n• Jour — lundi à vendredi\n• Semaine — A, B, ou A et B (toutes)\n• Heure de début et de fin — au pas de 5 minutes\n• Classe liée — pour l'automatisation\n• Couleur — 6 teintes disponibles\n\nCliquez sur un bloc existant pour le modifier.`,
      },
      {
        titre: 'Semaines A et B',
        contenu: `Cliquez sur "⚙️ Réf. A/B" pour définir quelle semaine est la semaine A de référence. ClassPro Desktop calcule ensuite automatiquement le type de chaque semaine (A ou B) pour toute l'année.\n\nLes cours peuvent être configurés en Semaine A uniquement, Semaine B uniquement, ou toutes les semaines (A et B).`,
      },
      {
        titre: 'Automatisation — Créer fiches et suivi',
        contenu: `Clic droit sur un bloc de cours → "Créer fiches et suivi".\n\nCette fonction crée automatiquement pour les N prochaines semaines :\n• Les séances dans le module Suivi de classe\n• Les fiches de cours dans le Carnet de bord\n\nElle respecte les semaines A/B et évite les doublons si les séances existent déjà.`,
      },
      {
        titre: 'Lier un cours préparé à un créneau',
        contenu: `Clic droit sur un bloc EDT → "Créer un cours pour ce créneau" ou "Consulter le cours lié".\n\n• Si aucun cours n'est lié : vous pouvez créer un nouveau cours vide pré-lié, ou lier un cours existant depuis la liste\n• Si un cours est déjà lié : vous voyez un résumé et pouvez le délier\n\nLes blocs avec un cours lié affichent un petit icône 📖.`,
      },
    ],
  },
  {
    id: 'creer-cours',
    icon: '✏️',
    titre: 'Créer un cours',
    tags: ['cours', 'préparer', 'fiche', 'objectif', 'déroulement', 'section', 'aperçu', 'pdf'],
    sections: [
      {
        titre: 'À quoi sert ce module ?',
        contenu: `Le module Créer un cours (section Préparer) est un éditeur de fiches de préparation de cours. Contrairement au Carnet de bord qui enregistre ce qui s'est passé, ce module sert à préparer en amont ce que vous allez faire.`,
      },
      {
        titre: 'Créer un nouveau cours',
        contenu: `Cliquez sur "+ Nouveau cours".\n\nRenseignez :\n• Titre — nom du cours (obligatoire)\n• Date de la séance — optionnel\n• Classe liée — pour retrouver le cours facilement\n• Séquence liée — si la classe a une progression annuelle, vous pouvez rattacher le cours à une séquence\n\nLe cours est créé avec 3 sections par défaut : Objectifs, Déroulement / Activité, Devoirs.`,
      },
      {
        titre: 'Mise en forme du contenu',
        contenu: `Chaque section dispose d'une barre d'outils de mise en forme :\n\n• G — Gras (**texte**)\n• I — Italique (_texte_)\n• S — Souligné (__texte__)\n• Liste à puces (• élément)\n• Liste numérotée (1. élément)\n• Titre (## Titre)\n• Sous-titre (### Sous-titre)\n\nLa mise en forme utilise un format Markdown simple, visible dans l'aperçu.`,
      },
      {
        titre: 'Réorganiser les sections',
        contenu: `Chaque section a une poignée ⠿ à gauche. Glissez-déposez les sections pour les réorganiser dans l'ordre souhaité.\n\nPour ajouter une section personnalisée, cliquez sur "+ Ajouter une section" en bas de l'éditeur et saisissez un nom.`,
      },
      {
        titre: 'Documents et pièces jointes',
        contenu: `La section Documents / Supports vous permet d'attacher des fichiers et des liens au cours :\n\n• 🖼️ Image / PDF — sélectionnez un fichier jpg, jpeg, png ou pdf. Il est encodé et stocké dans le JSON.\n• 🔗 Lien — ajoutez une URL avec un nom optionnel\n\nEn mode aperçu, les images sont affichées en pleine largeur et les liens sont cliquables.`,
      },
      {
        titre: 'Mode aperçu',
        contenu: `Cliquez sur "👁 Aperçu" dans le header pour basculer en mode lecture.\n\nL'aperçu affiche le cours comme un document propre :\n• En-tête avec classe, séquence et date\n• Sections avec titre et contenu mis en forme\n• Images affichées en pleine largeur\n• Liens cliquables\n\nCe rendu peut servir de base pour l'impression ou le partage.`,
      },
      {
        titre: 'Lier un cours à un créneau EDT',
        contenu: `Depuis l'Emploi du temps, faites un clic droit sur un bloc de cours → "Créer un cours pour ce créneau".\n\nVous pouvez aussi lier un cours existant à un créneau ou le consulter directement depuis l'EDT. Un icône 📖 apparaît sur les blocs qui ont un cours lié.`,
      },
    ],
  },
];

function ModuleAcademie({ onStartTour }) {
  const [search, setSearch] = useState('');
  const [selGuide, setSelGuide] = useState(null);

  const guidesFiltered = useMemo(() => {
    if (!search.trim()) return GUIDES;
    const q = search.toLowerCase();
    return GUIDES.filter(g =>
      g.titre.toLowerCase().includes(q) ||
      g.tags.some(t => t.includes(q)) ||
      g.sections.some(s =>
        s.titre.toLowerCase().includes(q) ||
        s.contenu.toLowerCase().includes(q)
      )
    );
  }, [search]);

  // Sections filtrées pour le guide actif
  const sectionsFiltered = useMemo(() => {
    if (!selGuide) return [];
    const guide = GUIDES.find(g => g.id === selGuide);
    if (!guide) return [];
    if (!search.trim()) return guide.sections;
    const q = search.toLowerCase();
    return guide.sections.filter(s =>
      s.titre.toLowerCase().includes(q) ||
      s.contenu.toLowerCase().includes(q)
    );
  }, [selGuide, search]);

  const guideActif = GUIDES.find(g => g.id === selGuide);

  // Highlight du texte de recherche
  const highlight = (text) => {
    if (!search.trim()) return text;
    const q = search.trim();
    const regex = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part)
        ? <mark key={i} style={{ background: 'rgba(59,91,219,.2)', color: 'var(--accent)', borderRadius: 3, padding: '0 2px' }}>{part}</mark>
        : part
    );
  };

  const formatContenu = (texte) => {
    return texte.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      // Lignes commençant par • ou emoji liste
      if (line.trim().startsWith('•') || /^[💬📚😶✋👍⭐🎯📝📄🔄⚠️🟢🔵🟡🔴📊👤📆]/u.test(line.trim())) {
        return (
          <div key={i} style={{ display: 'flex', gap: '.5rem', marginBottom: '.25rem', paddingLeft: '.5rem' }}>
            <span style={{ color: 'var(--accent)', flexShrink: 0 }}>›</span>
            <span>{highlight(line.trim().replace(/^•\s*/, ''))}</span>
          </div>
        );
      }
      // Lignes numérotées
      if (/^\d+\./.test(line.trim())) {
        return (
          <div key={i} style={{ display: 'flex', gap: '.5rem', marginBottom: '.25rem', paddingLeft: '.5rem' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0, minWidth: 18 }}>{line.match(/^\d+/)[0]}.</span>
            <span>{highlight(line.replace(/^\d+\.\s*/, '').trim())}</span>
          </div>
        );
      }
      return <span key={i}>{highlight(line)}</span>;
    });
  };

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">🎓 Académie</div>
          <div className="phd-title">ClassPro Académie</div>
          <div className="phd-sub">Centre d'aide · {GUIDES.length} guides disponibles</div>
        </div>
        <div className="phd-actions">
          <button className="btn btn-ghost" onClick={onStartTour}>
            🗺️ Revoir la visite guidée
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Sidebar guides */}
        <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Barre de recherche */}
          <div style={{ padding: '.65rem .75rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '.65rem', top: '50%', transform: 'translateY(-50%)', fontSize: '.85rem', opacity: .5, pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder="Rechercher dans les guides…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '.45rem .65rem .45rem 2rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          {/* Liste des guides */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {guidesFiltered.length === 0 && (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.8rem', fontStyle: 'italic' }}>
                Aucun résultat pour "{search}"
              </div>
            )}
            {guidesFiltered.map(guide => (
              <button key={guide.id}
                onClick={() => setSelGuide(guide.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '.65rem', width: '100%', padding: '.6rem .875rem', border: 'none', borderLeft: `3px solid ${selGuide === guide.id ? 'var(--accent)' : 'transparent'}`, background: selGuide === guide.id ? 'var(--surface)' : 'transparent', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.82rem', fontWeight: selGuide === guide.id ? 700 : 500, color: selGuide === guide.id ? 'var(--accent)' : 'var(--text2)', borderBottom: '1px solid var(--border)', transition: 'all .13s', textAlign: 'left' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{guide.icon}</span>
                <div>
                  <div>{guide.titre}</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 400, marginTop: '.08rem' }}>{guide.sections.length} sections</div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer sidebar */}
          <div style={{ padding: '.65rem .875rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: '.68rem', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
              ClassPro Académie<br />
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>v1.0 · {GUIDES.length} guides</span>
            </div>
          </div>
        </div>

        {/* Zone principale */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!selGuide ? (
            /* Écran d'accueil Académie */
            <div style={{ padding: '2rem 2.5rem' }}>
              <div style={{ maxWidth: 640, margin: '0 auto' }}>
                {/* Hero */}
                <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b5bdb 60%, #7c3aed 100%)', borderRadius: 16, padding: '2rem', marginBottom: '2rem', color: '#fff' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🎓</div>
                  <div style={{ fontWeight: 800, fontSize: '1.4rem', fontFamily: 'Roboto Slab, serif', marginBottom: '.5rem' }}>ClassPro Académie</div>
                  <div style={{ fontSize: '.9rem', opacity: .85, lineHeight: 1.6 }}>
                    Bienvenue dans le centre d'aide de ClassPro Desktop. Retrouvez ici tous les guides pour maîtriser l'application et tirer le meilleur parti de vos outils pédagogiques.
                  </div>
                </div>

                {/* Grille des guides */}
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem' }}>
                  Tous les guides
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  {GUIDES.map(guide => (
                    <button key={guide.id}
                      onClick={() => setSelGuide(guide.id)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '1rem', border: '1.5px solid var(--border)', borderRadius: 12, background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', fontFamily: 'Roboto, sans-serif' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(59,91,219,.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,91,219,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                        {guide.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text)', marginBottom: '.2rem' }}>{guide.titre}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{guide.sections.length} sections</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Guide sélectionné */
            <div style={{ padding: '1.75rem 2.5rem', maxWidth: 760 }}>

              {/* Breadcrumb */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.25rem', fontSize: '.78rem', color: 'var(--text3)' }}>
                <button onClick={() => setSelGuide(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', padding: 0, fontWeight: 600 }}>
                  ← Tous les guides
                </button>
                <span>/</span>
                <span style={{ color: 'var(--text2)' }}>{guideActif?.titre}</span>
              </div>

              {/* Titre du guide */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '2px solid var(--border)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(59,91,219,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                  {guideActif?.icon}
                </div>
                <div>
                  <h1 style={{ margin: 0, fontFamily: 'Roboto Slab, serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{guideActif?.titre}</h1>
                  <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.25rem' }}>{guideActif?.sections.length} sections</div>
                </div>
              </div>

              {/* Message si recherche sans résultat dans ce guide */}
              {search.trim() && sectionsFiltered.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.85rem', fontStyle: 'italic' }}>
                  Aucun résultat pour "{search}" dans ce guide.
                </div>
              )}

              {/* Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {sectionsFiltered.map((section, i) => (
                  <div key={i} style={{ padding: '1.25rem 1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, borderLeft: '4px solid var(--accent)' }}>
                    <h2 style={{ margin: '0 0 .75rem', fontFamily: 'Roboto, sans-serif', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
                      {highlight(section.titre)}
                    </h2>
                    <div style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.75 }}>
                      {formatContenu(section.contenu)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation entre guides */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                {(() => {
                  const idx = GUIDES.findIndex(g => g.id === selGuide);
                  const prev = GUIDES[idx - 1];
                  const next = GUIDES[idx + 1];
                  return (
                    <>
                      {prev ? (
                        <button onClick={() => setSelGuide(prev.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.8rem', color: 'var(--text2)', fontWeight: 500 }}>
                          ← {prev.icon} {prev.titre}
                        </button>
                      ) : <div />}
                      {next && (
                        <button onClick={() => setSelGuide(next.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1rem', border: '1px solid var(--accent)', borderRadius: 'var(--r-s)', background: 'var(--accent)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.8rem', color: '#fff', fontWeight: 600 }}>
                          {next.icon} {next.titre} →
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── MODULE CLASSES & ÉLÈVES ───────────────────────────────────────────────────