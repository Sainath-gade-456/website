#!/usr/bin/env node
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.env.ADMIN_EMAIL?.trim();
if (!email) {
  console.error('Set ADMIN_EMAIL to the Firebase Auth email to promote.');
  process.exit(1);
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!getApps().length) {
  if (serviceAccountJson) {
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
  } else {
    initializeApp({ credential: applicationDefault() });
  }
}

try {
  const user = await getAuth().getUserByEmail(email);
  await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
  console.log(`Admin claim assigned to ${email}.`);
} catch (error) {
  console.error('Could not assign admin claim:', error.message);
  process.exit(1);
}
