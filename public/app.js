let ws;
let me = 0;

const $ = id => document.getElementById(id);

// ==================================================
// サウンドシステム
// ==================================================

let audioCtx = null;
let drumTimer = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

// --------------------------------------------------
// 基本音
// --------------------------------------------------

function tone(
  frequency,
  duration = 0.1,
  type = "sine",
  volume = 0.08,
  delay = 0
) {
  initAudio();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(
    frequency,
    audioCtx.currentTime + delay
  );

  gain.gain.setValueAtTime(
    0.0001,
    audioCtx.currentTime + delay
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    audioCtx.currentTime + delay + 0.01
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioCtx.currentTime + delay + duration
  );

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + duration + 0.02);
}

// ==================================================
// 数字選択音
// ==================================================

function playSelectSound() {
  initAudio();

  tone(520, 0.07, "square", 0.06);
  tone(780, 0.12, "sine", 0.04, 0.04);
}

// ==================================================
// カード突進音
// ==================================================

function playAttackSound() {
  initAudio();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sawtooth";

  osc.frequency.setValueAtTime(
    180,
    audioCtx.currentTime
  );

  osc.frequency.exponentialRampToValueAtTime(
    850,
    audioCtx.currentTime + 0.35
  );

  gain.gain.setValueAtTime(
    0.0001,
    audioCtx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.08,
    audioCtx.currentTime + 0.03
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioCtx.currentTime + 0.35
  );

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.37);
}

// ==================================================
// 激突音
// ==================================================

function playImpactSound() {
  initAudio();

  // 低い衝撃音
  tone(90, 0.35, "sine", 0.25);

  // 高い衝撃音
  tone(180, 0.18, "square", 0.10);

  // 余韻
  tone(60, 0.5, "sine", 0.12, 0.05);
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

    if (!audioCtx) return;

    // ドラムっぽいノイズ
    const bufferSize =
      audioCtx.sampleRate * 0.08;

    const buffer =
      audioCtx.createBuffer(
        1,
        bufferSize,
        audioCtx.sampleRate
      );

    const data =
      buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {

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
    gain.connect(audioCtx.destination);

    source.start();

    count++;

    // 徐々に速くする
    if (count < 8) {
      interval = 115;
    } else if (count < 15) {
      interval = 90;
    } else {
      interval = 65;
    }

    drumTimer =
      setTimeout(hit, interval);
  }

  hit();
}

// ==================================================
// ドラム停止
// ==================================================

function stopDrumRoll() {

  if (drumTimer) {

    clearTimeout(drumTimer);

    drumTimer = null;
  }
}

// ==================================================
// 勝利音
// ==================================================

function playWinSound() {

  stopDrumRoll();

  initAudio();

  tone(523, 0.18, "sine", 0.12);
  tone(659, 0.18, "sine", 0.12, 0.15);
  tone(784, 0.25, "sine", 0.14, 0.30);
  tone(1046, 0.45, "sine", 0.18, 0.50);
}

// ==================================================
// 敗北音
// ==================================================

function playLoseSound() {

  stopDrumRoll();

  initAudio();

  tone(440, 0.25, "sawtooth", 0.10);
  tone(330, 0.30, "sawtooth", 0.10, 0.22);
  tone(220, 0.55, "sawtooth", 0.13, 0.48);
}

// ==================================================
// 引き分け音
// ==================================================

function playDrawSound() {

  stopDrumRoll();

  initAudio();

  tone(440, 0.20, "square", 0.08);
  tone(440, 0.20, "square", 0.08, 0.25);
}

// ==================================================
// WebSocket
// ==================================================

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

// ==================================================
// データ送信
// ==================================================

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

// ==================================================
// プレイヤー名
// ==================================================

function playerName() {

  return (
    $("name").value.trim()
    || "PLAYER"
  );
}

// ==================================================
// ルーム作成
// ==================================================

const createButton = $("create");

if (createButton) {

  createButton.onclick = () => {

    initAudio();

    send({
      type: "create",
      name: playerName()
    });
  };
}

// ==================================================
// ルーム参加
// ==================================================

const joinButton = $("join");

if (joinButton) {

  joinButton.onclick = () => {

    initAudio();

    send({
      type: "join",
      roomId:
        $("room").value.trim(),
      name:
        playerName()
    });
  };
}

// ==================================================
// ロビーへ戻る
// ==================================================

const backButton = $("back");

if (backButton) {

  backButton.onclick = () => {

    stopDrumRoll();

    location.reload();
  };
}

