// ══════════════════════════════════════════════════════════════════
//  FAQ COPROSYNC
//  • Accessible SANS connexion via ?faq=1 (showPublicFaq)
//  • Accessible connecté via nav('faq') (renderFAQ)
//  • Même données, même moteur de recherche, même style
//  • Contenu enrichi — 8 catégories, 40 questions
// ══════════════════════════════════════════════════════════════════

// ── DONNÉES ─────────────────────────────────────────────────────────────────

const FAQ_DATA = [

  // ── DÉMARRAGE (visible en premier sur la page publique) ──────────────────
  { id:'faq-start-1', cat:'demarrage', ico:'👋', public: true,
    q:'Qu\'est-ce que CoproSync ?',
    a:`CoproSync est l'application numérique de la <strong>Résidence le Floréal</strong> (13-19 rue du Moucherotte, Sassenage). Elle regroupe tout ce dont vous avez besoin pour vivre et gérer la résidence au quotidien :<br><br>
<ul>
  <li>🔧 <strong>Signalements</strong> — déclarez un problème dans les parties communes</li>
  <li>💬 <strong>Messagerie</strong> — échangez avec vos voisins et le conseil syndical</li>
  <li>📢 <strong>Annonces</strong> — restez informé des actualités de la résidence</li>
  <li>🗳️ <strong>Votes & Sondages</strong> — participez aux décisions collectives</li>
  <li>📄 <strong>Documents</strong> — accédez aux PV d'AG, règlement de copropriété…</li>
  <li>📅 <strong>Agenda</strong> — consultez les réunions et interventions à venir</li>
</ul>` },

  { id:'faq-start-2', cat:'demarrage', ico:'🆕', public: true,
    q:'Comment créer mon compte résident ?',
    a:`Vous pouvez créer votre compte de deux façons :<br><br>
<strong>Option 1 — Via le QR code</strong><br>
Scannez le QR code affiché dans votre résidence (hall d'entrée, boîtes aux lettres). Vous arriverez directement sur le formulaire d'inscription.<br><br>
<strong>Option 2 — Via le lien direct</strong><br>
Rendez-vous sur l'application et cliquez sur <strong>"Pas encore de compte ? Créer un compte"</strong> sur la page de connexion.<br><br>
<strong>Informations requises :</strong>
<ul>
  <li>Votre adresse email</li>
  <li>Un mot de passe (8 caractères minimum)</li>
  <li>Votre prénom et nom</li>
  <li>Votre tour (13, 15, 17 ou 19)</li>
  <li>Votre numéro de lot</li>
</ul>
<br>💡 Votre numéro de lot figure sur votre <strong>titre de propriété</strong>, votre <strong>avis de charges</strong> ou votre <strong>boîte aux lettres</strong>.` },

  { id:'faq-start-3', cat:'demarrage', ico:'🔐', public: true,
    q:'J\'ai oublié mon mot de passe, que faire ?',
    a:`Sur la page de connexion, entrez votre adresse email dans le champ prévu, puis cliquez sur <strong>"Mot de passe oublié ?"</strong>.<br><br>
Vous recevrez un email contenant un lien de réinitialisation valable <strong>24 heures</strong>.<br><br>
⚠️ Si vous ne recevez pas l'email dans les 5 minutes, vérifiez votre dossier <strong>spams / courriers indésirables</strong>.` },

  { id:'faq-start-4', cat:'demarrage', ico:'📱', public: true,
    q:'Comment installer l\'application sur mon téléphone ?',
    a:`CoproSync fonctionne comme une application installable (PWA) sur votre téléphone, sans passer par l'App Store ou Google Play.<br><br>
<strong>Sur iPhone (Safari) :</strong><br>
Ouvrez le site dans Safari → appuyez sur l'icône Partager <strong>⎋</strong> → choisissez <strong>"Sur l'écran d'accueil"</strong>.<br><br>
<strong>Sur Android (Chrome) :</strong><br>
Ouvrez le site dans Chrome → appuyez sur les 3 points <strong>⋮</strong> → choisissez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>.<br><br>
Une fois installée, l'app s'ouvre comme une vraie application, en plein écran, sans barre de navigation du navigateur.` },

  { id:'faq-start-5', cat:'demarrage', ico:'🔔', public: true,
    q:'Comment activer les notifications ?',
    a:`Lors de votre première connexion, l'application vous propose d'activer les notifications. Si vous avez refusé ou si vous souhaitez les activer manuellement :<br><br>
<strong>Sur iPhone :</strong> Réglages → Notifications → Safari → autorisez CoproSync.<br>
<strong>Sur Android :</strong> Réglages → Applications → Chrome ou CoproSync → Notifications → activer.<br><br>
Les notifications vous alertent pour :<ul>
  <li>Les annonces urgentes de la résidence</li>
  <li>L'avancement de vos signalements</li>
  <li>Les nouveaux messages qui vous sont adressés</li>
  <li>Les rappels d'événements (AG, réunions…)</li>
</ul>` },

  // ── SIGNALEMENTS ─────────────────────────────────────────────────────────
  { id:'faq-sig-1', cat:'signalements', ico:'🔧',
    q:'Comment signaler un problème dans la résidence ?',
    a:`Appuyez sur le bouton <strong>+ Signaler</strong> — visible en haut à droite sur ordinateur, ou au centre de la barre du bas sur mobile.<br><br>
Remplissez ensuite le formulaire :<ol>
  <li><strong>Urgence</strong> — Normal, Important ou Critique</li>
  <li><strong>Catégorie</strong> — Ascenseur, Fuite, Électricité, Sécurité…</li>
  <li><strong>Localisation</strong> — Tour, zone précise (hall, étage, parking…)</li>
  <li><strong>Titre</strong> — résumez le problème en quelques mots</li>
  <li><strong>Description</strong> — depuis quand, risques, observations utiles</li>
  <li><strong>Photos</strong> — jusqu'à 5 photos (optionnel mais recommandé)</li>
</ol>
<br>Votre signalement est immédiatement visible par le conseil syndical et le syndic.` },

  { id:'faq-sig-2', cat:'signalements', ico:'📋',
    q:'Quels sont les différents statuts d\'un signalement ?',
    a:`Un signalement passe par plusieurs étapes :<br><br>
<ul>
  <li>🟣 <strong>Nouveau</strong> — créé, pas encore pris en charge</li>
  <li>🟠 <strong>En cours</strong> — pris en charge par le conseil syndical</li>
  <li>🟡 <strong>Transmis syndic</strong> — transmis au syndic professionnel pour intervention</li>
  <li>🔵 <strong>En attente d'intervention</strong> — prestataire contacté, intervention planifiée</li>
  <li>🟢 <strong>Résolu</strong> — problème réglé</li>
  <li>⚫ <strong>Clos</strong> — archivé définitivement</li>
</ul>
<br>Vous êtes notifié à chaque changement de statut.` },

  { id:'faq-sig-3', cat:'signalements', ico:'🔴',
    q:'Quand utiliser le niveau d\'urgence "Critique" ?',
    a:`Le niveau <strong>Critique</strong> est réservé aux situations présentant un <strong>risque immédiat</strong> pour les personnes ou les biens :<br><br>
<ul>
  <li>💧 Fuite d'eau importante ou inondation</li>
  <li>🛗 Ascenseur en panne avec personnes bloquées</li>
  <li>⚡ Problème électrique dangereux (câble nu, court-circuit)</li>
  <li>🔒 Porte d'entrée ou portail principale bloqué(e)</li>
  <li>🏗️ Dégât structurel visible (fissure, effondrement)</li>
</ul>
<br>Pour un problème courant sans danger immédiat, utilisez <strong>Normal</strong> ou <strong>Important</strong>. Le niveau Critique déclenche une alerte immédiate au conseil syndical.` },

  { id:'faq-sig-4', cat:'signalements', ico:'🔔',
    q:'Serai-je notifié de l\'avancement de mon signalement ?',
    a:`Oui. Vous recevrez une notification dans l'application à chaque changement de statut sur votre signalement, ainsi qu'à chaque nouveau commentaire d'un gestionnaire.<br><br>
Pour recevoir ces alertes même lorsque l'application est fermée, pensez à <strong>activer les notifications</strong> dans les réglages de votre navigateur ou de l'app installée.` },

  { id:'faq-sig-5', cat:'signalements', ico:'📸',
    q:'Puis-je ajouter des photos à mon signalement ?',
    a:`Oui, et c'est vivement recommandé ! Une photo vaut mille mots et permet au conseil syndical de prioriser et d'agir plus vite.<br><br>
Vous pouvez joindre jusqu'à <strong>5 photos</strong> par signalement, directement depuis :<ul>
  <li>📷 L'appareil photo de votre téléphone (prise en temps réel)</li>
  <li>🖼️ La galerie de photos existantes</li>
</ul>
<br>Il est aussi possible d'ajouter une photo après la création du signalement, en ouvrant le détail et en cliquant sur <strong>"Ajouter une photo"</strong>.` },

  { id:'faq-sig-6', cat:'signalements', ico:'🗺️',
    q:'À quoi sert la carte des signalements ?',
    a:`La <strong>Carte</strong> (accessible depuis le menu) affiche tous les signalements géolocalisés sur un plan interactif de la résidence.<br><br>
Elle permet de visualiser d'un coup d'œil :<ul>
  <li>La concentration de problèmes par zone ou par tour</li>
  <li>Les signalements critiques (points rouges)</li>
  <li>L'état général de la résidence</li>
</ul>
<br>Vous pouvez filtrer par urgence, statut ou bâtiment. Cliquez sur un point pour voir le détail du signalement.` },

  // ── RÉSIDENCE ────────────────────────────────────────────────────────────
  { id:'faq-res-1', cat:'residence', ico:'🏢',
    q:'Comment est organisée la Résidence le Floréal ?',
    a:`La Résidence le Floréal est composée de <strong>4 tours</strong> situées au 13, 15, 17 et 19 rue du Moucherotte à Sassenage :<br><br>
<ul>
  <li>🏢 <strong>Tour 13</strong> — côté sud</li>
  <li>🏢 <strong>Tour 15</strong> — centre-sud</li>
  <li>🏢 <strong>Tour 17</strong> — centre-nord</li>
  <li>🏢 <strong>Tour 19</strong> — côté nord</li>
</ul>
<br>Chaque tour dispose de :<ul>
  <li>2 ascenseurs (numéros impairs et pairs)</li>
  <li>Un local poubelles</li>
  <li>Un canal de messagerie dédié dans CoproSync</li>
</ul>
<br>La résidence compte au total <strong>240 logements</strong> et des parkings communs (120 places visiteurs + 120 places privées).` },

  { id:'faq-res-2', cat:'residence', ico:'🛗',
    q:'L\'ascenseur de ma tour est en panne, que faire ?',
    a:`<strong>Personne bloquée dans la cabine → appelez le 18 (pompiers) immédiatement.</strong><br><br>
Pour une panne sans personne bloquée :<ol>
  <li>Signalez via CoproSync : <strong>+ Signaler → Ascenseur → Critique</strong></li>
  <li>Précisez la tour et l'ascenseur (impair ou pair)</li>
  <li>Le prestataire <strong>ACAF</strong> (contrat de maintenance) sera contacté en priorité</li>
</ol>
<br>Délais d'intervention standard :<ul>
  <li>⏱️ 2 heures en heures ouvrées</li>
  <li>⏱️ 4 heures en astreinte (soir, week-end, jours fériés)</li>
</ul>` },

  { id:'faq-res-3', cat:'residence', ico:'🅿️',
    q:'Comment fonctionne le parking de la résidence ?',
    a:`La résidence dispose de <strong>deux types de parkings</strong> :<br><br>
<strong>Parking visiteurs (120 places)</strong><br>
Accessible librement pour les visiteurs temporaires. Pas de badge requis.<br><br>
<strong>Parking privé (120 places)</strong><br>
Réservé aux résidents. L'accès se fait avec un badge d'entrée.<br><br>
<strong>Garages individuels</strong><br>
Boxes fermés attribués nominativement.<br><br>
⚠️ En cas de problème d'accès, de badge défectueux ou de véhicule mal garé, signalez-le via <strong>+ Signaler → Parking</strong>.` },

  { id:'faq-res-4', cat:'residence', ico:'🗑️',
    q:'Où sont les locaux poubelles et quelles sont les règles de tri ?',
    a:`Chaque tour dispose d'un <strong>local poubelles au rez-de-chaussée</strong>.<br><br>
Les règles de tri en vigueur à Sassenage :<ul>
  <li>🟡 <strong>Bac jaune</strong> — emballages, cartons, papiers</li>
  <li>🟢 <strong>Bac vert</strong> — verre</li>
  <li>⚫ <strong>Bac gris/noir</strong> — ordures ménagères</li>
</ul>
<br>En cas de local encombré, mal entretenu ou de problème de propreté, signalez-le via <strong>+ Signaler → Propreté</strong>.` },

  { id:'faq-res-5', cat:'residence', ico:'🔑',
    q:'Comment obtenir ou signaler la perte d\'un badge d\'accès ?',
    a:`Pour tout ce qui concerne les badges et accès :<br><br>
<ul>
  <li><strong>Badge perdu ou volé</strong> → signalez-le immédiatement via <strong>+ Signaler → Sécurité / Accès</strong> afin de le désactiver rapidement</li>
  <li><strong>Badge défectueux</strong> → signalez-le également pour qu'une intervention soit planifiée</li>
  <li><strong>Demande de nouveau badge</strong> → contactez le conseil syndical via <strong>Messages</strong></li>
</ul>` },

  // ── MON COMPTE ───────────────────────────────────────────────────────────
  { id:'faq-cpt-1', cat:'compte', ico:'👤',
    q:'Comment modifier mes informations personnelles ?',
    a:`Accédez à votre profil en cliquant sur votre nom dans le menu latéral (ou dans le menu burger sur mobile).<br><br>
Vous pouvez modifier :<ul>
  <li>Votre prénom et nom</li>
  <li>Votre numéro de téléphone</li>
  <li>Votre tour et numéro de lot</li>
</ul>
<br>⚠️ L'adresse email n'est pas modifiable directement. Contactez un administrateur si nécessaire.` },

  { id:'faq-cpt-2', cat:'compte', ico:'🌙',
    q:'Comment activer le mode sombre ?',
    a:`Cliquez sur l'icône <strong>🌙</strong> dans la barre en haut à droite. Un second clic repasse en mode clair ☀️.<br><br>
Votre préférence est sauvegardée automatiquement sur votre appareil.` },

  { id:'faq-cpt-3', cat:'compte', ico:'🏷️',
    q:'Quels sont les différents rôles sur CoproSync ?',
    a:`CoproSync fonctionne avec 4 niveaux d'accès :<br><br>
<ul>
  <li>🟢 <strong>Copropriétaire</strong> — accès standard : signalements, messagerie, votes, documents, agenda, annonces</li>
  <li>🟠 <strong>Membre du Conseil Syndical</strong> — comme copropriétaire + gestion des signalements, contrats, clés, journal, annonces</li>
  <li>🔵 <strong>Syndic</strong> — accès au rapport de synthèse et aux données de gestion</li>
  <li>🟣 <strong>Administrateur</strong> — accès complet, gestion des utilisateurs, de tous les modules</li>
</ul>` },

  { id:'faq-cpt-4', cat:'compte', ico:'🔒',
    q:'Mon compte a été suspendu, que faire ?',
    a:`Si votre compte a été suspendu par un administrateur, vous verrez un message d'erreur à la connexion.<br><br>
Contactez directement le conseil syndical :<ul>
  <li>Par email (coordonnées dans la section <strong>Contacts & Urgences</strong>)</li>
  <li>En vous présentant physiquement à une permanence</li>
</ul>
<br>La suspension est temporaire et peut être levée par tout administrateur.` },

  // ── MESSAGERIE ───────────────────────────────────────────────────────────
  { id:'faq-msg-1', cat:'messagerie', ico:'💬',
    q:'Comment fonctionne la messagerie ?',
    a:`La messagerie de CoproSync comprend deux espaces :<br><br>
<strong>🏠 Fil d'actualité</strong><br>
Espace communautaire public visible par tous les résidents. Partagez des infos, posez des questions, réagissez aux événements de la résidence.<br><br>
<strong>💬 Canaux de discussion</strong><br>
Groupes organisés par thématique (Tour 13, Tour 15, Conseil Syndical…). Rejoignez automatiquement le canal de votre tour à l'inscription.<br><br>
<strong>🔒 Messages privés (DM)</strong><br>
Conversations directes et confidentielles avec n'importe quel autre résident.` },

  { id:'faq-msg-2', cat:'messagerie', ico:'@',
    q:'Comment mentionner quelqu\'un dans un message ?',
    a:`Tapez <strong>@</strong> suivi du prénom de la personne dans le champ de message. Une liste de suggestions apparaît automatiquement.<br><br>
La personne mentionnée reçoit une notification spéciale lui indiquant qu'elle a été citée.<br><br>
Les mentions fonctionnent dans les commentaires de signalements et dans les canaux de discussion.` },

  { id:'faq-msg-3', cat:'messagerie', ico:'📢',
    q:'Quelle est la différence entre Annonces et Messagerie ?',
    a:`<strong>Annonces</strong> — canal officiel, réservé au conseil syndical et au syndic. Sert à diffuser des informations importantes : travaux, réunions, alertes. Les résidents peuvent lire mais pas publier.<br><br>
<strong>Messagerie / Fil d'actualité</strong> — ouvert à tous les résidents. Conversations informelles, questions de voisinage, partage d'infos du quotidien.` },

  // ── VOTES ────────────────────────────────────────────────────────────────
  { id:'faq-vot-1', cat:'votes', ico:'🗳️',
    q:'Comment participer à un vote ou un sondage ?',
    a:`Accédez à la section <strong>Votes & Sondages</strong> dans le menu.<br><br>
Les votes ouverts sont signalés par un bandeau <strong>vert "À voter"</strong>. Cliquez sur l'option de votre choix puis confirmez.<br><br>
Règles importantes :<ul>
  <li>Vous ne pouvez voter <strong>qu'une seule fois</strong> par scrutin</li>
  <li>Votre vote est <strong>définitif</strong> (pas de modification possible)</li>
  <li>Les résultats s'affichent en temps réel une fois le vote clos</li>
  <li>Certains votes sont <strong>anonymes</strong>, d'autres nominatifs (précisé dans l'intitulé)</li>
</ul>` },

  { id:'faq-vot-2', cat:'votes', ico:'📊',
    q:'Quels types de votes existent sur CoproSync ?',
    a:`Trois types de scrutins sont disponibles :<br><br>
<ul>
  <li>🗳️ <strong>Vote officiel</strong> — Pour / Contre / Abstention, avec quorum configurable. Utilisé pour les décisions importantes de la copropriété.</li>
  <li>📊 <strong>Sondage</strong> — Question à choix libre. Utilisé pour recueillir des avis sans caractère officiel.</li>
  <li>📅 <strong>Disponibilités</strong> — Type Doodle pour trouver une date commune (réunion, AG…).</li>
</ul>` },

  { id:'faq-vot-3', cat:'votes', ico:'🏛️',
    q:'Qu\'est-ce qu\'un quorum et comment ça fonctionne ?',
    a:`Le <strong>quorum</strong> est le taux de participation minimum requis pour qu'un vote soit valide.<br><br>
Exemple : si le quorum est fixé à 50%, il faut qu'au moins la moitié des résidents vote pour que le résultat soit officiel.<br><br>
Sur CoproSync, le quorum est visible sur chaque vote officiel. Une fois le vote clos, l'application indique si le quorum a été atteint ✅ ou non ❌.` },

  { id:'faq-vot-4', cat:'votes', ico:'✋',
    q:'Qui peut créer un vote ou un sondage ?',
    a:`Seuls les <strong>membres du Conseil Syndical</strong>, le <strong>Syndic</strong> et les <strong>Administrateurs</strong> peuvent créer des votes et sondages.<br><br>
Si vous souhaitez soumettre un sujet au vote, contactez un membre du CS via la <strong>Messagerie</strong> ou lors d'une réunion.` },

  // ── DOCUMENTS ────────────────────────────────────────────────────────────
  { id:'faq-doc-1', cat:'documents', ico:'📄',
    q:'Où trouver les documents de la copropriété ?',
    a:`Dans la section <strong>Documents</strong>, les fichiers sont classés par catégorie :<br><br>
<ul>
  <li>🏛️ <strong>Assemblées Générales</strong> — procès-verbaux, convocations</li>
  <li>💰 <strong>Financier</strong> — relevés de charges, budgets</li>
  <li>🔧 <strong>Technique</strong> — diagnostics, rapports d'intervention</li>
  <li>⚖️ <strong>Juridique</strong> — règlement de copropriété, contrats</li>
  <li>📋 <strong>Administratif</strong> — courriers officiels</li>
  <li>🔍 <strong>Diagnostics</strong> — DPE, amiante, etc.</li>
</ul>
<br>Les nouveaux documents sont signalés par un badge <strong>"Nouveau"</strong> jusqu'à ce que vous les ayez ouverts.` },

  { id:'faq-doc-2', cat:'documents', ico:'📅',
    q:'Quand ont lieu les Assemblées Générales ?',
    a:`Les dates d'Assemblée Générale sont publiées dans l'<strong>Agenda</strong> au moins <strong>21 jours avant</strong> la réunion, conformément à la loi.<br><br>
Vous recevez également une notification dans l'application lors de la publication.<br><br>
Le <strong>procès-verbal</strong> est disponible dans <em>Documents → Assemblées Générales</em> dans les 15 jours suivant la réunion.` },

  { id:'faq-doc-3', cat:'documents', ico:'🔒',
    q:'Pourquoi certains documents ne sont pas visibles ?',
    a:`Certains documents sont réservés aux membres du <strong>Conseil Syndical</strong> et du <strong>Syndic</strong> (contrats prestataires sensibles, documents financiers détaillés…).<br><br>
Ils sont signalés par une icône 🔒 et n'apparaissent pas dans la liste des copropriétaires standards.<br><br>
Si vous pensez avoir besoin d'accéder à un document spécifique, faites-en la demande au conseil syndical via la <strong>Messagerie</strong>.` },

  // ── GESTION (visible seulement pour les managers dans l'app) ─────────────
  { id:'faq-gest-1', cat:'gestion', ico:'📑',
    q:'Qu\'est-ce que le Journal d\'activité ?',
    a:`Le <strong>Journal</strong> est un historique immuable et horodaté de toutes les actions effectuées dans CoproSync :<br><br>
<ul>
  <li>Création, modification, clôture de signalements</li>
  <li>Changements de statut</li>
  <li>Ajout ou modification de contrats</li>
  <li>Mouvements de clés</li>
  <li>Connexions et actions administratives</li>
</ul>
<br>Il est accessible uniquement aux membres du Conseil Syndical, au Syndic et aux Administrateurs. Il ne peut ni être modifié ni supprimé.` },

  { id:'faq-gest-2', cat:'gestion', ico:'📋',
    q:'Comment gérer les contrats fournisseurs ?',
    a:`La section <strong>Contrats</strong> (menu de gestion) centralise tous les contrats en cours :<br><br>
<ul>
  <li>Ascenseurs (ACAF), chauffage, nettoyage, espaces verts…</li>
  <li>Date de début et d'échéance</li>
  <li>Montant annuel, contact fournisseur</li>
</ul>
<br>Une alerte automatique s'affiche sur le tableau de bord lorsqu'un contrat arrive à échéance dans les <strong>90 jours</strong>. Un badge orange apparaît aussi dans le menu.` },

  { id:'faq-gest-3', cat:'gestion', ico:'🔑',
    q:'Comment fonctionne la gestion des clés ?',
    a:`La section <strong>Clés</strong> permet de suivre en temps réel l'ensemble des clés de la résidence :<br><br>
<ul>
  <li>Clés disponibles vs sorties</li>
  <li>Nom du détenteur actuel</li>
  <li>Date de sortie</li>
  <li>Historique des mouvements</li>
</ul>
<br>Pour sortir une clé : cliquez sur <strong>"Sortir la clé"</strong> et saisissez le nom du destinataire. Un email de confirmation est envoyé automatiquement.<br>
Pour marquer un retour : cliquez sur <strong>"Marquer rendue"</strong>.` },

  { id:'faq-gest-4', cat:'gestion', ico:'📊',
    q:'Comment générer le rapport syndic ?',
    a:`Accédez à <strong>Rapport syndic</strong> dans le menu de gestion.<br><br>
Le rapport comprend :<ul>
  <li>Statistiques globales (ouverts, critiques, résolus, taux)</li>
  <li>Tableau des signalements ouverts</li>
  <li>Liste des signalements résolus</li>
  <li>Contrats à renouveler</li>
  <li>Répartition par bâtiment</li>
</ul>
<br>Trois formats d'export disponibles :<ul>
  <li>🖨️ <strong>PDF</strong> — mise en page professionnelle prête à imprimer</li>
  <li>📊 <strong>Excel</strong> — 4 onglets (signalements, résidents, contrats, stats)</li>
  <li>📁 <strong>CSV</strong> — export brut pour traitement externe</li>
</ul>` },
];

