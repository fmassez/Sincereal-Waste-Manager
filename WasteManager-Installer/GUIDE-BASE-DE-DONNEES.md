# 🗄️ Guide Base de Données - Waste Manager

## 📊 Architecture actuelle

### Stockage local (Zustand + localStorage)

L'application utilise actuellement **Zustand** avec persistance dans le **localStorage** du navigateur.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Navigateur    │────▶│    Zustand      │────▶│  localStorage   │
│   (React App)   │◀────│   (State Mgmt)  │◀────│   (Stockage)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Avantages :**
- ✅ Simple, pas de serveur requis
- ✅ Fonctionne offline
- ✅ Rapide (pas de latence réseau)
- ✅ Données privées par utilisateur

**Inconvénients :**
- ❌ Données non partagées entre utilisateurs
- ❌ Limité à ~5-10 MB par domaine
- ❌ Pas de backup automatique
- ❌ Données perdues si cache vidé

---

## 🎯 Options pour base de données distante partagée

### Option A : Backend Node.js + MongoDB (Recommandé)

**Architecture :**
```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   PC User 1 │   │   PC User 2 │   │   PC User 3 │   │   PC User N │
│  (Portable) │   │  (Portable) │   │  (Portable) │   │  (Portable) │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │                 │
       └─────────────────┴─────────────────┴─────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Internet  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Serveur    │
                    │  Node.js    │
                    │  + Express  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   MongoDB   │
                    │  (Database) │
                    └─────────────┘
```

**Composants nécessaires :**

1. **Serveur Node.js** (hébergé sur VM interne Nestlé ou cloud)
2. **Base MongoDB** (peut être sur le même serveur)
3. **API REST** pour communiquer avec l'app
4. **Authentification JWT** pour sécuriser les accès

**Code serveur simplifié :**

```javascript
// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose.connect('mongodb://localhost:27017/wastemanager');

// Modèles
const Dechet = mongoose.model('Dechet', {
  date_entree: String,
  matiere: String,
  code_dechet: String,
  poids_kg: Number,
  // ... autres champs
});

// Routes API
app.get('/api/dechets', async (req, res) => {
  const dechets = await Dechet.find();
  res.json(dechets);
});

app.post('/api/dechets', async (req, res) => {
  const dechet = new Dechet(req.body);
  await dechet.save();
  res.json(dechet);
});

app.listen(3000, () => {
  console.log('API Waste Manager sur http://localhost:3000');
});
```

**Coût :**
- Serveur VM interne Nestlé : Gratuit (si déjà disponible)
- MongoDB : Gratuit (Community Edition)
- Développement : ~2-3 jours de travail

---

### Option B : Firebase (Google) - Sans serveur

**Architecture :**
```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   PC User 1 │   │   PC User 2 │   │   PC User 3 │
│  (Portable) │   │  (Portable) │   │  (Portable) │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Firebase  │
                    │  (Backend   │
                    │   as a      │
                    │  Service)   │
                    └─────────────┘
```

**Avantages :**
- ✅ Pas de serveur à gérer
- ✅ Temps réel (sync auto)
- ✅ Authentification intégrée
- ✅ Gratuit jusqu'à certaines limites

**Inconvénients :**
- ❌ Données chez Google (conformité ?)
- ❌ Nécessite accès Internet
- ❌ Peut être bloqué par firewall entreprise

---

### Option C : Supabase (Open Source)

Alternative open source à Firebase, peut être auto-hébergé.

**Avantages :**
- ✅ Open source (pas de vendor lock-in)
- ✅ PostgreSQL (base relationnelle)
- ✅ Peut être auto-hébergé sur serveur interne

---

## 🔧 Implémentation recommandée pour Nestlé

### Étape 1 : Mode hybride (démarrage rapide)

Gardez l'application portable actuelle mais ajoutez une **synchronisation** :

```javascript
// Dans useStore.ts
const useStore = create((set, get) => ({
  // ... state actuel
  
  // Mode local (défaut)
  syncMode: 'local', // 'local' | 'remote'
  
  // Fonction de sync
  syncToRemote: async () => {
    if (get().syncMode === 'remote') {
      const dechets = get().dechets;
      await fetch('https://api-wastemanager.nestle.com/dechets', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + get().token },
        body: JSON.stringify(dechets)
      });
    }
  },
  
  // Charger depuis remote
  loadFromRemote: async () => {
    const response = await fetch('https://api-wastemanager.nestle.com/dechets', {
      headers: { 'Authorization': 'Bearer ' + get().token }
    });
    const dechets = await response.json();
    set({ dechets });
  }
}));
```

### Étape 2 : Déploiement progressif

