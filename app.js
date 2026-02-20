(() => {
  const K = { PLAN: "q20_plan_pages_simple_v1", READER: "q20_reader_pages_simple_v1" };
  const TOTAL_PAGES = 604;
  const DAYS = 20;

  const el = {
    pillStatus: document.getElementById("pillStatus"),
    pageSelect: document.getElementById("pageSelect"),
    searchInput: document.getElementById("searchInput"),
    btnSearch: document.getElementById("btnSearch"),
    nrTitle: document.getElementById("nrTitle"),
    nrMeta: document.getElementById("nrMeta"),
    pageWrap: document.getElementById("pageWrap"),
    results: document.getElementById("results"),
    btnPrev: document.getElementById("btnPrev"),
    btnNext: document.getElementById("btnNext"),
    btnMarkLastRead: document.getElementById("btnMarkLastRead"),
    btnGoContinue: document.getElementById("btnGoContinue"),
    btnBookmark: document.getElementById("btnBookmark"),
    btnOpenPlan: document.getElementById("btnOpenPlan"),
    planPanel: document.getElementById("planPanel"),
    btnClosePlan: document.getElementById("btnClosePlan"),

    startDate: document.getElementById("startDate"),
    totalPages: document.getElementById("totalPages"),
    daysWrap: document.getElementById("days"),
    completedStat: document.getElementById("completedStat"),
    streakStat: document.getElementById("streakStat"),
    todayStat: document.getElementById("todayStat"),
    progressFill: document.getElementById("progressFill"),
    paceLine: document.getElementById("paceLine"),
    markToday: document.getElementById("markToday"),
    undoToday: document.getElementById("undoToday"),
    resetAll: document.getElementById("resetAll"),
  };

  const setPill = (t) => (el.pillStatus.textContent = t);

  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };
  const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  const escapeHtml = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const todayLocalISO = () => {
    const d = new Date();
    const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return tz.toISOString().slice(0, 10);
  };

  const addDays = (iso, n) => {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return tz.toISOString().slice(0, 10);
  };

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ---------- Plan ----------
  const defaultPlanState = () => ({
    startDate: todayLocalISO(),
    totalPages: TOTAL_PAGES,
    done: Array.from({ length: DAYS }, () => false),
    updatedAt: Date.now(),
  });

  const buildPlan = (totalPages) => {
    const base = Math.floor(totalPages / DAYS);
    const rem = totalPages % DAYS;
    const chunks = [];
    let page = 1;
    for (let i = 0; i < DAYS; i++) {
      const size = base + (i < rem ? 1 : 0);
      chunks.push({ start: page, end: page + size - 1, size });
      page += size;
    }
    return chunks;
  };

  const computeDayIndex = (startISO, todayISO) => {
    const a = new Date(startISO + "T00:00:00");
    const b = new Date(todayISO + "T00:00:00");
    return Math.round((b - a) / 86400000);
  };

  const computeStreak = (doneArr) => {
    let s = 0;
    for (let i = doneArr.length - 1; i >= 0; i--) {
      if (doneArr[i]) s++;
      else break;
    }
    return s;
  };

  const renderPlan = (planState) => {
    const totalPages = Math.max(1, Math.floor(Number(planState.totalPages || TOTAL_PAGES)));
    const plan = buildPlan(totalPages);

    el.startDate.value = planState.startDate;
    el.totalPages.value = totalPages;

    el.daysWrap.innerHTML = "";
    plan.forEach((p, idx) => {
      const dayISO = addDays(planState.startDate, idx);
      const checked = !!planState.done[idx];

      const row = document.createElement("div");
      row.className = "day";
      row.innerHTML = `
        <div class="n">D${idx + 1}</div>
        <div>
          <div class="a">Pages ${p.start}–${p.end}</div>
          <div class="b">${dayISO} • ${p.size} pages</div>
        </div>
        <div><input type="checkbox" ${checked ? "checked" : ""} aria-label="Day ${idx+1} done"></div>
      `;

      row.querySelector("input").addEventListener("change", (ev) => {
        planState.done[idx] = ev.target.checked;
        planState.updatedAt = Date.now();
        save(K.PLAN, planState);
        renderPlan(planState);
      });

      el.daysWrap.appendChild(row);
    });

    const completed = planState.done.filter(Boolean).length;
    el.completedStat.textContent = `${completed}/20`;
    el.progressFill.style.width = `${Math.round((completed / DAYS) * 100)}%`;
    el.streakStat.textContent = `${computeStreak(planState.done)}`;

    const todayISO = todayLocalISO();
    const dayIdx = computeDayIndex(planState.startDate, todayISO);
    el.todayStat.textContent = dayIdx < 0 ? "Not started" : dayIdx >= DAYS ? "Ended" : `Day ${dayIdx + 1}`;

    const expected = clamp(dayIdx + 1, 0, DAYS);
    const behind = expected - completed;

    if (dayIdx < 0) el.paceLine.textContent = `Plan starts on ${planState.startDate}.`;
    else if (dayIdx >= DAYS) el.paceLine.textContent = completed === DAYS ? "Completed ✅" : `Plan ended on ${addDays(planState.startDate, DAYS - 1)}.`;
    else el.paceLine.textContent = behind <= 0 ? "On track ✔️" : `Behind by ${behind} day(s).`;

    el.markToday.disabled = !(dayIdx >= 0 && dayIdx < DAYS);
    el.undoToday.disabled = !(dayIdx >= 0 && dayIdx < DAYS);

    el.markToday.onclick = () => {
      if (dayIdx < 0 || dayIdx >= DAYS) return;
      planState.done[dayIdx] = true;
      save(K.PLAN, planState);
      renderPlan(planState);
    };
    el.undoToday.onclick = () => {
      if (dayIdx < 0 || dayIdx >= DAYS) return;
      planState.done[dayIdx] = false;
      save(K.PLAN, planState);
      renderPlan(planState);
    };
  };

  // ---------- Reader ----------
  const defaultReaderState = () => ({
    page: 1,
    lastRead: { page: 1 },
    bookmarks: [] // [{page, ts}]
  });

  let PAGES = null; // pages-simple.json

  const renderPageOptions = () => {
    el.pageSelect.innerHTML = "";
    for (let p = 1; p <= TOTAL_PAGES; p++) {
      const opt = document.createElement("option");
      opt.value = String(p);
      opt.textContent = `Page ${p}`;
      el.pageSelect.appendChild(opt);
    }
  };

  const renderPage = (st) => {
    const pageNum = clamp(Number(st.page || 1), 1, TOTAL_PAGES);
    const verses = PAGES?.pages?.[pageNum] || [];

    el.nrTitle.textContent = `Page ${pageNum} / ${TOTAL_PAGES}`;
    const startKey = verses[0]?.key || "—";
    const endKey = verses[verses.length - 1]?.key || "—";
    el.nrMeta.textContent = verses.length
      ? `Range: ${startKey} → ${endKey} • Verses: ${verses.length}`
      : "No verses found for this page";

    const pageText = verses.map(v => v.text).join(" ۝ ");

    el.pageWrap.innerHTML = `
      <div class="pageText" lang="ar" dir="rtl">${escapeHtml(pageText)}</div>
      <div class="pageMetaLine">
        <span>Last read: ${st.lastRead?.page ?? 1}</span>
        <span>Bookmarks: ${st.bookmarks?.length ?? 0}</span>
      </div>
    `;

    el.results.innerHTML = "";
  };

  const addBookmark = (st) => {
    const p = clamp(Number(st.page || 1), 1, TOTAL_PAGES);
    const exists = st.bookmarks.some(b => b.page === p);
    if (!exists) st.bookmarks.unshift({ page: p, ts: Date.now() });
    st.bookmarks = st.bookmarks.slice(0, 50);
  };

  const runSearchAcrossPages = (needleRaw) => {
    const needle = (needleRaw || "").trim();
    if (!needle) return [];
    const hits = [];
    for (let p = 1; p <= TOTAL_PAGES; p++) {
      const verses = PAGES.pages[p] || [];
      for (const v of verses) {
        if (v.text.includes(needle)) {
          hits.push({ page: p, key: v.key, preview: v.text });
          if (hits.length >= 30) return hits;
        }
      }
    }
    return hits;
  };

  const showSearchResults = (hits, st) => {
    el.results.innerHTML = "";
    if (!hits.length) { setPill("No matches"); return; }
    setPill(`${hits.length} match(es)`);

    const card = document.createElement("div");
    card.className = "resultCard";
    card.innerHTML = `<div class="badge">Search results</div>
      <div class="muted small" style="margin-top:8px">Click a result to jump to its page.</div>`;

    hits.slice(0, 12).forEach(h => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.style.marginTop = "10px";
      btn.style.textAlign = "left";
      btn.innerHTML = `<span class="badge">Page ${h.page}</span> <span class="badge">${h.key}</span>
        <div class="muted small" style="margin-top:6px">…${escapeHtml(h.preview.slice(0, 120))}…</div>`;
      btn.addEventListener("click", () => {
        st.page = h.page;
        save(K.READER, st);
        el.pageSelect.value = String(st.page);
        renderPage(st);
        setPill("Ready ✔️");
      });
      card.appendChild(btn);
    });

    el.results.appendChild(card);
  };

  const init = async () => {
    const planState = load(K.PLAN, defaultPlanState());
    const readerState = load(K.READER, defaultReaderState());

    el.startDate.addEventListener("change", () => {
      planState.startDate = el.startDate.value || todayLocalISO();
      save(K.PLAN, planState);
      renderPlan(planState);
    });
    el.totalPages.addEventListener("change", () => {
      planState.totalPages = Math.max(1, Math.floor(Number(el.totalPages.value || TOTAL_PAGES)));
      save(K.PLAN, planState);
      renderPlan(planState);
    });
    el.resetAll.addEventListener("click", () => {
      Object.assign(planState, defaultPlanState());
      save(K.PLAN, planState);
      renderPlan(planState);
    });

    el.btnOpenPlan.addEventListener("click", () => el.planPanel.classList.add("open"));
    el.btnClosePlan.addEventListener("click", () => el.planPanel.classList.remove("open"));

    try {
      setPill("Loading pages-simple.json…");
      const resp = await fetch("./pages-simple.json", { cache: "no-store" });
      if (!resp.ok) throw new Error("Missing pages-simple.json. Run: npm run build:all");
      PAGES = await resp.json();
      if (!PAGES?.pages || PAGES.pages.length < TOTAL_PAGES) throw new Error("pages-simple.json invalid");
      setPill("Ready ✔️");
    } catch (e) {
      console.error(e);
      setPill("Missing pages-simple.json ❗");
      el.nrTitle.textContent = "Run: npm run build:all";
      el.nrMeta.textContent = "Then refresh.";
      el.pageWrap.innerHTML = "";
      renderPlan(planState);
      return;
    }

    renderPageOptions();
    readerState.page = clamp(Number(readerState.page || 1), 1, TOTAL_PAGES);
    el.pageSelect.value = String(readerState.page);
    renderPage(readerState);

    el.pageSelect.addEventListener("change", () => {
      readerState.page = Number(el.pageSelect.value);
      save(K.READER, readerState);
      renderPage(readerState);
    });

    el.btnPrev.addEventListener("click", () => {
      readerState.page = clamp(readerState.page - 1, 1, TOTAL_PAGES);
      save(K.READER, readerState);
      el.pageSelect.value = String(readerState.page);
      renderPage(readerState);
    });

    el.btnNext.addEventListener("click", () => {
      readerState.page = clamp(readerState.page + 1, 1, TOTAL_PAGES);
      save(K.READER, readerState);
      el.pageSelect.value = String(readerState.page);
      renderPage(readerState);
    });

    el.btnMarkLastRead.addEventListener("click", () => {
      readerState.lastRead = { page: readerState.page };
      save(K.READER, readerState);
      setPill("Saved last read ✔️");
      renderPage(readerState);
    });

    el.btnGoContinue.addEventListener("click", () => {
      readerState.page = clamp(readerState.lastRead?.page ?? 1, 1, TOTAL_PAGES);
      save(K.READER, readerState);
      el.pageSelect.value = String(readerState.page);
      renderPage(readerState);
      setPill("Ready ✔️");
    });

    el.btnBookmark.addEventListener("click", () => {
      addBookmark(readerState);
      save(K.READER, readerState);
      setPill("Bookmarked 📌");
      setTimeout(() => setPill("Ready ✔️"), 700);
      renderPage(readerState);
    });

    el.btnSearch.addEventListener("click", () => {
      const hits = runSearchAcrossPages(el.searchInput.value);
      showSearchResults(hits, readerState);
    });

    el.searchInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") el.btnSearch.click();
    });

    renderPlan(planState);
  };

  init();
})();