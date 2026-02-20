/**
 * Builds page-map.json: { "2:255": 42, ... }
 * Uses Quran.com API (one-time) to get verse keys per page.
 * No Arabic text is downloaded here — only verse keys and pages.
 */

import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("./page-map.json");
const TOTAL_PAGES = 604;

const API_BASE = "https://api.quran.com/api/v4";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} for ${url}\n${txt.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchPageKeys(pageNum) {
  const url =
    `${API_BASE}/verses/by_page/${pageNum}` +
    `?per_page=300&fields=verse_key&words=false`;

  const data = await fetchJson(url);
  return (data.verses || []).map(v => v.verse_key).filter(Boolean);
}

async function main() {
  console.log(`Building page-map.json for ${TOTAL_PAGES} pages...`);

  const map = {};
  for (let p = 1; p <= TOTAL_PAGES; p++) {
    process.stdout.write(`Page ${p}/${TOTAL_PAGES}\r`);
    const keys = await fetchPageKeys(p);
    if (!keys.length) throw new Error(`No keys returned for page ${p}`);

    for (const key of keys) {
      // If a verse appears twice (shouldn't), keep first
      if (!map[key]) map[key] = p;
    }
    await sleep(120);
  }

  fs.writeFileSync(OUT, JSON.stringify({ meta: { source: "api.quran.com", pages: TOTAL_PAGES }, map }, null, 0), "utf8");
  console.log(`\n✅ Wrote ${OUT}`);
}

main().catch(e => {
  console.error("\n❌ Failed:", e);
  process.exit(1);
});