// ==================================================
// 残り数字
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
// ラウンド選択状態
// ==================================================

let selectedThisRound = false;

// ==================================================
// 数字ボタン
// ==================================================

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

    if (selectedThisRound) {
      return;
    }

    // 音声開始
    initAudio();

    // 選択音
    playSelectSound();

    selectedThisRound = true;

    // 今ラウンドの選択カードを青くする
    button.classList.add("selected");

    // サーバーへ送信
    send({
      type: "move",
      number: n
    });

    $("message").textContent =
      "NUMBER " +
      n +
      " を選択";

    // 他の数字をロック
    for (
      let i = 1;
      i <= 9;
      i++
    ) {

      const otherButton =
        $("n" + i);

      if (otherButton) {

        otherButton.disabled = true;
      }
    }
  };

  $("buttons").appendChild(button);
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

// ==================================================
// 勝敗表示
// ==================================================

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

  left.className =
    "card battle-card left-card";

  right.className =
    "card battle-card right-card";

  left.textContent = p1;
  right.textContent = p2;

  // ------------------------------
  // カード突進
  // ------------------------------

  setTimeout(() => {

    playAttackSound();

    left.classList.add(
      "attack-left"
    );

    right.classList.add(
      "attack-right"
    );

  }, 100);

  // ------------------------------
  // 激突
  // ------------------------------

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

  // ------------------------------
  // 少し間
  // ------------------------------

  setTimeout(() => {

    $("message").textContent =
      "……";

  }, 1000);

  // ------------------------------
  // ドラムロール開始
  // ------------------------------

  setTimeout(() => {

    $("message").textContent =
      "勝敗は……";

    startDrumRoll();

  }, 1400);

  // ------------------------------
  // 勝敗発表
  // ------------------------------

  setTimeout(() => {

    const win =
      result ===
      (me === 1 ? 1 : -1);

    // 勝者
    if (result === 1) {

      left.classList.add(
        "winner-card"
      );

      right.classList.add(
        "loser-card"
      );
    }

    // 敗者
    else if (result === -1) {

      right.classList.add(
        "winner-card"
      );

      left.classList.add(
        "loser-card"
      );
    }

    // 引き分け
    if (result === 0) {

      playDrawSound();

      showResult(
        "DRAW!",
        false
      );

      $("message").textContent =
        "引き分け！";

      return;
    }

    // 勝利音 / 敗北音
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

    $("message").textContent =
      win
        ? "あなたの勝ち！"
        : "あなたの負け…";

  }, 2700);
}

// ==================================================
// サーバーからのデータ
// ==================================================

function handle(m) {

  // ------------------------------
  // エラー
  // ------------------------------

  if (
    m.type === "error"
  ) {

    alert(m.message);

    return;
  }

  // ------------------------------
  // 参加成功
  // ------------------------------

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

  // ------------------------------
  // ゲーム状態
  // ------------------------------

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

  // ------------------------------
  // 待機
  // ------------------------------

  if (
    m.type === "waiting"
  ) {

    $("message").textContent =
      "相手の選択を待っています…";

    return;
  }

  // ------------------------------
  // ラウンド結果
  // ------------------------------

  if (
    m.type === "roundResult"
  ) {

    battleAnimation(
      m.p1,
      m.p2,
      m.result
    );

    setTimeout(() => {

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

          // 青色を解除
          button.classList.remove(
            "selected"
          );

          // 使用済み数字だけ×
          button.disabled =
            button.classList.contains(
              "used"
            );

          // 今回選択した数字を使用済みにする
          if (
            button.textContent ==
            (me === 1
              ? m.p1
              : m.p2)
          ) {

            button.classList.add(
              "used"
            );

            button.classList.remove(
              "selected"
            );
          }
        }
      }

      updateRemaining();

      $("p1card").className =
        "card hidden";

      $("p2card").className =
        "card hidden";

    }, 3300);

    return;
  }

  // ------------------------------
  // ゲーム終了
  // ------------------------------

  if (
    m.type === "gameOver"
  ) {

    const win =
      m.winner === me;

    if (m.winner === 0) {

      playDrawSound();

    } else if (win) {

      playWinSound();

    } else {

      playLoseSound();
    }

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

  // ------------------------------
  // 相手退出
  // ------------------------------

  if (
    m.type === "opponentLeft"
  ) {

    stopDrumRoll();

    $("message").textContent =
      "相手が退出しました。";

    return;
  }
}

// ==================================================
// 起動
// ==================================================

connect();