// ── CATÉGORIES ───────────────────────────────────────────────────────────────

const FAQ_CATS = [
  { id:'all',          label:'Toutes',        ico:'📋' },
  { id:'demarrage',    label:'Démarrage',     ico:'🚀' },
  { id:'signalements', label:'Signalements',  ico:'🔧' },
  { id:'residence',    label:'Résidence',     ico:'🏢' },
  { id:'compte',       label:'Mon compte',    ico:'👤' },
  { id:'messagerie',   label:'Messagerie',    ico:'💬' },
  { id:'votes',        label:'Votes',         ico:'🗳️' },
  { id:'documents',    label:'Documents',     ico:'📄' },
  { id:'gestion',      label:'Gestion',       ico:'⚙️' },
];

// Catégories visibles sans connexion
const FAQ_CATS_PUBLIC = ['demarrage', 'signalements', 'residence', 'compte', 'messagerie', 'votes', 'documents'];

// ── STORAGE LOCAL ────────────────────────────────────────────────────────────

const FAQ_VOTES_KEY   = 'coprosync_faq_votes_v1';
const FAQ_HELPFUL_KEY = 'coprosync_faq_helpful_v1';
const FAQ_READ_KEY    = 'coprosync_faq_read_v1';

let _faqVotes   = {};
let _faqHelpful = {};
let _faqRead    = {};

