let ws = null;
let me = 0;

const $ = id => document.getElementById(id);


// ========================================
// WebSocket接続
// ========================================

function connect() {

  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  ws = new WebSocket(
    protocol + "//" + location.host
  );


  ws.onopen = () => {

    const status = $("status");

    if (status) {
      status.textContent =
        "サーバー接続OK";
    }
  };


  ws.onclose = () => {

    const status = $("status");

    if (status) {
      status.textContent =
        "サーバーから切断されました";
    }
  };


  ws.onerror = () => {

    const status = $("status");

    if (status) {
      status.textContent =
        "サーバー接続エラー";
    }
  };


  ws.onmessage = event => {

    try {

      const message =
        JSON.parse(event.data);

      handle(message);

    } catch (error) {

      console.error(
        "受信データエラー:",
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

  const input = $("name");

  if (!input) {
    return "PLAYER";
  }

  return (
    input.value.trim() ||
    "PLAYER"
  );
}


// ========================================
// ルーム作成
// ========================================

function createRoom() {

  send({

    type: "create",

    name:
      playerName()
  });
}


// ========================================
// ルーム参加
// ========================================

function joinRoom() {

  const roomInput =
    $("room");

  send({

    type: "join",

    roomId:
      roomInput
        ? roomInput.value.trim()
        : "",

    name:
      playerName()
  });
}


// ========================================
// ロビーへ戻る
// ========================================

function backToLobby() {

  location.reload();
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


// ========================================
// ラウンド選択状態
// ========================================

let selectedThisRound =
  false;


// ========================================
// 数字ボタン生成
// ========================================

function createNumberButtons() {

  const container =
    $("buttons");


  if (!container) {
    return;
  }


  // 二重生成防止
  container.innerHTML = "";


  for (
    let n = 1;
    n <= 9;
    n++
  ) {

    const button =
      document.createElement(
        "button"
      );


    button.textContent = n;

    button.id =
      "n" + n;


    button.type =
      "button";


    button.onclick = () => {

      // --------------------------------
      // すでに選択済み
      // --------------------------------

      if (
        selectedThisRound
      ) {

        return;
      }


      // --------------------------------
      // 使用済みなら選択不可
      // --------------------------------

      if (
        button.classList.contains(
          "used"
        )
      ) {

        return;
      }


      // --------------------------------
      // このラウンドの選択状態
      // --------------------------------

      selectedThisRound =
        true;


      // --------------------------------
      // ★ 選択中は青く光る
      // --------------------------------

      button.classList.add(
        "selected"
      );


      // --------------------------------
      // サーバーへ送信
      // --------------------------------

      send({

        type: "move",

        number: n
      });


      // --------------------------------
      // メッセージ
      // --------------------------------

      const message =
        $("message");


      if (message) {

        message.textContent =
          "NUMBER " +
          n +
          " を選択";
      }


      // --------------------------------
      // 他の数字をロック
      // --------------------------------

      for (
        let i = 1;
        i <= 9;
        i++
      ) {

        const other =
          $("n" + i);


        if (other) {

          other.disabled =
            true;
        }
      }
    };


    container.appendChild(
      button
    );
  }


  updateRemaining();
}


// ========================================
// 爆発エフェクト
// ========================================

function explosion() {

  for (
    let i = 0;
    i < 30;
    i++
  ) {

    const particle =
      document.createElement(
        "div"
      );


    particle.className =
      "particle";


    particle.style.left =
      "50%";

    particle.style.top =
      "50%";


    particle.style.setProperty(
      "--x",
      (
        Math.random() * 400 -
        200
      ) + "px"
    );


    particle.style.setProperty(
      "--y",
      (
        Math.random() * 300 -
        150
      ) + "px"
    );


    document.body.appendChild(
      particle
    );


    setTimeout(
      () => {

        particle.remove();

      },
      900
    );
  }
}


// ========================================
// 勝敗オーバーレイ
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
    () => {

      overlay.className =
        "battle-overlay";

    },
    1200
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


  // --------------------------------
  // カード表示
  // --------------------------------

  left.className =
    "card battle-card left-card";

  right.className =
    "card battle-card right-card";


  left.textContent =
    p1;

  right.textContent =
    p2;


  // --------------------------------
  // 突進
  // --------------------------------

  setTimeout(
    () => {

      left.classList.add(
        "attack-left"
      );

      right.classList.add(
        "attack-right"
      );

    },
    100
  );


  // --------------------------------
  // 激突
  // --------------------------------

  setTimeout(
    () => {

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


  // --------------------------------
  // 間
  // --------------------------------

  setTimeout(
    () => {

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
    () => {

      const message =
        $("message");

      if (message) {

        message.textContent =
          "勝敗は……";
      }

    },
    1400
  );


  // --------------------------------
  // 勝敗
  // --------------------------------

  setTimeout(
    () => {

      const win =
        result ===
        (
          me === 1
            ? 1
            : -1
        );


      // ------------------------------
      // P1勝利
      // ------------------------------

      if (
        result === 1
      ) {

        left.classList.add(
          "winner-card"
        );

        right.classList.add(
          "loser-card"
        );
      }


      // ------------------------------
      // P2勝利
      // ------------------------------

      else if (
        result === -1
      ) {

        right.classList.add(
          "winner-card"
        );

        left.classList.add(
          "loser-card"
        );
      }


      // ------------------------------
      // 引き分け
      // ------------------------------

      if (
        result === 0
      ) {

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


      // ------------------------------
      // 勝敗表示
      // ------------------------------

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
// 次ラウンド準備
// ========================================

function prepareNextRound() {

  selectedThisRound =
    false;


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


    // --------------------------------
    // ★ 青色を解除
    // --------------------------------

    button.classList.remove(
      "selected"
    );


    // --------------------------------
    // 使用済み数字
    // --------------------------------

    if (
      button.classList.contains(
        "used"
      )
    ) {

      button.disabled =
        true;

    } else {

      button.disabled =
        false;
    }
  }


  updateRemaining();


  // --------------------------------
  // バトルカードを隠す
  // --------------------------------

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
}


// ========================================
// サーバーデータ処理
// ========================================

function handle(m) {

  // ======================================
  // エラー
  // ======================================

  if (
    m.type === "error"
  ) {

    alert(
      m.message
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


    // ------------------------------------
    // 自分の名前
    // ------------------------------------

    if (
      m.name
    ) {

      if (
        me === 1
      ) {

        const p1name =
          $("p1name");


        if (p1name) {

          p1name.textContent =
            m.name;
        }

      } else {

        const p2name =
          $("p2name");


        if (p2name) {

          p2name.textContent =
            m.name;
        }
      }
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


    // ====================================
    // ★ プレイヤー名
    // ====================================

    const p1name =
      $("p1name");


    if (p1name) {

      p1name.textContent =
        m.p1Name ||
        "PLAYER 1";
    }


    const p2name =
      $("p2name");


    if (p2name) {

      p2name.textContent =
        m.p2Name ||
        "PLAYER 2";
    }


    // ====================================
    // ゲーム中
    // ====================================

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


    setTimeout(
      () => {

        prepareNextRound();

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


    return;
  }


  // ======================================
  // サーバーメッセージ
  // ======================================

  if (
    m.type === "message"
  ) {

    const message =
      $("message");


    if (
      message &&
      m.text
    ) {

      message.textContent =
        m.text;
    }


    return;
  }
}


// ========================================
// ボタン設定
// ========================================

function setupUI() {

  const create =
    $("create");


  if (create) {

    create.onclick =
      createRoom;
  }


  const join =
    $("join");


  if (join) {

    join.onclick =
      joinRoom;
  }


  const back =
    $("back");


  if (back) {

    back.onclick =
      backToLobby;
  }
}


// ========================================
// 起動
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupUI();

    createNumberButtons();

    connect();

  }
);
