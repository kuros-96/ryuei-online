// ==================================================
// NUMBER CROSS
// 完成版 app.js
// ==================================================

let ws = null;
let me = 0;

let selectedThisRound = false;

// ==================================================
// HTML取得
// ==================================================

const $ = id => document.getElementById(id);

// ==================================================
// Audio
// ==================================================

let audioCtx = null;
let drumTimer = null;

// --------------------------------------------------
// Audio初期化
// --------------------------------------------------

function initAudio() {

  if (!audioCtx) {

    audioCtx =
      new (window.AudioContext ||
        window.webkitAudioContext)();
  }

  if (audioCtx.state === "suspended") {

    audioCtx.resume();
  }
}

// --------------------------------------------------
// 単音
// --------------------------------------------------

function tone(
  frequency,
  duration,
  type = "sine",
  volume = 0.08,
  delay = 0
) {

  if (!audioCtx) {
    return;
  }

  const osc =
    audioCtx.createOscillator();

  const gain =
    audioCtx.createGain();

  const start =
    audioCtx.currentTime + delay;

  osc.type = type;

  osc.frequency.setValueAtTime(
    frequency,
    start
  );

  gain.gain.setValueAtTime(
    0.0001,
    start
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    start + 0.01
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + duration
  );

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(start);

  osc.stop(
    start + duration + 0.03
  );
}

// ==================================================
// 数字選択音
// ==================================================

function playSelectSound() {

  initAudio();

  tone(
    520,
    0.07,
    "square",
    0.06
  );

  tone(
    780,
    0.12,
    "sine",
    0.04,
    0.04
  );
}

// ==================================================
// カード突進音
// ==================================================

function playAttackSound() {

  initAudio();

  const osc =
    audioCtx.createOscillator();

  const gain =
    audioCtx.createGain();

  const now =
    audioCtx.currentTime;

  osc.type = "sawtooth";

  osc.frequency.setValueAtTime(
    180,
    now
  );

  osc.frequency.exponentialRampToValueAtTime(
    850,
    now + 0.35
  );

  gain.gain.setValueAtTime(
    0.0001,
    now
  );

  gain.gain.exponentialRampToValueAtTime(
    0.08,
    now + 0.03
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.35
  );

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);

  osc.stop(
    now + 0.37
  );
}

// ==================================================
// 激突音
// ==================================================

function playImpactSound() {

  initAudio();

  tone(
    90,
    0.35,
    "sine",
    0.25
  );

  tone(
    180,
    0.18,
    "square",
    0.10
  );

  tone(
    60,
    0.5,
    "sine",
    0.12,
    0.05
  );
}

// ==================================================
// ドラムロール
// ==================================================

function startDrumRoll() {

  stopDrumRoll();

  initAudio();

  let count = 0;
  let interval = 115;

  function hit() {

    if (!audioCtx) {
      return;
    }

    const bufferSize =
      Math.floor(
        audioCtx.sampleRate * 0.08
      );

    const buffer =
      audioCtx.createBuffer(
        1,
        bufferSize,
        audioCtx.sampleRate
      );

    const data =
      buffer.getChannelData(0);

    for (
      let i = 0;
      i < bufferSize;
      i++
    ) {

      data[i] =
        (Math.random() * 2 - 1) *
        Math.exp(-i / 900);
    }

    const source =
      audioCtx.createBufferSource();

    const gain =
      audioCtx.createGain();

    source.buffer = buffer;

    gain.gain.setValueAtTime(
      0.12,
      audioCtx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + 0.08
    );

    source.connect(gain);
    gain.connect(
      audioCtx.destination
    );

    source.start();

    count++;

    if (count < 8) {

      interval = 115;

    } else if (count < 15) {

      interval = 90;

    } else {

      interval = 65;
    }

    drumTimer =
      setTimeout(
        hit,
        interval
      );
  }

  hit();
}

// ==================================================
// ドラム停止
// ==================================================

function stopDrumRoll() {

  if (drumTimer) {

    clearTimeout(
      drumTimer
    );

    drumTimer = null;
  }
}

// ==================================================
// 勝利音
// ==================================================

function playWinSound() {

  stopDrumRoll();

  initAudio();

  tone(
    523,
    0.18,
    "sine",
    0.12
  );

  tone(
    659,
    0.18,
    "sine",
    0.12,
    0.15
  );

  tone(
    784,
    0.25,
    "sine",
    0.14,
    0.30
  );

  tone(
    1046,
    0.45,
    "sine",
    0.18,
    0.50
  );
}

// ==================================================
// 敗北音
// ==================================================

function playLoseSound() {

  stopDrumRoll();

  initAudio();

  tone(
    440,
    0.25,
    "sawtooth",
    0.10
  );

  tone(
    330,
    0.30,
    "sawtooth",
    0.10,
    0.22
  );

  tone(
    220,
    0.55,
    "sawtooth",
    0.13,
    0.48
  );
}

