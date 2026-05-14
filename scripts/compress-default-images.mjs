#!/usr/bin/env node
/**
 * One-off (re-runnable) compressor for public/default-avatar.png and
 * public/default-banner.png. Uses sharp (already a transitive dependency
 * via Next image optimization).
 *
 * Strategy: keep the .png extension so existing <img src="/default-*.png">
 * references stay unchanged. Apply sharp's lossless palette+zlib chain
 * with a sensible resize cap.
 *
 * Run:
 *   node scripts/compress-default-images.mjs
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, "..", "public");

const TARGETS = [
  {
    file: "default-avatar.png",
    // Covers the largest avatar render (~128px) at 2x DPR, with headroom.
    resize: { width: 320, height: 320, fit: "cover" },
  },
  {
    file: "default-banner.png",
    // Banners render at up to 1600px wide, ~400px tall. 1600x600 covers it.
    resize: { width: 1600, height: 600, fit: "cover" },
  },
];

async function compress({ file, resize }) {
  const filePath = path.join(PUBLIC, file);
  const before = (await fs.stat(filePath)).size;

  const buf = await sharp(filePath)
    .resize(resize)
    .png({
      compressionLevel: 9,
      palette: true,
      quality: 90,
      effort: 10,
    })
    .toBuffer();

  await fs.writeFile(filePath, buf);

  const after = (await fs.stat(filePath)).size;
  const pct = ((1 - after / before) * 100).toFixed(1);
  console.log(`${file}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (${pct}% smaller)`);
}

for (const t of TARGETS) {
  await compress(t);
}
