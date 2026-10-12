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
