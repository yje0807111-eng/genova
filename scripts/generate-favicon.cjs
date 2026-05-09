/**
 * RGBA PNG 소스로 public/favicon.ico 생성 및 app/icon.png 최적화.
 * Usage: node scripts/generate-favicon.cjs
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function main() {
  const root = process.cwd();
  const srcPng = path.join(root, "src/app/icon.png");
  const tmp = path.join(root, "node_modules", ".favicon-tmp");
  fs.mkdirSync(tmp, { recursive: true });
  const rgbaPath = path.join(tmp, "source-rgba.png");

  await sharp(srcPng).ensureAlpha().png({ compressionLevel: 9 }).toFile(rgbaPath);

  const sizes = [16, 32, 48];
  const sizePaths = [];
  for (const s of sizes) {
    const p = path.join(tmp, `icon-${s}.png`);
    await sharp(rgbaPath)
      .resize(s, s, { fit: "cover", position: "centre" })
      .ensureAlpha()
      .png({ compressionLevel: 9 })
      .toFile(p);
    sizePaths.push(p);
  }

  const { default: pngToIco } = await import("png-to-ico");
  const icoBuffer = await pngToIco(sizePaths);

  const publicDir = path.join(root, "public");
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuffer);

  await sharp(rgbaPath)
    .resize(512, 512, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, "src/app/icon.png"));

  const appIco = path.join(root, "src/app/favicon.ico");
  if (fs.existsSync(appIco)) fs.unlinkSync(appIco);

  fs.rmSync(tmp, { recursive: true, force: true });

  const meta = await sharp(path.join(root, "src/app/icon.png")).metadata();
  console.log("OK public/favicon.ico, src/app/icon.png", {
    icoBytes: icoBuffer.length,
    iconPng: { width: meta.width, height: meta.height, hasAlpha: meta.hasAlpha, channels: meta.channels },
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
