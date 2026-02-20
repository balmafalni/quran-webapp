/**
 * Build pages.json (604 mushaf pages) by downloading verses-by-page from Quran Foundation API.
 * After this step, your app runs fully OFFLINE from pages.json.
 *
 * Run:
 *   npm run build:pages
 */

import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("./pages.json");

// You can change "text_type" if you want other scripts.
// "uthmani" is common mushaf-like text. For "simple" specifically, APIs vary.
// This build focuses on page-accurate mushaf paging (Madani).
const API_BASE = "https://api.quran.com/api/v4";

// How many pages in Madani mushaf:
const TOTAL_PAGES = 604;

// Gentle pacing so you don’t hammer the API
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} for ${url}\n${txt.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Fetch one page worth of verses.
 * We ask for:
 * - uthmani text (verse.verse_key + text_uthmani)
 * - include page number info is implicit by endpoint
 */
async function fetchPage(pageNum) {
  const url =
    `${API_BASE}/verses/by_page/${pageNum}` +
    `?per_page=300` +
    `&fields=text_uthmani,verse_key` +
    `&words=false`;

  const data = await fetchJson(url);
  const verses = (data.verses || []).map((v) => ({
    key: v.verse_key,            // e.g. "2:255"
    text: v.text_uthmani || "",  // Arabic text
  }));

  if (!verses.length) {
    throw new Error(`No verses returned for page ${pageNum}`);
  }

  return verses;
}

async function main() {
  console.log(`Building ${TOTAL_PAGES} pages -> ${OUT}`);
  const pages = Array.from({ length: TOTAL_PAGES + 1 }, () => null); // ignore index 0

  for (let p = 1; p <= TOTAL_PAGES; p++) {
    process.stdout.write(`Fetching page ${p}/${TOTAL_PAGES}...\r`);
    pages[p] = await fetchPage(p);
    await sleep(120); // small delay
  }

  const out = {
    meta: {
      source: "api.quran.com (Quran Foundation API)",
      pages: TOTAL_PAGES,
      builtAt: new Date().toISOString()
    },
    pages
  };

  fs.writeFileSync(OUT, JSON.stringify(out), "utf8");
  console.log(`\n✅ Done. Wrote: ${OUT}`);
}

main().catch((e) => {
  console.error("\n❌ Build failed:", e);
  process.exit(1);
});