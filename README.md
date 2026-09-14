# Bentur

Web app per fonici in tour: gestione di tour e artisti, to-do, liste acquisti, inventario, manuali e contatti utili.

## Stack
- React 19 + TypeScript + Vite
- Firebase Authentication (Google) e Cloud Firestore
- Firebase Hosting

## Sviluppo

Requisiti: Node.js 20+ e npm.

```bash
npm install
npm run dev      # avvia il dev server
npm run lint     # controlla il codice
npm test         # test in modalità watch
npm run test:run # test, esecuzione singola
npm run build    # typecheck + build di produzione in dist/
```

## Deploy

Serve la [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`) e l'accesso al progetto `bentur-c5eaa`.

```bash
firebase login
npm run build
firebase deploy
```
