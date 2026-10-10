#!/usr/bin/env node
import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function buildOnce() {
  console.log('Building with esbuild...');
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // Bundle and minify frontend entry points
  await build({
    entryPoints: ['app.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['es2018'],
    outfile: path.join(DIST, 'app.js'),
    logLevel: 'info'
  });

  await build({
    entryPoints: ['admin.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['es2018'],
    outfile: path.join(DIST, 'admin.js'),
    logLevel: 'info'
  });

  // Copy CSS and assets
  if (fs.existsSync(path.join(ROOT, 'styles.css'))) {
    fs.copyFileSync(path.join(ROOT, 'styles.css'), path.join(DIST, 'styles.css'));
  }

  copyDirSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));

  // Copy and adjust HTML files to point to built assets
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const indexTransformed = indexHtml
    .replace(/<script type="module" src="app\.js"><\/script>/, '<script type="module" src="./app.js"></script>');
  fs.writeFileSync(path.join(DIST, 'index.html'), indexTransformed, 'utf8');

  if (fs.existsSync(path.join(ROOT, 'admin.html'))) {
    const adminHtml = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
    const adminTransformed = adminHtml
      .replace(/<script type="module" src="admin\.js"><\/script>/, '<script type="module" src="./admin.js"></script>');
    fs.writeFileSync(path.join(DIST, 'admin.html'), adminTransformed, 'utf8');
  }

  console.log('Build complete. Output ->', DIST);
}

async function watchMode() {
  console.log('Starting esbuild in watch mode...');

  // Ensure dist exists and perform initial copy
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // Shared onRebuild handler
  const makeOnRebuild = (name) => ({
    onRebuild(err, result) {
      if (err) {
        console.error(`${name} rebuild failed:`, err);
      } else {
        console.log(`${name} rebuilt successfully at ${new Date().toLocaleTimeString()}`);
        // Re-copy static assets and HTML after rebuild to keep dist fresh
        try {
          if (fs.existsSync(path.join(ROOT, 'styles.css'))) {
            fs.copyFileSync(path.join(ROOT, 'styles.css'), path.join(DIST, 'styles.css'));
          }
          copyDirSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));

          const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
          const indexTransformed = indexHtml
            .replace(/<script type="module" src="app\.js"><\/script>/, '<script type="module" src="./app.js"></script>');
          fs.writeFileSync(path.join(DIST, 'index.html'), indexTransformed, 'utf8');

          if (fs.existsSync(path.join(ROOT, 'admin.html'))) {
            const adminHtml = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
            const adminTransformed = adminHtml
              .replace(/<script type="module" src="admin\.js"><\/script>/, '<script type="module" src="./admin.js"></script>');
            fs.writeFileSync(path.join(DIST, 'admin.html'), adminTransformed, 'utf8');
          }
        } catch (copyErr) {
          console.warn('Failed to refresh static assets after rebuild:', copyErr);
        }
      }
    }
  });

  // Kick off watch builds for app and admin
  try {
    await build({
      entryPoints: ['app.js'],
      bundle: true,
      minify: true,
      format: 'esm',
      target: ['es2018'],
      outfile: path.join(DIST, 'app.js'),
      logLevel: 'info',
      watch: makeOnRebuild('app.js')
    });

    await build({
      entryPoints: ['admin.js'],
      bundle: true,
      minify: true,
      format: 'esm',
      target: ['es2018'],
      outfile: path.join(DIST, 'admin.js'),
      logLevel: 'info',
      watch: makeOnRebuild('admin.js')
    });

    // Initial static copy
    if (fs.existsSync(path.join(ROOT, 'styles.css'))) {
      fs.copyFileSync(path.join(ROOT, 'styles.css'), path.join(DIST, 'styles.css'));
    }
    copyDirSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));

    const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const indexTransformed = indexHtml
      .replace(/<script type="module" src="app\.js"><\/script>/, '<script type="module" src="./app.js"></script>');
    fs.writeFileSync(path.join(DIST, 'index.html'), indexTransformed, 'utf8');

    if (fs.existsSync(path.join(ROOT, 'admin.html'))) {
      const adminHtml = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
      const adminTransformed = adminHtml
        .replace(/<script type="module" src="admin\.js"><\/script>/, '<script type="module" src="./admin.js"></script>');
      fs.writeFileSync(path.join(DIST, 'admin.html'), adminTransformed, 'utf8');
    }

    console.log('Watching for changes. Press Ctrl+C to stop.');
    // Keep the process alive
    process.stdin.resume();
  } catch (err) {
    console.error('Watch mode failed to start:', err);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.includes('--watch')) {
  watchMode();
} else {
  buildOnce().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}
