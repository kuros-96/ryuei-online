// ========================================
// NUMBER CROSS
// app.js 完全版
// ========================================

let ws = null;
let me = 0;

let selectedThisRound = false;


// ========================================
// ID取得
// ========================================

function $(id) {
  return document.getElementById(id);
}


// ========================================
// WebSocket接続
// ========================================

function connect() {

  ws = new WebSocket(
    (location.protocol === "https:"
      ? "wss://"
      : "ws://") + location.host
  );


  ws.onopen = function () {

    const status = $("status");

    if (status) {
      status.textContent =
        "サーバー接続OK";
    }

  };


  ws.onclose = function () {

    const status = $("status");

    if (status) {
      status.textContent =
        "サーバーから切断されました";
    }

  };


  ws.onerror = function () {

    const status = $("status");

    if (status) {
      status.textContent =
        "サーバー接続エラー";
    }

  };


  ws.onmessage = function (event) {

    try {

      const data =
        JSON.parse(event.data);

      handle(data);

    } catch (error) {

      console.error(
        "データ処理エラー:",
        error
      );

    }

  };

}


// ========================================
// データ送信
// ========================================

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


// ========================================
// プレイヤー名
// ========================================

function playerName() {

  const name = $("name");

  if (!name) {
    return "PLAYER";
  }

  return (
    name.value.trim() ||
    "PLAYER"
  );

}


// ========================================
// 残り数字表示
// ========================================

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


  const display =
    $("remaining");

  if (display) {

    display.textContent =
      "残り数字：" +
      (9 - used) +
      "枚";

  }

}


// ========================================
// 数字ボタン生成
// ========================================

function createNumberButtons() {

  const container =
    $("buttons");


  if (!container) {

    console.error(
      "#buttons がありません"
    );

    return;

  }


  container.innerHTML = "";


  for (
    let n = 1;
    n <= 9;
    n++
  ) {

    const button =
      document.createElement("button");


    button.id =
      "n" + n;


    button.type =
      "button";


    button.textContent =
      n;


    // ==================================
    // 数字クリック
    // ==================================

    button.onclick = function () {


      // ------------------------------
      // すでにこのラウンドで選択済み
      // ------------------------------

      if (selectedThisRound) {

        return;

      }


      // ------------------------------
      // すでに使用済み
      // ------------------------------

      if (
        button.classList.contains("used")
      ) {

        return;

      }


      // ------------------------------
      // このラウンドの選択完了
      // ------------------------------

      selectedThisRound =
        true;


      // ==================================
      // ★★★ 青く光らせる ★★★
      // ==================================

      button.classList.add(
        "selected"
      );


      // ★★★ ここでは used を付けない ★★★


      // ==================================
      // サーバーへ送信
      // ==================================

      send({

        type: "move",

        number: n

      });


      // ==================================
      // メッセージ
      // ==================================

      const message =
        $("message");

      if (message) {

        message.textContent =
          "NUMBER " +
          n +
          " を選択";

      }


      // ==================================
      // 他のカードを一時ロック
      // ==================================

      for (
        let i = 1;
        i <= 9;
        i++
      ) {

        const other =
          $("n" + i);


        if (!other) {
          continue;
        }


        // 選択したカードもロック
        // 使用済みではない

        other.disabled =
          true;

      }

    };


    container.appendChild(
      button
    );

  }

}


// ========================================
// ★ ラウンド終了処理
// ========================================

function finishRound() {

  // ======================================
  // 選択されたカードを探す
  // ======================================

  for (
    let n = 1;
    n <= 9;
    n++
  ) {

    const button =
      $("n" + n);


    if (!button) {
      continue;
    }


    // ====================================
    // 今ラウンドで選択されたカード
    // ====================================

    if (
      button.classList.contains("selected")
    ) {

      // 青色を解除
      button.classList.remove(
        "selected"
      );


      // ★★★ ここで初めて used ★★★
      button.classList.add(
        "used"
      );


      // 使用済みなのでロック
      button.disabled =
        true;

    }

  }


  // ======================================
  // 次ラウンド開始
  // ======================================

  selectedThisRound =
    false;


  // ======================================
  // 未使用カードだけ使用可能
  // ======================================

  for (
    let n = 1;
    n <= 9;
    n++
  ) {

    const button =
      $("n" + n);


    if (!button) {
      continue;
    }


    if (
      button.classList.contains("used")
    ) {

      button.disabled =
        true;

    } else {

      button.disabled =
        false;

    }

  }


  updateRemaining();

}


// ========================================
// 爆発
// ========================================

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


    setTimeout(
      function () {

        particle.remove();

      },
      900
    );

  }

}


// ========================================
// 勝敗表示
// ========================================

