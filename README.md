# Mes repères

Le logo source est `assets/branding/logo-clin-oeil.svg`. Après modification, exécuter
`python3 scripts/generate-branding.py` (Python 3 et Inkscape requis) pour régénérer
les icônes Android, les splash screens et le drawable vectoriel natif. Puis
recompiler l’APK avec `npm run android:docker`.

Carnet alimentaire personnel en français, décliné en application Web et en application Android avec **Capacitor 8 et SQLite natif**.

## Préparer le projet

Prérequis : Node.js 24 ou plus récent.

```sh
npm install
npm test
```

L’installation télécharge les dépendances. Le fichier `package-lock.json` verrouille les versions ; utiliser `npm ci` pour reproduire une installation. Les tests de logique et de stockage ne nécessitent pas Android Studio.

## Android

Prérequis : Android Studio 2025.2.1 ou plus récent, un JDK 21 et le SDK Android 36 adaptés à Capacitor 8. Configurer le SDK via Android Studio (ou `ANDROID_HOME`).

```sh
npm run android:sync
npm run android:open
```

`android:sync` construit les ressources locales, crée automatiquement le projet natif `android/` s’il n’existe pas, puis synchronise les plugins. `android:open` ouvre ce projet dans Android Studio. Choisir un émulateur ou un téléphone pour lancer l’application.

Identifiant de l’application : **fr.mesreperes.app**. Nom affiché : **Mes repères**. La configuration est dans `capacitor.config.json`.

Pour produire un APK de test :

```sh
npm run android:apk
```

Le résultat attendu est `android/app/build/outputs/apk/debug/app-debug.apk`. Il s’agit d’un APK de développement signé avec la clé de debug ; aucune configuration de signature de production ni publication sur le Play Store n’est incluse.

Le dossier Android est généré par le CLI officiel de Capacitor, pas par un gabarit maintenu à la main. Une fois généré, conserver ses fichiers sources et sa configuration dans Git ; les ressources copiées et les résultats de compilation sont ignorés.

### Compiler avec Docker

