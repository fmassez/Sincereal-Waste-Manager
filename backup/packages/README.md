# Packages d'Installation - Sincereal Waste Manager

Ce dossier contient les guides d'installation pour différents environnements de déploiement.

## 📦 Packages disponibles

| Package | Description | Cas d'usage |
|---------|-------------|-------------|
| [OneDrive](./GUIDE_INSTALLATION_ONEDRIVE.md) | Déploiement depuis un dossier OneDrive partagé | Entreprises utilisant Microsoft 365 |
| [SharePoint](./GUIDE_INSTALLATION_SHAREPOINT.md) | Déploiement depuis SharePoint Online/Server | Entreprises avec infrastructure SharePoint |
| [Hébergement Classique](./GUIDE_INSTALLATION_HEBERGEMENT.md) | Déploiement sur hébergement web mutualisé/dédié | PME sans infrastructure interne |
| [Sans Serveur](./GUIDE_INSTALLATION_SANS_SERVEUR.md) | Installation PWA ou exécution locale | Utilisation hors ligne, pas de serveur |

## 🚀 Démarrage rapide

### Pour les utilisateurs Windows (OneDrive)
```powershell
# 1. Copier depuis OneDrive
robocopy "C:\Users\%USERNAME%\OneDrive\sincereal-waste-manager\dist" "C:\inetpub\wwwroot\sincereal-waste-manager" /MIR

# 2. Ouvrir dans le navigateur
start http://localhost/sincereal-waste-manager/
```

### Pour les utilisateurs Linux/Mac (Local)
```bash
# 1. Démarrer un serveur local
cd dist && python3 -m http.server 8080

# 2. Ouvrir dans le navigateur
open http://localhost:8080
```

### Pour les développeurs (Docker)
```bash
# Build et run
docker build -t sincereal-waste-manager .
docker run -d -p 8080:80 sincereal-waste-manager
```

## 📋 Matrice de compatibilité

| Fonctionnalité | OneDrive | SharePoint | Hébergement | Sans Serveur |
|----------------|----------|------------|-------------|--------------|
| Multi-utilisateurs | ✅ | ✅ | ✅ | ❌ |
| Accès distant | ✅ VPN | ✅ | ✅ | ❌ VPN |
| Hors ligne | ❌ | ❌ | ❌ | ✅ |
| Sauvegarde auto | ✅ | ✅ | ⚠️ Manuelle | ⚠️ Manuelle |
| Coût | Gratuit* | Gratuit* | Payant | Gratuit |

* Nécessite une licence Microsoft 365

## 🔧 Configuration requise

### Minimum
- Navigateur : Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- RAM : 4 Go
- Espace disque : 50 Mo

### Recommandé
- Navigateur : Chrome/Edge dernière version
- RAM : 8 Go+
- Espace disque : 100 Mo

## 📞 Support

En cas de problème d'installation :
1. Consultez le guide spécifique à votre environnement
2. Vérifiez les prérequis
3. Contactez votre administrateur système

## 🔄 Mise à jour

Pour mettre à jour l'application :
1. Téléchargez la nouvelle version
2. Suivez les instructions du guide correspondant
3. Videz le cache du navigateur (Ctrl+F5)

## 📄 Licence

Sincereal Waste Manager - Tous droits réservés © 2026
