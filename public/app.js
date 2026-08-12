let ws;
let me = 0;

const $ = id => document.getElementById(id);

// ==========================
// WebSocket接続
// ==========================

function connect() {

  ws = new WebSocket(
    (location.protocol === "https:"
      ? "wss://"
      : "ws://") + location.host
  );

  ws.onopen = () => {

    $("status").textContent =
      "サーバー接続OK";

  };

  ws.onclose = () => {

    $("status").textContent =
      "サーバーから切断されました";

  };

  ws.onmessage = e => {

    handle(JSON.parse(e.data));

  };
}

// ==========================
// データ送信
// ==========================

function send(data) {

  if (
    ws &&
    ws.readyState === WebSocket.OPEN
  ) {

    ws.send(
      JSON.stringify(data)
    );

  }
}

// ==========================
// プレイヤー名
// ==========================

function playerName() {

  return (
    $("name").value.trim()
    || "PLAYER"
  );

}

// ==========================
// ルーム作成
// ==========================

$("create").onclick = () => {

  send({
    type: "create",
    name: playerName()
  });

};

// ==========================
// ルーム参加
// ==========================

$("join").onclick = () => {

  send({
    type: "join",
    roomId: $("room").value.trim(),
    name: playerName()
  });

};

// ==========================
// ロビーへ戻る
// ==========================

$("back").onclick = () => {

  location.reload();

};

// ==========================
// 残り数字を表示
// ==========================

function updateRemaining() {

  let used = 0;

  for (let n = 1; n <= 9; n++) {

    const button = $("n" + n);

    if (
      button &&
      button.classList.contains("used")
    ) {

      used++;

    }

  }

  const remaining = 9 - used;

  const display = $("remaining");

  if (display) {

    display.textContent =
      "残り数字：" +
      remaining +
      "枚";

  }

}

// ==========================
// このラウンドで選択済みか
// ==========================

let selectedThisRound = false;

// ==========================
// 数字ボタン生成
// ==========================

for (let n = 1; n <= 9; n++) {

  const button =
    document.createElement("button");

  button.textContent = n;

  button.id = "n" + n;

  // ========================
  // 数字クリック
  // ========================

  button.onclick = () => {

    // ------------------------
    // すでにこのラウンドで
    // 選択済みなら何もしない
    // ------------------------

    if (selectedThisRound) {
      return;
    }

    // ------------------------
    // 使用済みなら何もしない
    // ------------------------

    if (button.classList.contains("used")) {
      return;
    }

    // ------------------------
    // このラウンドの選択済み
    // ------------------------

    selectedThisRound = true;

    // ------------------------
    // ★ 選んだカードを青くする
    // ------------------------

    button.classList.add("selected");

    // ------------------------
    // サーバーへ送信
    // ------------------------

    send({
      type: "move",
      number: n
    });

    // ------------------------
    // 残り数字表示
    // ------------------------

    updateRemaining();

    // ------------------------
    // メッセージ
    // ------------------------

    $("message").textContent =
      "NUMBER " +
      n +
      " を選択";

    // ------------------------
    // 他の数字を一時的に
    // 押せなくする
    // ------------------------

    for (let i = 1; i <= 9; i++) {

      const otherButton =
        $("n" + i);

      if (otherButton) {

        // 選んだ数字以外をロック
        if (otherButton !== button) {

          otherButton.disabled = true;

        }

      }

    }

  };

  $("buttons").appendChild(button);

}

// ==========================
// 爆発エフェクト
// ==========================

function explosion() {

  for (let i = 0; i < 30; i++) {

    const particle =
      document.createElement("div");

    particle.className =
      "particle";

    particle.style.left =
      "50%";

    particle.style.top =
      "50%";

    particle.style.setProperty(
      "--x",
      (Math.random() * 400 - 200) +
      "px"
    );

    particle.style.setProperty(
      "--y",
      (Math.random() * 300 - 150) +
      "px"
    );

    document.body.appendChild(
      particle
    );

    setTimeout(() => {

      particle.remove();

    }, 800);

  }

}

// ==========================
// 勝敗表示
// ==========================

function showResult(text, win) {

  const overlay =
    $("battleOverlay");

  if (!overlay) {

    $("message").textContent =
      text;

    return;

  }

  const battleText =
    $("battleText");

  if (!battleText) {

    $("message").textContent =
      text;

    return;

  }

  battleText.textContent =
    text;

  overlay.className =
    "battle-overlay show " +
    (
      win
        ? "victory"
        : "defeat"
    );

  setTimeout(() => {

    overlay.className =
      "battle-overlay";

  }, 1200);

}

// ==========================
// バトル演出
// ==========================

