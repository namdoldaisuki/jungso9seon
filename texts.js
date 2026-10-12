// =====================================================
//  画面に出る文言は、すべてこのファイルで変更できます
// =====================================================
//  ・" " で囲まれた中の文字だけを書き換えてください
//  ・{n} {count} などの { } の部分は、自動で数字や名前に置き換わります（消さないでください）
//  ・<b>…</b> は太字、<br> は改行です
//  ・\n は確認ダイアログ（OK/キャンセルの小窓）の中での改行です
window.TEXTS = {
  // ----- サイト全体 -----
  title: "推し9選メーカー",                    // サイトのタイトル
  shareText: "私の推し9選！",                   // ツイートの文章
  hashtags: "",                                 // ハッシュタグ（#なし・カンマ区切り）例: "推し9選,ランキング"

  // ----- トップ画面 -----
  introTitle: "{total}人から推し{n}人を選ぼう",
  introSteps: [
    "<b>予選</b>：気になる人をタップ（何人でも・0人でもOK）",
    "<b>本選</b>：残った人の中から、{n}人以下になるまで絞り込み",
    "<b>決勝</b>：2人ずつ比べて「どっちが上？」を選ぶと順位が決まります",
    "<b>結果</b>：3×3の画像で発表！保存・シェア用のコラージュも作れます",
  ],
  introNote: "途中で閉じても、このブラウザで開けば続きから再開できます。",
  startButton: "はじめる",
  resumeTitle: "前回の続きがあります",
  resumeButton: "続きから",
  restartButton: "最初からやり直す",
  restartConfirm: "今までの選択を消して、最初からやり直しますか？",

  // ----- 予選・本選 -----
  prelimName: "予選",
  mainName: "本選 第{round}ラウンド",
  prelimIntro: "{total}人を{groups}グループに分けて、1グループずつ表示します。<br>気になる人をタップして「次へ」で進んでください。何人選んでも、0人でもOKです。",
  mainIntro: "残りは <b>{total}人</b>。<br><b>{n}人以下</b>になるまで絞り込みます。",
  mainIntroNote: "このラウンドで選んだ人が{n}人以下なら決勝へ。まだ多ければ、選んだ人でもう1ラウンド行います。",
  roundStartButton: "スタート",
  prelimHint: "気になる人をタップ（何人でも・0人でもOK）",
  mainHint: "{n}人以下に絞り込もう",
  groupHeading: "グループ {i} / {groups}",
  prelimCount: "選択中 {count}人",
  mainCount: "選択中 {count}人 / 目標{n}人以下",
  prevButton: "← 前へ",
  nextButton: "次へ →",
  prelimFinishButton: "予選を終える",
  mainFinishButton: "ラウンドを終える",
  noneSelectedAlert: "1人以上選んでください。",
  allSelectedAlert: "全員選ばれています。{n}人以下にするため、少なくとも1人は外してください。",
  toFinalConfirm: "{round}の通過者は {count}人です。決勝へ進みます。\nよろしいですか？",
  toNextRoundConfirm: "{round}の通過者は {count}人です。本選 第{next}ラウンドへ進みます。\nよろしいですか？",

  // ----- 決勝 -----
  finalIntroTitle: "決勝進出 {count}人！",
  finalIntroText: "2人ずつ表示されるので、<b>上の順位にしたい方</b>をタップしてください。",
  finalIntroNote: "最大{max}問で順位が決まります。間違えたら「ひとつ戻る」でやり直せます。",
  finalStartButton: "決勝スタート",
  finalQuestionTitle: "決勝　第{q}問",
  finalQuestionSub: "（最大{max}問）どっちが上？",
  undoButton: "ひとつ戻る",

  // ----- 順位の調整 -----
  adjustTitle: "順位が決まりました",
  adjustNote: "入れ替えたいときは ↑↓ で調整できます。",
  redoFinalButton: "2択をやり直す",
  decideButton: "この順位で決定",

  // ----- 結果 -----
  resultTitle: "わたしの推し{n}選",
  resultRank: "{rank}位",
  collageLink: "コラージュ画像を開く（保存・シェア用）",
  adjustButton: "順位を調整する",
  resultRestartConfirm: "結果を消して、最初からやり直しますか？",

  // ----- コラージュ画像のページ -----
  collageMaking: "画像を作成中…",
  collageNoData: "表示する人がいません。結果ページからもう一度開いてください。",
  collageFailed: "画像の作成に失敗しました。",
  shareButton: "画像をシェアする",
  saveButton: "画像を保存",
  tweetButton: "Xで投稿する",
  collageNote: "スマホは画像を長押しでも保存できます。<br>「Xで投稿する」では画像は自動で付かないので、保存した画像を添付してください。",
  shareFailed: "シェアできませんでした。画像を保存してから投稿してください。",
};
