# Guide d'Installation - Sincereal Waste Manager
## Installation Sans Serveur (PWA / Mode Hors Ligne)

### Prérequis
- Navigateur moderne (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
- Espace disque local : 100 Mo minimum
- Aucun serveur requis !

### Option 1 : Installation PWA (Progressive Web App)

#### Installation sur Windows
1. Ouvrez l'application dans Chrome/Edge : `https://[votre-url]/`
2. Cliquez sur l'icône ➕ dans la barre d'adresse (ou menu ⋮ > Installer l'application)
3. L'application s'installe comme un programme natif
4. Raccourci créé sur le bureau et dans le menu Démarrer

#### Installation sur macOS
1. Ouvrez l'application dans Chrome
2. Menu Chrome > "Installer Sincereal Waste Manager..."
3. L'application apparaît dans le dossier Applications

#### Installation sur Mobile (Android/iOS)
**Android :**
1. Ouvrez Chrome et allez sur l'URL de l'app
2. Menu ⋮ > "Ajouter à l'écran d'accueil"
3. L'icône apparaît sur l'écran d'accueil

**iOS :**
1. Ouvrez Safari et allez sur l'URL de l'app
2. Bouton Partager > "Sur l'écran d'accueil"
3. L'icône apparaît sur l'écran d'accueil

### Option 2 : Exécution Locale (Fichiers HTML)

#### Méthode 1 : Double-clic sur index.html
1. Téléchargez le dossier `dist/` depuis la source
2. Double-cliquez sur `index.html`
3. L'application s'ouvre dans le navigateur par défaut

⚠️ **Limitations** : Certaines fonctionnalités peuvent être limitées (CORS)

#### Méthode 2 : Serveur local simple
**Avec Python (recommandé) :**
```bash
# Python 3
cd dist/
python -m http.server 8080

# Ouvrez http://localhost:8080 dans le navigateur
```

**Avec Node.js :**
```bash
npm install -g serve
cd dist/
serve -l 8080
```

**Avec PHP :**
```bash
cd dist/
php -S localhost:8080
```

**Avec PowerShell :**
```powershell
# Créer un serveur HTTP simple
cd dist
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $file = Join-Path (Get-Location) $request.Url.LocalPath
    if ($file -eq (Get-Location)) { $file = Join-Path $file "index.html" }
    
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding Byte
        $response.ContentType = [System.Web.MimeMapping]::GetMimeMapping($file)
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
    }
    $response.Close()
}
```

### Option 3 : Electron (Application Desktop)

#### Créer une application Electron
```bash
# Créer le projet Electron
mkdir sincereal-desktop && cd sincereal-desktop
npm init -y
npm install electron --save-dev
```

**main.js :**
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'dist/favicon.ico')
  });

  // Charger l'application
  win.loadFile('dist/index.html');
  
  // Menu pour la production
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

**package.json :**
```json
{
  "name": "sincereal-waste-manager",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder"
  },
  "build": {
    "appId": "com.sincereal.waste-manager",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "main.js"
    ],
    "win": {
      "target": "nsis"
    },
    "mac": {
      "target": "dmg"
    }
  }
}
```

#### Compiler l'installateur
```bash
npm install electron-builder --save-dev
npm run build
```

### Option 4 : Docker (Container local)

#### Dockerfile
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

#### nginx.conf
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Build et run
```bash
docker build -t sincereal-waste-manager .
docker run -d -p 8080:80 --name sincereal sincereal-waste-manager
```

### Stockage des données

#### LocalStorage (par défaut)
- Les données sont stockées dans le navigateur
- Limite : ~5-10 Mo par domaine
- Persistance : Tant que le cache n'est pas vidé

#### Export/Import manuel
1. Menu Administration > Exporter les données
2. Sauvegardez le fichier JSON
3. Pour restaurer : Menu Administration > Importer les données

#### Synchronisation avec le cloud
- OneDrive : Placez le fichier d'export dans un dossier synchronisé
- Dropbox : Utilisez l'API Dropbox pour sauvegarder automatiquement
- Google Drive : Sauvegardez les exports régulièrement

### Mise à jour sans serveur
1. Téléchargez la nouvelle version (dossier `dist/`)
2. Remplacez les anciens fichiers
3. Rafraîchissez l'application (Ctrl+F5)
4. Les données sont conservées automatiquement

### Avantages du mode sans serveur
✅ Aucun coût d'hébergement
✅ Fonctionne hors ligne après première visite
✅ Installation rapide
✅ Pas de maintenance serveur
✅ Données privées (restent locales)

### Limitations
⚠️ Pas de synchronisation multi-utilisateurs
⚠️ Pas d'accès distant (sans VPN)
⚠️ Sauvegarde manuelle requise
⚠️ Dépend du navigateur local
