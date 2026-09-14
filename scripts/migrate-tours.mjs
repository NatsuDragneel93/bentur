#!/usr/bin/env node
/**
 * Migrazione tour (fase 8b)
 *
 * 1. Assegna ai tour senza proprietario `ownerId` e `memberIds` dell'utente indicato
 * 2. Copia gli artisti dalla vecchia collection globale `tour_artists`
 *    alla sottocollection `tours/{tourId}/artists` (stesso id documento)
 * 3. Con --delete-legacy elimina da `tour_artists` solo gli artisti già copiati
 *
 * Senza --apply o --delete-legacy NON scrive nulla: mostra solo cosa farebbe.
 * Prima di ogni scrittura salva un backup JSON in ./backups/.
 * Si può rilanciare più volte: salta ciò che è già migrato.
 *
 * Uso:
 *   node scripts/migrate-tours.mjs --key <service-account.json> --owner-email <email>            (prova)
 *   node scripts/migrate-tours.mjs --key <service-account.json> --owner-email <email> --apply    (migra)
 *   node scripts/migrate-tours.mjs --key <service-account.json> --delete-legacy                  (pulizia)
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Allineati con src/services/tours.service.ts
const TOURS_COLLECTION = 'tours';
const TOUR_ARTISTS_SUBCOLLECTION = 'artists';
const LEGACY_ARTISTS_COLLECTION = 'tour_artists';
const EXPECTED_PROJECT_ID = 'bentur-c5eaa';
const BATCH_LIMIT = 400;

const { values: args } = parseArgs({
  options: {
    key: { type: 'string' },
    'owner-email': { type: 'string' },
    apply: { type: 'boolean', default: false },
    'delete-legacy': { type: 'boolean', default: false },
  },
});

const fail = (message) => {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
};

if (!args.key) fail('Manca --key <percorso del file JSON del service account>');
if (args.apply && args['delete-legacy']) fail('Usa --apply e --delete-legacy in due esecuzioni separate');
if (!args['delete-legacy'] && !args['owner-email']) fail('Manca --owner-email <email del proprietario dei tour esistenti>');

const serviceAccount = JSON.parse(readFileSync(resolve(args.key), 'utf8'));
if (serviceAccount.project_id !== EXPECTED_PROJECT_ID) {
  fail(`Il service account è del progetto "${serviceAccount.project_id}", atteso "${EXPECTED_PROJECT_ID}"`);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Timestamp -> stringa ISO, per un backup leggibile
const toSerializable = (value) => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(toSerializable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toSerializable(v)]));
  }
  return value;
};

const writeBackup = (tours, legacyArtists) => {
  mkdirSync('backups', { recursive: true });
  const file = resolve('backups', `tours-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify({
    createdAt: new Date().toISOString(),
    tours: tours.map(d => ({ id: d.id, data: toSerializable(d.data()) })),
    tour_artists: legacyArtists.map(d => ({ id: d.id, data: toSerializable(d.data()) })),
  }, null, 2));
  console.log(`💾 Backup salvato in ${file}`);
};

const commitInBatches = async (operations) => {
  for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    operations.slice(i, i + BATCH_LIMIT).forEach(apply => apply(batch));
    await batch.commit();
  }
};

const artistRef = (tourId, artistId) =>
  db.collection(TOURS_COLLECTION).doc(tourId).collection(TOUR_ARTISTS_SUBCOLLECTION).doc(artistId);

const [toursSnapshot, legacySnapshot] = await Promise.all([
  db.collection(TOURS_COLLECTION).get(),
  db.collection(LEGACY_ARTISTS_COLLECTION).get(),
]);
const tours = toursSnapshot.docs;
const legacyArtists = legacySnapshot.docs;
const tourIds = new Set(tours.map(t => t.id));

console.log(`\nProgetto: ${EXPECTED_PROJECT_ID}`);
console.log(`Tour trovati: ${tours.length} — artisti nella vecchia collection: ${legacyArtists.length}\n`);

// ---------------- Pulizia vecchia collection ----------------
if (args['delete-legacy']) {
  const toDelete = [];
  const notCopied = [];

  for (const artist of legacyArtists) {
    const { tourId, name } = artist.data();
    const copy = tourId && tourIds.has(tourId) ? await artistRef(tourId, artist.id).get() : null;
    if (copy?.exists) {
      toDelete.push(artist);
    } else {
      notCopied.push(`${name ?? artist.id} (tourId: ${tourId ?? '—'})`);
    }
  }

  console.log(`Da eliminare (già copiati): ${toDelete.length}`);
  if (notCopied.length) {
    console.log(`⚠️  NON eliminati perché senza copia (tour inesistente o migrazione non eseguita): ${notCopied.length}`);
    notCopied.forEach(line => console.log(`   - ${line}`));
  }

  if (toDelete.length) {
    writeBackup(tours, legacyArtists);
    await commitInBatches(toDelete.map(artist => batch => batch.delete(artist.ref)));
    console.log(`\n✅ Eliminati ${toDelete.length} artisti dalla vecchia collection`);
  }
  process.exit(0);
}

// ---------------- Migrazione ----------------
const owner = await getAuth().getUserByEmail(args['owner-email']).catch(() => null);
if (!owner) fail(`Nessun utente registrato con email ${args['owner-email']} (deve aver fatto login almeno una volta)`);
console.log(`Proprietario dei tour esistenti: ${owner.email} (uid ${owner.uid})\n`);

const operations = [];

console.log('TOUR');
for (const tour of tours) {
  const data = tour.data();
  if (data.ownerId) {
    console.log(`  = "${data.name}" ha già un proprietario (${data.ownerId}), invariato`);
    continue;
  }
  console.log(`  + "${data.name}" → proprietario ${owner.email}`);
  operations.push(batch => batch.update(tour.ref, { ownerId: owner.uid, memberIds: [owner.uid] }));
}

console.log('\nARTISTI');
let orphans = 0;
for (const artist of legacyArtists) {
  const { tourId, name, role, createdAt, updatedAt } = artist.data();
  if (!tourId || !tourIds.has(tourId)) {
    orphans++;
    console.log(`  ⚠️  "${name}" appartiene a un tour inesistente (${tourId ?? '—'}): ignorato`);
    continue;
  }
  const target = artistRef(tourId, artist.id);
  if ((await target.get()).exists) {
    console.log(`  = "${name}" già copiato`);
    continue;
  }
  const tourName = tours.find(t => t.id === tourId).data().name;
  console.log(`  + "${name}" (${role}) → tour "${tourName}"`);
  const now = Timestamp.now();
  operations.push(batch => batch.set(target, {
    name: name ?? '',
    role: role ?? '',
    createdAt: createdAt ?? now,
    updatedAt: updatedAt ?? now,
  }));
}

console.log(`\nOperazioni da eseguire: ${operations.length}${orphans ? ` — artisti orfani ignorati: ${orphans}` : ''}`);

if (!args.apply) {
  console.log('\nℹ️  Prova a vuoto: nessuna modifica. Rilancia con --apply per eseguire la migrazione.\n');
  process.exit(0);
}

if (operations.length === 0) {
  console.log('\n✅ Niente da migrare.\n');
  process.exit(0);
}

writeBackup(tours, legacyArtists);
await commitInBatches(operations);
console.log('\n✅ Migrazione completata. La vecchia collection tour_artists è rimasta intatta.\n');
