(async () => {
  const byNo = new Map((window.ROSTER || []).map(p => [p.no, p]));
  const TILE = 400; // 1マスの大きさ(px)。全体は 1200×1200
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

  const ids = (new URLSearchParams(location.search).get("ids") || "")
    .split(",").map(Number).filter(n => byNo.has(n)).slice(0, 9);
  if (!ids.length) {
    $("status").textContent = T.collageNoData;
    return;
  }

  const loadImage = src => new Promise(resolve => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = TILE * 3;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const images = await Promise.all(ids.map(no => loadImage(byNo.get(no).img)));
  images.forEach((img, i) => {
    const x = (i % 3) * TILE, y = Math.floor(i / 3) * TILE;
    if (!img) {
      ctx.fillStyle = "#d9d4cf";
      ctx.fillRect(x, y, TILE, TILE);
      return;
    }
    // 正方形でない画像も中央を切り抜いて埋める
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, x, y, TILE, TILE);
  });

  const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.92));
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

  const tweet = new URL("https://twitter.com/intent/tweet");
  tweet.searchParams.set("text", T.shareText);
  if (T.hashtags) tweet.searchParams.set("hashtags", T.hashtags);
  $("tweet").href = tweet.toString();

  // スマホなどでは、画像付きでXなどのアプリに渡せる
  const file = new File([blob], "oshi9.jpg", { type: "image/jpeg" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    $("share").hidden = false;
    $("share").onclick = async () => {
      try {
        await navigator.share({ files: [file], text: T.shareText });
      } catch (e) {
        if (e.name !== "AbortError") alert(T.shareFailed);
      }
    };
  }
})();
