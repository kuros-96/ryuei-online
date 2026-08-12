let ws, me = 0;

const $ = id => document.getElementById(id);

function connect() {
  ws = new WebSocket(
    (location.protocol === "https:" ? "wss://" : "ws://") + location.host
  );

  ws.onopen = () => {
    $("status").textContent = "サーバー接続OK";
  };

  ws.onclose = () => {
    $("status").textContent = "サーバーから切断されました";
  };

  ws.onmessage = e => handle(JSON.parse(e.data));
}

function send(data) {
  if (ws?.readyState === 1) {
    ws.send(JSON.stringify(data));
  }
}

function playerName() {
  return $("name").value.trim() || "PLAYER";
}

$("create").onclick = () => {
  send({
    type: "create",
    name: playerName()
  });
};

$("join").onclick = () => {
  send({
    type: "join",
    roomId: $("room").value.trim(),
    name: playerName()
  });
};

$("back").onclick = () => location.reload();


// 数字ボタン
for (let n = 1; n <= 9; n++) {

  const button = document.createElement("button");

  button.textContent = n;
  button.id = "n" + n;

  button.onclick = () => {

    send({
      type: "move",
      number: n
    });

    button.classList.add("used");

    $("message").textContent =
      "NUMBER " + n + " を選択";

  };

  $("buttons").appendChild(button);
}


// 爆発エフェクト
function explosion() {

  for (let i = 0; i < 36; i++) {

    const particle = document.createElement("div");

    particle.className = "particle";

    particle.style.left = "50%";
    particle.style.top = "50%";

    particle.style.setProperty(
      "--x",
      (Math.random() * 500 - 250) + "px"
    );

    particle.style.setProperty(
      "--y",
      (Math.random() * 400 - 200) + "px"
    );

    document.body.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 900);
  }
}


// 勝敗表示
function showResult(text, win) {

  const overlay = $("battleOverlay");

  $("battleText").textContent = text;

  overlay.className =
    "battle-overlay show " +
    (win ? "victory" : "defeat");

  setTimeout(() => {
    overlay.className = "battle-overlay";
  }, 1200);
}


// カードを中央に飛ばす
function battleAnimation(p1, p2, result) {

  const left = $("p1card");
  const right = $("p2card");

  left.className = "card battle-card left-card";
  right.className = "card battle-card right-card";

  left.textContent = p1;
  right.textContent = p2;

  // 一旦少し待つ
  setTimeout(() => {

    left.classList.add("attack-left");
    right.classList.add("attack-right");

  }, 100);


  // 激突
  setTimeout(() => {

    left.classList.add("impact");
    right.classList.add("impact");

    explosion();

  }, 650);


  // 勝敗
  setTimeout(() => {

    const win =
      result === (me === 1 ? 1 : -1);

    left.classList.add(
      result === 1 ? "winner-card" : "loser-card"
    );

    right.classList.add(
      result === -1 ? "winner-card" : "loser-card"
    );

    showResult(
      win ? "YOU WIN!" : "YOU LOSE!",
      win
    );

    $("message").textContent =
      win ? "あなたの勝ち！" : "あなたの負け…";

  }, 900);
}


function handle(m) {

  if (m.type === "error") {

    alert(m.message);
    return;
  }


  if (m.type === "joined") {

    me = m.player;

    $("roomId").textContent = m.roomId;

    $("lobby").classList.add("hidden");
    $("game").classList.remove("hidden");

    $("message").textContent =
      me === 1
        ? "相手の参加を待っています…"
        : "ゲーム開始！";

    return;
  }


  if (m.type === "state") {

    $("round").textContent = m.round;

    $("scores").textContent =
      `${m.p1Score} - ${m.p2Score}`;

    $("p1state").textContent =
      m.p1Connected ? "接続中" : "待機中";

    $("p2state").textContent =
      m.p2Connected ? "接続中" : "待機中";

    if (m.status === "playing") {

      $("message").textContent =
        "数字を1枚選んでください";
    }

    return;
  }


  if (m.type === "waiting") {

    $("message").textContent =
      "相手の選択を待っています…";

    return;
  }


  if (m.type === "roundResult") {

    battleAnimation(
      m.p1,
      m.p2,
      m.result
    );

    setTimeout(() => {

      for (let n = 1; n <= 9; n++) {

        $("n" + n)
          .classList
          .remove("used");
      }

      $("p1card").className =
        "card hidden";

      $("p2card").className =
        "card hidden";

    }, 1500);

    return;
  }


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


  if (m.type === "opponentLeft") {

    $("message").textContent =
      "相手が退出しました。";
  }
}


connect();
