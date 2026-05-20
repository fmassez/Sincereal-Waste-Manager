#!/bin/bash
# Script d'installation automatique pour Linux/Mac
# Sincereal Waste Manager

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables par défaut
SOURCE_PATH=""
INSTALL_PATH="/var/www/sincereal-waste-manager"
PORT=8080

# Afficher l'en-tête
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Sincereal Waste Manager - Installation${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Vérifier les privilèges root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Ce script doit être exécuté en tant que root${NC}"
    echo -e "${YELLOW}   Utilisez : sudo bash install-linux.sh${NC}"
    exit 1
fi

# Détecter la source
if [ -z "$SOURCE_PATH" ]; then
    if [ -d "./dist" ]; then
        SOURCE_PATH="./dist"
        echo -e "${GREEN}✅ Source détectée : Dossier courant${NC}"
    elif [ -d "/home/$(logname)/sincereal-waste-manager/dist" ]; then
        SOURCE_PATH="/home/$(logname)/sincereal-waste-manager/dist"
        echo -e "${GREEN}✅ Source détectée : Dossier utilisateur${NC}"
    fi
fi

if [ -z "$SOURCE_PATH" ] || [ ! -d "$SOURCE_PATH" ]; then
    echo -e "${RED}❌ Impossible de trouver les fichiers source${NC}"
    echo -e "${YELLOW}   Veuillez spécifier le chemin avec SOURCE_PATH=/chemin/dist bash install-linux.sh${NC}"
    exit 1
fi

echo -e "${GRAY}📁 Source : $SOURCE_PATH${NC}"
echo -e "${GRAY}📁 Destination : $INSTALL_PATH${NC}"
echo ""

# Créer le dossier d'installation
if [ ! -d "$INSTALL_PATH" ]; then
    mkdir -p "$INSTALL_PATH"
    echo -e "${GREEN}✅ Dossier d'installation créé${NC}"
fi

# Copier les fichiers
echo -e "${CYAN}📋 Copie des fichiers...${NC}"
rsync -av --delete "$SOURCE_PATH/" "$INSTALL_PATH/"
echo -e "${GREEN}✅ Fichiers copiés${NC}"
echo ""

# Détecter le système
if command -v apt-get &> /dev/null; then
    # Debian/Ubuntu
    echo -e "${CYAN}📦 Installation de Nginx (Debian/Ubuntu)...${NC}"
    apt-get update
    apt-get install -y nginx rsync
    
    # Configuration Nginx
    cat > /etc/nginx/sites-available/sincereal-waste-manager << 'EOF'
server {
    listen 8080;
    server_name localhost;
    root /var/www/sincereal-waste-manager;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 6M;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/sincereal-waste-manager /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx
    
elif command -v yum &> /dev/null; then
    # RHEL/CentOS/Fedora
    echo -e "${CYAN}📦 Installation de Nginx (RHEL/CentOS)...${NC}"
    yum install -y nginx rsync
    
    # Configuration Nginx
    cat > /etc/nginx/conf.d/sincereal-waste-manager.conf << 'EOF'
server {
    listen 8080;
    server_name localhost;
    root /var/www/sincereal-waste-manager;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 6M;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    nginx -t && systemctl restart nginx
    
elif command -v brew &> /dev/null; then
    # macOS avec Homebrew
    echo -e "${CYAN}📦 Installation de Nginx (macOS)...${NC}"
    brew install nginx rsync
    
    # Configuration Nginx
    cat > /usr/local/etc/nginx/servers/sincereal-waste-manager << 'EOF'
server {
    listen 8080;
    server_name localhost;
    root /usr/local/var/www/sincereal-waste-manager;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
    
    brew services restart nginx
fi

echo -e "${GREEN}✅ Nginx configuré${NC}"

# Configurer le pare-feu
if command -v ufw &> /dev/null; then
    echo -e "${CYAN}🔥 Configuration du pare-feu (UFW)...${NC}"
    ufw allow 8080/tcp
    echo -e "${GREEN}✅ Pare-feu configuré${NC}"
elif command -v firewall-cmd &> /dev/null; then
    echo -e "${CYAN}🔥 Configuration du pare-feu (firewalld)...${NC}"
    firewall-cmd --permanent --add-port=8080/tcp
    firewall-cmd --reload
    echo -e "${GREEN}✅ Pare-feu configuré${NC}"
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}  ✅ Installation terminée !${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}🌐 Accès local :${NC}"
echo -e "   http://localhost:8080/${NC}"
echo ""
echo -e "${YELLOW}🌐 Accès réseau :${NC}"
IP_ADDRESS=$(hostname -I | awk '{print $1}')
if [ -n "$IP_ADDRESS" ]; then
    echo -e "   http://$IP_ADDRESS:8080/${NC}"
fi
echo ""
echo -e "${YELLOW}📁 Dossier d'installation :${NC}"
echo -e "   $INSTALL_PATH${NC}"
echo ""
echo -e "${CYAN}Merci d'utiliser Sincereal Waste Manager !${NC}"
