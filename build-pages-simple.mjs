/**
 * Combines:
 *   - quran-simple.json (Tanzil Simple text)
 *   - page-map.json (verse_key -> page)
 * into:
 *   - pages-simple.json (pages 1..604 with Simple text)
 */

import fs from "node:fs";
import path from "node:path";

const IN_QURAN = path.resolve("./quran-simple.json");
const IN_MAP = path.resolve("./page-map.json");
const OUT = path.resolve("./pages-simple.json");

const TOTAL_PAGES = 604;

function mustReadJson(file) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing file: ${file}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function main() {
  const q = mustReadJson(IN_QURAN);
  const pm = mustReadJson(IN_MAP);

  const verseToPage = pm.map;
  if (!verseToPage) {
    console.error("❌ page-map.json invalid: missing 'map'");
    process.exit(1);
  }

  const pages = Array.from({ length: TOTAL_PAGES + 1 }, () => []); // index 0 unused

  // Walk through Tanzil simple and assign verses to pages
  for (const s of q.surahs) {
    for (const a of s.ayahs) {
      const key = `${s.number}:${a.n}`;
      const page = verseToPage[key];
      if (!page) continue; // should not happen, but safe

      pages[page].push({
        key,
        surah: s.number,
        ayah: a.n,
        text: a.text // verbatim Tanzil Simple
      });
    }
  }

  // Validate
  const emptyPages = [];
  for (let p = 1; p <= TOTAL_PAGES; p++) {
    if (!pages[p].length) emptyPages.push(p);
  }
  if (emptyPages.length) {
    console.error("❌ Some pages are empty:", emptyPages.slice(0, 50));
    console.error("This usually means mismatched verse keys (different mushaf scheme).");
    process.exit(1);
  }

  const out = {
    meta: {
      sourceText: q.meta,
      pageMap: pm.meta,
      pages: TOTAL_PAGES,
      builtAt: new Date().toISOString()
    },
    pages
  };

  fs.writeFileSync(OUT, JSON.stringify(out), "utf8");
  console.log(`✅ Wrote ${OUT}`);
}

main();