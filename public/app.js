let ws = null;

let me = 0;

let myName = "";

let selectedThisRound = false;

let gameFinished = false;

let audioCtx = null;

let drumTimer = null;


// ==================================================
// ID取得
// ==================================================

const $ = id =>
  document.getElementById(id);


// ==================================================
// Audio
// ==================================================

function initAudio() {

  if (!audioCtx) {

    audioCtx =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

  }

  if (
    audioCtx.state === "suspended"
  ) {

    audioCtx.resume();

  }
}


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
    audioCtx.currentTime +
    delay;

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
    start + 0.02
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + duration
  );

  osc.connect(gain);

  gain.connect(
    audioCtx.destination
  );

  osc.start(start);

  osc.stop(
    start + duration + 0.03
  );
}


// ==================================================
// 選択音
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
// 攻撃音
// ==================================================

function playAttackSound() {

  initAudio();

  const osc =
    audioCtx.createOscillator();

  const gain =
    audioCtx.createGain();

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

  gain.connect(
    audioCtx.destination
  );

  osc.start();

  osc.stop(
    audioCtx.currentTime + 0.37
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
      audioCtx.sampleRate * 0.08;

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

    (
      location.protocol === "https:"
        ? "wss://"
        : "ws://"
    ) + location.host

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


  ws.onmessage = e => {

    try {

      handle(
        JSON.parse(e.data)
      );

    } catch (err) {

      console.error(err);

    }

  };

}


// ==================================================
// 送信
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
// 作成ボタン
// ==================================================

const createButton =
  $("create");

if (createButton) {

  createButton.onclick = () => {

    initAudio();

    myName =
      playerName();

    send({
      type: "create",
      name: myName
    });

  };

}


// ==================================================
// 参加ボタン
// ==================================================

const joinButton =
  $("join");

if (joinButton) {

  joinButton.onclick = () => {

    initAudio();

    myName =
      playerName();

    send({
      type: "join",

      roomId:
        $("room")?.value.trim(),

      name: myName
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

    send({
      type: "leave"
    });

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
      button.classList.contains(
        "used"
      )
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


// ==================================================
// 数字ボタン生成
// ==================================================

function createNumberButtons() {

  const container =
    $("buttons");

  if (!container) {
    return;
  }

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

    button.onclick = () => {

      // --------------------------------------------
      // すでに選択済み
      // --------------------------------------------

      if (
        selectedThisRound
      ) {

        return;

      }

      // --------------------------------------------
      // ゲーム終了中
      // --------------------------------------------

      if (
        gameFinished
      ) {

        return;

      }

      // --------------------------------------------
      // 使用済み
      // --------------------------------------------

      if (
        button.classList.contains(
          "used"
        )
      ) {

        return;

      }

      initAudio();

      playSelectSound();

      selectedThisRound =
        true;

      // --------------------------------------------
      // ★選択した1枚だけ青くする
      // --------------------------------------------

      button.classList.add(
        "selected"
      );

      // --------------------------------------------
      // ★重要
      // 全ボタンをdisabledにしない
      // 相手の画面には影響しない
      // --------------------------------------------

      button.disabled = true;

      // --------------------------------------------
      // サーバーへ送信
      // --------------------------------------------

      send({
        type: "move",
        number: n
      });

      const message =
        $("message");

      if (message) {

        message.textContent =
          "NUMBER " +
          n +
          " を選択";

      }

    };

    container.appendChild(
      button
    );

  }

  updateRemaining();
}


// ==================================================
// 爆発
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
// 勝敗オーバーレイ
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

  }, 1300);

}


// ==================================================
// バトル演出
// ==================================================

function battleAnimation(
  p1,
  p2,
  battleResult
) {

  const left =
    $("p1card");

  const right =
    $("p2card");

  if (!left || !right) {
    return;
  }

  // ----------------------------------------------
  // 数字をまだ表示しない
  // ----------------------------------------------

  left.className =
    "card battle-card left-card";

  right.className =
    "card battle-card right-card";

  left.textContent = "?";

  right.textContent = "?";


  // ----------------------------------------------
  // 突進
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
  // 少し間
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
  // 数字公開
  // ----------------------------------------------

  setTimeout(() => {

    left.textContent =
      p1;

    right.textContent =
      p2;

  }, 2050);


  // ----------------------------------------------
  // 勝敗発表
  // ----------------------------------------------

  setTimeout(() => {

    const win =
      battleResult ===
      (
        me === 1
          ? 1
          : -1
      );


    if (
      battleResult === 1
    ) {

      left.classList.add(
        "winner-card"
      );

      right.classList.add(
        "loser-card"
      );

    } else if (
      battleResult === -1
    ) {

      right.classList.add(
        "winner-card"
      );

      left.classList.add(
        "loser-card"
      );

    }


    if (
      battleResult === 0
    ) {

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
// 再戦ボタン
// ==================================================

function createRematchButton() {

  let button =
    $("rematch");

  if (button) {
    return button;
  }

  button =
    document.createElement(
      "button"
    );

  button.id =
    "rematch";

  button.textContent =
    "もう一度対戦する";

  button.style.display =
    "block";

  button.style.margin =
    "20px auto";

  button.style.fontSize =
    "18px";

  button.style.background =
    "#2196f3";

  button.onclick = () => {

    initAudio();

    button.disabled =
      true;

    button.textContent =
      "相手を待っています…";

    send({
      type: "rematch"
    });

  };

  const game =
    $("game");

  if (game) {

    const back =
      $("back");

    if (back) {

      game.insertBefore(
        button,
        back
      );

    } else {

      game.appendChild(
        button
      );

    }

  }

  return button;
}


// ==================================================
// 再戦ボタン削除
// ==================================================

function removeRematchButton() {

  const button =
    $("rematch");

  if (button) {

    button.remove();

  }

}


// ==================================================
// ゲーム初期化
// ==================================================

function resetClientGame() {

  selectedThisRound =
    false;

  gameFinished =
    false;

  removeRematchButton();

  createNumberButtons();

  const round =
    $("round");

  if (round) {
    round.textContent = "1";
  }

  const scores =
    $("scores");

  if (scores) {
    scores.textContent =
      "0 - 0";
  }

  const p1card =
    $("p1card");

  const p2card =
    $("p2card");

  if (p1card) {

    p1card.className =
      "card hidden";

    p1card.textContent =
      "?";

  }

  if (p2card) {

    p2card.className =
      "card hidden";

    p2card.textContent =
      "?";

  }

  const message =
    $("message");

  if (message) {

    message.textContent =
      "数字を1枚選んでください";

  }

}


// ==================================================
// サーバーからのデータ
// ==================================================

function handle(m) {

  // ==================================================
  // エラー
  // ==================================================

  if (
    m.type === "error"
  ) {

    alert(m.message);

    return;

  }


  // ==================================================
  // 参加成功
  // ==================================================

  if (
    m.type === "joined"
  ) {

    me =
      m.player;

    myName =
      m.name || myName;

    const roomId =
      $("roomId");

    if (roomId) {

      roomId.textContent =
        m.roomId;

    }

    $("lobby")?.classList.add(
      "hidden"
    );

    $("game")?.classList.remove(
      "hidden"
    );

    createNumberButtons();

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


  // ==================================================
  // プレイヤー名
  // ==================================================

  if (
    m.type === "players"
  ) {

    const p1 =
      $("p1name");

    const p2 =
      $("p2name");

    if (p1) {

      p1.textContent =
        m.p1Name ||
        "PLAYER 1";

    }

    if (p2) {

      p2.textContent =
        m.p2Name ||
        "PLAYER 2";

    }

    return;

  }


  // ==================================================
  // ゲーム状態
  // ==================================================

  if (
    m.type === "state"
  ) {

    if (m.round) {

      const round =
        $("round");

      if (round) {

        round.textContent =
          m.round;

      }

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

    const p2state =
      $("p2state");

    if (p1state) {

      p1state.textContent =
        m.p1Connected
          ? "接続中"
          : "待機中";

    }

    if (p2state) {

      p2state.textContent =
        m.p2Connected
          ? "接続中"
          : "待機中";

    }


    if (
      m.status === "playing"
    ) {

      selectedThisRound =
        false;

      gameFinished =
        false;

      const message =
        $("message");

      if (message) {

        message.textContent =
          "数字を1枚選んでください";

      }

    }

    return;

  }


  // ==================================================
  // 待機
  // ==================================================

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


  // ==================================================
  // ラウンド結果
  // ==================================================

  if (
    m.type === "roundResult"
  ) {

    battleAnimation(
      m.p1,
      m.p2,
      m.result
    );


    // ----------------------------------------------
    // ラウンド終了後
    // ----------------------------------------------

    setTimeout(() => {

      selectedThisRound =
        false;


      // --------------------------------------------
      // 自分が選んだ数字だけ使用済みにする
      // --------------------------------------------

      const myNumber =
        me === 1
          ? m.p1
          : m.p2;


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


        // 自分の使用数字
        if (
          Number(button.textContent) ===
          Number(myNumber)
        ) {

          button.classList.add(
            "used"
          );

          button.disabled =
            true;

        } else if (
          !button.classList.contains(
            "used"
          )
        ) {

          button.disabled =
            false;

        }

      }


      updateRemaining();


      const p1card =
        $("p1card");

      const p2card =
        $("p2card");

      if (p1card) {

        p1card.className =
          "card hidden";

        p1card.textContent =
          "?";

      }

      if (p2card) {

        p2card.className =
          "card hidden";

        p2card.textContent =
          "?";

      }

    }, 3300);


    return;

  }


  // ==================================================
  // ゲーム終了
  // ==================================================

  if (
    m.type === "gameOver"
  ) {

    gameFinished =
      true;

    stopDrumRoll();


    const win =
      m.winner === me;


    if (
      m.winner === 0
    ) {

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


    // ----------------------------------------------
    // 再戦ボタン
    // ----------------------------------------------

    setTimeout(() => {

      createRematchButton();

    }, 1400);


    return;

  }


  // ==================================================
  // 再戦待機
  // ==================================================

  if (
    m.type === "rematchWaiting"
  ) {

    const button =
      createRematchButton();

    button.disabled =
      true;

    button.textContent =
      "相手を待っています…";

    const message =
      $("message");

    if (message) {

      message.textContent =
        "相手の再戦を待っています…";

    }

    return;

  }


  // ==================================================
  // 相手の再戦待ち
  // ==================================================

  if (
    m.type ===
    "rematchWaitingOpponent"
  ) {

    const message =
      $("message");

    if (message) {

      message.textContent =
        "相手が再戦を希望しています";

    }

    return;

  }


  // ==================================================
  // 再戦開始
  // ==================================================

  if (
    m.type === "rematchStart"
  ) {

    resetClientGame();

    const message =
      $("message");

    if (message) {

      message.textContent =
        "再戦開始！数字を選んでください";

    }

    return;

  }


  // ==================================================
  // 相手退出
  // ==================================================

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

createNumberButtons();

connect();
