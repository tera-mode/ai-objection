import * as admin from 'firebase-admin';

let _app: admin.app.App | null = null;

export function getAdminApp(): admin.app.App {
  if (_app) return _app;
  if (admin.apps.length > 0) {
    _app = admin.apps[0]!;
    return _app;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  _app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });

  return _app;
}

export function getAdminDb(): admin.firestore.Firestore {
  return admin.firestore(getAdminApp());
}

export function getAdminAuth(): admin.auth.Auth {
  return admin.auth(getAdminApp());
}

// 後方互換エイリアス
export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop: string | symbol) {
    const db = getAdminDb();
    const value = (db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  },
});

export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop: string | symbol) {
    const auth = getAdminAuth();
    const value = (auth as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(auth) : value;
  },
});
