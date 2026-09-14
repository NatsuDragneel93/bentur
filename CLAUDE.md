# Bentur

Web app per fonici (sound engineer) in tour: gestione tour/artisti, to-do, liste acquisti, inventario, manuali, contatti utili.
Per ora solo online; la gestione offline è prevista in futuro (tenerne conto nelle scelte architetturali).

## Stack
- React 19 + TypeScript + Vite 6, SCSS per pagina (tema scuro, colori hardcoded)
- React Router 7 (`BrowserRouter`), rotte in `src/App.tsx`
- Firebase 11: Auth (solo Google popup) + Firestore. Config in `src/environment/firebaseConfig.ts`
- Hosting: Firebase Hosting (progetto `bentur-c5eaa`, cartella `dist`, rewrite SPA)
- UI: FontAwesome per le icone, `@hello-pangea/dnd` per drag & drop; nessuna libreria di componenti (MUI rimosso)
- Test: Vitest + React Testing Library (jsdom). Regole Firestore in `firestore.rules` (deploy: `firebase deploy --only firestore:rules`, lo fa l'utente)
- Git: non fare mai commit/push/branch, l'utente committa da sé

## Comandi
- `npm run dev` — dev server
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — ESLint
- `npm test` — Vitest in watch; `npm run test:run` — esecuzione singola
- Deploy: `npm run build` poi `firebase deploy`

## Struttura
- `src/services/firebase.service.ts` — istanze Firebase `auth`, `provider`, `database` (importate direttamente dai servizi)
- `src/context/AuthProvider.tsx` — unico listener di `onAuthStateChanged`; hook in `src/hooks/useAuth.ts`: `useAuth()` (user, loading, signInWithGoogle, logout) e `useRequiredUser()` per le pagine sotto ProtectedRoute
- `src/components/ProtectedRoute.tsx` — redirect a `/` se non loggato; `Header.tsx` — nav + menu profilo/logout
- `src/services/*.service.ts` — un servizio singleton per collection Firestore
- `src/pages/<sezione>/` — componente + SCSS; le pagine non usano Firebase Auth direttamente

## Modello dati Firestore
| Collection | Scope | Forma |
|---|---|---|
| `user_todos_personal` | per utente (`userId`) | categoria `{title, todos: [{id,text,completed,order}]}` |
| `user_todos_tour` | per utente | come sopra (servizio pronto, pagina non implementata) |
| `user_to_buy` | per utente | categoria `{title, tobuys: [...]}` |
| `user_inventory_personal` | per utente | categoria `{title, data: [{id,name,number,order}]}` |
| `manuals` | per utente | `{title, link}` |
| `usefulContacts` | per utente | `{name, category, phone, email, city, notes}` |
| `tours` | **globale** (nessun userId) | `{name, stagePlot, channelList}` (URL) |
| `tour_artists` | per `tourId` | `{tourId, name, role}` |

Gli item delle liste sono array dentro il documento categoria: ogni modifica fa read → modify → write dell'intero array.

## Convenzioni
- Test accanto al file testato (`*.test.ts(x)`). `src/test/setup.ts` mocka sempre `firebase.service`; i test di servizi mockano `firebase/firestore`, i test di pagine mockano il servizio. Usare `renderWithAuth` (`src/test/renderWithAuth.tsx`) per pagine che richiedono utente/router
- Logica pura (filtri, normalizzazioni) in `src/utils/` con test dedicati
- Testi UI e commenti in italiano (titoli sezioni in inglese)
- Modali, loading e conferme di eliminazione sono reimplementati inline in ogni pagina (nessun componente condiviso)
