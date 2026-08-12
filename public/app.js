document.addEventListener("DOMContentLoaded", () => {

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

    const name = $("name");

    if (!name) {
      return "PLAYER";
    }

    return (
      name.value.trim() ||
      "PLAYER"
    );

  }


  // ==========================
  // ルーム作成
  // ==========================

  const createButton = $("create");

  if (createButton) {

    createButton.onclick = () => {

      send({
        type: "create",
        name: playerName()
      });

    };

  }


  // ==========================
  // ルーム参加
  // ==========================

  const joinButton = $("join");

  if (joinButton) {

    joinButton.onclick = () => {

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


  // ==========================
  // ロビーへ戻る
  // ==========================

  const backButton = $("back");

  if (backButton) {

    backButton.onclick = () => {

      location.reload();

    };

  }


  // ==========================
  // 残り数字
  // ==========================

  function updateRemaining() {

    let used = 0;

    for (let n = 1; n <= 9; n++) {

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
  // ラウンド選択状態
  // ==========================

  let selectedThisRound =
    false;


  // ==========================
  // 数字ボタン生成
  // ==========================

  const buttonsArea =
    $("buttons");

  if (buttonsArea) {

    for (let n = 1; n <= 9; n++) {

      const button =
        document.createElement("button");

      button.textContent =
        n;

      button.id =
        "n" + n;


      button.onclick = () => {

        // すでに選択済み
        if (selectedThisRound) {
          return;
        }

        // 使用済み
        if (
          button.classList.contains("used")
        ) {
          return;
        }


        // --------------------
        // 今ラウンド選択済み
        // --------------------

        selectedThisRound =
          true;


        // --------------------
        // ★ 青くする
        // --------------------

        button.classList.add(
          "selected"
        );


        // --------------------
        // サーバーへ送信
        // --------------------

        send({
          type: "move",
          number: n
        });


        // --------------------
        // 残り数字
        // --------------------

        updateRemaining();


        // --------------------
        // メッセージ
        // --------------------

        const message =
          $("message");

        if (message) {

          message.textContent =
            "NUMBER " +
            n +
            " を選択";

        }


        // --------------------
        // 他の数字をロック
        // --------------------

        for (
          let i = 1;
          i <= 9;
          i++
        ) {

          const other =
            $("n" + i);

          if (
            other &&
            other !== button
          ) {

            other.disabled =
              true;

          }

        }

      };


      buttonsArea.appendChild(
        button
      );

    }

  }


  // ==========================
  // 爆発
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

    const battleText =
      $("battleText");

    const message =
      $("message");


    if (
      !overlay ||
      !battleText
    ) {

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


    if (!left || !right) {
      return;
    }


    left.className =
      "card battle-card left-card";

    right.className =
      "card battle-card right-card";


    left.textContent =
      p1;

    right.textContent =
      p2;


    // ----------------------
    // 突進
    // ----------------------

    setTimeout(() => {

      left.classList.add(
        "attack-left"
      );

      right.classList.add(
        "attack-right"
      );

    }, 100);


    // ----------------------
    // 激突
    // ----------------------

    setTimeout(() => {

      left.classList.add(
        "impact"
      );

      right.classList.add(
        "impact"
      );

      explosion();

    }, 650);


    // ----------------------
    // 間
    // ----------------------

    setTimeout(() => {

      const message =
        $("message");

      if (message) {

        message.textContent =
          "……";

      }

    }, 1000);


    setTimeout(() => {

      const message =
        $("message");

      if (message) {

        message.textContent =
          "勝敗は……";

      }

    }, 1400);


    // ----------------------
    // 勝敗
    // ----------------------

    setTimeout(() => {

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

    }, 1900);

  }


  // ==========================
  // サーバーからのデータ
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


      const roomId =
        $("roomId");

      if (roomId) {

        roomId.textContent =
          m.roomId;

      }


      $("lobby")
        ?.classList
        .add("hidden");


      $("game")
        ?.classList
        .remove("hidden");


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

          button.classList.remove(
            "selected"
          );

          button.classList.remove(
            "used"
          );

          button.disabled =
            false;

        }

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


    // ========================
    // ゲーム状態
    // ========================

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


    // ========================
    // 待機
    // ========================

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


    // ========================
    // ラウンド結果
    // ========================

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

          if (!button) {
            continue;
          }


          // 今回選んだ数字
          // → 使用済みにする

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


          // 使用済みだけロック
          // 未使用は次ラウンドで使用可能

          button.disabled =
            button.classList.contains(
              "used"
            );

        }


        updateRemaining();


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

      }, 2800);


      return;

    }


    // ========================
    // ゲーム終了
    // ========================

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


    // ========================
    // 相手退出
    // ========================

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


  // ==========================
  // 起動
  // ==========================

  connect();

});
