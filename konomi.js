(() => {
  const K = window.TEXTS.konomi;
  const k = (key, vars) => fill(K[key] ?? key, vars);
  const ROSTER = window.ROSTER || [];
  const byNo = new Map(ROSTER.map(p => [p.no, p]));
  const MAX_GROUPS = window.APP_CONFIG.konomiMaxGroups;
  const STORE_KEY = "konomi-state-v1";
  const NONE = "none"; // 「選ばない」を選んだマスの値（メンバーのときは no が入る）
  const app = document.getElementById("app");

  document.title = K.title;
  document.getElementById("appTitle").textContent = K.title;

  // 所属なしの人はグループから選べないので候補に入れない
  const membersOf = new Map();
  for (const p of ROSTER) {
    if (!p.group) continue;
    if (!membersOf.has(p.group)) membersOf.set(p.group, []);
    membersOf.get(p.group).push(p);
  }
  const allGroups = [...membersOf.keys()].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

  // ---------- 保存 ----------
  // extras：名簿にいないので手入力で足したメンバー（グループごと。picks には id が入る）
  // extraGroups：名簿にないので手入力で足したグループ
  const newState = () => ({ phase: "users", users: [], groups: [], picks: {}, extras: [], extraGroups: [], nextId: 1, nextExtraId: 1, u: 0, g: 0 });
  function load() {
    const s = newState();
    try {
      const v = JSON.parse(localStorage.getItem(STORE_KEY));
      if (v && Array.isArray(v.users) && Array.isArray(v.groups)) Object.assign(s, v);
    } catch (e) {}
    // 名簿が変わっても入力は残し、いなくなったグループ・メンバーの分だけ捨てる
    s.groups = s.groups.filter(g => membersOf.has(g) || s.extraGroups.includes(g)).slice(0, MAX_GROUPS);
    s.extraGroups = s.extraGroups.filter(g => s.groups.includes(g));
    s.extras = s.extras.filter(x => s.groups.includes(x.group));
    for (const row of Object.values(s.picks)) {
      for (const [g, v] of Object.entries(row)) {
        const ok = s.groups.includes(g) && (v === NONE
          || (membersOf.get(g) || []).some(p => p.no === v)
          || s.extras.some(x => x.id === v && x.group === g));
        if (!ok) delete row[g];
      }
    }
    return s;
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  let state = load();
  let fromTable = false; // 好み表のマスから選び直しに来たとき
  let drawToken = 0;     // 古い画像作成の結果を捨てるため
  let imageUrl = null;

  // ---------- 小物 ----------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // 検索用：全角半角・大文字小文字・ひらがなカタカナ・記号や空白の違いを無視する
  const norm = s => String(s).normalize("NFKC").toLowerCase()
    .replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60))
    .replace(/[\s\p{P}\p{S}]/gu, "");

  const firstChar = s => Array.from(String(s))[0] || "";

  function iconHtml(user) {
    return user.icon
      ? `<img class="ko-icon" src="${user.icon}" alt="">`
      : `<span class="ko-icon ko-icon-empty">${esc(firstChar(user.name))}</span>`;
  }

  // 写真がない人の画像（名簿の番号入り）。画面と好み表で同じものを使う
  const placeholders = new Map();
  function placeholder(no) {
    if (!placeholders.has(no)) {
      const c = document.createElement("canvas");
      c.width = c.height = 480;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#d9d4cf";
      ctx.fillRect(0, 0, 480, 480);
      ctx.fillStyle = "#6b6b6b";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 56px ${FONT}`;
      ctx.fillText("No.", 240, 160);
      ctx.font = `800 150px ${FONT}`;
      ctx.fillText(String(no), 240, 280);
      placeholders.set(no, c.toDataURL("image/png"));
    }
    return placeholders.get(no);
  }
  const photoSrc = p => p.img || placeholder(p.no);

  // 手入力のメンバーで写真がない人の画像（番号がないので名前を入れる）
  function namePlaceholder(name) {
    const c = document.createElement("canvas");
    c.width = c.height = 480;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#d9d4cf";
    ctx.fillRect(0, 0, 480, 480);
    ctx.fillStyle = "#6b6b6b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    fitOneLine(ctx, name, 440, 90, 22, 800);
    ctx.fillText(name, 240, 240);
    return c.toDataURL("image/png");
  }
  const extraSrc = x => x.img || namePlaceholder(x.name);
  const extrasOf = group => state.extras.filter(x => x.group === group);

  // 写真ファイルが読めなかったときも番号入りの画像に差し替える
  app.addEventListener("error", e => {
    const el = e.target;
    if (el.tagName !== "IMG" || !el.dataset.no) return;
    const src = placeholder(Number(el.dataset.no));
    if (el.src !== src) el.src = src;
  }, true);

  const pickOf = (user, group) => (state.picks[user.id] || {})[group];
  const filledCount = () =>
    state.users.reduce((a, u) => a + state.groups.filter(g => pickOf(u, g) !== undefined).length, 0);

  // ---------- 画面の切り替え ----------
  function go(phase) {
    state.phase = phase;
    save();
    render();
  }
  function goPick(u, g) {
    state.u = u;
    state.g = g;
    go("pick");
  }
  // 「3 選ぶ」を押したときは、まだ選んでいない最初のマスへ
  function goFirstEmpty() {
    fromTable = false;
    for (let u = 0; u < state.users.length; u++) {
      for (let g = 0; g < state.groups.length; g++) {
        if (pickOf(state.users[u], state.groups[g]) === undefined) return goPick(u, g);
      }
    }
    goPick(0, 0);
  }

  function render() {
    drawToken++;
    window.scrollTo(0, 0);
    if (!ROSTER.length) {
      app.innerHTML = `<div class="panel">名簿データが読み込めませんでした。</div>`;
      return;
    }
    if (!state.users.length) state.phase = "users";
    else if (!state.groups.length && state.phase !== "users") state.phase = "groups";
    ({
      users: renderUsers,
      groups: renderGroups,
      pick: renderPick,
      table: renderTable,
    }[state.phase] || renderUsers)();
  }

  function stepsHtml() {
    const steps = [
      ["users", K.stepUsers, true],
      ["groups", K.stepGroups, state.users.length > 0],
      ["pick", K.stepPick, state.users.length > 0 && state.groups.length > 0],
      ["table", K.stepTable, state.users.length > 0 && state.groups.length > 0],
    ];
    return `<nav class="ko-steps">${steps.map(([ph, label, on], i) =>
      `<button class="btn small ${state.phase === ph ? "primary" : ""}" data-step="${ph}" ${on ? "" : "disabled"}>${i + 1} ${esc(label)}</button>`
    ).join("")}</nav>`;
  }
  function bindSteps() {
    app.querySelectorAll("[data-step]").forEach(b => (b.onclick = () => {
      if (b.dataset.step === "pick") return goFirstEmpty();
      fromTable = false;
      go(b.dataset.step);
    }));
  }

  // ---------- 1. ユーザー ----------
  // 画像は正方形に切り抜いて小さくしてから保存する（サーバーには送らない）
  function readIcon(file, size) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const c = document.createElement("canvas");
        c.width = c.height = size;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        drawCover(ctx, img, 0, 0, size, size);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });
  }
  async function iconFromInput(input, size = 240) {
    const file = input.files[0];
    input.value = ""; // 同じファイルをもう一度選べるように
    if (!file) return null;
    try {
      return await readIcon(file, size);
    } catch (e) {
      showAlert(K.iconFailed);
      return null;
    }
  }

  let draftIcon = null;
  function renderUsers() {
    app.innerHTML = `
      ${stepsHtml()}
      <h2>${k("usersTitle")}</h2>
      <p class="muted">${k("usersNote")}</p>
      <div class="panel ko-form">
        <label class="ko-iconpick" aria-label="${esc(K.iconLabel)}">
          <input class="ko-file" type="file" accept="image/*" id="draftFile">
          ${draftIcon ? `<img class="ko-icon" src="${draftIcon}" alt="">` : `<span class="ko-icon ko-icon-empty">＋</span>`}
          <span class="ko-iconcap">${k("iconLabel")}</span>
        </label>
        <input class="ko-input" id="name" maxlength="20" placeholder="${esc(K.namePlaceholder)}" autocomplete="off">
        <button class="btn primary" id="add">${k("addButton")}</button>
      </div>
      <ul class="ko-users">${state.users.map(u => `
        <li>
          <label class="ko-iconpick" aria-label="${esc(K.iconLabel)}">
            <input class="ko-file" type="file" accept="image/*" data-icon="${u.id}">
            ${iconHtml(u)}
          </label>
          <input class="ko-input" data-name="${u.id}" maxlength="20" value="${esc(u.name)}" aria-label="${esc(K.namePlaceholder)}" autocomplete="off">
          <button class="btn small" data-del="${u.id}" aria-label="${esc(K.deleteLabel)}">×</button>
        </li>`).join("")}</ul>
      <div class="bottombar"><div class="inner">
        <span class="count">${k("usersCount", { count: state.users.length })}</span>
        <button class="btn primary" id="next" ${state.users.length ? "" : "disabled"}>${k("nextButton")}</button>
      </div></div>`;
    bindSteps();

    const nameEl = app.querySelector("#name");
    const add = async () => {
      const name = nameEl.value.trim();
      if (!name) {
        await showAlert(K.nameRequired);
        return nameEl.focus();
      }
      state.users.push({ id: state.nextId++, name, icon: draftIcon });
      draftIcon = null;
      go("users");
      app.querySelector("#name").focus();
    };
    app.querySelector("#add").onclick = add;
    nameEl.onkeydown = e => { if (e.key === "Enter" && !e.isComposing) add(); };
    app.querySelector("#draftFile").onchange = async e => {
      const typed = nameEl.value;
      const icon = await iconFromInput(e.target);
      if (!icon) return;
      draftIcon = icon;
      render();
      app.querySelector("#name").value = typed;
    };

    const userById = id => state.users.find(u => u.id === Number(id));
    app.querySelectorAll("[data-icon]").forEach(el => (el.onchange = async () => {
      const icon = await iconFromInput(el);
      if (!icon) return;
      userById(el.dataset.icon).icon = icon;
      go("users");
    }));
    app.querySelectorAll("[data-name]").forEach(el => (el.onchange = () => {
      const u = userById(el.dataset.name);
      const name = el.value.trim();
      if (name) u.name = name;
      el.value = u.name;
      const initial = el.closest("li").querySelector(".ko-icon-empty");
      if (initial) initial.textContent = firstChar(u.name);
      save();
    }));
    app.querySelectorAll("[data-del]").forEach(b => (b.onclick = async () => {
      const u = userById(b.dataset.del);
      if (!(await showConfirm(k("deleteUserConfirm", { name: u.name })))) return;
      state.users = state.users.filter(x => x !== u);
      delete state.picks[u.id];
      go("users");
    }));
    app.querySelector("#next").onclick = () => go("groups");
  }

  // ---------- 2. グループ ----------
  function renderGroups() {
    app.innerHTML = `
      ${stepsHtml()}
      <h2>${k("groupsTitle")}</h2>
      <p class="muted">${k("groupsNote", { max: MAX_GROUPS })}</p>
      <div class="ko-sticky">
        <input class="ko-input" id="q" type="search" placeholder="${esc(K.groupSearch)}" autocomplete="off">
        <div class="ko-chips" id="chips"></div>
      </div>
      <p class="muted" id="limit" hidden>${k("groupLimit", { max: MAX_GROUPS })}</p>
      <section class="panel ko-extra">
        <h3>${k("extraGroupTitle")}</h3>
        <div class="ko-extra-row">
          <input class="ko-input" id="extraGroupName" maxlength="20" placeholder="${esc(K.extraGroupName)}" autocomplete="off">
          <button class="btn primary" id="extraGroupAdd">${k("extraGroupButton")}</button>
        </div>
      </section>
      <div class="ko-list" id="list"></div>
      <div class="bottombar"><div class="inner">
        <span class="count" id="count"></span>
        <button class="btn primary" id="next">${k("nextButton")}</button>
      </div></div>`;
    bindSteps();

    const qEl = app.querySelector("#q");
    // 入力欄を作り直すと文字入力が途切れるので、ここから下だけ描き直す
    const paint = () => {
      const q = norm(qEl.value);
      const full = state.groups.length >= MAX_GROUPS;
      const hits = [...state.extraGroups, ...allGroups].filter(g => norm(g).includes(q));
      app.querySelector("#chips").innerHTML = state.groups.map(g =>
        `<button class="ko-chip" data-group="${esc(g)}" aria-label="${esc(k("removeGroupLabel", { group: g }))}">${esc(g)} ×</button>`
      ).join("");
      app.querySelector("#list").innerHTML = hits.map(g => {
        const on = state.groups.includes(g);
        return `<button class="ko-row" data-group="${esc(g)}" aria-pressed="${on}" ${full && !on ? "disabled" : ""}>
          <span>${esc(g)}</span><span class="muted">${k("memberCount", { count: (membersOf.get(g) || []).length + extrasOf(g).length })}</span>
        </button>`;
      }).join("") || `<p class="muted center">${k("noHit")}</p>`;
      app.querySelector("#limit").hidden = !full;
      app.querySelector("#count").textContent = k("groupsCount", { count: state.groups.length, max: MAX_GROUPS });
      app.querySelector("#next").disabled = !state.groups.length;
      app.querySelector("#extraGroupAdd").disabled = full;
    };
    const toggle = async group => {
      if (state.groups.includes(group)) {
        // すでに誰かを選んでいるグループを外すときは、選択も消えるので確認する
        const used = extrasOf(group).length > 0 || state.users.some(u => pickOf(u, group) !== undefined);
        if (used && !(await showConfirm(k("removeGroupConfirm", { group })))) return;
        state.groups = state.groups.filter(g => g !== group);
        state.extraGroups = state.extraGroups.filter(g => g !== group);
        state.extras = state.extras.filter(x => x.group !== group);
        for (const row of Object.values(state.picks)) delete row[group];
      } else if (state.groups.length < MAX_GROUPS) {
        state.groups.push(group);
      }
      save();
      paint();
    };
    qEl.oninput = paint;

    // ここにないグループを足す。名簿のグループと同じ名前なら、そちらを選ぶ
    const extraGroupEl = app.querySelector("#extraGroupName");
    const addGroup = async () => {
      const name = extraGroupEl.value.trim();
      if (!name) {
        await showAlert(K.extraGroupRequired);
        return extraGroupEl.focus();
      }
      const key = norm(name);
      const known = [...state.extraGroups, ...allGroups].find(g => g === name || (key && norm(g) === key));
      const group = known || name;
      if (!state.groups.includes(group)) {
        if (state.groups.length >= MAX_GROUPS) return;
        if (!known) state.extraGroups.push(group);
        state.groups.push(group);
      }
      extraGroupEl.value = "";
      save();
      paint();
    };
    app.querySelector("#extraGroupAdd").onclick = addGroup;
    extraGroupEl.onkeydown = e => { if (e.key === "Enter" && !e.isComposing) addGroup(); };

    for (const id of ["#chips", "#list"]) {
      app.querySelector(id).onclick = e => {
        const b = e.target.closest("[data-group]");
        if (b && !b.disabled) toggle(b.dataset.group);
      };
    }
    app.querySelector("#next").onclick = goFirstEmpty;
    paint();
  }

  // ---------- 3. メンバーを選ぶ ----------
  function memberCard(p, picked) {
    return `<button class="card" data-pick="${p.no}" aria-pressed="${picked === p.no}">
      <img class="thumb" src="${esc(photoSrc(p))}" data-no="${p.no}" alt="${esc(p.name)}" loading="lazy">
      <div class="meta"><div class="name">${esc(p.name)}</div></div>
    </button>`;
  }
  function extraCard(x, picked) {
    return `<button class="card" data-pick="${x.id}" aria-pressed="${picked === x.id}">
      <img class="thumb" src="${extraSrc(x)}" alt="${esc(x.name)}">
      <div class="meta"><div class="name">${esc(x.name)}</div></div>
    </button>`;
  }
  function noneCard(picked) {
    return `<button class="card" data-pick="${NONE}" aria-pressed="${picked === NONE}">
      <div class="ko-dash">—</div>
      <div class="meta"><div class="name">${k("noneLabel")}</div></div>
    </button>`;
  }

  function step(delta) {
    const n = state.groups.length;
    const pos = state.u * n + state.g + delta;
    if (pos < 0) return go("groups"); // 最初のマスから戻るとグループ選択へ
    if (pos >= state.users.length * n) return go("table");
    goPick(Math.floor(pos / n), pos % n);
  }

  function renderPick() {
    state.u = Math.min(state.u, state.users.length - 1);
    state.g = Math.min(state.g, state.groups.length - 1);
    const user = state.users[state.u];
    const group = state.groups[state.g];
    const members = membersOf.get(group) || [];
    const extras = extrasOf(group);
    const total = state.users.length * state.groups.length;

    app.innerHTML = `
      ${stepsHtml()}
      <div class="gauge ko-gauge">
        <div class="gauge-label">
          <span class="ko-who">${iconHtml(user)}<b>${esc(user.name)}</b></span>
          <span>${k("userProgress", { i: state.u + 1, n: state.users.length })}　${k("groupProgress", { i: state.g + 1, n: state.groups.length })}</span>
        </div>
        <div class="progress"><div style="width:${(filledCount() / total) * 100}%"></div></div>
      </div>
      <h2>${esc(group)}</h2>
      <div class="grid" id="cands"></div>
      <section class="panel ko-extra">
        <h3>${k("extraTitle")}</h3>
        <div class="ko-extra-row">
          <label class="ko-iconpick" aria-label="${esc(K.extraPhoto)}">
            <input class="ko-file" type="file" accept="image/*" id="extraFile">
            <span id="extraPreview"><span class="ko-icon ko-icon-empty">＋</span></span>
            <span class="ko-iconcap">${k("extraPhoto")}</span>
          </label>
          <input class="ko-input" id="extraName" maxlength="20" placeholder="${esc(K.extraName)}" autocomplete="off">
        </div>
        <button class="btn primary" id="extraAdd">${k("extraButton")}</button>
      </section>
      <div class="pager">${fromTable
        ? `<button class="btn" id="back">${k("backToTable")}</button>`
        : `<button class="btn" id="prev">${k("prevButton")}</button>
           <button class="btn" id="next">${k("nextButton")}</button>`}
      </div>`;
    bindSteps();

    const cands = app.querySelector("#cands");
    // 「選ばない」は写真一覧の先頭に出す
    const paint = () => {
      const picked = pickOf(user, group);
      cands.innerHTML = noneCard(picked)
        + members.map(p => memberCard(p, picked)).join("")
        + extras.map(x => extraCard(x, picked)).join("");
    };
    let moving = false;
    const choose = value => {
      moving = true;
      (state.picks[user.id] ||= {})[group] = value;
      save();
      // チェックが付いたのを見せてから次のマスへ
      setTimeout(() => {
        if (fromTable) {
          fromTable = false;
          go("table");
        } else {
          step(1);
        }
      }, 180);
    };
    cands.onclick = e => {
      const b = e.target.closest("[data-pick]");
      if (!b || moving) return;
      const v = b.dataset.pick;
      choose(v === NONE || extras.some(x => x.id === v) ? v : Number(v));
      // 作り直すと写真が一瞬消えるので、チェックだけ付け替える
      cands.querySelectorAll("[data-pick]").forEach(c => c.setAttribute("aria-pressed", c === b));
    };

    // ここにいないメンバーを足して、そのまま選ぶ
    let extraPhoto = null;
    const extraNameEl = app.querySelector("#extraName");
    app.querySelector("#extraFile").onchange = async e => {
      const img = await iconFromInput(e.target, 320);
      if (!img) return;
      extraPhoto = img;
      app.querySelector("#extraPreview").innerHTML = `<img class="ko-icon" src="${img}" alt="">`;
    };
    const addExtra = async () => {
      if (moving) return;
      const name = extraNameEl.value.trim();
      if (!name) {
        await showAlert(K.extraNameRequired);
        return extraNameEl.focus();
      }
      const x = { id: "x" + state.nextExtraId++, group, name, img: extraPhoto };
      state.extras.push(x);
      extras.push(x);
      choose(x.id);
      paint();
    };
    app.querySelector("#extraAdd").onclick = addExtra;
    extraNameEl.onkeydown = e => { if (e.key === "Enter" && !e.isComposing) addExtra(); };

    if (fromTable) {
      app.querySelector("#back").onclick = () => { fromTable = false; go("table"); };
    } else {
      app.querySelector("#prev").onclick = () => step(-1);
      app.querySelector("#next").onclick = () => step(1);
    }
    paint();
  }

  // ---------- 画像（好み表） ----------
  const FONT = '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  // CELL：写真の大きさ　GAP：写真同士の横の間隔　ROW_GAP：ユーザー行同士の間隔　PAD：画像のふち　LEFT：名前の列の幅　HEAD：グループ名の行の高さ　ICON：アイコンの大きさ
  const CELL = 140, GAP = 20, ROW_GAP = 60, PAD = 24, LEFT = 156, HEAD = 56, ICON = 76;
  const RADIUS = 16; // マスの角の丸み（0で四角）
  const IMAGE_BG = "#ffffff"; // 画像の背景色
  // スマホのブラウザが作れるcanvasの大きさの上限。超えるときは全体を縮小する
  const MAX_AREA = 16000000, MAX_SIDE = 8192;

  const loadImage = src => new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  // 正方形でない画像も中央を切り抜いて埋める
  function drawCover(ctx, img, x, y, w, h) {
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, x, y, w, h);
  }

  // 幅に収まるまで文字を小さくする
  function fitOneLine(ctx, text, maxW, from, to, weight) {
    for (let size = from; size >= to; size--) {
      ctx.font = `${weight} ${size}px ${FONT}`;
      if (ctx.measureText(text).width <= maxW) return;
    }
  }

  // 長い名前は2行に折り返す。2行に入るまで文字を小さくして、省略はしない
  function nameLines(ctx, text, maxW) {
    for (let size = 21; size >= 15; size--) {
      ctx.font = `500 ${size}px ${FONT}`;
      if (ctx.measureText(text).width <= maxW) return { size, lines: [text] };
    }
    for (let size = 15; ; size--) {
      ctx.font = `500 ${size}px ${FONT}`;
      const lines = [""];
      for (const c of Array.from(text)) {
        const cur = lines[lines.length - 1];
        if (ctx.measureText(cur + c).width <= maxW) lines[lines.length - 1] = cur + c;
        else lines.push(c);
      }
      if (lines.length <= 2 || size === 10) return { size, lines };
    }
  }

  const tableSize = () => ({
    w: PAD * 2 + LEFT + state.groups.length * (CELL + GAP) - GAP,
    h: PAD * 2 + HEAD + state.users.length * (CELL + ROW_GAP) - ROW_GAP,
  });

  async function buildImage() {
    const { w, h } = tableSize();
    const scale = Math.min(1, Math.sqrt(MAX_AREA / (w * h)), MAX_SIDE / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.fillStyle = IMAGE_BG;
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    state.groups.forEach((g, c) => {
      ctx.fillStyle = "#222222";
      fitOneLine(ctx, g, CELL + GAP - 8, 20, 12, 500);
      // 手入力の長い名前でも隣の列にはみ出さないよう、幅も指定する
      ctx.fillText(g, PAD + LEFT + c * (CELL + GAP) + CELL / 2, PAD + HEAD / 2, CELL + GAP - 8);
    });

    const photo = async p => (await loadImage(photoSrc(p))) || loadImage(placeholder(p.no));
    const pickImage = v => {
      if (v === undefined || v === NONE) return null;
      const x = state.extras.find(e => e.id === v);
      return x ? loadImage(extraSrc(x)) : photo(byNo.get(v));
    };
    await Promise.all(state.users.map(async (user, r) => {
      const y = PAD + HEAD + r * (CELL + ROW_GAP);

      // 行の左端：アイコンとその下に名前
      const cx = PAD + (LEFT - 12) / 2, iy = y + 12;
      const iconImg = user.icon ? await loadImage(user.icon) : null;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, iy + ICON / 2, ICON / 2, 0, Math.PI * 2);
      ctx.clip();
      if (iconImg) {
        drawCover(ctx, iconImg, cx - ICON / 2, iy, ICON, ICON);
      } else {
        ctx.fillStyle = "#d9d4cf";
        ctx.fillRect(cx - ICON / 2, iy, ICON, ICON);
        ctx.fillStyle = "#6b6b6b";
        ctx.font = `500 34px ${FONT}`;
        ctx.fillText(firstChar(user.name), cx, iy + ICON / 2);
      }
      ctx.restore();
      const { size, lines } = nameLines(ctx, user.name, LEFT - 20);
      ctx.font = `500 ${size}px ${FONT}`;
      ctx.fillStyle = "#222222";
      const lineH = size * 1.25;
      const midY = iy + ICON + (CELL - 12 - ICON) / 2;
      lines.forEach((line, i) => ctx.fillText(line, cx, midY + (i - (lines.length - 1) / 2) * lineH));

      // メンバーのマス。「選ばない」と未選択は列を詰めずにグレーの「—」
      await Promise.all(state.groups.map(async (g, c) => {
        const x = PAD + LEFT + c * (CELL + GAP);
        const v = pickOf(user, g);
        const img = await pickImage(v);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + RADIUS, y);
        ctx.arcTo(x + CELL, y, x + CELL, y + CELL, RADIUS);
        ctx.arcTo(x + CELL, y + CELL, x, y + CELL, RADIUS);
        ctx.arcTo(x, y + CELL, x, y, RADIUS);
        ctx.arcTo(x, y, x + CELL, y, RADIUS);
        ctx.closePath();
        ctx.clip();
        if (img) {
          drawCover(ctx, img, x, y, CELL, CELL);
          ctx.restore();
        } else {
          ctx.fillStyle = "#d9d4cf";
          ctx.fillRect(x, y, CELL, CELL);
          ctx.restore();
          ctx.fillStyle = "#6b6b6b";
          ctx.font = `400 40px ${FONT}`;
          ctx.fillText("—", x + CELL / 2, y + CELL / 2);
        }
      }));
    }));

    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(b => (b ? resolve(b) : reject()), "image/png");
      } catch (e) {
        reject(e);
      }
    });
  }

  // ---------- 4. 好み表 ----------
  async function renderTable() {
    const token = drawToken;
    app.innerHTML = `
      ${stepsHtml()}
      <h2>${k("tableTitle")}</h2>
      <p class="center muted" id="status">${k("making")}</p>
      <img class="collage-img ko-table" id="out" alt="${esc(K.title)}" hidden>
      <p class="muted center" id="hint" hidden>${k("tableHint")}</p>
      <div class="actions" id="actions" hidden>
        <a class="btn primary" id="download" download="konomi.png">${k("saveButton")}</a>
        <a class="btn" id="tweet" target="_blank" rel="noopener">${k("tweetButton")}</a>
      </div>
      <p class="center muted" id="note" hidden>${k("saveNote")}</p>
      <div class="actions"><button class="btn small" id="restart">${k("restartButton")}</button></div>`;
    bindSteps();
    const $ = id => app.querySelector("#" + id);
    $("restart").onclick = async () => {
      if (!(await showConfirm(k("restartConfirm")))) return;
      state = newState();
      fromTable = false;
      go("users");
    };

    let blob = null;
    try {
      blob = await buildImage();
    } catch (e) {} // 作れなかったときは下の「失敗しました」を出す
    if (token !== drawToken) return; // 作っている間に別の画面へ移った
    if (!blob) {
      $("status").textContent = K.failed;
      return;
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = URL.createObjectURL(blob);
    $("out").src = imageUrl;
    $("out").hidden = false;
    $("download").href = imageUrl;
    $("status").hidden = true;
    $("hint").hidden = false;
    $("actions").hidden = false;
    $("note").hidden = false;

    // Xの投稿画面を開く。投稿画面のリンクでは画像を渡せないので、
    // 画像を渡せるスマホでは共有メニューを使う（PCの共有メニューにはXが出ないことがあるので使わない）
    const siteUrl = new URL("./", location.href).href;
    const tweet = new URL("https://twitter.com/intent/tweet");
    tweet.searchParams.set("text", K.shareText);
    tweet.searchParams.set("url", siteUrl);
    if (K.hashtags) tweet.searchParams.set("hashtags", K.hashtags);
    $("tweet").href = tweet.toString();
    const file = new File([blob], "konomi.png", { type: "image/png" });
    if (matchMedia("(pointer: coarse)").matches && navigator.canShare && navigator.canShare({ files: [file] })) {
      $("tweet").onclick = async e => {
        e.preventDefault();
        try {
          // アプリによっては url を落とすので、文章の中にリンクとハッシュタグを入れておく
          const tags = (K.hashtags || "").split(",").map(s => s.trim()).filter(Boolean).map(s => "#" + s).join(" ");
          const text = [K.shareText, tags, siteUrl].filter(Boolean).join("\n");
          await navigator.share({ files: [file], text });
        } catch (err) {
          if (err.name !== "AbortError") showAlert(K.shareFailed);
        }
      };
    }

    // タップした位置のマスを選び直す（長押しで保存できるよう、画像の上には何も重ねない）
    $("out").onclick = e => {
      const rect = e.currentTarget.getBoundingClientRect();
      const { w, h } = tableSize();
      const px = ((e.clientX - rect.left) / rect.width) * w - PAD - LEFT;
      const py = ((e.clientY - rect.top) / rect.height) * h - PAD - HEAD;
      if (px < 0 || py < 0) return;
      const c = Math.floor(px / (CELL + GAP));
      const r = Math.floor(py / (CELL + ROW_GAP));
      if (c >= state.groups.length || r >= state.users.length) return;
      fromTable = true;
      goPick(r, c);
    };
  }

  render();
})();
