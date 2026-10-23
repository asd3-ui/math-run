import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

// Rasterize the existing existing public app icon for Android launcher densities.
// Use the original public icon supplied with the project; never modify it.
const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
const androidRes = new URL('../android/app/src/main/res/', import.meta.url);
const root = androidRes.pathname;
const densities = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192]
];

for (const [folder, size] of densities) {
  const dir = join(root, folder);
  mkdirSync(dir, { recursive: true });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(join(dir, 'ic_launcher.png'), png);
  writeFileSync(join(dir, 'ic_launcher_round.png'), png);
}

// Android 8+ uses adaptive icons. Keep the same repository artwork as foreground.
const valuesDir = join(root, 'values');
mkdirSync(valuesDir, { recursive: true });
writeFileSync(join(valuesDir, 'ic_launcher_background.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#151a36</color>
</resources>
`);

const adaptiveDir = join(root, 'mipmap-anydpi-v26');
mkdirSync(adaptiveDir, { recursive: true });
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher" />
</adaptive-icon>
`;
writeFileSync(join(adaptiveDir, 'ic_launcher.xml'), adaptive);
writeFileSync(join(adaptiveDir, 'ic_launcher_round.xml'), adaptive);
console.log('Android launcher icons generated from the existing icon.svg.');
