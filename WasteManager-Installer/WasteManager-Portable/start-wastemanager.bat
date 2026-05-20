@echo off
chcp 65001 >nul
title Waste Manager
cls

echo ╔════════════════════════════════════════════════════════╗
echo ║                                                        ║
echo ║           🗑️  WASTE MANAGER                            ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé ou n'est pas dans le PATH
    echo.
    echo 📥 Veuillez installer Node.js depuis :
    echo    https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js détecté
echo.

REM Aller dans le dossier server
cd /d "%~dp0server"

REM Installer les dépendances si nécessaire
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    call npm install --silent
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation
        pause
        exit /b 1
    )
    echo ✅ Dépendances installées
    echo.
)

REM Lancer le serveur
echo 🚀 Démarrage du serveur...
echo.
node serve.js

REM Si le serveur s'arrête
pause
