import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import crypto from "node:crypto";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC = join(ROOT, "public");

const rooms = new Map();

function send(ws, data) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(data));
  }
}

function broadcast(room, data) {
  for (const p of room.players) {
    send(p.ws, data);
  }
}

function result(a, b) {
  if (a === b) return 0;

  if (a === 1 && b === 9) return 1;
  if (a === 9 && b === 1) return -1;

  return a > b ? 1 : -1;
}

function publicState(room) {
  return {
    type: "state",

    roomId: room.id,

    status:
      room.players.length === 2 &&
      !room.finished &&
      room.phase === "playing"
        ? "playing"
        : "waiting",

    round: room.round,

    p1Score: room.players[0]?.score ?? 0,
    p2Score: room.players[1]?.score ?? 0,

    p1Connected: !!room.players[0],
    p2Connected: !!room.players[1],

    phase: room.phase
  };
}

function makeRoom() {
  const id = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  const room = {
    id,

    players: [],

    round: 1,

    moves: new Map(),

    phase: "waiting",

    finished: false,

    rematchReady: new Set()
  };

  rooms.set(id, room);

  return room;
}

function resetRound(room) {
  room.moves.clear();

  room.phase = "playing";

  for (const p of room.players) {
    p.ready = false;
  }
}

function resetGame(room) {
  room.round = 1;

  room.moves.clear();

  room.finished = false;

  room.phase = "playing";

  room.rematchReady.clear();

  for (const p of room.players) {
    p.score = 0;
    p.used = [];
    p.ready = false;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(
      req.url,
      "http://localhost"
    );

    let pathname =
      url.pathname === "/"
        ? "/index.html"
        : url.pathname;

    const file = join(PUBLIC, pathname);

    const data = await readFile(file);

    const types = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json"
    };

    res.writeHead(200, {
      "Content-Type":
        types[extname(file)] ||
        "application/octet-stream"
    });

    res.end(data);

  } catch {
    res.writeHead(404);
    res.end("Not Found");
  }
});

const wss = new WebSocketServer({
  server
});

