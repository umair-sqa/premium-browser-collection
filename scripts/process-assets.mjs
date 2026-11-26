import sharp from 'sharp';
import { mkdir, copyFile, writeFile } from 'fs/promises';
import path from 'path';

const SRC = '/opt/cursor/artifacts/assets';
const ROOT = '/workspace';

async function themeAssets(id, ntpSrc, frameColor) {
  const dir = path.join(ROOT, 'products/themes', id);
  await mkdir(path.join(dir, 'images'), { recursive: true });
  await mkdir(path.join(dir, 'store'), { recursive: true });

  // NTP background 1920x1080
  await sharp(path.join(SRC, ntpSrc))
    .resize(1920, 1080, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, 'images/theme_ntp_background.png'));

  // Frame: dark gradient bar 1920x180 blended with theme color
  const frameSvg = `<svg width="1920" height="180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${frameColor}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${frameColor}" stop-opacity="0.92"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="180" fill="url(#g)"/>
  </svg>`;

  // Composite cropped top of wallpaper with overlay
  const top = await sharp(path.join(SRC, ntpSrc))
    .resize(1920, 1080, { fit: 'cover' })
    .extract({ left: 0, top: 0, width: 1920, height: 180 })
    .modulate({ brightness: 0.55, saturation: 0.7 })
    .png()
    .toBuffer();

  await sharp(top)
    .composite([{ input: Buffer.from(frameSvg), blend: 'over' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, 'images/theme_frame.png'));

  // Store preview 1280x800
  await sharp(path.join(SRC, ntpSrc))
    .resize(1280, 800, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, 'store/preview-1280x800.png'));

  // Small tile 440x280
  await sharp(path.join(SRC, ntpSrc))
    .resize(440, 280, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, 'store/tile-440x280.png'));

  console.log(`Theme assets OK: ${id}`);
}

async function extAssets(id, bgSrc, iconSrc) {
  const dir = path.join(ROOT, 'products/new-tab', id);
  await mkdir(path.join(dir, 'assets'), { recursive: true });
  await mkdir(path.join(dir, 'icons'), { recursive: true });
  await mkdir(path.join(dir, 'store'), { recursive: true });

  await sharp(path.join(SRC, bgSrc))
    .resize(1920, 1080, { fit: 'cover' })
    .jpeg({ quality: 85 })
    .toFile(path.join(dir, 'assets/background.jpg'));

  for (const size of [16, 32, 48, 128]) {
    await sharp(path.join(SRC, iconSrc))
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(path.join(dir, `icons/icon-${size}.png`));
  }

  await sharp(path.join(SRC, bgSrc))
    .resize(1280, 800, { fit: 'cover' })
    .png()
    .toFile(path.join(dir, 'store/screenshot-1280x800.png'));

  await sharp(path.join(SRC, iconSrc))
    .resize(440, 280, { fit: 'cover' })
    .png()
    .toFile(path.join(dir, 'store/promo-small.png'));

  console.log(`Extension assets OK: ${id}`);
}

// Preserve original Obsidian artwork as provenance copy
await mkdir(path.join(ROOT, 'products/themes/obsidian/images/provenance'), { recursive: true });
await copyFile(
  path.join(ROOT, 'products/themes/obsidian/images/theme_ntp_background.png'),
  path.join(ROOT, 'products/themes/obsidian/images/provenance/original-ntp.png')
).catch(() => {});
await copyFile(
  path.join(ROOT, 'products/themes/obsidian/images/theme_frame.png'),
  path.join(ROOT, 'products/themes/obsidian/images/provenance/original-frame.png')
).catch(() => {});

await themeAssets('obsidian', 'obsidian-ntp-bg.jpg', 'rgba(18,18,20,0.55)');
await themeAssets('shinobi', 'shinobi-ntp-bg.jpg', 'rgba(12,10,12,0.5)');
await themeAssets('aurora', 'aurora-ntp-bg.jpg', 'rgba(8,16,32,0.45)');
await themeAssets('nebula', 'nebula-ntp-bg.jpg', 'rgba(12,8,28,0.5)');
await themeAssets('dev-terminal', 'dev-terminal-ntp-bg.jpg', 'rgba(10,14,12,0.55)');
await themeAssets('noor', 'noor-ntp-bg.jpg', 'rgba(20,28,24,0.4)');

await extAssets('salah-sun', 'salah-sun-bg.jpg', 'salah-sun-icon.jpg');
await extAssets('deep-work', 'deep-work-bg.jpg', 'deep-work-icon.jpg');
await extAssets('devspace', 'devspace-bg.jpg', 'devspace-icon.jpg');
await extAssets('cosmos', 'cosmos-bg.jpg', 'cosmos-icon.jpg');

// Brand mark
await sharp(path.join(SRC, 'obsidian-ntp-bg.jpg'))
  .resize(512, 512, { fit: 'cover' })
  .png()
  .toFile(path.join(ROOT, 'assets/brand/aurevia-mark.png'));

console.log('All assets processed.');