function battleAnimation(
  p1,
  p2,
  result
) {

  const left =
    $("p1card");

  const right =
    $("p2card");

  // ------------------------
  // カード表示
  // ------------------------

  left.className =
    "card battle-card left-card";

  right.className =
    "card battle-card right-card";

  left.textContent =
    p1;

  right.textContent =
    p2;

  // ------------------------
  // 突進
  // ------------------------

  setTimeout(() => {

    left.classList.add(
      "attack-left"
    );

    right.classList.add(
      "attack-right"
    );

  }, 100);

  // ------------------------
  // 激突
  // ------------------------

  setTimeout(() => {

    left.classList.add(
      "impact"
    );

    right.classList.add(
      "impact"
    );

    explosion();

  }, 650);

  // ------------------------
  // 間
  // ------------------------

  setTimeout(() => {

    $("message").textContent =
      "……";

  }, 1000);

  setTimeout(() => {

    $("message").textContent =
      "勝敗は……";

  }, 1400);

  // ------------------------
  // 勝敗
  // ------------------------

  setTimeout(() => {

    const win =
      result ===
      (
        me === 1
          ? 1
          : -1
      );

    // ----------------------
    // プレイヤー1勝利
    // ----------------------

    if (result === 1) {

      left.classList.add(
        "winner-card"
      );

      right.classList.add(
        "loser-card"
      );

    }

    // ----------------------
    // プレイヤー2勝利
    // ----------------------

    else if (result === -1) {

      right.classList.add(
        "winner-card"
      );

      left.classList.add(
        "loser-card"
      );

    }

    // ----------------------
    // 引き分け
    // ----------------------

    if (result === 0) {

      showResult(
        "DRAW!",
        false
      );

      $("message").textContent =
        "引き分け！";

      return;

    }

    // ----------------------
    // 結果表示
    // ----------------------

    showResult(
      win
        ? "YOU WIN!"
        : "YOU LOSE!",
      win
    );

    $("message").textContent =
      win
        ? "あなたの勝ち！"
        : "あなたの負け…";

  }, 1900);

}

// ==========================
// サーバーからのデータ処理
// ==========================

function handle(m) {

  // ========================
  // エラー
  // ========================

  if (m.type === "error") {

    alert(m.message);

    return;

  }

  // ========================
  // 参加成功
  // ========================

  if (m.type === "joined") {

    me =
      m.player;

    $("roomId").textContent =
      m.roomId;

    $("lobby")
      .classList
      .add("hidden");

    $("game")
      .classList
      .remove("hidden");

    // ----------------------
    // 新しいゲームなので
    // ボタン状態をリセット
    // ----------------------

    selectedThisRound = false;

    for (let n = 1; n <= 9; n++) {

      const button =
        $("n" + n);

      if (button) {

        button.classList.remove(
          "selected"
        );

        button.classList.remove(
          "used"
        );

        button.disabled = false;

      }

    }

    updateRemaining();

    $("message").textContent =
      me === 1
        ? "相手の参加を待っています…"
        : "ゲーム開始！";

    return;

  }

  // ========================
  // ゲーム状態
  // ========================

  if (m.type === "state") {

    $("round").textContent =
      m.round;

    $("scores").textContent =
      m.p1Score +
      " - " +
      m.p2Score;

    $("p1state").textContent =
      m.p1Connected
        ? "接続中"
        : "待機中";

    $("p2state").textContent =
      m.p2Connected
        ? "接続中"
        : "待機中";

    if (
      m.status === "playing"
    ) {

      // まだ選んでいない場合だけ
      // 選択メッセージを表示

      if (!selectedThisRound) {

        $("message").textContent =
          "数字を1枚選んでください";

      }

    }

    return;

  }

  // ========================
  // 待機
  // ========================

  if (m.type === "waiting") {

    $("message").textContent =
      "相手の選択を待っています…";

    return;

  }

  // ========================
  // ラウンド結果
  // ========================

  if (m.type === "roundResult") {

    battleAnimation(
      m.p1,
      m.p2,
      m.result
    );

    // ----------------------
    // バトル演出終了後
    // 次ラウンドへ
    // ----------------------

    setTimeout(() => {

      // --------------------
      // 選択状態をリセット
      // --------------------

      selectedThisRound = false;

      // --------------------
      // ボタン状態
      // --------------------

      for (let n = 1; n <= 9; n++) {

        const button =
          $("n" + n);

        if (button) {

          // ----------------
          // ★ 今回選んだ数字
          // 使用済みにする
          // ----------------

          if (
            button.classList.contains(
              "selected"
            )
          ) {

            button.classList.remove(
              "selected"
            );

            button.classList.add(
              "used"
            );

          }

          // ----------------
          // 使用済みはロック
          // 未使用は次ラウンドで
          // 選択可能
          // ----------------

          button.disabled =
            button.classList.contains(
              "used"
            );

        }

      }

      // --------------------
      // 残り数字を更新
      // --------------------

      updateRemaining();

      // --------------------
      // バトルカードを隠す
      // --------------------

      $("p1card").className =
        "card hidden";

      $("p2card").className =
        "card hidden";

    }, 2800);

    return;

  }

  // ========================
  // ゲーム終了
  // ========================

  if (m.type === "gameOver") {

    const win =
      m.winner === me;

    showResult(

      m.winner === 0
        ? "DRAW"
        : win
          ? "VICTORY!"
          : "DEFEAT",

      win

    );

    $("message").textContent =

      m.winner === 0
        ? "引き分け！"
        : win
          ? "あなたの勝利！"
          : "あなたの敗北…";

    return;

  }

  // ========================
  // 相手退出
  // ========================

  if (
    m.type === "opponentLeft"
  ) {

    $("message").textContent =
      "相手が退出しました。";

    return;

  }

}

// ==========================
// 起動
// ==========================

connect();