// ==================================================
// 引き分け音
// ==================================================

function playDrawSound() {

  stopDrumRoll();

  initAudio();

  tone(
    440,
    0.20,
    "square",
    0.08
  );

  tone(
    440,
    0.20,
    "square",
    0.08,
    0.25
  );
}

// ==================================================
// WebSocket接続
// ==================================================

function connect() {

  ws = new WebSocket(
    (location.protocol === "https:"
      ? "wss://"
      : "ws://") +
    location.host
  );

  ws.onopen = () => {

    const status =
      $("status");

    if (status) {

      status.textContent =
        "サーバー接続OK";
    }
  };

  ws.onclose = () => {

    const status =
      $("status");

    if (status) {

      status.textContent =
        "サーバーから切断されました";
    }
  };

  ws.onerror = () => {

    const status =
      $("status");

    if (status) {

      status.textContent =
        "サーバー接続エラー";
    }
  };

  ws.onmessage = e => {

    try {

      handle(
        JSON.parse(e.data)
      );

    } catch (error) {

      console.error(
        "受信データエラー:",
        error
      );
    }
  };
}

// ==================================================
// データ送信
// ==================================================

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

// ==================================================
// プレイヤー名
// ==================================================

function playerName() {

  const input =
    $("name");

  if (!input) {

    return "PLAYER";
  }

  return (
    input.value.trim() ||
    "PLAYER"
  );
}

// ==================================================
// ルーム作成
// ==================================================

const createButton =
  $("create");

if (createButton) {

  createButton.onclick = () => {

    initAudio();

    send({

      type: "create",

      name:
        playerName()
    });
  };
}

// ==================================================
// ルーム参加
// ==================================================

const joinButton =
  $("join");

if (joinButton) {

  joinButton.onclick = () => {

    initAudio();

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

// ==================================================
// ロビーへ戻る
// ==================================================

const backButton =
  $("back");

if (backButton) {

  backButton.onclick = () => {

    stopDrumRoll();

    location.reload();
  };
}

// ==================================================
// 残り数字表示
// ==================================================

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

// ==================================================
// 数字ボタン生成
// ==================================================

const buttonsArea =
  $("buttons");

if (buttonsArea) {

  for (
    let n = 1;
    n <= 9;
    n++
  ) {

    const button =
      document.createElement(
        "button"
      );

    button.textContent =
      n;

    button.id =
      "n" + n;

    button.type =
      "button";

    button.onclick = () => {

      // --------------------------------------------
      // このラウンドですでに選択済み
      // --------------------------------------------

      if (selectedThisRound) {

        return;
      }

      // --------------------------------------------
      // Audio
      // --------------------------------------------

      initAudio();

      playSelectSound();

      // --------------------------------------------
      // 選択状態
      // --------------------------------------------

      selectedThisRound = true;

      // ★ 選択中は青く光る
      // ★ この時点では used にしない
      button.classList.add(
        "selected"
      );

      // --------------------------------------------
      // サーバーへ送信
      // --------------------------------------------

      send({

        type: "move",

        number: n
      });

      // --------------------------------------------
      // メッセージ
      // --------------------------------------------

      const message =
        $("message");

      if (message) {

        message.textContent =
          "NUMBER " +
          n +
          " を選択";
      }

      // --------------------------------------------
      // 他の数字をロック
      // --------------------------------------------

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

    buttonsArea.appendChild(
      button
    );
  }
}

// ==================================================
// 爆発エフェクト
// ==================================================

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

    setTimeout(() => {

      particle.remove();

    }, 900);
  }
}

// ==================================================
// 勝敗表示
// ==================================================

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

  setTimeout(() => {

    overlay.className =
      "battle-overlay";

  }, 1500);
}

// ==================================================
// バトル演出
// ==================================================

