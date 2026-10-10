#!/usr/bin/env node
// Simple static server to serve the `dist/` folder for staging verification.
// Usage: `node serve-dist.js` or `npm run serve-dist`

const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.SERVE_DIST_PORT || 5000;
const DIST_DIR = path.join(__dirname, 'dist');

app.use(express.static(DIST_DIR));

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serving dist/ at http://localhost:${PORT}`);
});
