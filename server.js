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
  if (ws.readyState === 1) {
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

// ==========================
// ゲーム状態
// ==========================

function publicState(room) {
  return {
    type: "state",

    roomId: room.id,

    status:
      room.players.length === 2
        ? "playing"
        : "waiting",

    round: room.round,

    p1Score:
      room.players[0]?.score ?? 0,

    p2Score:
      room.players[1]?.score ?? 0,

    p1Connected:
      !!room.players[0],

    p2Connected:
      !!room.players[1],

    // ★ プレイヤー名
    p1Name:
      room.players[0]?.name ?? "PLAYER 1",

    p2Name:
      room.players[1]?.name ?? "PLAYER 2"
  };
}

// ==========================
// ルーム作成
// ==========================

function makeRoom() {
  const id =
    crypto.randomBytes(3)
      .toString("hex")
      .toUpperCase();

  const room = {
    id,
    players: [],
    round: 1,
    moves: new Map(),
    finished: false
  };

  rooms.set(id, room);

  return room;
}

// ==========================
// ラウンドリセット
// ==========================

function resetRound(room) {
  room.moves.clear();

  for (const p of room.players) {
    p.ready = false;
  }
}

// ==========================
// HTTPサーバー
// ==========================

const server = http.createServer(
  async (req, res) => {

    try {

      const url =
        new URL(
          req.url,
          "http://localhost"
        );

      let pathname =
        url.pathname === "/"
          ? "/index.html"
          : url.pathname;

      const file =
        join(PUBLIC, pathname);

      const data =
        await readFile(file);

      const types = {
        ".html":
          "text/html; charset=utf-8",

        ".js":
          "text/javascript; charset=utf-8",

        ".css":
          "text/css; charset=utf-8",

        ".json":
          "application/json"
      };

      res.writeHead(
        200,
        {
          "Content-Type":
            types[extname(file)] ||
            "application/octet-stream"
        }
      );

      res.end(data);

    } catch {

      res.writeHead(404);

      res.end("Not Found");
    }
  }
);

// ==========================
// WebSocket
// ==========================

const wss =
  new WebSocketServer({
    server
  });

wss.on(
  "connection",
  ws => {

    let player = null;

    ws.on(
      "message",
      raw => {

        let msg;

        try {

          msg =
            JSON.parse(
              raw.toString()
            );

        } catch {

          return send(
            ws,
            {
              type: "error",
              message:
                "不正なデータです"
            }
          );
        }

        // ==========================
        // ルーム作成
        // ==========================

        if (
          msg.type === "create"
        ) {

          const room =
            makeRoom();

          player = {

            ws,

            n: 1,

            score: 0,

            used: [],

            name:
              String(
                msg.name ||
                "PLAYER 1"
              ).slice(0, 16)
          };

          room.players.push(player);

          player.room = room;

          send(
            ws,
            {
              type: "joined",

              roomId:
                room.id,

              player: 1,

              name:
                player.name
            }
          );

          broadcast(
            room,
            publicState(room)
          );

          return;
        }

        // ==========================
        // ルーム参加
        // ==========================

        if (
          msg.type === "join"
        ) {

          const id =
            String(
              msg.roomId || ""
            ).toUpperCase();

          const room =
            rooms.get(id);

          if (!room) {

            return send(
              ws,
              {
                type: "error",
                message:
                  "ルームが見つかりません"
              }
            );
          }

          if (
            room.players.length >= 2
          ) {

            return send(
              ws,
              {
                type: "error",
                message:
                  "このルームは満員です"
              }
            );
          }

          player = {

            ws,

            n: 2,

            score: 0,

            used: [],

            name:
              String(
                msg.name ||
                "PLAYER 2"
              ).slice(0, 16)
          };

          room.players.push(player);

          player.room = room;

          send(
            ws,
            {
              type: "joined",

              roomId:
                room.id,

              player: 2,

              name:
                player.name
            }
          );

          broadcast(
            room,
            publicState(room)
          );

          broadcast(
            room,
            {
              type: "message",

              text:
                "対戦相手が入室しました。ゲーム開始！"
            }
          );

          return;
        }

        // ==========================
        // ルーム未参加
        // ==========================

        if (!player?.room) {

          return send(
            ws,
            {
              type: "error",

              message:
                "先にルームを作成または参加してください"
            }
          );
        }

        const room =
          player.room;

        // ==========================
        // 数字選択
        // ==========================

        if (
          msg.type === "move"
        ) {

          if (
            room.players.length !== 2 ||
            room.finished
          ) {
            return;
          }

          const n =
            Number(msg.number);

          if (
            !Number.isInteger(n) ||
            n < 1 ||
            n > 9 ||
            player.used.includes(n)
          ) {

            return send(
              ws,
              {
                type: "error",
                message:
                  "その数字は使えません"
              }
            );
          }

          if (
            room.moves.has(
              player.n
            )
          ) {

            return send(
              ws,
              {
                type: "error",
                message:
                  "このラウンドは選択済みです"
              }
            );
          }

          player.used.push(n);

          room.moves.set(
            player.n,
            n
          );

          send(
            ws,
            {
              type: "waiting"
            }
          );

          if (
            room.moves.size < 2
          ) {
            return;
          }

          const a =
            room.moves.get(1);

          const b =
            room.moves.get(2);

          const r =
            result(a, b);

          if (r > 0) {
            room.players[0].score++;
          }

          if (r < 0) {
            room.players[1].score++;
          }

          // ==========================
          // ラウンド結果
          // ==========================

          broadcast(
            room,
            {
              type: "roundResult",

              round:
                room.round,

              p1: a,

              p2: b,

              result: r
            }
          );

          // ==========================
          // ゲーム終了
          // ==========================

          if (
            room.round >= 9 ||
            room.players.some(
              p => p.score >= 5
            )
          ) {

            room.finished = true;

            const winner =
              room.players[0].score ===
              room.players[1].score
                ? 0
                : room.players[0].score >
                  room.players[1].score
                    ? 1
                    : 2;

            broadcast(
              room,
              {
                type: "gameOver",

                winner
              }
            );

            return;
          }

          // ==========================
          // 次ラウンド
          // ==========================

          room.round++;

          resetRound(room);

          setTimeout(
            () => {

              broadcast(
                room,
                publicState(room)
              );

            },
            900
          );
        }
      }
    );

    // ==========================
    // 切断
    // ==========================

    ws.on(
      "close",
      () => {

        if (!player?.room) {
          return;
        }

        const room =
          player.room;

        room.players =
          room.players.filter(
            p => p !== player
          );

        broadcast(
          room,
          {
            type:
              "opponentLeft"
          }
        );

        if (
          room.players.length === 0
        ) {

          rooms.delete(
            room.id
          );
        }
      }
    );
  }
);

// ==========================
// 起動
// ==========================

server.listen(
  process.env.PORT || 3000,
  () => {

    console.log(
      `龍影オンライン: http://localhost:${process.env.PORT || 3000}`
    );
  }
);