function battleAnimation(
  p1,
  p2,
  result
) {

  const left =
    $("p1card");

  const right =
    $("p2card");

  if (!left || !right) {

    return;
  }

  // ----------------------------------------------
  // カード表示
  // ----------------------------------------------

  left.className =
    "card battle-card left-card";

  right.className =
    "card battle-card right-card";

  left.textContent =
    p1;

  right.textContent =
    p2;

  // ----------------------------------------------
  // カード突進
  // ----------------------------------------------

  setTimeout(() => {

    playAttackSound();

    left.classList.add(
      "attack-left"
    );

    right.classList.add(
      "attack-right"
    );

  }, 100);

  // ----------------------------------------------
  // 激突
  // ----------------------------------------------

  setTimeout(() => {

    playImpactSound();

    left.classList.add(
      "impact"
    );

    right.classList.add(
      "impact"
    );

    explosion();

  }, 650);

  // ----------------------------------------------
  // 間
  // ----------------------------------------------

  setTimeout(() => {

    const message =
      $("message");

    if (message) {

      message.textContent =
        "……";
    }

  }, 1000);

  // ----------------------------------------------
  // ドラムロール
  // ----------------------------------------------

  setTimeout(() => {

    const message =
      $("message");

    if (message) {

      message.textContent =
        "勝敗は……";
    }

    startDrumRoll();

  }, 1400);

  // ----------------------------------------------
  // 勝敗発表
  // ----------------------------------------------

  setTimeout(() => {

    const win =
      result ===
      (me === 1 ? 1 : -1);

    // --------------------------------------------
    // P1勝利
    // --------------------------------------------

    if (result === 1) {

      left.classList.add(
        "winner-card"
      );

      right.classList.add(
        "loser-card"
      );
    }

    // --------------------------------------------
    // P2勝利
    // --------------------------------------------

    else if (result === -1) {

      right.classList.add(
        "winner-card"
      );

      left.classList.add(
        "loser-card"
      );
    }

    // --------------------------------------------
    // 引き分け
    // --------------------------------------------

    if (result === 0) {

      playDrawSound();

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

    // --------------------------------------------
    // 勝利 / 敗北
    // --------------------------------------------

    if (win) {

      playWinSound();

    } else {

      playLoseSound();
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

  }, 2700);
}

// ==================================================
// サーバーからのデータ処理
// ==================================================

function handle(m) {

  // =================================================
  // エラー
  // =================================================

  if (m.type === "error") {

    alert(
      m.message
    );

    return;
  }

  // =================================================
  // 参加成功
  // =================================================

  if (m.type === "joined") {

    me =
      m.player;

    const roomId =
      $("roomId");

    if (roomId) {

      roomId.textContent =
        m.roomId;
    }

    // ----------------------------------------------
    // プレイヤー名表示
    // ----------------------------------------------

    if (me === 1) {

      const p1name =
        $("p1name");

      if (p1name) {

        p1name.textContent =
          m.name ||
          "PLAYER 1";
      }

    } else {

      const p2name =
        $("p2name");

      if (p2name) {

        p2name.textContent =
          m.name ||
          "PLAYER 2";
      }
    }

    // ----------------------------------------------
    // 画面切り替え
    // ----------------------------------------------

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

  // =================================================
  // ゲーム状態
  // =================================================

  if (m.type === "state") {

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

    // ----------------------------------------------
    // ★ プレイヤー名
    // ----------------------------------------------

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

    // ----------------------------------------------
    // プレイ中
    // ----------------------------------------------

    if (
      m.status === "playing"
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

  // =================================================
  // 待機
  // =================================================

  if (m.type === "waiting") {

    const message =
      $("message");

    if (message) {

      message.textContent =
        "相手の選択を待っています…";
    }

    return;
  }

  // =================================================
  // ラウンド結果
  // =================================================

  if (
    m.type === "roundResult"
  ) {

    battleAnimation(
      m.p1,
      m.p2,
      m.result
    );

    setTimeout(() => {

      // --------------------------------------------
      // 次ラウンド
      // --------------------------------------------

      selectedThisRound =
        false;

      // --------------------------------------------
      // 自分が今回使った数字
      // --------------------------------------------

      const myNumber =
        me === 1
          ? m.p1
          : m.p2;

      // --------------------------------------------
      // ボタン処理
      // --------------------------------------------

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

        // 青色解除
        button.classList.remove(
          "selected"
        );

        // 今回自分が選んだ数字
        if (
          Number(button.textContent) ===
          Number(myNumber)
        ) {

          // ★ ここで初めて使用済み
          button.classList.add(
            "used"
          );
        }

        // 使用済みだけロック
        button.disabled =
          button.classList.contains(
            "used"
          );
      }

      // --------------------------------------------
      // 残り数字
      // --------------------------------------------

      updateRemaining();

      // --------------------------------------------
      // バトルカードを隠す
      // --------------------------------------------

      const p1card =
        $("p1card");

      const p2card =
        $("p2card");

      if (p1card) {

        p1card.className =
          "card hidden";
      }

      if (p2card) {

        p2card.className =
          "card hidden";
      }

    }, 3300);

    return;
  }

  // =================================================
  // ゲーム終了
  // =================================================

  if (m.type === "gameOver") {

    stopDrumRoll();

    const win =
      m.winner === me;

    // ----------------------------------------------
    // 結果音
    // ----------------------------------------------

    if (m.winner === 0) {

      playDrawSound();

    } else if (win) {

      playWinSound();

    } else {

      playLoseSound();
    }

    // ----------------------------------------------
    // 結果表示
    // ----------------------------------------------

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

  // =================================================
  // 相手退出
  // =================================================

  if (
    m.type === "opponentLeft"
  ) {

    stopDrumRoll();

    const message =
      $("message");

    if (message) {

      message.textContent =
        "相手が退出しました。";
    }

    return;
  }
}

// ==================================================
// 起動
// ==================================================

connect();