wss.on("connection", ws => {

  let player = null;

  ws.on("message", raw => {

    let msg;

    try {
      msg = JSON.parse(
        raw.toString()
      );
    } catch {
      return send(ws, {
        type: "error",
        message: "不正なデータです"
      });
    }

    // ==================================================
    // ルーム作成
    // ==================================================

    if (msg.type === "create") {

      const room = makeRoom();

      player = {
        ws,
        n: 1,
        score: 0,
        used: [],
        ready: false,
        name: String(
          msg.name || "PLAYER 1"
        ).slice(0, 16)
      };

      room.players.push(player);

      player.room = room;

      send(ws, {
        type: "joined",
        roomId: room.id,
        player: 1,
        name: player.name
      });

      broadcast(
        room,
        publicState(room)
      );

      return;
    }

    // ==================================================
    // ルーム参加
    // ==================================================

    if (msg.type === "join") {

      const id = String(
        msg.roomId || ""
      ).toUpperCase();

      const room = rooms.get(id);

      if (!room) {
        return send(ws, {
          type: "error",
          message: "ルームが見つかりません"
        });
      }

      if (room.players.length >= 2) {
        return send(ws, {
          type: "error",
          message: "このルームは満員です"
        });
      }

      player = {
        ws,
        n: 2,
        score: 0,
        used: [],
        ready: false,
        name: String(
          msg.name || "PLAYER 2"
        ).slice(0, 16)
      };

      room.players.push(player);

      player.room = room;

      room.phase = "playing";

      send(ws, {
        type: "joined",
        roomId: room.id,
        player: 2,
        name: player.name
      });

      // 2人の名前を全員に送る
      broadcast(room, {
        type: "players",
        p1Name:
          room.players[0]?.name ||
          "PLAYER 1",
        p2Name:
          room.players[1]?.name ||
          "PLAYER 2"
      });

      broadcast(
        room,
        publicState(room)
      );

      broadcast(room, {
        type: "message",
        text: "対戦相手が入室しました。ゲーム開始！"
      });

      return;
    }

    // ==================================================
    // ルーム未参加
    // ==================================================

    if (!player?.room) {

      return send(ws, {
        type: "error",
        message:
          "先にルームを作成または参加してください"
      });

    }

    const room = player.room;

    // ==================================================
    // 数字選択
    // ==================================================

    if (msg.type === "move") {

      // 2人揃っていなければ無効
      if (
        room.players.length !== 2 ||
        room.finished ||
        room.phase !== "playing"
      ) {
        return;
      }

      const n = Number(msg.number);

      // 数字チェック
      if (
        !Number.isInteger(n) ||
        n < 1 ||
        n > 9
      ) {

        return send(ws, {
          type: "error",
          message: "その数字は使えません"
        });

      }

      // 使用済みチェック
      if (player.used.includes(n)) {

        return send(ws, {
          type: "error",
          message: "その数字はすでに使用済みです"
        });

      }

      // このラウンドで選択済み
      if (room.moves.has(player.n)) {

        return send(ws, {
          type: "error",
          message:
            "このラウンドは選択済みです"
        });

      }

      // 数字を使用済みに登録
      player.used.push(n);

      // 選択した数字を保存
      room.moves.set(
        player.n,
        n
      );

      // ================================================
      // ★重要
      // 自分が選んでも相手には影響しない
      // 相手は普通に数字を選べる
      // ================================================

      send(ws, {
        type: "waiting",
        numberSelected: true
      });

      // まだ片方しか選んでいない
      if (room.moves.size < 2) {

        return;
      }

      // ==================================================
      // 両者選択完了
      // ==================================================

      room.phase = "revealing";

      const a =
        room.moves.get(1);

      const b =
        room.moves.get(2);

      const r = result(a, b);

      if (r > 0) {
        room.players[0].score++;
      }

      if (r < 0) {
        room.players[1].score++;
      }

      // ==================================================
      // ラウンド結果
      // ==================================================

      broadcast(room, {
        type: "roundResult",

        round: room.round,

        p1: a,
        p2: b,

        result: r
      });

      // ==================================================
      // ゲーム終了判定
      // ==================================================

      if (
        room.round >= 9 ||
        room.players.some(
          p => p.score >= 5
        )
      ) {

        room.finished = true;

        room.phase = "finished";

        const winner =
          room.players[0].score ===
          room.players[1].score
            ? 0
            : room.players[0].score >
              room.players[1].score
              ? 1
              : 2;

        // 少し待ってからゲーム終了
        setTimeout(() => {

          broadcast(room, {
            type: "gameOver",

            winner,

            p1Score:
              room.players[0].score,

            p2Score:
              room.players[1].score
          });

        }, 3500);

        return;
      }

      // ==================================================
      // 次ラウンド
      // ==================================================

      room.round++;

      setTimeout(() => {

        resetRound(room);

        broadcast(
          room,
          publicState(room)
        );

      }, 3600);

      return;
    }

    // ==================================================
    // 再戦希望
    // ==================================================

    if (
      msg.type === "rematch"
    ) {

      if (
        room.players.length !== 2
      ) {
        return;
      }

      if (!room.finished) {
        return;
      }

      // このプレイヤーを再戦希望にする
      room.rematchReady.add(
        player.n
      );

      // 自分に待機表示
      send(ws, {
        type: "rematchWaiting"
      });

      // 2人ともOK
      if (
        room.rematchReady.size === 2
      ) {

        resetGame(room);

        // 再戦開始
        broadcast(room, {
          type: "rematchStart"
        });

        // 最新状態
        broadcast(
          room,
          publicState(room)
        );

      } else {

        // 相手を待つ
        broadcast(room, {
          type: "rematchWaitingOpponent"
        });

      }

      return;
    }

    // ==================================================
    // ロビーへ戻る
    // ==================================================

    if (
      msg.type === "leave"
    ) {

      try {
        ws.close();
      } catch {}

      return;
    }

  });

  // ==================================================
  // 切断
  // ==================================================

  ws.on("close", () => {

    if (!player?.room) {
      return;
    }

    const room =
      player.room;

    room.players =
      room.players.filter(
        p => p !== player
      );

    broadcast(room, {
      type: "opponentLeft"
    });

    if (
      room.players.length === 0
    ) {

      rooms.delete(room.id);

    } else {

      room.phase = "waiting";

      room.finished = false;

      room.moves.clear();

      room.rematchReady.clear();

      broadcast(
        room,
        publicState(room)
      );

    }

  });

});

// ==================================================
// サーバー起動
// ==================================================

server.listen(
  process.env.PORT || 3000,
  () => {

    console.log(
      `NUMBER CROSS ONLINE: http://localhost:${process.env.PORT || 3000}`
    );

  }
);
