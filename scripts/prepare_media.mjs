import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const BRAIN = '/Users/gadesainath/.gemini/antigravity-ide/brain/fe9b39f6-d7f4-4165-b7ad-416039f49ebc';
const ASSETS = path.join(ROOT, 'assets');

// Copy generated photos to assets
const filesToCopy = [
  ['trench_model_1792985412659.jpg', 'mewos_trench_model.jpg'],
  ['trench_detail_1792985443417.jpg', 'mewos_trench_detail.jpg'],
  ['hoodie_model_1792985475380.jpg', 'mewos_hoodie_model.jpg'],
  ['hoodie_detail_1792985501349.jpg', 'mewos_hoodie_detail.jpg'],
  ['shirt_model_1792985532416.jpg', 'mewos_shirt_model.jpg'],
  ['shirt_detail_1792985560715.jpg', 'mewos_shirt_detail.jpg'],
];

for (const [srcName, destName] of filesToCopy) {
  const src = path.join(BRAIN, srcName);
  const dest = path.join(ASSETS, destName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${srcName} -> ${destName}`);
  } else {
    console.warn(`Source missing: ${src}`);
  }
}
