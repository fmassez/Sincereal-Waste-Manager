# Guide d'Installation - Sincereal Waste Manager
## Déploiement depuis OneDrive Partagé

### Prérequis
- Accès au dossier OneDrive partagé contenant l'application
- Un serveur web (IIS, Apache, Nginx) installé sur le réseau local
- Windows Server 2016+ ou Windows 10/11 Pro recommandé

### Étapes d'Installation

#### 1. Copier les fichiers depuis OneDrive
1. Ouvrez le dossier OneDrive partagé contenant `sincereal-waste-manager`
2. Copiez l'intégralité du dossier `dist/` sur le serveur web
3. Placez les fichiers dans le répertoire racine du serveur web :
   - Pour IIS : `C:\inetpub\wwwroot\sincereal-waste-manager\`
   - Pour Apache : `C:\Apache24\htdocs\sincereal-waste-manager\`

#### 2. Configuration IIS (Windows)
```powershell
# Créer un nouveau site IIS
Import-Module WebAdministration
New-Item -Path "IIS:\Sites\SincerealWasteManager" -Bindings @{protocol="http";bindingInformation=":8080:"} -PhysicalPath "C:\inetpub\wwwroot\sincereal-waste-manager"

# Configurer les types MIME pour les fichiers statiques
Add-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/staticContent" -Name "." -Value @{fileExtension='.json';mimeType='application/json'}
```

#### 3. Configuration Apache
```apache
# httpd.conf ou virtual host
<Directory "C:/Apache24/htdocs/sincereal-waste-manager">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>

# Activer le module rewrite
LoadModule rewrite_module modules/mod_rewrite.so
```

#### 4. Créer le fichier .htaccess
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### 5. Synchronisation automatique depuis OneDrive
Créez une tâche planifiée pour synchroniser les fichiers :
```powershell
# Script PowerShell de synchronisation (sync-from-onedrive.ps1)
$source = "C:\Users\[Utilisateur]\OneDrive - [Entreprise]\sincereal-waste-manager\dist"
$destination = "C:\inetpub\wwwroot\sincereal-waste-manager"
robocopy $source $destination /MIR /FFT /Z /XA:H
```

#### 6. Accès à l'application
- URL locale : `http://[nom-du-serveur]:8080/`
- URL réseau : `http://[adresse-ip]:8080/`

### Mise à jour
1. Téléchargez la nouvelle version depuis OneDrive
2. Remplacez les fichiers dans le répertoire du serveur
3. Videz le cache du navigateur (Ctrl+F5)

### Dépannage
- **Page blanche** : Vérifier que tous les fichiers sont copiés
- **Erreur 404** : Vérifier la configuration du rewrite
- **Données non sauvegardées** : Vérifier le stockage local du navigateur
