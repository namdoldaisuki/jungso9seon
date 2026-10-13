// ===== 設定（文言は texts.js で変更できます） =====
window.APP_CONFIG = {
  finalCount: 9,        // 最終的に選ぶ人数
  prelimGroupSize: 12,  // 予選の1グループの人数
  mainGroupSize: 12,    // 本選の1グループの人数
};

// 文言を取り出す小さな関数： t("introTitle", { n: 9 })
window.fill = (str, vars = {}) =>
  String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
window.t = (key, vars = {}) => window.fill(window.TEXTS[key] ?? key, vars);

// 確認の小窓。ブラウザの confirm()/alert() は X などのアプリ内ブラウザでは出ない
// （そのままキャンセル扱いになる）ことがあるので、ページの中に自前で表示する
window.showDialog = (message, { cancel = false } = {}) => new Promise(resolve => {
  if (document.querySelector(".dialog-backdrop")) return resolve(false); // 連打で2つ出ないように
  const T = window.TEXTS || {};
  const wrap = document.createElement("div");
  wrap.className = "dialog-backdrop";
  wrap.innerHTML = `<div class="dialog" role="dialog" aria-modal="true">
      <p class="dialog-msg"></p>
      <div class="dialog-btns">
        ${cancel ? `<button class="btn" data-v="0"></button>` : ""}
        <button class="btn primary" data-v="1"></button>
      </div>
    </div>`;
  wrap.querySelector(".dialog-msg").textContent = message;
  wrap.querySelector('[data-v="1"]').textContent = T.dialogOk || "OK";
  if (cancel) wrap.querySelector('[data-v="0"]').textContent = T.dialogCancel || "キャンセル";
  wrap.addEventListener("click", e => {
    const b = e.target.closest("[data-v]");
    if (!b) return;
    wrap.remove();
    resolve(b.dataset.v === "1");
  });
  document.body.appendChild(wrap);
});
window.showConfirm = message => window.showDialog(message, { cancel: true });
window.showAlert = message => window.showDialog(message);