| Phase | Description | Durée |
|-------|-------------|-------|
| 1 | Application portable actuelle (local) | ✅ Fait |
| 2 | Ajout bouton "Synchroniser" (manuel) | 1 jour |
| 3 | Backend API + base de données | 2-3 jours |
| 4 | Mode automatique (sync en temps réel) | 1 jour |

---

## 📋 Spécifications techniques pour IT Nestlé

### Serveur requis

```yaml
Spécifications minimales:
  CPU: 2 cores
  RAM: 4 GB
  Disque: 20 GB
  OS: Ubuntu 22.04 LTS / Windows Server 2019
  
Logiciels:
  - Node.js 20.x
  - MongoDB 7.x (ou PostgreSQL 15)
  - Nginx (reverse proxy)
  - PM2 (gestion processus)

Ports:
  - 80/443 (HTTP/HTTPS)
  - 27017 (MongoDB - interne uniquement)
```

### Sécurité

```yaml
Authentification:
  - JWT tokens
  - Refresh tokens
  - Durée session: 8h
  
HTTPS:
  - Certificat SSL interne Nestlé
  
Firewall:
  - Autoriser uniquement IP internes Nestlé
  - Bloquer accès externe
  
Backup:
  - Sauvegarde quotidienne MongoDB
  - Rétention: 30 jours
```

---

## 💻 Code modifications nécessaires

### 1. Ajouter un fichier de configuration API

```typescript
// src/config/api.ts
export const API_CONFIG = {
  // Mode local (défaut)
  mode: 'local' as 'local' | 'remote',
  
  // URL de l'API (quand disponible)
  baseUrl: 'https://api-wastemanager.nestle.com',
  
  // Timeout requêtes
  timeout: 10000,
};
```

### 2. Modifier le store pour supporter les deux modes

```typescript
// src/store/useStore.ts
// Ajouter dans l'interface:
interface StoreState {
  // ... existant
  apiMode: 'local' | 'remote';
  setApiMode: (mode: 'local' | 'remote') => void;
  syncData: () => Promise<void>;
}
```

### 3. Ajouter un bouton "Synchroniser" dans l'interface

```tsx
// Dans Header.tsx ou AdminPanel.tsx
<Button onClick={() => syncData()}>
  <Sync className="h-4 w-4 mr-2" />
  Synchroniser
</Button>
```

---

## 📊 Comparaison des solutions

| Critère | Local (actuel) | Node.js + MongoDB | Firebase | Supabase |
|---------|---------------|-------------------|----------|----------|
| **Coût** | Gratuit | Gratuit (VM interne) | Gratuit/Payant | Gratuit/Payant |
| **Setup** | ✅ Instantané | ⚠️ 2-3 jours | ⚠️ 1 jour | ⚠️ 1-2 jours |
| **Partage données** | ❌ Non | ✅ Oui | ✅ Oui | ✅ Oui |
| **Offline** | ✅ Oui | ⚠️ Partiel | ❌ Non | ❌ Non |
| **Sécurité Nestlé** | ✅ 100% interne | ✅ 100% interne | ❌ Cloud Google | ⚠️ Cloud/Interne |
| **Maintenance** | ✅ Aucune | ⚠️ Modérée | ✅ Faible | ⚠️ Modérée |

---

## 🎯 Recommandation

### Pour démarrer rapidement (Phase 1)

**Gardez la solution portable actuelle** avec ces améliorations :

1. **Export/Import JSON** pour transférer les données entre utilisateurs
2. **Bouton "Synchroniser avec OneDrive"** pour backup automatique

### Pour production (Phase 2)

**Déployer un backend Node.js + MongoDB** sur une VM interne Nestlé :

1. Contacter IT pour obtenir une VM
2. Développer l'API (2-3 jours)
3. Modifier l'app pour utiliser l'API
4. Déployer et tester

---

## ❓ Questions fréquentes

**Q: Peut-on utiliser SQL Server au lieu de MongoDB ?**
R: Oui, l'API peut utiliser n'importe quelle base de données. PostgreSQL ou SQL Server sont parfaitement adaptés.

**Q: Les données sont-elles sécurisées ?**
R: Avec une VM interne Nestlé + HTTPS + authentification JWT, oui. Les données ne quittent jamais le réseau interne.

**Q: Combien d'utilisateurs simultanés ?**
R: Un serveur modeste (2 CPU, 4GB RAM) peut gérer facilement 100+ utilisateurs simultanés pour cette application.

**Q: Que se passe-t-il si le serveur tombe ?**
R: L'application peut fonctionner en mode "offline" avec sync différée, ou afficher un message d'erreur.

---

## 📞 Prochaines étapes

1. **Décider de l'approche** : Local vs Remote
2. **Contacter IT Nestlé** pour VM si besoin
3. **Développer le backend** (si option remote choisie)
4. **Tester avec quelques utilisateurs**
5. **Déployer à l'échelle**
