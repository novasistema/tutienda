#!/usr/bin/env node
/**
 * Da acceso de administrador del panel a una cuenta de Google.
 *
 * Uso:
 *   1. La persona entra una vez a https://SU-TIENDA/admin y toca "Ingresar con Google"
 *      (va a ver "no autorizada": es normal, así queda registrada en Firebase).
 *   2. Desde la carpeta del proyecto:
 *        FIREBASE_SERVICE_ACCOUNT="$(cat clave.json)" FIREBASE_DATABASE_ID=... node scripts/crear-admin.mjs persona@gmail.com
 *   3. La persona vuelve a ingresar y ya ve el panel.
 *
 * Para quitar el acceso: node scripts/crear-admin.mjs persona@gmail.com --quitar
 */
import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const [email, flag] = process.argv.slice(2);
if (!email || !email.includes('@')) {
  console.error('Indicá el email: node scripts/crear-admin.mjs persona@gmail.com');
  process.exit(1);
}

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) {
  console.error('Falta FIREBASE_SERVICE_ACCOUNT (el JSON de la cuenta de servicio, o la ruta al archivo).');
  process.exit(1);
}
const text = raw.trim().startsWith('{')
  ? raw
  : raw.endsWith('.json')
    ? readFileSync(raw, 'utf8')
    : Buffer.from(raw, 'base64').toString('utf8');
const sa = JSON.parse(text);

let databaseId = process.env.FIREBASE_DATABASE_ID;
if (!databaseId) {
  try {
    databaseId = JSON.parse(readFileSync(new URL('../firebase-applet-config.json', import.meta.url), 'utf8')).firestoreDatabaseId;
  } catch {
    databaseId = undefined;
  }
}

const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = databaseId && databaseId !== '(default)' ? getFirestore(app, databaseId) : getFirestore(app);

let user;
try {
  user = await getAuth(app).getUserByEmail(email);
} catch {
  console.error(`No existe una cuenta con ${email}. Pedile que ingrese una vez en /admin con Google y volvé a correr el script.`);
  process.exit(1);
}

const ref = db.collection('admins').doc(user.uid);
if (flag === '--quitar') {
  await ref.delete();
  console.log(`Listo: ${email} ya no es administrador.`);
} else {
  await ref.set({ email, createdAt: new Date().toISOString() });
  console.log(`Listo: ${email} ahora es administrador (uid ${user.uid}).`);
}
process.exit(0);
