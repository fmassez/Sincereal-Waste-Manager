# 🗑️ Waste Manager - Installateur Entreprise

Ce package contient plusieurs solutions pour déployer Waste Manager dans votre environnement d'entreprise Nestlé.

---

## 📦 Contenu du package

```
WasteManager-Installer/
├── 📁 WasteManager-Portable/     # Solution 1 : Version portable (RECOMMANDÉE)
├── 📁 WasteManager-Electron/     # Solution 2 : Application desktop
├── 📄 install-windows.ps1        # Script d'installation automatique Windows
├── 📄 Dockerfile                 # Solution 3 : Conteneur Docker
├── 📄 docker-compose.yml         # Configuration Docker Compose
├── 📄 nginx.conf                 # Configuration Nginx
├── 📄 README.md                  # Ce fichier
└── 📄 README-Installation.md     # Guide détaillé d'installation
```

---

## 🚀 Solutions proposées

### Solution 1 : Version Portable (⭐ Recommandée)

**Idéale pour :** Déploiement rapide sans droits administrateur

**Avantages :**
- ✅ Pas d'installation requise
- ✅ Fonctionne depuis OneDrive
- ✅ Partage facile entre collègues
- ✅ Pas de droits admin nécessaires

**Installation :**
1. Copier `WasteManager-Portable` sur votre OneDrive
2. Partager le dossier avec vos collègues
3. Double-cliquer sur `start-wastemanager.bat` (Windows) ou `start-wastemanager.sh` (Mac/Linux)

---

### Solution 2 : Application Desktop (Electron)

**Idéale pour :** Utilisation comme un logiciel classique

**Avantages :**
- ✅ Icône sur le bureau
- ✅ Fonctionne hors-ligne
- ✅ Pas de navigateur nécessaire
- ✅ Menu natif (Fichier, Affichage, etc.)

**Installation :**
1. Construire l'application :
   ```bash
   cd WasteManager-Electron
   npm install
   npm run build:win    # Pour Windows
   npm run build:mac    # Pour macOS
   ```
2. Distribuer le fichier `WasteManager-Setup.exe` ou `WasteManager.dmg`

---

### Solution 3 : Docker (Pour IT/Admin)

**Idéale pour :** Déploiement serveur interne

**Avantages :**
- ✅ Déploiement centralisé
- ✅ Mise à jour facile
- ✅ Scalable

**Installation :**
```bash
# Construire et lancer
docker-compose up -d

# Accéder à l'application
http://localhost:8080
```

---

## 🔧 Installation rapide (Windows)

### Méthode 1 : Script PowerShell (Automatique)

1. **Ouvrir PowerShell** en tant qu'administrateur
2. **Exécuter** :
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\install-windows.ps1
   ```
3. **Suivre les instructions** à l'écran

### Méthode 2 : Manuelle

1. **Vérifier Node.js** :
   ```cmd
   node --version
   ```
   Si non installé : [Télécharger Node.js](https://nodejs.org/)

2. **Copier** le dossier `WasteManager-Portable` sur votre PC

3. **Lancer** :
   ```cmd
   cd WasteManager-Portable
   start-wastemanager.bat
   ```

---

## 📂 Partage via OneDrive

### Pour le propriétaire (vous)

1. Copier `WasteManager-Portable` dans votre OneDrive
2. Clic droit → **Partager**
3. Ajouter les collègues avec droit de **modification**

### Pour les utilisateurs

1. Synchroniser le dossier partagé dans leur OneDrive
2. Lancer `start-wastemanager.bat`
3. L'application est accessible sur `http://localhost:8080`

---

## 👥 Gestion des utilisateurs

### Mode actuel (LocalStorage)

Chaque utilisateur a ses propres données stockées dans son navigateur.

**Pour synchroniser les données :**
- Utiliser la fonction **"Exporter CSV"** régulièrement
- Sauvegarder sur OneDrive partagé

### Mode multi-utilisateurs (Option avancée)

Pour un vrai mode multi-utilisateurs avec base de données partagée, contactez votre service IT pour :

1. Déployer un serveur Node.js + MongoDB
2. Configurer l'API backend
3. Modifier l'application pour utiliser l'API au lieu du localStorage

---

## 🔒 Sécurité & Conformité Nestlé

| Aspect | Statut |
|--------|--------|
| Données locales | ✅ Pas de cloud externe |
| Fonctionnement offline | ✅ Pas d'Internet requis |
| Installation admin | ❌ Non requise (portable) |
| Audit trail | ✅ Export CSV disponible |
| Sauvegarde | ✅ Via OneDrive |

---

## ❓ Dépannage

### Problème : "Node.js non trouvé"
**Solution :** Installer Node.js depuis https://nodejs.org/

### Problème : "Port 8080 déjà utilisé"
**Solution :** Modifier le port dans `server/serve.js` (ligne 4)

### Problème : "Accès refusé" (OneDrive)
**Solution :** Vérifier les droits de partage OneDrive

### Problème : Les modifications ne sont pas sauvegardées
**Solution :** Vérifier que le navigateur autorise le localStorage

---

## 📞 Support

En cas de problème :
1. Consulter `README-Installation.md`
2. Vérifier les prérequis
3. Contacter votre service IT interne

---

## 📝 Notes

- **Version actuelle :** 1.0.0
- **Dernière mise à jour :** Mars 2025
- **Développé pour :** Sincereal / Nestlé
- **Technologies :** React, TypeScript, Vite, Zustand, Tailwind CSS
