# Teranga Packaging — App de gestion & prospection

Application web 100% statique (HTML + CSS + JavaScript, sans serveur, sans
installation). Elle fonctionne directement en local et peut aussi être
installée comme une vraie application (PWA) sur téléphone ou ordinateur.

## Contenu du dossier

```
index.html          → page principale de l'application
style.css            → mise en forme (couleurs, mise en page)
app.js               → toute la logique (prospection, stock, budget, caisse)
manifest.json        → fiche d'identité de l'app pour l'installation (PWA)
sw.js                → fonctionnement hors-ligne (service worker)
icons/               → icônes de l'application (générées depuis le logo)
```

## 1. Utilisation en local (le plus simple)

Double-cliquez sur `index.html`. L'application s'ouvre dans le navigateur et
fonctionne immédiatement. Toutes les données sont sauvegardées automatiquement
dans le navigateur (localStorage) — rien à installer, rien à configurer.

**Remarque :** en ouverture directe par double-clic (`file://`), le mode
hors-ligne (service worker) et l'installation en icône ne sont pas
disponibles — ces fonctions demandent que l'app soit servie via une adresse
web (voir étape 2). Tout le reste (prospection, stock, budget, caisse,
export/import) fonctionne normalement en local.

## 2. Mettre l'app en ligne (gratuit, 1 minute) — Netlify

1. Allez sur https://app.netlify.com/drop
2. Glissez-déposez ce dossier entier (celui qui contient `index.html`) sur la
   page
3. Netlify vous donne une adresse (ex : `teranga-app.netlify.app`) — c'est
   votre application, accessible depuis n'importe quel téléphone ou
   ordinateur avec internet

Une fois en ligne, chaque prospecteur peut ouvrir cette adresse sur son
téléphone et utiliser le bouton **"Installer l'application"** proposé par le
navigateur (ou "Ajouter à l'écran d'accueil") pour avoir une icône comme une
vraie application, avec fonctionnement hors-ligne.

**Pour mettre à jour l'app plus tard :** repassez par
https://app.netlify.com/drop en glissant le dossier mis à jour, ou créez un
compte Netlify gratuit pour pouvoir redéployer sur la même adresse.

## 3. Synchroniser les données entre plusieurs téléphones (optionnel)

Par défaut, chaque appareil garde ses propres données (celles de son
navigateur). Si plusieurs prospecteurs doivent voir les mêmes fiches en temps
réel, activez la synchronisation via Firebase (gratuit à cette échelle) :

### a) Créer le projet Firebase
1. Allez sur https://console.firebase.google.com → **Ajouter un projet**
2. Menu de gauche → **Firestore Database** → **Créer une base de données**
   → mode production
3. Onglet **Rules** → collez ceci puis **Publish** :
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /teranga_packaging_sync/{code} {
         allow read, write: if true;
       }
     }
   }
   ```
4. Icône engrenage → **Project settings** → **Your apps** → icône `</>`
   (Web) → donnez un nom → copiez l'objet `firebaseConfig` affiché

### b) Connecter l'application
1. Dans l'app → **Réglages** → section **Synchronisation entre appareils**
2. Collez la configuration Firebase copiée à l'étape précédente
3. Choisissez un **code de synchronisation** (comme un mot de passe — par
   exemple `teranga-dakar-2026`)
4. Cliquez sur **Connecter**
5. Répétez l'étape 1-4 sur chaque appareil, avec **exactement le même code**

Les modifications faites sur un appareil apparaissent automatiquement sur les
autres en quelques secondes.

⚠️ Ce système de synchronisation n'a pas de mot de passe individuel : toute
personne qui connaît le code peut lire et modifier les données. Choisissez un
code peu évident et ne le partagez qu'avec l'équipe.

## 4. Sauvegarde automatique sur disque (optionnel)

Dans **Réglages → Sauvegarde automatique sur disque**, cliquez sur
**"Choisir un fichier"** pour désigner un fichier `.json` sur votre
ordinateur. L'application le mettra à jour automatiquement à chaque
modification — une sauvegarde supplémentaire, en plus du navigateur.
Fonctionne sur Chrome et Edge ; non disponible sur Firefox/Safari (utilisez
alors l'export manuel ci-dessous).

## 5. Export / Import manuel (filet de sécurité universel)

Dans **Réglages** :
- **Exporter** télécharge un fichier `.json` avec toutes les données
- **Importer** restaure les données depuis un fichier `.json` précédemment
  exporté

Fonctionne sur tous les navigateurs, sans configuration. Pensez à exporter
régulièrement si vous n'utilisez pas la synchronisation Firebase.

## Notes importantes

- **Une nouvelle adresse Netlify = une mémoire vide.** Si vous redéployez sur
  une NOUVELLE adresse au lieu de mettre à jour l'existante, il faudra
  reconnecter la synchronisation Firebase avec le même code pour retrouver
  les données.
- **Devise :** tous les montants sont affichés en FCFA.
- **Catalogue produits :** les 30 produits du site (Kraft, Plastique,
  Cosmétique) sont préchargés. Renseignez leurs prix unitaires réels dans
  **Réglages → Catalogue produits & prix** — ils sont utilisés pour calculer
  la valeur du stock et les simulations de budget.
