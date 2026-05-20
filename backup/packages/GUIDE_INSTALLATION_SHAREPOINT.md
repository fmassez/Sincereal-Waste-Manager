# Guide d'Installation - Sincereal Waste Manager
## Déploiement depuis SharePoint

### Prérequis
- Accès au site SharePoint avec les droits de téléchargement
- SharePoint Online ou SharePoint Server 2019+
- Un serveur web pour l'hébergement

### Option 1 : Déploiement via SharePoint Online (Recommended)

#### 1. Télécharger depuis SharePoint
1. Connectez-vous à SharePoint Online
2. Naviguez vers la bibliothèque de documents contenant `sincereal-waste-manager`
3. Sélectionnez le dossier `dist/` et cliquez sur "Télécharger"
4. Extrayez l'archive sur le serveur web

#### 2. Utilisation de PowerShell PnP
```powershell
# Installer le module PnP PowerShell
Install-Module PnP.PowerShell -Force

# Se connecter à SharePoint
Connect-PnPOnline -Url "https://[votre-entreprise].sharepoint.com/sites/[site]" -Interactive

# Télécharger le dossier
Get-PnPFolder -Url "/sites/[site]/Shared Documents/sincereal-waste-manager/dist" -DownloadPath "C:\inetpub\wwwroot\sincereal-waste-manager"
```

#### 3. Configuration du serveur IIS
```powershell
# Créer l'application pool
Import-Module WebAdministration
New-Item -Path "IIS:\AppPools\SincerealAppPool" -ItemType "AppPool"
Set-ItemProperty -Path "IIS:\AppPools\SincerealAppPool" -Name "managedRuntimeVersion" -Value ""

# Créer le site
New-Item -Path "IIS:\Sites\SincerealWasteManager" -Bindings @{protocol="http";bindingInformation=":8080:"} -PhysicalPath "C:\inetpub\wwwroot\sincereal-waste-manager" -ApplicationPool "SincerealAppPool"
```

### Option 2 : Déploiement avec Azure DevOps + SharePoint

#### Pipeline YAML pour déploiement automatique
```yaml
# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: 'windows-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '20.x'
  displayName: 'Install Node.js'

- script: |
    npm ci
    npm run build
  displayName: 'Build application'

- task: CopyFiles@2
  inputs:
    SourceFolder: 'dist'
    Contents: '**'
    TargetFolder: '$(Build.ArtifactStagingDirectory)'

- task: PublishBuildArtifacts@1
  inputs:
    PathtoPublish: '$(Build.ArtifactStagingDirectory)'
    ArtifactName: 'sincereal-waste-manager'
```

### Configuration SharePoint pour le stockage

#### 1. Créer une bibliothèque de documents dédiée
```powershell
# Créer la bibliothèque
New-PnPList -Title "Sincereal Waste Manager" -Template DocumentLibrary -Url "sincereal-waste-manager"

# Configurer les permissions
Set-PnPList -Identity "sincereal-waste-manager" -BreakRoleInheritance
Add-PnPGroupToRole -List "sincereal-waste-manager" -Group "Sincereal Users" -RoleDefinition "Contribute"
```

#### 2. Synchronisation automatique
```powershell
# Script de synchronisation planifiée
$sharepointUrl = "https://[votre-entreprise].sharepoint.com/sites/[site]"
$localPath = "C:\inetpub\wwwroot\sincereal-waste-manager"

Connect-PnPOnline -Url $sharepointUrl -ClientId "[votre-client-id]" -ClientSecret "[votre-secret]"
Get-PnPFile -Url "/sites/[site]/sincereal-waste-manager/dist/index.html" -Path $localPath -Filename "index.html" -AsFile
```

### Sécurité
- Activer l'authentification Windows (Kerberos/NTLM)
- Configurer HTTPS avec un certificat valide
- Restreindre l'accès par groupe Active Directory

### URLs d'accès
- Application : `https://[serveur]/sincereal-waste-manager/`
- SharePoint : `https://[votre-entreprise].sharepoint.com/sites/[site]/sincereal-waste-manager`
