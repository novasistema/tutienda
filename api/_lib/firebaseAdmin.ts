import { readFileSync } from 'node:fs';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Acceso de servidor a Firestore (salta las reglas de seguridad, por eso solo corre en /api).
 *
 * Variables de entorno (Vercel → Settings → Environment Variables):
 *  - FIREBASE_SERVICE_ACCOUNT: el JSON de la cuenta de servicio (Firebase → Configuración del
 *    proyecto → Cuentas de servicio → Generar nueva clave privada). Puede ir tal cual o en base64.
 *  - FIREBASE_DATABASE_ID (opcional): id de la base de Firestore si no es "(default)".
 */
let cached: Firestore | null = null;

const loadServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('Falta la variable FIREBASE_SERVICE_ACCOUNT en el servidor.');
  }
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  return JSON.parse(text);
};

const fallbackDatabaseId = (): string | undefined => {
  try {
    const cfg = JSON.parse(readFileSync(new URL('../../firebase-applet-config.json', import.meta.url), 'utf8'));
    return cfg.firestoreDatabaseId;
  } catch {
    return undefined;
  }
};

export const adminDb = (): Firestore => {
  if (cached) return cached;
  let app: App;
  if (getApps().length) {
    app = getApps()[0];
  } else {
    const sa = loadServiceAccount();
    app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
  }
  const databaseId = process.env.FIREBASE_DATABASE_ID || fallbackDatabaseId();
  cached = databaseId && databaseId !== '(default)' ? getFirestore(app, databaseId) : getFirestore(app);
  return cached;
};
