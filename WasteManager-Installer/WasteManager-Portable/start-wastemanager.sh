#!/bin/bash

# Waste Manager Launcher

clear

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║           🗑️  WASTE MANAGER                            ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    echo ""
    echo "📥 Veuillez installer Node.js :"
    echo "   macOS: brew install node"
    echo "   Linux: sudo apt install nodejs npm"
    echo ""
    read -p "Appuyez sur Entrée pour quitter..."
    exit 1
fi

echo "✅ Node.js détecté: $(node --version)"
echo ""

# Aller dans le dossier server
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/server"

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install --silent
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors de l'installation"
        read -p "Appuyez sur Entrée pour quitter..."
        exit 1
    fi
    echo "✅ Dépendances installées"
    echo ""
fi

# Lancer le serveur
echo "🚀 Démarrage du serveur..."
echo ""
node serve.js

# Si le serveur s'arrête
read -p "Appuyez sur Entrée pour quitter..."
