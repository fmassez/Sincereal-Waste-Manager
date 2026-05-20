# Waste Manager - Guide d'Installation Entreprise

## 📋 Prérequis

- Windows 10/11 ou macOS
- OneDrive synchronisé avec votre compte entreprise
- Node.js (pour la solution 1 - optionnel si vous utilisez la version portable)

---

## 🚀 Solution 1 : Version Portable (Recommandée)

La plus simple pour un déploiement rapide en entreprise.

### Installation

1. **Copier le dossier** `WasteManager-Portable` sur votre OneDrive
2. **Partager le dossier** avec les collègues via OneDrive
3. **Lancer** l'application avec le script fourni

### Pour les utilisateurs

```bash
# Windows - Double-cliquer sur :
start-wastemanager.bat

# macOS - Terminal :
./start-wastemanager.sh
```

L'application sera accessible sur : `http://localhost:8080`

---

## 💻 Solution 2 : Application Desktop (Electron)

Application autonome comme un logiciel classique.

### Avantages
- Pas besoin de navigateur
- Icône sur le bureau
- Fonctionne hors-ligne
- Données stockées localement

### Installation
1. Télécharger `WasteManager-Setup.exe` (Windows) ou `WasteManager.dmg` (macOS)
2. Installer comme un logiciel standard
3. Lancer depuis le menu Démarrer / Applications

---

## 🐳 Solution 3 : Docker (Pour IT/Admin)

Pour déploiement sur un serveur interne.

```bash
# Construire l'image
docker build -t wastemanager .

# Lancer le conteneur
docker run -p 8080:80 wastemanager
```

---

## 🔧 Configuration Multi-Utilisateurs

### Gestion des utilisateurs

L'application utilise Zustand avec persistance localStorage. Pour un environnement multi-utilisateurs :

1. **Option A - Données locales** : Chaque utilisateur a ses propres données
2. **Option B - Backend partagé** : Nécessite un serveur API (Node.js/Express + MongoDB/PostgreSQL)

### Pour ajouter un backend partagé (Option B)

Contactez votre service IT pour déployer :
- Un serveur Node.js avec Express
- Une base de données (MongoDB ou PostgreSQL)
- Configuration CORS pour l'application

---

## 📁 Structure des fichiers

```
WasteManager-Portable/
├── dist/                    # Application buildée
├── server/                  # Serveur local léger
│   ├── serve.js            # Serveur Node.js
│   └── package.json        # Dépendances serveur
├── start-wastemanager.bat  # Lanceur Windows
├── start-wastemanager.sh   # Lanceur macOS/Linux
└── README.md               # Ce fichier
```

---

## 🔒 Sécurité Entreprise

### Conformité Nestlé
- ✅ Pas de données externes (tout est local)
- ✅ Fonctionne sans accès Internet
- ✅ Compatible OneDrive Enterprise
- ✅ Pas d'installation admin requise (version portable)

### Sauvegarde des données
Les données sont stockées dans le localStorage du navigateur. Pour sauvegarder :
1. Exporter régulièrement via le bouton "Exporter CSV"
2. Ou sauvegarder le dossier complet OneDrive

---

## ❓ Support

En cas de problème :
1. Vérifier que le port 8080 n'est pas utilisé
2. Vérifier les droits d'écriture sur OneDrive
3. Contacter votre service IT pour les droits d'exécution de scripts
