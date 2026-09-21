# Bentur

Web app per fonici (sound engineer) in tour: gestione tour/artisti, to-do, liste acquisti, inventario, manuali, contatti utili.
Per ora solo online; la gestione offline è prevista in futuro (tenerne conto nelle scelte architetturali).

## Stack
- React 19 + TypeScript + Vite 6, SCSS per pagina (tema scuro, colori hardcoded)
- React Router 7 (`BrowserRouter`), rotte in `src/App.tsx`
- Firebase 11: Auth (solo Google popup) + Firestore. Config in `src/environment/firebaseConfig.ts`
- Hosting: Firebase Hosting (progetto `bentur-c5eaa`, cartella `dist`, rewrite SPA)
- i18n: react-i18next (IT/EN), testi in `src/i18n/locales/it.ts` (riferimento) ed `en.ts`
- UI: FontAwesome per le icone, `@hello-pangea/dnd` per drag & drop delle liste, Konva + react-konva per l'editor Setup (caricato con `React.lazy`); nessuna libreria di componenti (MUI rimosso)
- Test: Vitest + React Testing Library (jsdom). Regole Firestore in `firestore.rules` (deploy: `firebase deploy --only firestore:rules`, lo fa l'utente)
- Git: non fare mai commit/push/branch, l'utente committa da sé

## Comandi
- `npm run dev` — dev server
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — ESLint
- `npm test` — Vitest in watch; `npm run test:run` — esecuzione singola
- Deploy: `npm run build` poi `firebase deploy`
- `scripts/migrate-tours.mjs` — migrazione una tantum dei tour (Admin SDK; chiave service account fuori dal repo; senza `--apply` è solo una prova)

## Struttura
- `src/services/firebase.service.ts` — istanze Firebase `auth`, `provider`, `database` (importate direttamente dai servizi)
- `src/context/AuthProvider.tsx` — unico listener di `onAuthStateChanged`; hook in `src/hooks/useAuth.ts`: `useAuth()` (user, loading, signInWithGoogle, logout) e `useRequiredUser()` per le pagine sotto ProtectedRoute
- `src/components/ui/` — componenti condivisi: `FormModal` (form + blocco doppio invio), `ConfirmDialog`, `Modal`, `LoadingState`, `FloatingAddButton`; stili in `ui.scss` con prefisso `bt-`
- `src/context/ToastProvider.tsx` + `useToast()` — notifiche (`showError`, `showSuccess`, `showToast`); non usare `alert()`
- `src/i18n/index.ts` — configurazione i18next (lingua da localStorage `bentur.language`, poi browser, ripiego italiano); `LanguageSwitcher` nel menu profilo e nel login
- `src/components/ProtectedRoute.tsx` — redirect a `/` se non loggato; `Header.tsx` — nav + menu profilo/logout
- `src/services/*.service.ts` — un servizio singleton per collection Firestore
- `src/services/categoryList.service.ts` — `createCategoryListService<TItem>(scope, itemsField)`: servizio generico per le collection "categoria con array di elementi", legato a un ambito (`collectionRef` + filtri + campi extra); ogni modifica agli elementi usa `runTransaction`. Liste personali: `createUserCategoryListService(collection, field).forUser(uid)`; liste artista: `artistLists.service.ts` → `.forArtist(tourId, artistId)`. Le pagine creano il servizio con `useMemo`. Logica pura sugli array in `src/utils/categoryItems.ts`
- `src/services/batchDelete.ts` — `deleteInBatches` (gruppi da 500); eliminando tour/artisti si cancellano anche liste e setup degli artisti (`artistDocumentsToDelete` in `tours.service.ts`)
- `src/components/category-list/` — motore delle liste: `useCategoryList` (stato: caricamento, CRUD categorie/elementi, riordino, aggiornamenti ottimistici) + `CategoryListView`/`CategoryList` (categorie a fisarmonica, modali, conferme) + `CategoryListPage` (la pagina intera: `TopBar`, titolo, ricerca, pulsante "azzera tutte le spunte") + tipi di elemento in `itemTypes.tsx` (`checklistItemType`, `inventoryItemType`, `consumableItemType` con flag `toRestock`). Prop opzionali: `back`, `kicker`, `resetAction` (azzera spunte), `categoryBadge`, `onCategoriesChange` (conteggi verso l'esterno). To Do Personal, To Buy, Inventory Personal e le liste artista sono solo configurazione (servizio + tipo + testi)
- `src/components/tour-overview/` — `TourOverview` (elenco tour a fisarmonica, più tour aperti insieme, ricerca su tour e artisti, link al dettaglio artista) + `ArtistListBlock` (una lista modificabile dell'artista dentro il tour). Gli artisti di un tour si leggono alla prima apertura e restano montati finché si resta nella pagina; il tag con i conteggi compare solo dopo l'apertura. Ci si appoggiano `ToDoTour` (`/to-do/tour`, lista `todos`) e `MyInventoryTour` (`/my-inventory/tour`, blocchi separati Spare e Consumabili); `showtime_checks` non compare mai qui. Conteggi puri in `src/utils/tourOverview.ts`
- `src/pages/tours/artist-lists/` — `ArtistList` (rotta `/tours/:tourId/artists/:artistId/lists/:listPath`: `spare`, `to-do`, `consumables`, `check-before-show`) aperta dalle card di `ArtistDetail`
- `src/pages/tours/setup/` — editor Setup A/B (rotta `/tours/:tourId/artists/:artistId/setup/:setupKey`, `a`|`b`): `SetupEditor` (stato: cronologia annulla/ripristina, salvataggio, dialoghi conflitto / copia da Setup A / uscita senza salvare), `StageCanvas` (Konva: forme con stile ispirato alla demo "Infinite Canvas" — angoli arrotondati, ombre, colori pieni, stella, palco a puntini; il campo `stroke` resta nei dati ma non viene disegnato; maniglie, zoom con rotella/pizzico, spostamento vista, `exportImage` PNG), `ShapePalette`, `ShapeProperties` (nome, colori, duplica, ordine). Su cellulare (`useMediaQuery(MOBILE_MEDIA_QUERY)` in `src/hooks/useMediaQuery.ts`) il pannello si apre solo con "Modifica" o doppio tocco, in primo piano sopra il palco (portal su `document.body`, classe `se-sheet`), e si chiude con "Fatto" o toccando fuori; `GestureHelp` è un riquadro sovrapposto all'area di lavoro (non ne riduce lo spazio), aperto al primo accesso (localStorage `bentur.setupHelpSeen`) e riapribile con "?". Logica pura in `src/utils/stagePlot.ts` (palco logico 1000×600, coordinate = centro della forma; la tela Konva occupa tutta l'area disponibile e il palco vi è centrato con bordo tratteggiato, zoom/vista calcolati rispetto alla tela con `clampView`/`zoomAt`) e `src/utils/history.ts`. Servizio `artistSetups.service.ts` (`saveSetup` in transazione: `conflict` se `updatedAt` è cambiato dal caricamento, `force` per sovrascrivere). Nei test vanno mockati `react-konva` e `konva` (jsdom non ha canvas). Con `BrowserRouter` non si può bloccare la navigazione: l'avviso di modifiche non salvate copre solo il pulsante indietro e `beforeunload`
- `src/pages/tours/useTourArtist.ts` — caricamento artista condiviso da dettaglio, liste e setup
- `src/pages/<sezione>/` — componente + SCSS; le pagine non usano Firebase Auth direttamente

## Modello dati Firestore
| Collection | Scope | Forma |
|---|---|---|
| `user_todos_personal` | per utente (`userId`) | categoria `{title, todos: [{id,text,completed,order}]}` |
| `user_to_buy` | per utente | categoria `{title, tobuys: [...]}` |
| `user_inventory_personal` | per utente | categoria `{title, data: [{id,name,number,order}]}` |
| `manuals` | per utente | `{title, link}` |
| `usefulContacts` | per utente | `{name, category, phone, email, city, notes}` |
| `tours` | membri (`memberIds` array-contains uid) | `{name, stagePlot, channelList, ownerId, memberIds}`; modifica/eliminazione solo `ownerId` |
| `tours/{tourId}/artists` | membri del tour in lettura, proprietario in scrittura | `{name, role}` |
| `tours/{t}/artists/{a}/spare`, `/consumables` | membri del tour in lettura **e scrittura** | categoria `{title, items: [{id,name,number,order}]}` (consumables anche `toRestock`) |
| `tours/{t}/artists/{a}/todos`, `/showtime_checks` | membri del tour in lettura e scrittura | categoria `{title, items: [{id,text,completed,order}]}` |
| `tours/{t}/artists/{a}/setups/{setupA\|setupB}` | membri del tour in lettura e scrittura (`updatedBy` = chi salva, max 500 forme) | `{elements: [{id,type,x,y,width,height,rotation,fill,stroke,label,labelColor}], updatedAt, updatedBy, updatedByName}` |
| `tour_artists` | **legacy**, negata dalle regole | vecchia collection globale degli artisti; si svuota con `scripts/migrate-tours.mjs --delete-legacy` |

Gli item delle liste sono array dentro il documento categoria. Offline non richiesto: le modifiche agli array passano da transazioni Firestore (niente migrazione a subcollection). Nomi dei campi array diversi per collection (`todos`, `tobuys`, `data`): non rinominarli, i dati esistenti li usano.

## Convenzioni
- Test accanto al file testato (`*.test.ts(x)`). `src/test/setup.ts` mocka sempre `firebase.service`; i test di servizi mockano `firebase/firestore`, i test di pagine mockano il servizio. Usare `renderWithAuth` (`src/test/renderWithAuth.tsx`) per pagine che richiedono utente/router
- Logica pura (filtri, normalizzazioni) in `src/utils/` con test dedicati
- Nessun testo UI scritto nei componenti: aggiungere la chiave in `it.ts` E in `en.ts` (il tipo di `en` e `CustomTypeOptions` rendono le chiavi mancanti/errate errori di compilazione) e usare `useTranslation().t`. Termini tecnici del mestiere (To Do, To Buy, Stage Plot, Channel List, Setup, Spare) restano in inglese in entrambe le lingue
- Valori salvati su Firestore non si traducono (es. categorie contatti in `CONTACT_CATEGORIES`: `value` salvato, `labelKey` mostrato)
- I test girano in italiano (`src/test/setup.ts` forza `it`)
- Commenti nel codice in italiano
- Usare i componenti di `src/components/ui/` per modali, conferme, caricamento e pulsante "+"; errori all'utente via `useToast().showError`
- Gli SCSS delle pagine sono GLOBALI (nessun CSS module): classi generiche come `.modal`, `.save-button`, `.confirm-button` definite in più file collidono e vince l'ultimo importato. Nei nuovi stili usare un prefisso dedicato (`bt-` per ui, `cl-` per category-list, `tov-` per tour-overview) o classi specifiche della pagina