function _faqLoadStorage() {
  const safe = (key, def) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : def; } catch { return def; } };
  _faqVotes   = safe(FAQ_VOTES_KEY,   {});
  _faqHelpful = safe(FAQ_HELPFUL_KEY, {});
  _faqRead    = safe(FAQ_READ_KEY,    {});
}
function _faqSaveVotes()   { try { localStorage.setItem(FAQ_VOTES_KEY,   JSON.stringify(_faqVotes));   } catch {} }
function _faqSaveHelpful() { try { localStorage.setItem(FAQ_HELPFUL_KEY, JSON.stringify(_faqHelpful)); } catch {} }
function _faqSaveRead()    { try { localStorage.setItem(FAQ_READ_KEY,    JSON.stringify(_faqRead));    } catch {} }

// ── STATE ────────────────────────────────────────────────────────────────────

let _faqActiveCat      = 'all';
let _faqSearchQuery    = '';
let _faqOpenId         = null;
let _faqSearchTimer    = null;
let _faqLastVisibleIds = [];
let _faqKbIdx          = -1;
let _faqIsPublic       = false;   // true = mode sans connexion

// ── FAQ PUBLIQUE (sans connexion) ────────────────────────────────────────────

function checkFaqMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('faq') === '1') {
    showPublicFaq();
    return true;
  }
  return false;
}

