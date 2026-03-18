# StageConnect - Guide de Déploiement Nginx

## Structure du projet
```
/app/
├── backend/
│   ├── server.py              # API FastAPI
│   ├── requirements.txt       # Dépendances Python
│   └── .env                   # Variables d'environnement
├── frontend/
│   ├── src/                   # Code source React
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env
├── docker-compose.yml
└── nginx/
    └── nginx.conf
```

## Déploiement avec Docker + Nginx

### 1. Build du frontend
```bash
cd frontend
yarn install
yarn build
# Le build sera dans frontend/build/
```

### 2. Lancer avec Docker Compose
```bash
docker-compose up -d
```

### 3. Variables d'environnement requises

**backend/.env**
```
MONGO_URL=mongodb://mongo:27017
DB_NAME=stageconnect
JWT_SECRET=votre-secret-jwt-ici
CORS_ORIGINS=*
```

**frontend/.env** (pour le build)
```
REACT_APP_BACKEND_URL=https://votre-domaine.com
```

### 4. Initialiser les données démo
```bash
curl -X POST https://votre-domaine.com/api/seed
```

## Comptes démo
- Candidat : marie@demo.com / demo123
- Recruteur : recruteur@techcorp.com / demo123
