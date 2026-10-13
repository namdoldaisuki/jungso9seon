(() => {
  const CFG = window.APP_CONFIG;
  const T = window.TEXTS;
  const t = window.t;
  const ROSTER = window.ROSTER || [];
  const byNo = new Map(ROSTER.map(p => [p.no, p]));
  const STORE_KEY = "rank9-state-v3";
  // 名簿が変わったら古い途中データは使わない
  const ROSTER_SIG = ROSTER.length + "-" + ROSTER.reduce((a, p) => a + p.no, 0);
  const N = CFG.finalCount;
  const app = document.getElementById("app");

  document.title = T.title;
  document.getElementById("appTitle").textContent = T.title;

  // ---------- 保存 ----------
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.rosterSig === ROSTER_SIG) return s;
    } catch (e) {}
    return { phase: "intro" };
  }
  function save() {
    state.rosterSig = ROSTER_SIG;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function reset() {
    state = { phase: "intro" };
    save();
  }

  let state = load();
  let showResume = state.phase !== "intro";

  // ---------- 小物 ----------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ランダムにグループ分けする。同じ所属の人はなるべく別々のグループに散らす
  function makeGroups(list, size) {
    const k = Math.max(1, Math.ceil(list.length / size));
    // 端数が出ないよう、なるべく同じ人数ずつにする
    const cap = [...Array(k)].map((_, i) => Math.floor(list.length / k) + (i < list.length % k ? 1 : 0));
    const groups = [...Array(k)].map(() => []);
    const affCount = [...Array(k)].map(() => new Map());

    // 所属ごとにまとめ、人数の多い所属から順に配る（所属なしの人は1人ずつ別扱い）
    const byAff = new Map();
    for (const no of shuffle(list)) {
      const aff = byNo.get(no).group || "#" + no;
      if (!byAff.has(aff)) byAff.set(aff, []);
      byAff.get(aff).push(no);
    }
    const clusters = shuffle([...byAff.entries()]).sort((a, b) => b[1].length - a[1].length);

    for (const [aff, members] of clusters) {
      for (const no of members) {
        // 空きがあるグループのうち、同じ所属が少ない→人数が少ない→ランダム の順で選ぶ
        let best = null, bestKey = null;
        for (const gi of shuffle([...Array(k).keys()])) {
          if (groups[gi].length >= cap[gi]) continue;
          const key = [affCount[gi].get(aff) || 0, groups[gi].length / cap[gi]];
          if (best === null || key[0] < bestKey[0] || (key[0] === bestKey[0] && key[1] < bestKey[1])) {
            best = gi;
            bestKey = key;
          }
        }
        groups[best].push(no);
        affCount[best].set(aff, (affCount[best].get(aff) || 0) + 1);
      }
    }
    return shuffle(groups).map(shuffle);
  }

  function thumb(p, cls = "thumb") {
    return p.img
      ? `<img class="${cls}" src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">`
      : `<div class="noimg"></div>`;
  }

  function card(p, pressed) {
    return `<button class="card" data-no="${p.no}" aria-pressed="${pressed}">
      ${thumb(p)}
      <div class="meta"><div class="name">${esc(p.name)}</div><div class="grp">${esc(p.group)}</div></div>
    </button>`;
  }

  function roundLabel(round) {
    return round === 0 ? t("prelimName") : t("mainName", { round });
  }

  // ---------- 決勝：2択で並べる（二分挿入ソート） ----------
  // answers を最初から再生するので、「ひとつ戻る」は answers を1つ消すだけでよい
  function runSort(items, answers) {
    let ai = 0;
    const sorted = [items[0]];
    for (let i = 1; i < items.length; i++) {
      const x = items[i];
      let lo = 0, hi = sorted.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (ai >= answers.length) return { need: [x, sorted[mid]] };
        if (answers[ai++]) hi = mid; else lo = mid + 1;
      }
      sorted.splice(lo, 0, x);
    }
    return { order: sorted };
  }
  function maxQuestions(n) {
    let q = 0;
    for (let k = 1; k < n; k++) q += Math.ceil(Math.log2(k + 1));
    return q;
  }

  // ---------- 画面の切り替え ----------
  function goRound(round, pool) {
    const groups = makeGroups(pool, round === 0 ? CFG.prelimGroupSize : CFG.mainGroupSize);
    state = { phase: "roundIntro", round, pool, groups, groupIndex: 0, selected: [] };
    save();
  }
  function goFinal(list) {
    state = { phase: "finalIntro", items: shuffle(list), answers: [] };
    save();
  }


  function render() {
    window.scrollTo(0, 0);
    if (!ROSTER.length) {
      app.innerHTML = `<div class="panel">名簿データが読み込めませんでした。</div>`;
      return;
    }
    if (showResume) return renderResume();
    ({
      intro: renderIntro,
      roundIntro: renderRoundIntro,
      round: renderRound,
      finalIntro: renderFinalIntro,
      final: renderFinal,
      adjust: renderAdjust,
      result: renderResult,
    }[state.phase] || renderIntro)();
  }

  function renderIntro() {
    app.innerHTML = `
      <h2>${t("introTitle", { total: ROSTER.length, n: N })}</h2>
      <div class="panel">
        <ol class="steps">${T.introSteps.map(s => `<li>${fill(s, { n: N })}</li>`).join("")}</ol>
        <p class="muted">${t("introNote")}</p>
      </div>
      <button class="btn primary" id="start">${t("startButton")}</button>`;
    app.querySelector("#start").onclick = () => {
      goRound(0, ROSTER.map(p => p.no));
      render();
    };
  }

  function renderResume() {
    app.innerHTML = `
      <h2>${t("resumeTitle")}</h2>
      <div class="stack">
        <button class="btn primary" id="cont">${t("resumeButton")}</button>
        <button class="btn" id="restart">${t("restartButton")}</button>
      </div>`;
    app.querySelector("#cont").onclick = () => { showResume = false; render(); };
    app.querySelector("#restart").onclick = async () => {
      if (!(await showConfirm(t("restartConfirm")))) return;
      showResume = false;
      reset();
      render();
    };
  }

  function renderRoundIntro() {
    const vars = { total: state.pool.length, groups: state.groups.length, n: N };
    const body = state.round === 0
      ? `<p>${t("prelimIntro", vars)}</p>`
      : `<p>${t("mainIntro", vars)}</p><p class="muted">${t("mainIntroNote", vars)}</p>`;
    app.innerHTML = `
      <h2>${roundLabel(state.round)}</h2>
      <div class="panel">${body}</div>
      <button class="btn primary" id="go">${t("roundStartButton")}</button>`;
    app.querySelector("#go").onclick = () => { state.phase = "round"; save(); render(); };
  }

  // 予選・本選：1グループ＝1ページ。選び終わったら「次へ」で進む
  function renderRound() {
    const { round, groups } = state;
    const gi = Math.min(state.groupIndex || 0, groups.length - 1);
    const sel = new Set(state.selected);
    const last = gi === groups.length - 1;
    const finishLabel = round === 0 ? t("prelimFinishButton") : t("mainFinishButton");

    app.innerHTML = `
      <div class="gauge">
        <div class="gauge-label"><b>${roundLabel(round)}</b><span>${t("groupHeading", { i: gi + 1, groups: groups.length })}</span></div>
        <div class="progress"><div style="width:${((gi + 1) / groups.length) * 100}%"></div></div>
        <div class="count" id="count"></div>
      </div>
      <p class="muted">${round === 0 ? t("prelimHint") : t("mainHint", { n: N })}</p>
      <div class="grid">${groups[gi].map(no => card(byNo.get(no), sel.has(no))).join("")}</div>
      <!-- 「次へ」は一番下に置く（画面の下に固定すると、スクロールせずに進んで下の段の人を見逃すため） -->
      <div class="pager">
        <button class="btn" id="prev" ${gi === 0 ? "disabled" : ""}>${t("prevButton")}</button>
        <button class="btn primary" id="next">${last ? finishLabel : t("nextButton")}</button>
      </div>`;

    const countEl = app.querySelector("#count");
    const updateCount = () => {
      const n = state.selected.length;
      if (round === 0) {
        countEl.innerHTML = t("prelimCount", { count: `<b>${n}</b>` });
      } else {
        const cls = n <= N ? "ok" : "over";
        countEl.innerHTML = t("mainCount", { count: `<span class="${cls}">${n}</span>`, n: N });
      }
    };
    updateCount();

    app.querySelectorAll(".card").forEach(el => {
      el.onclick = () => {
        const no = Number(el.dataset.no);
        const on = el.getAttribute("aria-pressed") !== "true";
        el.setAttribute("aria-pressed", on);
        state.selected = on ? [...state.selected, no] : state.selected.filter(x => x !== no);
        save();
        updateCount();
      };
    });
    app.querySelector("#prev").onclick = () => { state.groupIndex = gi - 1; save(); render(); };
    app.querySelector("#next").onclick = () => {
      if (last) return finishRound();
      state.groupIndex = gi + 1;
      save();
      render();
    };
  }

  async function finishRound() {
    const sel = new Set(state.selected);
    const passed = state.pool.filter(no => sel.has(no));
    if (passed.length === 0) {
      await showAlert(t("noneSelectedAlert"));
      return;
    }
    if (state.round > 0 && passed.length === state.pool.length && passed.length > N) {
      await showAlert(t("allSelectedAlert", { n: N }));
      return;
    }
    const vars = { round: roundLabel(state.round), count: passed.length, next: state.round + 1 };
    if (!(await showConfirm(passed.length <= N ? t("toFinalConfirm", vars) : t("toNextRoundConfirm", vars)))) return;
    if (passed.length <= N) goFinal(passed);
    else goRound(state.round + 1, shuffle(passed));
    render();
  }

  function renderFinalIntro() {
    const n = state.items.length;
    app.innerHTML = `
      <h2>${t("finalIntroTitle", { count: n })}</h2>
      <div class="panel">
        <p>${t("finalIntroText")}</p>
        <p class="muted">${t("finalIntroNote", { max: maxQuestions(n) })}</p>
      </div>
      <div class="grid">${state.items.map(no => card(byNo.get(no), false)).join("")}</div>
      <p><button class="btn primary" id="go">${t("finalStartButton")}</button></p>`;
    app.querySelectorAll(".card").forEach(el => (el.disabled = true));
    app.querySelector("#go").onclick = () => { state.phase = "final"; save(); render(); };
  }

  function renderFinal() {
    const r = runSort(state.items, state.answers);
    if (r.order) {
      state.phase = "adjust";
      state.order = r.order;
      save();
      return render();
    }
    const [x, y] = r.need;
    // 左右の位置が偏らないように入れ替える
    const [left, right] = (state.answers.length + x) % 2 ? [y, x] : [x, y];
    app.innerHTML = `
      <h2 class="center">${t("finalQuestionTitle", { q: state.answers.length + 1 })}</h2>
      <p class="muted center">${t("finalQuestionSub", { max: maxQuestions(state.items.length) })}</p>
      <div class="vs">${card(byNo.get(left), false)}${card(byNo.get(right), false)}</div>
      <p class="center"><button class="btn small" id="undo" ${state.answers.length ? "" : "disabled"}>${t("undoButton")}</button></p>`;
    app.querySelectorAll(".card").forEach(el => {
      el.onclick = () => {
        state.answers.push(Number(el.dataset.no) === x);
        save();
        render();
      };
    });
    app.querySelector("#undo").onclick = () => { state.answers.pop(); save(); render(); };
  }

  function renderAdjust() {
    const o = state.order;
    app.innerHTML = `
      <h2>${t("adjustTitle")}</h2>
      <p class="muted">${t("adjustNote")}</p>
      <ol class="adjust">${o.map((no, i) => {
        const p = byNo.get(no);
        return `<li>
          <span class="rank">${i + 1}</span>
          ${thumb(p, "")}
          <div class="who"><div><b>${esc(p.name)}</b></div><div class="muted">${esc(p.group)}</div></div>
          <button class="btn small" data-up="${i}" ${i === 0 ? "disabled" : ""} aria-label="↑">↑</button>
          <button class="btn small" data-down="${i}" ${i === o.length - 1 ? "disabled" : ""} aria-label="↓">↓</button>
        </li>`;
      }).join("")}</ol>
      <div class="actions">
        <button class="btn" id="redo">${t("redoFinalButton")}</button>
        <button class="btn primary" id="done">${t("decideButton")}</button>
      </div>`;
    const swap = (i, j) => {
      [o[i], o[j]] = [o[j], o[i]];
      save();
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    };
    app.querySelectorAll("[data-up]").forEach(b => (b.onclick = () => swap(+b.dataset.up, +b.dataset.up - 1)));
    app.querySelectorAll("[data-down]").forEach(b => (b.onclick = () => swap(+b.dataset.down, +b.dataset.down + 1)));
    app.querySelector("#redo").onclick = () => {
      state.answers = [];
      state.phase = "final";
      save();
      render();
    };
    app.querySelector("#done").onclick = () => { state.phase = "result"; save(); render(); };
  }

  function renderResult() {
    const o = state.order;
    const cells = [];
    for (let i = 0; i < 9; i++) {
      const p = byNo.get(o[i]);
      cells.push(p
        ? `<div class="cell">${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.name)}">` : ""}
             <span class="rk">${i + 1}</span><span class="gp">${p.group ? `<small>${esc(p.group)}</small>` : ""}<small>${esc(p.name)}</small></span></div>`
        : `<div class="cell empty"></div>`);
    }
    app.innerHTML = `
      <h2 class="center">${t("resultTitle", { n: N })}</h2>
      <div class="result">${cells.join("")}</div>
      <ol class="namelist">${o.map((no, i) => {
        const p = byNo.get(no);
        return `<li><b>${t("resultRank", { rank: i + 1 })}</b>　${esc(p.name)}${p.group ? ` <span class="muted">（${esc(p.group)}）</span>` : ""}</li>`;
      }).join("")}</ol>
      <div class="actions">
        <a class="btn primary" href="collage.html?ids=${o.join(",")}" target="_blank" rel="noopener">${t("collageLink")}</a>
      </div>
      <div class="actions">
        <button class="btn small" id="adjust">${t("adjustButton")}</button>
        <button class="btn small" id="restart">${t("restartButton")}</button>
      </div>`;
    app.querySelector("#adjust").onclick = () => { state.phase = "adjust"; save(); render(); };
    app.querySelector("#restart").onclick = async () => {
      if (!(await showConfirm(t("resultRestartConfirm")))) return;
      reset();
      render();
    };
  }

  render();
})();
