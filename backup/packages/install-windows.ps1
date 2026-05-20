# Script d'installation automatique pour Windows
# Sincereal Waste Manager

param(
    [string]$SourcePath = "",
    [string]$InstallPath = "C:\inetpub\wwwroot\sincereal-waste-manager",
    [int]$Port = 8080
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sincereal Waste Manager - Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les privilèges administrateur
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ Ce script doit être exécuté en tant qu'administrateur" -ForegroundColor Red
    Write-Host "   Clic droit sur PowerShell > 'Exécuter en tant qu'administrateur'" -ForegroundColor Yellow
    exit 1
}

# Détecter la source
if (-not $SourcePath) {
    # Chercher dans OneDrive
    $oneDrivePaths = @(
        "$env:USERPROFILE\OneDrive",
        "$env:USERPROFILE\OneDrive - $env:USERDOMAIN"
    )
    
    foreach ($path in $oneDrivePaths) {
        if (Test-Path "$path\sincereal-waste-manager\dist") {
            $SourcePath = "$path\sincereal-waste-manager\dist"
            Write-Host "✅ Source détectée : OneDrive" -ForegroundColor Green
            break
        }
    }
    
    # Chercher dans le dossier courant
    if (-not $SourcePath -and (Test-Path ".\dist")) {
        $SourcePath = ".\dist"
        Write-Host "✅ Source détectée : Dossier courant" -ForegroundColor Green
    }
}

if (-not $SourcePath -or -not (Test-Path $SourcePath)) {
    Write-Host "❌ Impossible de trouver les fichiers source" -ForegroundColor Red
    Write-Host "   Veuillez spécifier le chemin avec -SourcePath" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Source : $SourcePath" -ForegroundColor Gray
Write-Host "📁 Destination : $InstallPath" -ForegroundColor Gray
Write-Host ""

# Créer le dossier d'installation
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "✅ Dossier d'installation créé" -ForegroundColor Green
}

# Copier les fichiers
Write-Host "📋 Copie des fichiers..." -ForegroundColor Cyan
robocopy $SourcePath $InstallPath /MIR /FFT /Z /XA:H /NDL /NJH /NJS
Write-Host "✅ Fichiers copiés" -ForegroundColor Green
Write-Host ""

# Vérifier si IIS est installé
$iisInstalled = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue

if (-not $iisInstalled -or -not $iisInstalled.Installed) {
    Write-Host "📦 Installation d'IIS..." -ForegroundColor Cyan
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All -NoRestart
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer -All -NoRestart
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures -All -NoRestart
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent -All -NoRestart
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-DefaultDocument -All -NoRestart
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-DirectoryBrowsing -All -NoRestart
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors -All -NoRestart
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect -All -NoRestart
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment -All -NoRestart
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45 -All -NoRestart
    Write-Host "✅ IIS installé" -ForegroundColor Green
}

# Importer le module WebAdministration
Import-Module WebAdministration -ErrorAction SilentlyContinue

# Créer le site IIS
Write-Host "🌐 Configuration d'IIS..." -ForegroundColor Cyan

# Supprimer le site existant s'il existe
$existingSite = Get-Website -Name "SincerealWasteManager" -ErrorAction SilentlyContinue
if ($existingSite) {
    Remove-Website -Name "SincerealWasteManager"
    Write-Host "   Site existant supprimé" -ForegroundColor Gray
}

# Créer le nouveau site
New-Website -Name "SincerealWasteManager" -PhysicalPath $InstallPath -Port $Port -Force | Out-Null
Write-Host "✅ Site IIS créé (Port $Port)" -ForegroundColor Green

# Configurer les types MIME
$mimeTypes = @(
    @{Extension=".json"; MimeType="application/json"},
    @{Extension=".webmanifest"; MimeType="application/manifest+json"}
)

foreach ($mime in $mimeTypes) {
    $existingMime = Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/staticContent/mimeMap[@fileExtension='$($mime.Extension)']" -Name "fileExtension" -ErrorAction SilentlyContinue
    if (-not $existingMime) {
        Add-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/staticContent" -Name "." -Value @{fileExtension=$mime.Extension;mimeType=$mime.MimeType}
    }
}
Write-Host "✅ Types MIME configurés" -ForegroundColor Green

# Démarrer le site
Start-Website -Name "SincerealWasteManager"
Write-Host "✅ Site démarré" -ForegroundColor Green
Write-Host ""

# Ouvrir le pare-feu
Write-Host "🔥 Configuration du pare-feu..." -ForegroundColor Cyan
$firewallRule = Get-NetFirewallRule -DisplayName "Sincereal Waste Manager" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    New-NetFirewallRule -DisplayName "Sincereal Waste Manager" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow | Out-Null
    Write-Host "✅ Règle pare-feu créée" -ForegroundColor Green
}
Write-Host ""

# Afficher les informations
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Installation terminée !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Accès local :" -ForegroundColor Yellow
Write-Host "   http://localhost:$Port/" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Accès réseau :" -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
if ($ipAddress) {
    Write-Host "   http://$ipAddress`:$Port/" -ForegroundColor White
}
Write-Host ""
Write-Host "📁 Dossier d'installation :" -ForegroundColor Yellow
Write-Host "   $InstallPath" -ForegroundColor White
Write-Host ""
Write-Host "⚙️  Gestion IIS :" -ForegroundColor Yellow
Write-Host "   Ouvrez 'Gestionnaire des services IIS'" -ForegroundColor White
Write-Host ""

# Ouvrir le navigateur
$openBrowser = Read-Host "🚀 Ouvrir dans le navigateur ? (O/N)"
if ($openBrowser -eq "O" -or $openBrowser -eq "o") {
    Start-Process "http://localhost:$Port/"
}

Write-Host ""
Write-Host "Merci d'utiliser Sincereal Waste Manager !" -ForegroundColor Cyan
