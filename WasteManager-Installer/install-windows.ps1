# Waste Manager - Script d'installation Windows
# Exécuter en tant qu'administrateur si nécessaire

param(
    [string]$InstallPath = "$env:USERPROFILE\WasteManager",
    [switch]$CreateShortcut = $true
)

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "║           🗑️  WASTE MANAGER - Installation             ║" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Vérifier si on est en mode administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

# Vérifier Node.js
Write-Host "🔍 Vérification de Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null

if (-not $nodeVersion) {
    Write-Host "❌ Node.js n'est pas installé" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Téléchargement de Node.js..." -ForegroundColor Yellow
    
    $nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    
    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
        Write-Host "✅ Téléchargement terminé" -ForegroundColor Green
        Write-Host ""
        Write-Host "📦 Installation de Node.js..." -ForegroundColor Yellow
        
        if ($isAdmin) {
            Start-Process msiexec.exe -ArgumentList "/i", $nodeInstaller, "/quiet", "/norestart" -Wait
        } else {
            Write-Host "⚠️  Veuillez installer Node.js manuellement depuis :" -ForegroundColor Yellow
            Write-Host "   $nodeInstaller" -ForegroundColor Cyan
            Write-Host ""
            Start-Process $nodeInstaller
            Write-Host "⏳ Appuyez sur Entrée après l'installation..." -ForegroundColor Yellow
            Read-Host
        }
    } catch {
        Write-Host "❌ Erreur lors du téléchargement : $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "📥 Veuillez télécharger manuellement depuis :" -ForegroundColor Yellow
        Write-Host "   https://nodejs.org/" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "✅ Node.js détecté : $nodeVersion" -ForegroundColor Green
}

Write-Host ""

# Créer le dossier d'installation
Write-Host "📁 Création du dossier d'installation..." -ForegroundColor Yellow
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
}
Write-Host "✅ Dossier créé : $InstallPath" -ForegroundColor Green
Write-Host ""

# Copier les fichiers
Write-Host "📦 Copie des fichiers..." -ForegroundColor Yellow
$sourcePath = Join-Path $PSScriptRoot "WasteManager-Portable"
if (Test-Path $sourcePath) {
    Copy-Item -Path "$sourcePath\*" -Destination $InstallPath -Recurse -Force
    Write-Host "✅ Fichiers copiés" -ForegroundColor Green
} else {
    Write-Host "❌ Dossier source non trouvé : $sourcePath" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Créer un raccourci sur le bureau
if ($CreateShortcut) {
    Write-Host "🔗 Création du raccourci sur le bureau..." -ForegroundColor Yellow
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Waste Manager.lnk")
    $Shortcut.TargetPath = "$InstallPath\start-wastemanager.bat"
    $Shortcut.WorkingDirectory = $InstallPath
    $Shortcut.IconLocation = "%SystemRoot%\System32\shell32.dll,14"
    $Shortcut.Save()
    Write-Host "✅ Raccourci créé sur le bureau" -ForegroundColor Green
    Write-Host ""
}

# Créer un raccourci dans le menu Démarrer
Write-Host "🔗 Création du raccourci dans le menu Démarrer..." -ForegroundColor Yellow
$startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Waste Manager"
if (-not (Test-Path $startMenuPath)) {
    New-Item -ItemType Directory -Path $startMenuPath -Force | Out-Null
}
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$startMenuPath\Waste Manager.lnk")
$Shortcut.TargetPath = "$InstallPath\start-wastemanager.bat"
$Shortcut.WorkingDirectory = $InstallPath
$Shortcut.IconLocation = "%SystemRoot%\System32\shell32.dll,14"
$Shortcut.Save()
Write-Host "✅ Raccourci créé dans le menu Démarrer" -ForegroundColor Green
Write-Host ""

# Message final
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║           ✅ Installation terminée !                   ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║  📍 Dossier : $InstallPath" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║  🚀 Pour lancer :                                      ║" -ForegroundColor Green
Write-Host "║     - Double-cliquez sur le raccourci bureau          ║" -ForegroundColor Green
Write-Host "║     - Ou exécutez : start-wastemanager.bat            ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║  🌐 L'application sera accessible sur :                ║" -ForegroundColor Green
Write-Host "║     http://localhost:8080                              ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Proposer de lancer immédiatement
$launch = Read-Host "🚀 Voulez-vous lancer Waste Manager maintenant ? (O/n)"
if ($launch -eq "" -or $launch -eq "O" -or $launch -eq "o") {
    Start-Process "$InstallPath\start-wastemanager.bat"
    Write-Host ""
    Write-Host "⏳ Démarrage en cours..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:8080"
}