Sur Ubuntu, seuls Node.js 24+ et un moteur Docker accessible sont nécessaires ; Java et le SDK Android sont fournis par l’image [Cirrus Labs Android SDK 36](https://github.com/cirruslabs/docker-images-android).

```sh
npm ci
npm run android:docker
```

Cette commande reconstruit le Web, synchronise Capacitor, puis lance `assembleDebug` dans `ghcr.io/cirruslabs/android-sdk:36` (image verrouillée par son digest dans le script). Le premier lancement télécharge l’image et les dépendances Gradle. Le dépôt n’est ni publié ni envoyé à un service de compilation.

L’APK est écrit dans **`android/app/build/outputs/apk/debug/app-debug.apk`**. Sous Linux, le conteneur utilise ton UID/GID pour que les fichiers produits restent à ton nom. Seuls `android/`, `node_modules/` et le cache de compilation sont montés dans le conteneur.

Le cache Gradle et la clé de signature de debug sont conservés dans **`.cache/android-docker/`**, ignoré par Git (clé : `android/debug.keystore` dans ce cache). Conserver ce dossier permet de réutiliser les téléchargements et de signer les prochaines versions avec la même clé. Une nouvelle clé peut empêcher Android de mettre à jour une installation précédente : exporter le carnet avant toute désinstallation. Cette clé sert aux APK de développement, pas à une publication de production.

Docker doit être démarré et `docker info` doit fonctionner avec ton utilisateur. Ne lance pas `sudo npm`.

### Compiler avec GitHub Actions

Le workflow **Android debug APK** (`.github/workflows/android-debug.yml`) lance les tests puis réutilise `npm run android:docker` sur un runner Ubuntu. Il démarre à chaque push sur `main` et peut être lancé depuis **Actions → Android debug APK → Run workflow**.

Une fois le workflow terminé, ouvrir son exécution et télécharger **Artifacts → mes-reperes-debug-<numéro>**. L’archive contient l’APK et son empreinte SHA-256 ; elle est conservée 14 jours. Aucun envoi sur le Play Store ni création de release GitHub n’est effectué.

Pour signer les builds CI avec ta clé de debug existante, ajouter le secret de dépôt **ANDROID_DEBUG_KEYSTORE_BASE64** dans **Settings → Secrets and variables → Actions**. Il doit contenir le fichier `.cache/android-docker/android/debug.keystore` encodé en base64, avec l’alias et les mots de passe Android de debug habituels. Depuis ta machine, avec GitHub CLI authentifié :

```sh
base64 -w 0 .cache/android-docker/android/debug.keystore | gh secret set ANDROID_DEBUG_KEYSTORE_BASE64 --repo edouard-administratif/mes-reperes
```

La clé n’est ni ajoutée au dépôt ni conservée dans le cache de compilation. Sans ce secret, chaque exécution génère une clé temporaire : un APK déjà installé avec une autre clé ne pourra pas être mis à jour directement. Exporter son carnet avant une éventuelle désinstallation. Ce mécanisme concerne uniquement les builds de debug, pas la signature de production.

## Web

```sh
npm start
```

Ouvrir **http://localhost:4173**. Le serveur ne sert que les fichiers statiques du dossier `dist/`. Pour un hébergement, servir ce dossier après `npm run build`. Pour ouvrir directement un fichier sans serveur, utiliser la version autonome décrite ci-dessous.

Le build embarque les styles locaux, Remix Icon, sa police d’icônes et le binaire SQLite WebAssembly. Aucun CDN n’est nécessaire à l’exécution. Android fonctionne hors connexion une fois installé. La version Web nécessite que ses ressources soient accessibles ; aucun service worker de mise en cache n’est ajouté.

## Fichier HTML autonome hors ligne

```sh
npm run build
```

Ouvrir **`dist/mes-reperes-hors-ligne.html`** directement dans un navigateur moderne (double clic, adresse `file://`). Ce fichier contient le JavaScript, les styles, les polices, les icônes et le moteur SQLite. Il ne nécessite ni serveur ni connexion Internet, même au premier lancement. Les liens des sources nutritionnelles restent des liens externes, consultables avec une connexion.

Le carnet est enregistré dans IndexedDB, **pas dans le fichier HTML**. Copier le HTML seul ne copie donc pas les repas. Utiliser **Exporter mon carnet** puis **Importer** pour les transférer. Garder le même navigateur, profil et emplacement du fichier ; le stockage des pages `file://` dépend du navigateur. Une navigation privée ou l’effacement des données du navigateur peut supprimer le carnet. Si le navigateur refuse IndexedDB pour les fichiers locaux, utiliser `npm start` ou l’application Android.

Les licences des bibliothèques sont intégrées au HTML autonome et également disponibles dans `dist/THIRD_PARTY_NOTICES.txt`.

## Stockage : natif et Web séparés

### Android

- Le JavaScript détecte la plateforme Capacitor et utilise exclusivement `@capacitor-community/sqlite`.
- Le moteur SQLite est natif et le fichier est dans l’espace privé de l’application, nommé par le plugin à partir de `mes_reperes`.
- Le fichier n’est pas conservé dans IndexedDB et le moteur WebAssembly n’est pas chargé.
- Chaque sauvegarde est une transaction native. Un échec n’actualise pas le carnet affiché.
- Le carnet est non chiffré, protégé par l’isolation du stockage privé Android. Aucun secret ni mot de passe de base n’est inclus.
- Si le plugin natif est absent, l’application affiche une erreur ; elle ne bascule pas silencieusement vers le stockage Web.

### Navigateur

SQLite s’exécute via sql.js/WebAssembly ; son fichier binaire est conservé dans IndexedDB. Chaque modification est sauvegardée avant confirmation à l’écran. Le numéro de révision empêche un onglet ancien d’écraser les modifications d’un autre onglet.

Les deux adaptateurs partagent les mêmes tables, règles de validation et règles métier. Aucun compte ni service de synchronisation n’est ajouté.

## Import et export

- **Android :** l’export crée un JSON dans le cache privé puis ouvre la boîte de partage Android pour l’enregistrer ou l’envoyer avec une application choisie. Aucune permission d’accès général aux fichiers n’est nécessaire. L’import utilise le sélecteur de fichiers de la WebView.
- **Web :** l’export télécharge le JSON et l’import ouvre le sélecteur de fichiers du navigateur.
- L’import remplace le carnet après confirmation et transaction réussie. Les catégories inconnues sont ignorées et signalées.
- Le format est celui de la version courante : aucune migration d’un ancien format ni conversion de grammes n’est implémentée.

Pour passer du navigateur à Android, exporter le carnet JSON puis l’importer dans l’application. Les données de la version Web ne sont pas transférées automatiquement. Garder une copie exportée : effacer les données de l’application ou la désinstaller peut supprimer le carnet local.

Ne pas ajouter les exports personnels ni les fichiers SQLite au dépôt Git.

## Organisation

```text
src/
  index.html                    Structure de l’interface
  css/                          Styles locaux et import Remix Icon
  js/
    app.js                      Initialisation de l’application
    platform.js                 Choix explicite du stockage natif ou Web
    catalog.js                  Catégories, familles, repas et préparations
    dates.js                    Dates et semaines lundi–dimanche
    notebook.js                 Validation du format et imports
    nutrition.js                Compteurs et saisie des portions
    chocolate.js                Crédits chocolat et expiration
    schema.js                   Tables SQLite communes
    sqlite-records.js           Conversion des lignes et requêtes liées
    repository-native.js        Transactions SQLite via le pont Capacitor
    repository.js               Adaptateur SQLite Web
    browser-storage.js          Fichier SQLite Web dans IndexedDB
    sqlite-browser.js           Initialisation du moteur WebAssembly embarqué
    transfer-native.js          Export par fichier et partage Android
    store.js                    File de modifications et état confirmé
    ui.js                       Affichage et interactions
scripts/
  build.mjs                     Bundles Web/Android et HTML autonome
  serve.mjs                     Serveur statique de développement
  android-sync.mjs              Génération et synchronisation Android
  android-apk.mjs               Compilation de l’APK de debug
  android-docker.mjs            Synchronisation et compilation dans Docker
capacitor.config.json           Identité et configuration Capacitor
test/                           Tests de logique, stockage et contrôleur
```

`dist/` est un résultat de build. Après une modification du code, relancer `npm run android:sync` pour mettre à jour l’application Android.

## Fonctionnalités

- Saisie des aliments par portions, journée, repas et famille.
- Maximums personnels et objectifs journaliers ou hebdomadaires modifiables.
- Préparation indépendante par famille, sauf laitages et fromages.
- Les préparations sont des étiquettes : la sauce riche est une catégorie indépendante à saisir manuellement.
- Mesures hebdomadaires de poids et de masse graisseuse.
- Efforts S/M/L : 2 S ou 1 M donnent un carré de chocolat, 1 L en donne deux. Les carrés expirent à la fin du lendemain ; les plus anciens sont consommés en premier.

## Vérifications et limite de cette livraison

Les 16 tests couvrent les règles métier, les imports, les transactions et la réouverture SQLite, les conflits entre onglets, le rollback de l’adaptateur natif, le contrat d’export Android et les interactions du contrôleur.

Les tests de l’adaptateur natif utilisent SQLite natif de Node et une connexion asynchrone reproduisant le contrat du plugin. Ils ne remplacent pas une exécution du plugin sur Android.

Vérification locale du 27 octobre 2026 :

- Les 16 tests passent.
- `npm run build` produit le bundle Web et le HTML autonome.
- Le HTML autonome a été exécuté dans Edge/Chromium en mode hors connexion, via `file://`, avec un profil de test vierge : ajout, persistance après rechargement, export JSON et réimport réussis, sans requête HTTP ni erreur JavaScript. La largeur mobile de 390 px ne déborde pas.
- `npm run android:sync` génère et synchronise le projet `android/` avec SQLite, Filesystem et Share.
- `npm run android:docker` compile avec succès l’APK de debug et les plugins natifs, sans Java installé sur l’hôte. Les Build Tools sont fixés à 36.0.0 pour tous les modules dans `android/build.gradle`, afin d’utiliser ceux de l’image.
- L’APK produit dans `android/app/build/outputs/apk/debug/app-debug.apk` a été vérifié par `apksigner` : signature v2 valide. Sa clé de debug persiste dans le cache local. Aucun test sur émulateur ou téléphone n’a encore été réalisé.

Le DSFR fourni dans l’archive initiale a été remplacé par des styles locaux : son installation demandait l’acceptation de conditions spécifiques. Aucune acceptation n’a été enregistrée. Le projet n’en dépend plus.

## Références

- [Capacitor](https://capacitorjs.com/docs)
- [SQLite natif pour Capacitor](https://github.com/capacitor-community/sqlite)
- [Remix Icon](https://remixicon.com/)
- [sql.js, uniquement pour la version Web](https://github.com/sql-js/sql.js/)

Le carnet est un outil personnel ; il ne représente pas un service officiel de l’État, LeDiet ou WeightWatchers. Les règles nutritionnelles personnelles ne constituent pas une prescription médicale. Les sources des repères généraux restent accessibles dans l’application.

La saisie quotidienne propose les catégories déjà consommées dans le carnet. Dans les réglages regroupés par famille, le bouton œil permet de forcer leur masquage sans effacer l’historique ; le bouton + note une première portion pour le jour et le repas sélectionnés. Les liens sous les titres ouvrent la famille correspondante dans les réglages ou la saisie. Les familles sont repliées initialement et une seule s’ouvre à la fois dans chaque espace. Vin, bière et autres alcools sont suivis en verres, sans plafond prédéfini, dans une famille dédiée ; les biscuits apéritifs figurent dans les entrées.
