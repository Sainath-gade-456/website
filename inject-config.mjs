#!/usr/bin/env node
// Build-time injector: reads environment variables and writes a small script
// into dist/index.html to expose `window.__FIREBASE_CONFIG__` and
// `window.__BACKEND_API_URL__`.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

function getFirebaseConfigFromEnv() {
  const key = process.env.FIREBASE_API_KEY;
  if (!key) return null;
  return {
    apiKey: key,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || ''
  };
}

async function inject() {
  if (!fs.existsSync(DIST)) {
    console.error('dist/ not found. Run `npm run build` first.');
    process.exit(1);
  }

  const indexPath = path.join(DIST, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  const firebaseConfig = getFirebaseConfigFromEnv();
  const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || '';

  const injection = [];
  if (firebaseConfig) {
    injection.push(`window.__FIREBASE_CONFIG__ = ${JSON.stringify(firebaseConfig)};`);
  }
  if (backendUrl) {
    injection.push(`window.__BACKEND_API_URL__ = ${JSON.stringify(backendUrl)};`);
  }

  const scriptTag = injection.length ? `<script>${injection.join('\n')}</script>` : '';

  // Replace the marker
  if (html.includes('<!-- FIREBASE_CONFIG_INJECT -->')) {
    html = html.replace('<!-- FIREBASE_CONFIG_INJECT -->', scriptTag);
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('Injected runtime config into dist/index.html');
  } else {
    console.warn('Injection marker not found in index.html; skipping injection.');
  }

  const adminPath = path.join(DIST, 'admin.html');
  if (fs.existsSync(adminPath)) {
    let adminHtml = fs.readFileSync(adminPath, 'utf8');
    if (adminHtml.includes('<!-- FIREBASE_CONFIG_INJECT -->')) {
      adminHtml = adminHtml.replace('<!-- FIREBASE_CONFIG_INJECT -->', scriptTag);
      fs.writeFileSync(adminPath, adminHtml, 'utf8');
      console.log('Injected runtime config into dist/admin.html');
    }
  }
}

inject().catch(err => {
  console.error('Injection failed:', err);
  process.exit(1);
});
