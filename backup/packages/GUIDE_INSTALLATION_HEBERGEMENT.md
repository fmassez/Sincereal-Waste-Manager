# Guide d'Installation - Sincereal Waste Manager
## Hébergement Classique (Mutualisé/Dédié)

### Prérequis
- Hébergement web avec support PHP (optionnel) ou statique
- Espace disque : minimum 50 Mo
- Bande passante selon l'utilisation
- Support HTTPS recommandé

### Hébergements recommandés
- **OVH** : Plan Start 10M ou Performance
- **Ionos** : Plan Essential ou Business
- **Infomaniak** : Plan Start+
- **AWS S3** + CloudFront (statique)
- **Netlify/Vercel** (déploiement continu)

### Déploiement sur hébergement mutualisé

#### 1. Préparation des fichiers
```bash
# Build de l'application
npm run build

# Vérification du contenu du dossier dist
ls -la dist/
# Doit contenir : index.html, assets/, favicon.ico
```

#### 2. Upload via FTP/SFTP
```bash
# Avec lftp
lftp -u [utilisateur],[motdepasse] [hôte]
mirror -R dist/ /www/sincereal-waste-manager/
bye

# Avec rsync
rsync -avz --delete dist/ [utilisateur]@[hôte]:/www/sincereal-waste-manager/
```

#### 3. Configuration .htaccess (Apache)
```apache
# /www/sincereal-waste-manager/.htaccess

# Activer la compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>

# Cache des fichiers statiques
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType image/png "access plus 6 months"
  ExpiresByType image/jpeg "access plus 6 months"
</IfModule>

# Redirection SPA (Single Page Application)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Sécurité
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

#### 4. Configuration Nginx
```nginx
# /etc/nginx/sites-available/sincereal-waste-manager
server {
    listen 80;
    listen [::]:80;
    server_name waste-manager.votredomaine.com;
    root /var/www/sincereal-waste-manager;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 6M;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

### Déploiement sur AWS S3 + CloudFront

#### 1. Créer le bucket S3
```bash
aws s3 mb s3://sincereal-waste-manager-[votre-entreprise]
aws s3 website s3://sincereal-waste-manager-[votre-entreprise]/ --index-document index.html --error-document index.html
```

#### 2. Upload des fichiers
```bash
aws s3 sync dist/ s3://sincereal-waste-manager-[votre-entreprise]/ --delete
```

#### 3. Politique du bucket (public read)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::sincereal-waste-manager-[votre-entreprise]/*"
    }
  ]
}
```

### Déploiement sur Netlify (Gratuit)

#### 1. Via CLI
```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Déployer
netlify deploy --dir=dist --prod
```

#### 2. Via Git (CI/CD)
1. Connectez votre repo GitHub/GitLab à Netlify
2. Configurez le build : `npm run build`
3. Définissez le dossier de publication : `dist`

### Configuration HTTPS (SSL)

#### Let's Encrypt (Certbot)
```bash
# Installation du certificat
sudo certbot --nginx -d waste-manager.votredomaine.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

### Mise à jour
```bash
# Build et déploiement
npm run build
rsync -avz --delete dist/ [utilisateur]@[hôte]:/www/sincereal-waste-manager/
```

### Monitoring
- Uptime Robot (gratuit)
- Google Analytics
- Sentry (erreurs JavaScript)
