#!/usr/bin/env node
// Creates the admin user in Firebase Auth (Email/Password) and sets the admin custom claim.
// Usage: node scripts/create-admin-user.mjs <email> <password>

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email    = process.argv[2]?.trim();
const password = process.argv[3]?.trim();

if (!email || !password) {
  console.error('\nUsage: node scripts/create-admin-user.mjs <email> <password>\n');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Password must be at least 6 characters.');
  process.exit(1);
}

// Initialise with Application Default Credentials (uses gcloud / firebase login)
if (!getApps().length) {
  initializeApp({ projectId: 'landing-page-ba0a8' });
}

const auth = getAuth();

let uid;
try {
  // Try to find existing user
  const existing = await auth.getUserByEmail(email);
  uid = existing.uid;
  console.log(`User already exists (uid: ${uid}). Updating password & claims...`);
  await auth.updateUser(uid, { password });
} catch (err) {
  if (err.code === 'auth/user-not-found') {
    console.log(`Creating new Firebase Auth user: ${email}`);
    const created = await auth.createUser({ email, password, emailVerified: true });
    uid = created.uid;
    console.log(`User created (uid: ${uid})`);
  } else {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
}

// Set admin custom claim
await auth.setCustomUserClaims(uid, { admin: true });
console.log(`\n✅ Admin user ready:`);
console.log(`   Email    : ${email}`);
console.log(`   UID      : ${uid}`);
console.log(`   Claim    : { admin: true }`);
console.log(`\nYou can now sign in at: https://landing-page-ba0a8.web.app/admin.html\n`);
