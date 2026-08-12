let ws;

let me = 0;

let myName = "";

let selectedThisRound = false;

let drumTimer = null;

let audioCtx = null;


// ==================================================
// DOM
// ==================================================

const $ = id =>
  document.getElementById(id);


// ==================================================
// オーディオ
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


// ==================================================
// 音
// ==================================================

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

  const end =
    start + duration;


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
    end
  );


  osc.connect(gain);

  gain.connect(
    audioCtx.destination
  );


  osc.start(start);

  osc.stop(
    end + 0.03
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
// 突進音
// ==================================================

function playAttackSound() {

  initAudio();


  const osc =
    audioCtx.createOscillator();

  const gain =
    audioCtx.createGain();


  osc.type =
    "sawtooth";


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


    source.buffer =
      buffer;


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

  ws =
    new WebSocket(
      (
        location.protocol ===
        "https:"
          ? "wss://"
          : "ws://"
      )
      +
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


  ws.onmessage = e => {

    try {

      handle(
        JSON.parse(
          e.data
        )
      );

    } catch (error) {

      console.error(
        "受信データエラー",
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

  return (
    input?.value.trim()
    ||
    "PLAYER"
  );
}


// ==================================================
// ルーム作成
// ==================================================

const createButton =
  $("create");


if (createButton) {

  createButton.onclick =
    () => {

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
// ルーム参加
// ==================================================

const joinButton =
  $("join");


if (joinButton) {

  joinButton.onclick =
    () => {

      initAudio();

      myName =
        playerName();

      send({

        type: "join",

        roomId:
          $("room")?.value.trim(),

        name:
          myName
      });
    };
}


// ==================================================
// ロビーへ戻る
// ==================================================

const backButton =
  $("back");


if (backButton) {

  backButton.onclick =
    () => {

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
      button.classList.contains(
        "used"
      )
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


    button.onclick =
      () => {

        if (
          selectedThisRound
        ) {

          return;
        }


        initAudio();

        playSelectSound();


        selectedThisRound =
          true;


        button.classList.add(
          "selected"
        );


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


        // 1ラウンド1枚
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
// 数字をリセット
// ==================================================

function resetNumberButtons() {

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


    button.disabled =
      false;


    button.classList.remove(
      "selected"
    );

    button.classList.remove(
      "used"
    );
  }


  updateRemaining();
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
        Math.random() *
        400 -
        200
      ) + "px"
    );


    particle.style.setProperty(
      "--y",
      (
        Math.random() *
        300 -
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
      800
    );
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

    const message =
      $("message");

    if (message) {

      message.textContent =
        text;
    }

    return;
  }


  const battleText =
    $("battleText");


  if (!battleText) {

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


// ==================================================
// 連戦ボタン表示
// ==================================================

function showRematchPanel(
  winner
) {

  let panel =
    $("rematchPanel");


  if (!panel) {

    panel =
      document.createElement(
        "div"
      );

    panel.id =
      "rematchPanel";


    panel.style.textAlign =
      "center";

    panel.style.marginTop =
      "20px";

    panel.style.padding =
      "18px";

    panel.style.border =
      "1px solid #444";

    panel.style.borderRadius =
      "14px";

    panel.style.background =
      "#16181d";


    const game =
      $("game");


    if (game) {

      game.appendChild(
        panel
      );
    }
  }


  panel.innerHTML = "";


  const title =
    document.createElement(
      "div"
    );


  title.textContent =
    "もう一度対戦しますか？";


  title.style.fontSize =
    "18px";

  title.style.fontWeight =
    "800";

  title.style.marginBottom =
    "12px";


  panel.appendChild(
    title
  );


  const button =
    document.createElement(
      "button"
    );


  button.textContent =
    "もう一度対戦";


  button.style.margin =
    "5px";


  button.onclick =
    () => {

      initAudio();

      button.disabled =
        true;

      button.textContent =
        "相手を待っています…";


      send({
        type: "rematch"
      });
    };


  panel.appendChild(
    button
  );


  const lobbyButton =
    document.createElement(
      "button"
    );


  lobbyButton.textContent =
    "ロビーに戻る";


  lobbyButton.style.margin =
    "5px";


  lobbyButton.onclick =
    () => {

      stopDrumRoll();

      location.reload();
    };


  panel.appendChild(
    lobbyButton
  );
}


// ==================================================
// 連戦パネル削除
// ==================================================

function removeRematchPanel() {

  const panel =
    $("rematchPanel");


  if (panel) {

    panel.remove();
  }
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


  left.className =
    "card battle-card left-card";


  right.className =
    "card battle-card right-card";


  /*
   * 数字はここで初めて表示する
   */

  left.textContent =
    p1;

  right.textContent =
    p2;


  // 突進
  setTimeout(
    () => {

      playAttackSound();


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
    () => {

      playImpactSound();


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


  // ドラム
  setTimeout(
    () => {

      const message =
        $("message");

      if (message) {

        message.textContent =
          "勝敗は……";
      }


      startDrumRoll();

    },
    1400
  );


  // 結果
  setTimeout(
    () => {

      const win =
        battleResult ===
        (
          me === 1
            ? 1
            : -1
        );


      // P1勝利
      if (
        battleResult === 1
      ) {

        left.classList.add(
          "winner-card"
        );

        right.classList.add(
          "loser-card"
        );
      }


      // P2勝利
      else if (
        battleResult === -1
      ) {

        right.classList.add(
          "winner-card"
        );

        left.classList.add(
          "loser-card"
        );
      }


      // 引き分け
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


      // 勝敗音
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

    },
    2700
  );
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

    alert(
      m.message
    );

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
      m.name ||
      myName ||
      "PLAYER";


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


    removeRematchPanel();


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


  // ==================================================
  // ゲーム状態
  // ==================================================

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
      m.status ===
      "playing"
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


    setTimeout(
      () => {

        selectedThisRound =
          false;


        // 今回使用した数字
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


          button.classList.remove(
            "selected"
          );


          if (
            Number(
              button.textContent
            ) ===
            Number(myNumber)
          ) {

            button.classList.add(
              "used"
            );
          }


          button.disabled =
            button.classList.contains(
              "used"
            );
        }


        updateRemaining();


        const left =
          $("p1card");

        const right =
          $("p2card");


        if (left) {

          left.className =
            "card hidden";
        }


        if (right) {

          right.className =
            "card hidden";
        }

      },
      3300
    );


    return;
  }


  // ==================================================
  // ゲーム終了
  // ==================================================

  if (
    m.type === "gameOver"
  ) {

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


    // 連戦ボタン
    setTimeout(
      () => {

        showRematchPanel(
          m.winner
        );

      },
      500
    );


    return;
  }


  // ==================================================
  // 連戦待機
  // ==================================================

  if (
    m.type === "rematchWaiting"
  ) {

    const panel =
      $("rematchPanel");


    if (panel) {

      const button =
        panel.querySelector(
          "button"
        );


      if (button) {

        button.disabled =
          true;

        button.textContent =
          "相手を待っています…";
      }
    }


    const message =
      $("message");


    const both =
      m.p1Rematch &&
      m.p2Rematch;


    if (message) {

      message.textContent =
        both
          ? "再戦準備中…"
          : "相手の再戦を待っています…";
    }


    return;
  }


  // ==================================================
  // 連戦開始
  // ==================================================

  if (
    m.type === "rematchStart"
  ) {

    stopDrumRoll();


    removeRematchPanel();


    resetNumberButtons();


    const round =
      $("round");


    if (round) {

      round.textContent =
        "1";
    }


    const scores =
      $("scores");


    if (scores) {

      scores.textContent =
        "0 - 0";
    }


    const message =
      $("message");


    if (message) {

      message.textContent =
        "第2戦スタート！ 数字を1枚選んでください";
    }


    // カードを隠す
    const left =
      $("p1card");

    const right =
      $("p2card");


    if (left) {

      left.className =
        "card hidden";
    }


    if (right) {

      right.className =
        "card hidden";
    }


    // プレイヤー名はそのまま


    // 再戦開始音
    initAudio();

    tone(
      523,
      0.12,
      "sine",
      0.08
    );

    tone(
      659,
      0.15,
      "sine",
      0.08,
      0.12
    );

    tone(
      784,
      0.20,
      "sine",
      0.10,
      0.24
    );


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


    removeRematchPanel();


    return;
  }
}


// ==================================================
// 起動
// ==================================================

connect();
