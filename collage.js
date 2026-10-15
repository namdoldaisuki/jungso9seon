(async () => {
  const byNo = new Map((window.ROSTER || []).map(p => [p.no, p]));
  const params = new URLSearchParams(location.search);
  // size=3/4/5 で 3×3・4×4・5×5（9・16・25選）。全体はいつも 1200×1200
  const SIZE = Math.min(5, Math.max(3, Number(params.get("size")) || 3));
  const TILE = 1200 / SIZE;
  const $ = id => document.getElementById(id);

  const T = window.TEXTS;
  document.title = T.title;
  $("appTitle").textContent = T.title;
  $("out").alt = T.title;
  $("status").textContent = T.collageMaking;
  $("share").textContent = T.shareButton;
  $("download").textContent = T.saveButton;
  $("tweet").textContent = T.tweetButton;
  $("note").innerHTML = T.collageNote;

  const ids = (params.get("ids") || "")
    .split(",").map(Number).filter(n => byNo.has(n)).slice(0, SIZE * SIZE);
  if (!ids.length) {
    $("status").textContent = T.collageNoData;
    return;
  }

  const loadImage = src => new Promise(resolve => {
    if (!src) return resolve(null);
    const img = new Image();
    // 写真が別の場所から来ても（下書きのプレビューなど）画像を作れるようにする
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = TILE * SIZE;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const images = await Promise.all(ids.map(no => loadImage(byNo.get(no).img)));
  images.forEach((img, i) => {
    const x = (i % SIZE) * TILE, y = Math.floor(i / SIZE) * TILE;
    if (!img) {
      ctx.fillStyle = "#d9d4cf";
      ctx.fillRect(x, y, TILE, TILE);
      return;
    }
    // 正方形でない画像も中央を切り抜いて埋める
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, x, y, TILE, TILE);
  });

  let blob = null;
  try {
    blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.92));
  } catch (e) {} // 作れなかったときは下の「失敗しました」を出す
  if (!blob) {
    $("status").textContent = T.collageFailed;
    return;
  }
  const url = URL.createObjectURL(blob);
  $("out").src = url;
  $("out").hidden = false;
  $("download").href = url;
  $("status").hidden = true;
  $("actions").hidden = false;
  $("note").hidden = false;

  // サイトのトップページのURL（ツイートに付けるリンク）
  const siteUrl = new URL("./", location.href).href;
  const tweet = new URL("https://twitter.com/intent/tweet");
  tweet.searchParams.set("text", T.shareText);
  tweet.searchParams.set("url", siteUrl);
  if (T.hashtags) tweet.searchParams.set("hashtags", T.hashtags);
  $("tweet").href = tweet.toString();

  // スマホなどでは、画像付きでXなどのアプリに渡せる
  const file = new File([blob], "oshi9.jpg", { type: "image/jpeg" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    $("share").hidden = false;
    $("share").onclick = async () => {
      try {
        // アプリによっては url を落とすので、文章の中にリンクとハッシュタグを入れておく
        const tags = (T.hashtags || "").split(",").map(s => s.trim()).filter(Boolean).map(s => "#" + s).join(" ");
        const text = [T.shareText, tags, siteUrl].filter(Boolean).join("\n");
        await navigator.share({ files: [file], text });
      } catch (e) {
        if (e.name !== "AbortError") showAlert(T.shareFailed);
      }
    };
  }
})();
