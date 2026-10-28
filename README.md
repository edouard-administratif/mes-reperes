# Mes repères

Carnet alimentaire personnel en français, décliné en application Web et en application Android avec **Capacitor 8 et SQLite natif**.

## Préparer le projet

Prérequis : Node.js 24 ou plus récent.

```sh
npm install
npm test
```

L’installation télécharge les dépendances et crée `package-lock.json`. Les tests de logique et de stockage ne nécessitent pas Android Studio.

## Android

Prérequis : Android Studio 2025.2.1 ou plus récent, son JDK et un SDK Android adaptés à Capacitor 8. Configurer le SDK via Android Studio (ou `ANDROID_HOME`).

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

## Web

```sh
npm start
```

Ouvrir **http://localhost:4173**. Le serveur ne sert que les fichiers statiques du dossier `dist/`. Pour un hébergement, servir ce dossier après `npm run build`. L’ouverture directe en `file://` ne convient pas aux modules JavaScript.

Le build embarque le DSFR, Remix Icon, les polices et les ressources SQLite WebAssembly. Aucun CDN n’est nécessaire à l’exécution. Android fonctionne hors connexion une fois installé. La version Web nécessite que ses ressources soient accessibles ; aucun service worker de mise en cache n’est ajouté.

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
- L’import remplace le carnet après confirmation et transaction réussie. Les catégories inconnues sont ignorées et signalées ; les sauces devenues orphelines sont écartées.
- Le format est celui de la version courante : aucune migration d’un ancien format ni conversion de grammes n’est implémentée.

Pour passer du navigateur à Android, exporter le carnet JSON puis l’importer dans l’application. Les données de la version Web ne sont pas transférées automatiquement. Garder une copie exportée : effacer les données de l’application ou la désinstaller peut supprimer le carnet local.

Ne pas ajouter les exports personnels ni les fichiers SQLite au dépôt Git.

## Organisation

```text
src/
  index.html                    Structure de l’interface
  css/                          Styles et imports DSFR / Remix Icon
  js/
    app.js                      Initialisation de l’application
    platform.js                 Choix explicite du stockage natif ou Web
    catalog.js                  Catégories, familles, repas et préparations
    dates.js                    Dates et semaines lundi–dimanche
    notebook.js                 Validation du format et imports
    nutrition.js                Compteurs et sauces associées
    chocolate.js                Crédits chocolat et expiration
    schema.js                   Tables SQLite communes
    sqlite-records.js           Conversion des lignes et requêtes liées
    repository-native.js        Transactions SQLite via le pont Capacitor
    repository.js               Adaptateur SQLite Web
    browser-storage.js          Fichier SQLite Web dans IndexedDB
    sqlite-browser.js           Chargement local du moteur WebAssembly
    transfer-native.js          Export par fichier et partage Android
    store.js                    File de modifications et état confirmé
    ui.js                       Affichage et interactions
scripts/
  build.mjs                     Bundle et copie des ressources locales
  serve.mjs                     Serveur statique de développement
  android-sync.mjs              Génération et synchronisation Android
  android-apk.mjs               Compilation de l’APK de debug
capacitor.config.json           Identité et configuration Capacitor
test/                           Tests de logique, stockage et contrôleur
```

`dist/` est un résultat de build. Après une modification du code, relancer `npm run android:sync` pour mettre à jour l’application Android.

## Fonctionnalités

- Saisie des aliments par portions, journée, repas et famille.
- Maximums personnels et objectifs journaliers ou hebdomadaires modifiables.
- Préparation indépendante par famille, sauf laitages et fromages.
- « En sauce » ajoute une sauce riche liée ; supprimer l’aliment retire aussi sa sauce. L’annulation restaure les deux.
- Mesures hebdomadaires de poids et de masse graisseuse.
- Efforts S/M/L : 2 S ou 1 M donnent un carré de chocolat, 1 L en donne deux. Les carrés expirent à la fin du lendemain ; les plus anciens sont consommés en premier.

## Vérifications et limite de cette livraison

Les 16 tests couvrent les règles métier, les imports, les transactions et la réouverture SQLite, les conflits entre onglets, le rollback de l’adaptateur natif, le contrat d’export Android et les interactions du contrôleur.

Les tests de l’adaptateur natif utilisent SQLite natif de Node et une connexion asynchrone reproduisant le contrat du plugin. Ils ne remplacent pas une exécution du plugin sur Android.

Dans l’environnement de préparation, l’installation réseau des dépendances a été bloquée puis interrompue. Le bundle, le projet Android généré et l’APK n’ont donc pas pu être construits ; aucun test sur émulateur ou téléphone n’a été réalisé. Les scripts ci-dessus effectuent ces étapes sur une machine équipée.

## Références

- [Capacitor](https://capacitorjs.com/docs)
- [SQLite natif pour Capacitor](https://github.com/capacitor-community/sqlite)
- [DSFR](https://www.systeme-de-design.gouv.fr/)
- [Remix Icon](https://remixicon.com/)
- [sql.js, uniquement pour la version Web](https://github.com/sql-js/sql.js/)

Le carnet est un outil personnel ; il ne représente pas un service officiel de l’État, LeDiet ou WeightWatchers. Les règles nutritionnelles personnelles ne constituent pas une prescription médicale. Les sources des repères généraux restent accessibles dans l’application.
