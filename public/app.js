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
    ws.readyState === 1
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

    roomId:
      $("room").value.trim(),

    name:
      playerName()

  });
};


// ==========================
// ロビーへ戻る
// ==========================

$("back").onclick = () => {

  location.reload();
};


// ==========================
// 残り数字
// ==========================

function updateRemaining() {

  let used = 0;


  for (
    let n = 1;
    n <= 9;
    n++
  ) {

    const button =
      $("n" + n);


    if (
      button &&
      button.classList.contains("used")
    ) {

      used++;
    }
  }


  const remaining =
    9 - used;


  const display =
    $("remaining");


  if (display) {

    display.textContent =
      "残り数字：" +
      remaining +
      "枚";
  }
}


// ==========================
// このラウンドの選択状態
// ==========================

let selectedThisRound = false;


// ==========================
// 数字ボタン生成
// ==========================

for (
  let n = 1;
  n <= 9;
  n++
) {

  const button =
    document.createElement("button");


  button.textContent = n;

  button.id = "n" + n;


  button.onclick = () => {


    // --------------------------
    // すでに選択済み
    // --------------------------

    if (selectedThisRound) {

      return;
    }


    // --------------------------
    // 選択状態
    // --------------------------

    selectedThisRound = true;


    // ★ 今回選んだカードを青くする

    button.classList.add(
      "selected"
    );


    // 使用済みにする

    button.classList.add(
      "used"
    );


    // --------------------------
    // サーバーへ送信
    // --------------------------

    send({

      type: "move",

      number: n

    });


    updateRemaining();


    $("message").textContent =
      "NUMBER " +
      n +
      " を選択";


    // --------------------------
    // 他の数字をロック
    // --------------------------

    for (
      let i = 1;
      i <= 9;
      i++
    ) {

      const otherButton =
        $("n" + i);


      if (otherButton) {

        otherButton.disabled =
          true;
      }
    }
  };


  $("buttons").appendChild(
    button
  );
}


// ==========================
// 爆発エフェクト
// ==========================

function explosion() {

  for (
    let i = 0;
    i < 30;
    i++
  ) {

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
      (Math.random() * 400 - 200)
      + "px"
    );


    particle.style.setProperty(
      "--y",
      (Math.random() * 300 - 150)
      + "px"
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

function showResult(
  text,
  win
) {

  const overlay =
    $("battleOverlay");


  if (!overlay) {

    $("message")
      .textContent = text;

    return;
  }


  const battleText =
    $("battleText");


  if (!battleText) {

    $("message")
      .textContent = text;

    return;
  }


  battleText.textContent =
    text;


  overlay.className =
    "battle-overlay show " +
    (win
      ? "victory"
      : "defeat");


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


  // --------------------------
  // カード表示
  // --------------------------

  left.className =
    "card battle-card left-card";


  right.className =
    "card battle-card right-card";


  left.textContent =
    p1;

  right.textContent =
    p2;


  // --------------------------
  // 突進
  // --------------------------

  setTimeout(() => {

    left.classList.add(
      "attack-left"
    );

    right.classList.add(
      "attack-right"
    );

  }, 100);


  // --------------------------
  // 激突
  // --------------------------

  setTimeout(() => {

    left.classList.add(
      "impact"
    );

    right.classList.add(
      "impact"
    );


    explosion();

  }, 650);


  // --------------------------
  // 間
  // --------------------------

  setTimeout(() => {

    $("message").textContent =
      "……";

  }, 1000);


  setTimeout(() => {

    $("message").textContent =
      "勝敗は……";

  }, 1400);


  // --------------------------
  // 勝敗
  // --------------------------

  setTimeout(() => {

    const win =
      result ===
      (me === 1 ? 1 : -1);


    // --------------------------
    // 勝者
    // --------------------------

    if (result === 1) {

      left.classList.add(
        "winner-card"
      );

      right.classList.add(
        "loser-card"
      );

    }


    // --------------------------
    // 敗者
    // --------------------------

    else if (result === -1) {

      right.classList.add(
        "winner-card"
      );

      left.classList.add(
        "loser-card"
      );

    }


    // --------------------------
    // 引き分け
    // --------------------------

    if (result === 0) {

      showResult(
        "DRAW!",
        false
      );


      $("message").textContent =
        "引き分け！";

      return;
    }


    // --------------------------
    // 結果
    // --------------------------

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
// サーバーからのデータ
// ==========================

function handle(m) {


  // ==========================
  // エラー
  // ==========================

  if (
    m.type === "error"
  ) {

    alert(m.message);

    return;
  }


  // ==========================
  // 参加成功
  // ==========================

  if (
    m.type === "joined"
  ) {

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


    updateRemaining();


    $("message").textContent =
      me === 1
        ? "相手の参加を待っています…"
        : "ゲーム開始！";


    return;
  }


  // ==========================
  // ゲーム状態
  // ==========================

  if (
    m.type === "state"
  ) {

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

      $("message").textContent =
        "数字を1枚選んでください";
    }


    return;
  }


  // ==========================
  // 待機
  // ==========================

  if (
    m.type === "waiting"
  ) {

    $("message").textContent =
      "相手の選択を待っています…";

    return;
  }


  // ==========================
  // ラウンド結果
  // ==========================

  if (
    m.type === "roundResult"
  ) {

    battleAnimation(
      m.p1,
      m.p2,
      m.result
    );


    setTimeout(() => {


      // --------------------------
      // 次ラウンド
      // --------------------------

      selectedThisRound =
        false;


      for (
        let n = 1;
        n <= 9;
        n++
      ) {

        const button =
          $("n" + n);


        if (button) {


          // ★ 青色を解除

          button.classList.remove(
            "selected"
          );


          // --------------------------
          // 使用済みはロック
          // --------------------------

          button.disabled =
            button.classList.contains(
              "used"
            );
        }
      }


      // --------------------------
      // バトルカードを隠す
      // --------------------------

      $("p1card").className =
        "card hidden";


      $("p2card").className =
        "card hidden";


    }, 2800);


    return;
  }


  // ==========================
  // ゲーム終了
  // ==========================

  if (
    m.type === "gameOver"
  ) {

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


  // ==========================
  // 相手退出
  // ==========================

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