function showResult(
  text,
  win
) {

  const overlay =
    $("battleOverlay");

  const battleText =
    $("battleText");


  if (
    !overlay ||
    !battleText
  ) {

    const message =
      $("message");

    if (message) {

      message.textContent =
        text;

    }

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


  setTimeout(
    function () {

      overlay.className =
        "battle-overlay";

    },
    1500
  );

}


// ========================================
// バトルアニメーション
// ========================================

function battleAnimation(
  p1,
  p2,
  result
) {

  const left =
    $("p1card");

  const right =
    $("p2card");


  if (
    !left ||
    !right
  ) {

    return;

  }


  // カード表示

  left.className =
    "card battle-card left-card";

  right.className =
    "card battle-card right-card";


  left.textContent =
    p1;

  right.textContent =
    p2;


  // 突進

  setTimeout(
    function () {

      left.classList.add(
        "attack-left"
      );

      right.classList.add(
        "attack-right"
      );

    },
    100
  );


  // 激突

  setTimeout(
    function () {

      left.classList.add(
        "impact"
      );

      right.classList.add(
        "impact"
      );


      explosion();

    },
    650
  );


  // 間

  setTimeout(
    function () {

      const message =
        $("message");

      if (message) {

        message.textContent =
          "……";

      }

    },
    1000
  );


  setTimeout(
    function () {

      const message =
        $("message");

      if (message) {

        message.textContent =
          "勝敗は……";

      }

    },
    1400
  );


  // 勝敗

  setTimeout(
    function () {

      const win =
        result ===
        (
          me === 1
            ? 1
            : -1
        );


      if (result === 1) {

        left.classList.add(
          "winner-card"
        );

        right.classList.add(
          "loser-card"
        );

      }


      if (result === -1) {

        right.classList.add(
          "winner-card"
        );

        left.classList.add(
          "loser-card"
        );

      }


      if (result === 0) {

        showResult(
          "DRAW!",
          false
        );


        const message =
          $("message");

        if (message) {

          message.textContent =
            "引き分け！";

        }

        return;

      }


      showResult(
        win
          ? "YOU WIN!"
          : "YOU LOSE!",
        win
      );


      const message =
        $("message");

      if (message) {

        message.textContent =
          win
            ? "あなたの勝ち！"
            : "あなたの負け…";

      }

    },
    1900
  );

}


// ========================================
// サーバーデータ処理
// ========================================

function handle(m) {

  if (!m) {
    return;
  }


  // ======================================
  // エラー
  // ======================================

  if (
    m.type === "error"
  ) {

    alert(
      m.message ||
      "エラーが発生しました"
    );

    return;

  }


  // ======================================
  // 参加成功
  // ======================================

  if (
    m.type === "joined"
  ) {

    me =
      m.player;


    const roomId =
      $("roomId");

    if (roomId) {

      roomId.textContent =
        m.roomId;

    }


    const lobby =
      $("lobby");

    const game =
      $("game");


    if (lobby) {

      lobby.classList.add(
        "hidden"
      );

    }


    if (game) {

      game.classList.remove(
        "hidden"
      );

    }


    // 新しいゲーム

    selectedThisRound =
      false;


    updateRemaining();


    const message =
      $("message");

    if (message) {

      message.textContent =
        me === 1
          ? "相手の参加を待っています…"
          : "ゲーム開始！";

    }


    return;

  }


  // ======================================
  // ゲーム状態
  // ======================================

  if (
    m.type === "state"
  ) {

    const round =
      $("round");

    if (round) {

      round.textContent =
        m.round;

    }


    const scores =
      $("scores");

    if (scores) {

      scores.textContent =
        m.p1Score +
        " - " +
        m.p2Score;

    }


    const p1state =
      $("p1state");

    if (p1state) {

      p1state.textContent =
        m.p1Connected
          ? "接続中"
          : "待機中";

    }


    const p2state =
      $("p2state");

    if (p2state) {

      p2state.textContent =
        m.p2Connected
          ? "接続中"
          : "待機中";

    }


    if (
      m.status === "playing" &&
      !selectedThisRound
    ) {

      const message =
        $("message");

      if (message) {

        message.textContent =
          "数字を1枚選んでください";

      }

    }


    return;

  }


  // ======================================
  // 待機
  // ======================================

  if (
    m.type === "waiting"
  ) {

    const message =
      $("message");

    if (message) {

      message.textContent =
        "相手の選択を待っています…";

    }

    return;

  }


  // ======================================
  // ラウンド結果
  // ======================================

  if (
    m.type === "roundResult"
  ) {

    battleAnimation(
      m.p1,
      m.p2,
      m.result
    );


    // ==================================
    // ★ バトル終了後に使用済みにする
    // ==================================

    setTimeout(
      function () {

        finishRound();


        // カードを隠す

        const p1card =
          $("p1card");

        const p2card =
          $("p2card");


        if (p1card) {

          p1card.className =
            "card hidden";

          p1card.textContent =
            "？";

        }


        if (p2card) {

          p2card.className =
            "card hidden";

          p2card.textContent =
            "？";

        }

      },
      2800
    );


    return;

  }


  // ======================================
  // ゲーム終了
  // ======================================

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


    const message =
      $("message");

    if (message) {

      message.textContent =

        m.winner === 0
          ? "引き分け！"
          : win
            ? "あなたの勝利！"
            : "あなたの敗北…";

    }


    return;

  }


  // ======================================
  // 相手退出
  // ======================================

  if (
    m.type === "opponentLeft"
  ) {

    const message =
      $("message");

    if (message) {

      message.textContent =
        "相手が退出しました。";

    }

  }

}


// ========================================
// ページ読み込み完了
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    // 数字ボタン作成
    createNumberButtons();


    // ルーム作成

    const create =
      $("create");

    if (create) {

      create.onclick =
        function () {

          send({

            type: "create",

            name:
              playerName()

          });

        };

    }


    // ルーム参加

    const join =
      $("join");

    if (join) {

      join.onclick =
        function () {

          const room =
            $("room");


          send({

            type: "join",

            roomId:
              room
                ? room.value.trim()
                : "",

            name:
              playerName()

          });

        };

    }


    // 戻る

    const back =
      $("back");

    if (back) {

      back.onclick =
        function () {

          location.reload();

        };

    }


    // WebSocket開始

    connect();

  }
);
