# Souvenirs du mariage – installation (20 minutes)

Architecture : une page web statique (`index.html`) + un script Google Apps Script qui reçoit les fichiers dans ton Google Drive. Aucun serveur à louer, aucun abonnement. Les invités ne voient jamais le dossier, ils ne peuvent qu'y déposer.

## 1. Côté Google Drive

1. Crée un dossier dans ton Drive, par exemple `Mariage Aude et Jérémie – souvenirs invités`. Copie son identifiant (dans l'URL : `drive.google.com/drive/folders/**ID**`).
2. Crée une feuille Google Sheets vide `Journal des envois`. Copie son identifiant (dans l'URL : `/spreadsheets/d/**ID**/edit`).

## 2. Côté Apps Script

1. Va sur script.google.com, nouveau projet, nomme-le `souvenirs-mariage`.
2. Dans l'éditeur, roue crantée > Paramètres du projet > coche « Afficher le fichier manifeste appsscript.json ».
3. Remplace le contenu de `Code.gs` par le fichier fourni, et celui de `appsscript.json` par le fichier fourni.
4. Dans `Code.gs`, renseigne `FOLDER_ID` et `SHEET_ID`.
5. Exécute une fois la fonction `doGet` (bouton Exécuter) pour autoriser les accès Drive et Sheets demandés.
6. Déployer > Nouveau déploiement > type « Application web » :
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
   - Copie l'URL qui se termine par `/exec`.

À chaque modification de `Code.gs`, il faut refaire Déployer > Gérer les déploiements > modifier > nouvelle version, sinon l'URL sert l'ancien code.

## 3. Côté page web

1. Dans `index.html`, colle l'URL `/exec` dans `CONFIG.SCRIPT_URL`.
2. Dépose la photo du couple sous le nom `couple.jpg` dans le même dossier que `index.html` (elle remplit l'octogone de l'accueil).
3. Héberge le dossier gratuitement : Netlify Drop (app.netlify.com/drop, glisser-déposer le dossier) ou GitHub Pages. Il faut une URL en **https**, la page ne fonctionne pas ouverte en local (`file://`) à cause de la sécurité navigateur.
4. Génère un QR code vers l'URL pour les tables et le livret.

## 4. Test avant diffusion

- Envoie depuis un PC : une photo + un fichier avec un mot par fichier + un mot global.
- Envoie depuis un iPhone et un Android : une vidéo de plusieurs centaines de Mo (l'envoi se fait par morceaux de 8 Mo, avec reprise en cas d'échec d'un morceau).
- Vérifie dans Drive : un sous-dossier `date – nom` par envoi, le mot par fichier dans la description du fichier (clic droit > Informations), le mot global dans `Mot de X.txt`, et une ligne par élément dans le Sheet.

## Ce qu'il faut savoir

- **Limites** : le quota Drive de ton compte (15 Go gratuit, plus avec Google One). Compte 50 à 300 Mo par vidéo de téléphone. Le script accepte 4 Go par fichier (`MAX_FILE_MB`).
- **Confidentialité** : la page ne liste rien, il n'existe aucune route de lecture. Le seul risque est le lien de l'application web : quelqu'un qui l'a peut *déposer* des fichiers, jamais en lire. Ne diffuse que l'URL de la page, pas celle du script.
- **Formats iPhone** : les photos arrivent en HEIC et les vidéos en HEVC. Prévois VLC ou une conversion avant projection.
- **Après le mariage** : Déployer > Gérer les déploiements > archiver, pour fermer la porte.
- **Pas testé en conditions réelles ici** (pas d'accès Google depuis mon environnement) : le mécanisme d'upload par session « resumable » ouverte côté serveur est un schéma connu et documenté, mais fais le test du point 4 avant d'imprimer les QR codes.
