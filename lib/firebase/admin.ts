import "server-only";

import * as admin from 'firebase-admin'

export const adminApp = admin.apps[0] || admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)),
});