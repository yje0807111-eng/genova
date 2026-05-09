const fs = require("fs");
const path = require("path");

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const root = path.join(__dirname, "..", "src");
const files = walk(root);

const hangul = /[\uAC00-\uD7A3\u3131-\u318E]/;
const koreanFiles = [];
for (const f of files) {
  const c = fs.readFileSync(f, "utf8");
  if (hangul.test(c)) {
    koreanFiles.push(path.relative(path.join(__dirname, ".."), f).replace(/\\/g, "/"));
  }
}

const trPath = path.join(__dirname, "..", "src/lib/i18n/translations.ts");
const tr = fs.readFileSync(trPath, "utf8");
const enKeys = new Set();
const keyLineRe = /^\s*"([^"]+)":/gm;
let m;
while ((m = keyLineRe.exec(tr)) !== null) enKeys.add(m[1]);

function extractOverrideKeys(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const keys = new Set();
  while ((m = keyLineRe.exec(src)) !== null) keys.add(m[1]);
  return keys;
}

const koKeys = extractOverrideKeys(path.join(__dirname, "..", "src/lib/i18n/ko-overrides.ts"));
const jaKeys = extractOverrideKeys(path.join(__dirname, "..", "src/lib/i18n/ja-overrides.ts"));

const onlyKo = [...koKeys].filter((k) => !enKeys.has(k)).sort();
const onlyJa = [...jaKeys].filter((k) => !enKeys.has(k)).sort();

const tKeyRe = /\bt\(\s*["']([^"']+)["']/g;
const usedKeys = new Set();
for (const f of files) {
  const c = fs.readFileSync(f, "utf8");
  while ((m = tKeyRe.exec(c)) !== null) usedKeys.add(m[1]);
}

const missingInEn = [...usedKeys].filter((k) => !enKeys.has(k)).sort();

const out = {
  hangulFiles: koreanFiles.sort(),
  missingInEnFromT: missingInEn,
  onlyKoNotEn: onlyKo,
  onlyJaNotEn: onlyJa,
};

/** Files that reference any missing key via t("key") */
const missingFiles = new Set();
for (const k of missingInEn) {
  const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\bt\\(\\s*["']${esc}["']`, "g");
  for (const f of files) {
    const c = fs.readFileSync(f, "utf8");
    if (re.test(c)) {
      missingFiles.add(path.relative(path.join(__dirname, ".."), f).replace(/\\/g, "/"));
    }
  }
}

out.filesReferencingMissingEnKeys = [...missingFiles].sort();

/** App router pages (tsx under src/app) containing Hangul */
const appHangul = koreanFiles.filter((f) => /^src\/app\/.*\.tsx$/.test(f));

out.appTsxPagesWithHangul = appHangul.sort();

process.stdout.write(JSON.stringify(out, null, 2));