function showPublicFaq() {
  _faqIsPublic = true;
  _faqLoadStorage();

  const registerUrl = `${location.origin}${location.pathname}?register=1`;
  const loginUrl    = `${location.origin}${location.pathname}`;

  document.body.innerHTML = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-tap-highlight-color: transparent; }
    body {
      font-family: 'Instrument Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh; min-height: 100dvh;
      font-size: 14px; line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    :root {
      --bg: #f5f4f1; --surface: #ffffff; --surface-2: #f9f8f6;
      --border: #e8e5df; --border-strong: #d0cdc7;
      --text: #1a1917; --text-2: #6b6860; --text-3: #9b9890;
      --accent: #2563eb; --accent-light: #eff6ff; --accent-hover: #1d4ed8;
      --red: #dc2626; --red-light: #fef2f2; --red-border: #fecaca;
      --green: #16a34a; --green-light: #f0fdf4; --green-border: #bbf7d0;
      --amber: #d97706; --amber-light: #fffbeb; --amber-border: #fde68a;
      --font-head: 'Syne', sans-serif;
      --font-body: 'Instrument Sans', sans-serif;
      --r: 10px; --r-sm: 7px; --r-lg: 16px;
      --shadow: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
      --shadow-md: 0 4px 16px rgba(0,0,0,.08);
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  </style>

  <!-- TOPBAR PUBLIC -->
  <div style="
    background: #0c0b09; border-bottom: 1px solid rgba(255,255,255,.06);
    padding: 0 20px; height: 54px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    position: sticky; top: 0; z-index: 100;
  ">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:30px;height:30px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#0c0b09"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22" fill="white" stroke="none"/></svg>
      </div>
      <span style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#fff;letter-spacing:-.3px;">CoproSync</span>
      <span style="font-size:11px;color:rgba(255,255,255,.3);padding:2px 8px;border:1px solid rgba(255,255,255,.1);border-radius:20px;">Aide</span>
    </div>
    <div style="display:flex;gap:8px;">
      <a href="${registerUrl}" style="
        background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
        color:rgba(255,255,255,.7);font-size:12px;font-weight:600;
        padding:7px 14px;border-radius:8px;text-decoration:none;
        font-family:'Instrument Sans',sans-serif;
      ">Créer un compte</a>
      <a href="${loginUrl}" style="
        background:linear-gradient(135deg,#2563eb,#3b82f6);
        color:#fff;font-size:12px;font-weight:700;
        padding:7px 14px;border-radius:8px;text-decoration:none;
        font-family:'Instrument Sans',sans-serif;
      ">Se connecter</a>
    </div>
  </div>

  <!-- CONTENU FAQ -->
  <div id="faq-public-root" style="max-width:760px;margin:0 auto;padding:24px 16px 80px;">
    ${_faqPublicHtml()}
  </div>`;

  _faqBindSearch('faq-public-search');
  _faqRenderCats('faq-public-cats');
  _faqRenderList('faq-public-list');
  _faqBindKeyboard();

  const fromHash = _faqParseHashId();
  if (fromHash && FAQ_DATA.some(f => f.id === fromHash)) {
    _faqJumpTo(fromHash, { fromHash: true });
  }
}

function _faqPublicHtml() {
  return `
    <!-- Hero -->
    <div style="margin-bottom:24px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
        color:var(--text-3);margin-bottom:10px;display:flex;align-items:center;gap:8px;">
        <span style="width:16px;height:1px;background:var(--border-strong);display:inline-block;"></span>
        Centre d'aide
        <span style="width:16px;height:1px;background:var(--border-strong);display:inline-block;"></span>
      </div>
      <h1 style="font-family:'Syne',sans-serif;font-size:clamp(26px,5vw,40px);font-weight:800;
        letter-spacing:-1.5px;margin-bottom:8px;">FAQ & Aide</h1>
      <p style="font-size:14px;color:var(--text-2);line-height:1.6;max-width:520px;">
        Résidence le Floréal · Sassenage — toutes les réponses à vos questions sur CoproSync.
      </p>
    </div>

    <!-- Barre de recherche -->
    <div style="position:relative;margin-bottom:18px;">
      <svg style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-3);"
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input id="faq-public-search" type="search" placeholder="Rechercher dans l'aide…"
        style="width:100%;padding:12px 40px 12px 42px;border:1.5px solid var(--border);
          border-radius:var(--r-lg);font-size:14px;font-family:'Instrument Sans',sans-serif;
          background:var(--surface);color:var(--text);outline:none;
          box-shadow:var(--shadow);transition:border-color .18s;"
        oninput="setAnnoncesSearch && null; _faqOnSearch(this.value)"
        onfocus="this.style.borderColor='#2563eb'"
        onblur="this.style.borderColor='var(--border)'">
      <button id="faq-public-clear" onclick="_faqClearSearch()"
        style="display:none;position:absolute;right:12px;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;font-size:18px;color:var(--text-3);">×</button>
    </div>

    <!-- Catégories -->
    <div id="faq-public-cats" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;"></div>

    <!-- Liste -->
    <div id="faq-public-list"></div>

    <!-- Bloc CTA connexion -->
    <div style="
      margin-top:32px;background:linear-gradient(135deg,#0c0b09,#1c1b19);
      border-radius:20px;padding:28px 24px;
      border:1px solid rgba(255,255,255,.08);
      display:flex;align-items:center;gap:20px;flex-wrap:wrap;
    ">
      <div style="font-size:32px;">🏢</div>
      <div style="flex:1;min-width:180px;">
        <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:800;
          color:#fff;margin-bottom:4px;">Vous êtes résident du Floréal ?</div>
        <div style="font-size:13px;color:rgba(255,255,255,.4);line-height:1.5;">
          Accédez à tous les services : signalements, messagerie, votes, documents…
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a href="${location.origin}${location.pathname}?register=1"
          style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);
            color:rgba(255,255,255,.8);font-family:'Instrument Sans',sans-serif;
            font-size:13px;font-weight:600;padding:10px 18px;border-radius:10px;text-decoration:none;">
          Créer un compte
        </a>
        <a href="${location.origin}${location.pathname}"
          style="background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;
            font-family:'Instrument Sans',sans-serif;font-size:13px;font-weight:700;
            padding:10px 18px;border-radius:10px;text-decoration:none;
            box-shadow:0 4px 14px rgba(37,99,235,.35);">
          Se connecter →
        </a>
      </div>
    </div>`;
}

// ── FAQ CONNECTÉE ─────────────────────────────────────────────────────────────

function renderFAQ() {
  _faqIsPublic = false;
  _faqLoadStorage();
  _faqBindHashListener();
  _faqBindKeyboard();

  $('page').innerHTML = `
    <div class="faq2-page">
      <div class="faq2-sticky">
        <div class="faq2-hero">
          <div class="faq2-hero-top">
            <div>
              <h1>❓ Aide & FAQ</h1>
              <p>Toutes les réponses sur CoproSync et la Résidence le Floréal.</p>
            </div>
            ${_faqProgressHtml()}
          </div>
          <div class="faq2-hints">
            <span><kbd>/</kbd> recherche</span>
            <span><kbd>J</kbd> <kbd>K</kbd> navigation</span>
            <span><kbd>Entrée</kbd> ouvrir</span>
            <span><kbd>Échap</kbd> effacer</span>
          </div>
          <div class="faq2-search-wrap">
            <svg class="faq2-search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input class="faq2-search-input" id="faq-search" type="text"
              placeholder="Rechercher une question…" autocomplete="off"
              aria-label="Rechercher dans la FAQ">
            <button class="faq2-search-clear" id="faq-search-clear"
              onclick="_faqClearSearch()" title="Effacer" type="button">×</button>
          </div>
        </div>
      </div>

      <div class="faq2-cats" id="faq-cats"></div>
      <div id="faq-list"></div>

      <div class="faq2-contact">
        <div class="faq2-contact-ico">🤝</div>
        <div class="faq2-contact-body">
          <div class="faq2-contact-title">Vous n'avez pas trouvé votre réponse ?</div>
          <div class="faq2-contact-sub">Le conseil syndical vous répond sous 48h ouvrées.</div>
        </div>
        <div class="faq2-contact-actions">
          <button type="button" class="btn btn-primary" onclick="nav('messages')">💬 Message</button>
          <button type="button" class="btn btn-secondary" onclick="nav('contacts')">📞 Contacts</button>
        </div>
      </div>
    </div>`;

  _faqBindSearch('faq-search');
  _faqRenderCats('faq-cats');
  _faqRenderList('faq-list');

  const fromHash = _faqParseHashId();
  if (fromHash && FAQ_DATA.some(f => f.id === fromHash)) {
    _faqJumpTo(fromHash, { fromHash: true });
  } else {
    setTimeout(() => document.getElementById('faq-search')?.focus(), 60);
  }
}

// ── MOTEUR COMMUN ─────────────────────────────────────────────────────────────

function _faqListId()    { return _faqIsPublic ? 'faq-public-list'   : 'faq-list'; }
function _faqCatsId()    { return _faqIsPublic ? 'faq-public-cats'   : 'faq-cats'; }
function _faqSearchId()  { return _faqIsPublic ? 'faq-public-search' : 'faq-search'; }
function _faqClearId()   { return _faqIsPublic ? 'faq-public-clear'  : 'faq-search-clear'; }

function _faqVisibleData() {
  // En mode public : on cache la catégorie "gestion"
  return _faqIsPublic
    ? FAQ_DATA.filter(f => FAQ_CATS_PUBLIC.includes(f.cat))
    : FAQ_DATA;
}

function _faqVisibleCats() {
  return _faqIsPublic
    ? FAQ_CATS.filter(c => c.id === 'all' || FAQ_CATS_PUBLIC.includes(c.id))
    : FAQ_CATS;
}

function _faqBindSearch(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.value = _faqSearchQuery || '';
  const clearBtn = document.getElementById(_faqClearId());
  if (clearBtn) clearBtn.style.display = (_faqSearchQuery || '') ? 'block' : 'none';
  input.addEventListener('input', e => _faqOnSearch(e.target.value));
}

function _faqOnSearch(val) {
  _faqSearchQuery = val || '';
  _faqOpenId = null;
  const clearBtn = document.getElementById(_faqClearId());
  if (clearBtn) clearBtn.style.display = _faqSearchQuery ? 'block' : 'none';
  clearTimeout(_faqSearchTimer);
  _faqSearchTimer = setTimeout(() => _faqRenderList(_faqListId()), 180);
}

function _faqClearSearch() {
  _faqSearchQuery = '';
  _faqOpenId = null;
  const input  = document.getElementById(_faqSearchId());
  const clearBtn = document.getElementById(_faqClearId());
  if (input)    input.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  _faqClearHashIfFaq();
  _faqRenderList(_faqListId());
}

function _faqRenderCats(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const cats = _faqVisibleCats();
  const data = _faqVisibleData();
  el.innerHTML = cats.map(cat => {
    const count = cat.id === 'all'
      ? data.length
      : data.filter(f => f.cat === cat.id).length;
    const isActive = _faqActiveCat === cat.id;
    if (_faqIsPublic) {
      return `<button type="button" onclick="_faqSetCat('${cat.id}')"
        style="
          border:1.5px solid ${isActive ? '#2563eb' : 'var(--border)'};
          background:${isActive ? '#2563eb' : 'var(--surface)'};
          color:${isActive ? '#fff' : 'var(--text-2)'};
          border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:600;
          cursor:pointer;font-family:'Instrument Sans',sans-serif;
          display:inline-flex;align-items:center;gap:6px;
          box-shadow:${isActive ? '0 6px 16px rgba(37,99,235,.22)' : 'var(--shadow)'};
          transition:all .12s;
        ">
        ${cat.ico} ${cat.label}
        <span style="opacity:.65;font-size:11px;">(${count})</span>
      </button>`;
    }
    return `<button type="button" class="faq2-cat-btn ${isActive ? 'active' : ''}" onclick="_faqSetCat('${cat.id}')">
      <span>${cat.ico} ${cat.label}</span>
      <span class="faq2-cat-count">(${count})</span>
    </button>`;
  }).join('');
}

function _faqSetCat(id) {
  _faqActiveCat = id;
  _faqOpenId    = null;
  _faqKbIdx     = -1;
  _faqClearHashIfFaq();
  _faqRenderCats(_faqCatsId());
  _faqRenderList(_faqListId());
}

function _faqRenderList(listId) {
  const el = document.getElementById(listId);
  if (!el) return;

  const q    = (_faqSearchQuery || '').toLowerCase().trim();
  const data = _faqVisibleData();
  let items  = [...data];

  if (_faqActiveCat !== 'all') items = items.filter(f => f.cat === _faqActiveCat);
  if (q) items = items.filter(f =>
    f.q.toLowerCase().includes(q) ||
    (f.a || '').toLowerCase().includes(q)
  );

  if (_faqOpenId && !items.some(f => f.id === _faqOpenId)) {
    _faqOpenId = null;
    _faqClearHashIfFaq();
  }

  if (!items.length && q) {
    clearTimeout(_faqSearchTimer);
    _faqSearchTimer = setTimeout(() => _faqRenderAssistant(listId, q), 200);
    _faqLastVisibleIds = [];
    return;
  }

  _faqLastVisibleIds = items.map(f => f.id);
  if (_faqKbIdx >= _faqLastVisibleIds.length) _faqKbIdx = Math.max(0, _faqLastVisibleIds.length - 1);
  if (_faqKbIdx < 0 && _faqLastVisibleIds.length) _faqKbIdx = 0;

  const hotIds  = _faqTopHelpfulSet();
  const focusId = _faqKbIdx >= 0 ? (_faqLastVisibleIds[_faqKbIdx] || null) : null;

  // Vue "Toutes" sans recherche → grouper par catégorie
  if (_faqActiveCat === 'all' && !q) {
    const groups = {};
    items.forEach(f => { if (!groups[f.cat]) groups[f.cat] = []; groups[f.cat].push(f); });
    el.innerHTML = Object.entries(groups).map(([catId, catItems]) => {
      const cat = FAQ_CATS.find(c => c.id === catId);
      return `<div class="faq2-section">
        <div class="faq2-section-label">${cat?.ico || ''} ${cat?.label || catId}</div>
        ${catItems.map(f => _faqItemHtml(f, '', hotIds, focusId === f.id)).join('')}
      </div>`;
    }).join('');
  } else {
    el.innerHTML = items.map(f => _faqItemHtml(f, q, hotIds, focusId === f.id)).join('');
  }

  _faqRefreshProgress();
}

// ── RENDU D'UN ITEM ───────────────────────────────────────────────────────────

function _faqItemHtml(f, q, hotIds, kbFocus) {
  const isOpen    = _faqOpenId === f.id;
  const vote      = _faqVotes?.[f.id];
  const helpfulN  = _faqHelpful?.[f.id] || 0;
  const isHot     = hotIds.has(f.id);
  const mins      = _faqReadMins(f.a);
  const hlQ       = _faqHl(f.q, q);

  return `<div class="faq2-item ${isOpen ? 'open' : ''} ${kbFocus ? 'faq2-kb-focus' : ''}"
    id="faq-item-${f.id}" data-faq-id="${f.id}">
    <button type="button" class="faq2-q" onclick="_faqToggle('${f.id}')"
      aria-expanded="${isOpen}">
      <span class="faq2-ico">${f.ico || '❓'}</span>
      <span class="faq2-q-text">${hlQ}</span>
      ${isHot ? '<span class="faq2-pill-hot" title="Souvent utile">★ Top</span>' : ''}
      ${helpfulN >= 3 ? `<span class="faq2-pill-count">${helpfulN} utiles</span>` : ''}
      <svg class="faq2-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <polyline points="6,9 12,15 18,9"/>
      </svg>
    </button>
    <div class="faq2-a">
      <div class="faq2-a-inner">
        ${_faqHl(f.a || '', q)}
        <div class="faq2-answer-meta">
          <span class="faq2-readtime">~${mins} min de lecture</span>
          <button type="button" class="btn btn-ghost btn-xs faq2-copy-btn"
            onclick="event.stopPropagation();_faqCopyLink('${f.id}')">🔗 Copier le lien</button>
        </div>
        ${isOpen ? _faqRelatedHtml(f) : ''}
        <div class="faq2-vote">
          <span class="faq2-vote-label">Cette réponse vous a aidé ?</span>
          <button type="button" class="faq2-vote-btn ${vote === true  ? 'voted-yes' : ''}"
            onclick="_faqVote('${f.id}', true)">👍 Oui</button>
          <button type="button" class="faq2-vote-btn ${vote === false ? 'voted-no'  : ''}"
            onclick="_faqVote('${f.id}', false)">👎 Non</button>
        </div>
      </div>
    </div>
  </div>`;
}

// ── HELPERS UI ────────────────────────────────────────────────────────────────

function _faqToggle(id) {
  _faqOpenId = _faqOpenId === id ? null : id;
  if (_faqOpenId) {
    _faqMarkRead(_faqOpenId);
    _faqReplaceHash(_faqOpenId);
    _faqKbIdx = _faqLastVisibleIds.indexOf(_faqOpenId);
  } else {
    _faqClearHashIfFaq();
  }
  _faqRenderList(_faqListId());
  if (_faqOpenId) {
    setTimeout(() => document.getElementById('faq-item-' + id)
      ?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 50);
  }
}

function _faqJumpTo(id, opts) {
  _faqActiveCat   = 'all';
  _faqOpenId      = id;
  _faqSearchQuery = '';
  const input    = document.getElementById(_faqSearchId());
  const clearBtn = document.getElementById(_faqClearId());
  if (input)    input.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  _faqMarkRead(id);
  if (!opts?.fromHash) _faqReplaceHash(id);
  _faqRenderCats(_faqCatsId());
  _faqRenderList(_faqListId());
  setTimeout(() => document.getElementById('faq-item-' + id)
    ?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 80);
}

function _faqVote(id, helpful) {
  _faqVotes = _faqVotes || {};
  const was = _faqVotes[id];
  _faqVotes[id] = helpful;
  _faqSaveVotes();
  if (helpful && was !== true) {
    _faqHelpful = _faqHelpful || {};
    _faqHelpful[id] = (_faqHelpful[id] || 0) + 1;
    _faqSaveHelpful();
    // Toast uniquement si connecté
    if (!_faqIsPublic && typeof toast === 'function') toast('Merci pour votre retour !', 'ok');
  }
  const root = document.getElementById('faq-item-' + id);
  if (!root) return;
  root.querySelectorAll('.faq2-vote-btn').forEach(b => b.classList.remove('voted-yes','voted-no'));
  const btns = root.querySelectorAll('.faq2-vote-btn');
  if (btns[0] && helpful)  btns[0].classList.add('voted-yes');
  if (btns[1] && !helpful) btns[1].classList.add('voted-no');
}

function _faqCopyLink(id) {
  const url = `${location.origin}${location.pathname}?faq=1#faq=${id}`;
  navigator.clipboard?.writeText(url)
    .then(() => { if (typeof toast === 'function') toast('Lien copié ✓', 'ok'); })
    .catch(() => {});
}

function _faqRelatedHtml(cur) {
  const data = _faqVisibleData();
  const tok  = new Set(_faqTokens(cur.q + ' ' + cur.a));
  const same = data.filter(f => f.id !== cur.id && f.cat === cur.cat);
  const scored = same.map(f => {
    let s = 0;
    for (const t of _faqTokens(f.q)) if (tok.has(t)) s++;
    return { f, s };
  }).filter(x => x.s > 0).sort((a,b) => b.s - a.s);
  const out = scored.map(x => x.f);
  if (out.length < 3) {
    for (const f of same) {
      if (out.length >= 3) break;
      if (!out.find(x => x.id === f.id)) out.push(f);
    }
  }
  const rel = out.slice(0, 3);
  if (!rel.length) return '';
  return `<div class="faq2-related">
    <div class="faq2-related-title">À lire aussi</div>
    <div class="faq2-related-list">
      ${rel.map(r => `
        <button type="button" class="faq2-related-chip" onclick="_faqJumpTo('${r.id}')">
          ${r.ico || '❓'} ${r.q}
        </button>`).join('')}
    </div>
  </div>`;
}

function _faqRenderAssistant(listId, q) {
  const el = document.getElementById(listId);
  if (!el) return;
  const data = _faqVisibleData();
  const ranked = data
    .map(it => ({ it, s: _faqScore(it, q) }))
    .filter(x => x.s > 0)
    .sort((a,b) => b.s - a.s)
    .slice(0,3)
    .map(x => x.it);

  el.innerHTML = `
    <div class="faq2-no-results">
      <div class="faq2-no-hint">
        <div class="faq2-no-ico">🔍</div>
        <div class="faq2-no-title">Aucun résultat pour « ${q} »</div>
        <div class="faq2-no-sub">Voici les questions les plus proches de votre recherche.</div>
      </div>
      <div class="faq2-ai-card">
        <div class="faq2-ai-head">
          <span class="faq2-ai-badge">Suggestions</span>
          <span class="faq2-ai-label">${ranked.length ? 'Questions similaires' : 'Aucune correspondance'}</span>
        </div>
        <div class="faq2-ai-body">
          ${ranked.length
            ? ranked.map(r => `
              <button type="button" class="faq2-ai-suggest" onclick="_faqJumpTo('${r.id}')">
                <span class="faq2-ai-suggest-ico">${r.ico || '❓'}</span>
                <span class="faq2-ai-suggest-txt">${r.q}</span>
                <span class="faq2-ai-suggest-go">Voir →</span>
              </button>`).join('')
            : `<p style="font-size:13px;color:var(--text-2);padding:4px 0;">
                Essayez des mots-clés comme <strong>ascenseur</strong>, <strong>parking</strong>,
                <strong>mot de passe</strong>, <strong>vote</strong>…
              </p>`}
        </div>
        <div class="faq2-ai-foot">
          <span class="faq2-ai-foot-label">Toujours bloqué ?</span>
          <button type="button" class="btn btn-secondary btn-sm" onclick="_faqClearSearch()">← Retour</button>
          ${!_faqIsPublic ? `
            <button type="button" class="btn btn-primary btn-sm" onclick="nav('messages')">💬 Message</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="nav('contacts')">📞 Contacts</button>
          ` : `
            <a href="${location.origin}${location.pathname}" class="btn btn-primary btn-sm"
              style="text-decoration:none;">Se connecter</a>
          `}
        </div>
      </div>
    </div>`;
}

// ── PROGRESSION ───────────────────────────────────────────────────────────────

function _faqProgressHtml() {
  const data  = FAQ_DATA;
  const n     = Object.keys(_faqRead || {}).filter(id => data.some(f => f.id === id)).length;
  const total = data.length;
  const pct   = total ? Math.round((n / total) * 100) : 0;
  return `<div class="faq2-progress" title="Questions consultées sur cet appareil">
    <div class="faq2-progress-ring" style="--p:${pct};"><span>${pct}%</span></div>
    <div class="faq2-progress-txt"><strong>${n}</strong> / ${total} vues</div>
  </div>`;
}

function _faqRefreshProgress() {
  if (_faqIsPublic) return;
  const ring = document.querySelector('.faq2-progress');
  if (!ring) return;
  const n     = Object.keys(_faqRead || {}).filter(id => FAQ_DATA.some(f => f.id === id)).length;
  const total = FAQ_DATA.length;
  const pct   = total ? Math.round((n / total) * 100) : 0;
  const pr    = ring.querySelector('.faq2-progress-ring');
  const span  = pr?.querySelector('span');
  if (pr)   pr.style.setProperty('--p', String(pct));
  if (span) span.textContent = pct + '%';
  const txt = ring.querySelector('.faq2-progress-txt');
  if (txt) txt.innerHTML = `<strong>${n}</strong> / ${total} vues`;
}

function _faqMarkRead(id) {
  if (!id) return;
  _faqRead = _faqRead || {};
  _faqRead[id] = new Date().toISOString();
  _faqSaveRead();
}

// ── UTILS ────────────────────────────────────────────────────────────────────

function _faqReadMins(html) {
  const words = (html || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().split(' ').length;
  return Math.max(1, Math.round(words / 220) || 1);
}

function _faqTokens(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(t => t.length > 2);
}

function _faqHl(text, q) {
  if (!q) return text;
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return (text || '').replace(new RegExp(`(${safe})`, 'gi'), '<span class="faq2-hl">$1</span>');
}

function _faqScore(item, q) {
  const qq  = (q||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if (!qq) return 0;
  const hay = (item.q + ' ' + (item.a||'').replace(/<[^>]+>/g,' ')).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  let s = 0;
  for (const t of qq.split(' ').filter(Boolean)) if (hay.includes(t)) s += 2;
  if ((item.q||'').toLowerCase().includes(qq)) s += 4;
  return s;
}

function _faqTopHelpfulSet() {
  const entries = Object.entries(_faqHelpful || {}).filter(([,n]) => (n||0) > 0);
  entries.sort((a,b) => b[1] - a[1]);
  return new Set(entries.slice(0,5).map(([id]) => id));
}

// ── HASH & DEEP LINKS ────────────────────────────────────────────────────────

function _faqParseHashId() {
  const m = (location.hash || '').replace(/^#/,'').match(/^faq=([\w-]+)$/i);
  return m ? m[1] : null;
}

function _faqReplaceHash(id) {
  const h = `#faq=${id}`;
  if (location.hash !== h) {
    try { history.replaceState(null,'',`${location.pathname}${location.search}${h}`); }
    catch { location.hash = h; }
  }
}

function _faqClearHashIfFaq() {
  if (/^#faq=/.test(location.hash||'')) {
    try { history.replaceState(null,'',`${location.pathname}${location.search}`); }
    catch { location.hash = ''; }
  }
}

// ── CLAVIER ──────────────────────────────────────────────────────────────────

function _faqBindHashListener() {
  if (window.__faqHashBound) return;
  window.__faqHashBound = true;
  window.addEventListener('hashchange', () => {
    const onFaqPage = _faqIsPublic || (typeof currentPage !== 'undefined' && currentPage === 'faq');
    if (!onFaqPage) return;
    const id = _faqParseHashId();
    if (id && FAQ_DATA.some(f => f.id === id)) _faqJumpTo(id, { fromHash: true });
  });
}

function _faqBindKeyboard() {
  if (window.__faqKbBound) return;
  window.__faqKbBound = true;
  document.addEventListener('keydown', _faqOnKeydown);
}

function _faqOnKeydown(e) {
  const onFaqPage = _faqIsPublic || (typeof currentPage !== 'undefined' && currentPage === 'faq');
  if (!onFaqPage) return;
  if (!_faqIsPublic && typeof $ === 'function' && $('search-overlay')) return;
  const tag     = (e.target?.tagName || '');
  const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;
  const searchEl = document.getElementById(_faqSearchId());

  if (e.key === '/' && !inField) { e.preventDefault(); searchEl?.focus(); return; }
  if (e.key === 'Escape' && document.activeElement === searchEl && !(_faqSearchQuery||'').trim()) { searchEl?.blur(); return; }
  if (e.key === 'Escape' && (_faqSearchQuery||'').trim()) { e.preventDefault(); _faqClearSearch(); return; }
  if (inField && document.activeElement === searchEl && e.key === 'ArrowDown') { e.preventDefault(); _faqKbMove(1); return; }
  if (inField) return;
  if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown')  { e.preventDefault(); _faqKbMove(1); }
  else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') { e.preventDefault(); _faqKbMove(-1); }
  else if (e.key === 'Enter') { const id = _faqLastVisibleIds[_faqKbIdx]; if (id) _faqToggle(id); }
}

function _faqKbMove(delta) {
  if (!_faqLastVisibleIds.length) return;
  if (_faqKbIdx < 0) _faqKbIdx = 0;
  else _faqKbIdx = (_faqKbIdx + delta + _faqLastVisibleIds.length) % _faqLastVisibleIds.length;
  _faqRenderList(_faqListId());
  const id = _faqLastVisibleIds[_faqKbIdx];
  requestAnimationFrame(() => document.getElementById('faq-item-' + id)
    ?.scrollIntoView({ behavior:'smooth', block:'nearest' }));
}

// ── COMPAT ANCIENS APPELS (search globale Ctrl+K) ────────────────────────────

function faqGlobalSearchMatches(query, n) {
  const qq = (query || '').trim().toLowerCase();
  if (!qq || qq.length < 2) return [];
  return FAQ_DATA
    .map(f => ({ f, s: (f.q.toLowerCase().includes(qq) ? 10 : 0) + _faqScore(f, qq) * 0.5 }))
    .filter(x => x.s > 0)
    .sort((a,b) => b.s - a.s)
    .slice(0, n || 4)
    .map(x => ({ id: x.f.id, q: x.f.q, ico: x.f.ico || '❓' }));
}

function navigateToFaqItem(id) {
  if (typeof nav === 'function') nav('faq');
  setTimeout(() => _faqJumpTo(id), 50);
}

// Alias pour compatibilité avec les anciens appels inline dans le HTML existant
const faqToggle   = _faqToggle;
const faqJumpTo   = _faqJumpTo;
const faqVote     = _faqVote;
const faqSetCat   = _faqSetCat;
const faqOnSearch = _faqOnSearch;
