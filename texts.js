// =====================================================
//  画面に出る文言は、すべてこのファイルで変更できます
// =====================================================
//  ・" " で囲まれた中の文字だけを書き換えてください
//  ・{n} {count} などの { } の部分は、自動で数字や名前に置き換わります（消さないでください）
//  ・<b>…</b> は太字、<br> は改行です
//  ・\n は確認ダイアログ（OK/キャンセルの小窓）の中での改行です
window.TEXTS = {
  // ----- サイト全体 -----
  title: "中小ナムドル好き顔9選",                    // サイトのタイトル
  shareText: "中小ナムドル好き顔9選",                   // ツイートの文章
  hashtags: "中小ナムドル好き顔9選",                                 // ハッシュタグ（#なし・カンマ区切り）例: "推し9選,ランキング"

  // ----- トップ画面（遊び方を選ぶ） -----
  topLead: "{total}人の中から、あなたの好き顔を選ぼう",   // いらなければ "" にする
  quickModeLabel: "忙しい人向け",
  quickModeDesc: "{n}人以下に絞ってから2択で順位を決めます（2択は最大20問ほど）",
  longModeLabel: "時間がある人向け",
  longModeDesc: "選んだ人全員を2択でランキング。9・16・25選の画像が作れます",
  topStartButton: "始める",
  topResumeNote: "途中から再開できます",
  backButton: "← 戻る",

  // ----- 説明ページ（忙しい人向け） -----
  introTitle: "{total}人から好き顔{n}人を選ぼう",
  introSteps: [
    "<b>Step1</b>：気になる人をタップ（何人でもOK・スキップOK）",
    "<b>Step2</b>：残った人の中から、{n}人以下になるまで絞り込む",
    "<b>step3</b>：2人の中から好きな顔を選ぶ",
  ],
  introNote: "途中で閉じても、このブラウザで開けば続きから再開できます。<br>グループによっては脱退メンバーを含む場合があります。自己責任で遊んでください。",
  startButton: "はじめる",
  resumeTitle: "前回の続きがあります",
  resumeButton: "続きから",
  restartButton: "最初からやり直す",
  restartConfirm: "今までの選択を消して、最初からやり直しますか？",

  // ----- 予選・本選 -----
  prelimName: "Step1",
  mainName: "Step2 第{round}回目",
  prelimIntro: "{total}人を{groups}グループに分けて、1グループずつ表示します。<br>気になる人をタップして「次へ」で進んでください。何人選んでも、0人でもOKです。",
  mainIntro: "残りは <b>{total}人</b>。<br><b>{n}人以下</b>になるまで絞り込みます。",
  mainIntroNote: "このラウンドで選んだ人が{n}人以下なら決勝へ。まだ多ければ、選んだ人でもう1ラウンド行います。",
  roundStartButton: "スタート",
  prelimHint: "好き顔をタップ（何人でもOK・スキップOK）",
  mainHint: "{n}人以下に絞り込もう",
  groupHeading: "グループ {i} / {groups}",
  prelimCount: "選択中 {count}人",
  mainCount: "選択中 {count}人 / 目標{n}人以下",
  prevButton: "← 前へ",
  nextButton: "次へ →",
  prelimFinishButton: "Step1を終える",
  mainFinishButton: "OK",
  noneSelectedAlert: "1人以上選んでください。",
  allSelectedAlert: "全員選ばれています。{n}人以下にするため、少なくとも1人は外してください。",
  toFinalConfirm: "{round}の通過者は {count}人です。Step3へ進みます。\nよろしいですか？",
  toNextRoundConfirm: "{round}の通過者は {count}人です。Step2 第{next}回目へ進みます。\nよろしいですか？",

  // ----- 決勝 -----
  finalIntroTitle: "Step3進出 {count}人！",
  finalIntroText: "2人ずつ表示されるので、<b>より好きな顔</b>をタップしてください。",
  finalIntroNote: "最大{max}問で順位が決まります。間違えたら「ひとつ戻る」でやり直せます。",
  finalStartButton: "Step3スタート",
  finalQuestionTitle: "Step3　第{q}問",
  finalQuestionSub: "（最大{max}問）どっちが好き？",
  undoButton: "ひとつ戻る",

  // ----- 順位の調整 -----
  adjustTitle: "順位が決まりました",
  adjustNote: "入れ替えたいときは ↑↓ で調整できます。",
  redoFinalButton: "2択をやり直す",
  decideButton: "この順位で決定",

  // ----- 結果 -----
  resultTitle: "中小好き顔{n}選",
  resultRank: "{rank}位",
  collageLink: "保存・シェア用",
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

  // ----- 時間がある人向け（2択ランキングモード）の説明ページと画面 -----
  // ここにない文言は、上の9選と同じものが使われます
  rankMode: {
    introTitle: "選んだ人を2択でランキングしよう",
    introSteps: [
      "<b>Step1</b>：気になる人をタップ（何人でもOK・スキップOK）",
      "<b>Step2</b>：選んだ人を2人ずつ比べて、好きな顔を選ぶと順位が決まります",
      "<b>結果</b>：上位9人を3×3で発表！保存用の画像は9・16・25選から選べます",
    ],
    introNote: "選んだ人数が多いほど2択の問題数が増えます（25人で最大約95問、50人で最大約240問）。",
    prelimHint: "ランキングに入れたい人をタップ（何人でもOK・スキップOK）",
    toFinalConfirm: "{count}人を選びました。Step2の2択で順位を決めます（最大{max}問）。\nよろしいですか？",
    finalIntroTitle: "{count}人の順位を決めよう！",
    finalStartButton: "Step2スタート",
    finalQuestionTitle: "Step2　第{q}問",
    resultTitle: "わたしの好き顔ランキング",
    collageLink: "{n}選の画像を開く",
  },
};
