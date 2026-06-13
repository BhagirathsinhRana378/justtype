const { WebSocketServer } = require("ws");
const http = require("http");

const PORT = process.env.PORT || 3001;
const rooms = new Map();

const WORDS = [
  "the","and","of","to","in","is","you","that","it","he","was","for","on","are","as","with","his","they","at","be",
  "this","have","from","one","had","by","word","but","not","what","all","were","we","when","your","can","said","use",
  "an","each","she","do","how","if","will","up","out","many","then","them","so","some","her","make","like","him","into",
  "time","has","look","two","more","go","see","no","way","my","than","call","who","oil","its","now","find","long",
  "down","day","did","get","come","made","may","part","new","take","get","place","made","live","back","give","most","very",
  "about","above","across","action","answer","around","better","faster","typing","science","measure","rhythm","cadence",
  "engine","growth","sprint","memory","mistake","routine","program","develop","complex","elegant","minimal","builder",
  "layout","control","command","trigger","resolve","warning","optimal","systems","digital","product","network","service",
  "dynamic","balance","perfect","profile","numbers","context","history","support","process",
  "people","number","water","sound","years","thing","think","great","every","under","found","still","between","never",
  "start","another","course","family","always","country","system","school","group","during","without","before","study",
  "almost","change","design","manage","project","simple","active","future","nature","modern","focus","custom","device",
  "visual","source","output","create","import","render","client","server","button","screen","canvas","header","footer",
  "border","shadow","margin","padding","height","width","window","object","string","cursor"
];

function genText(len = 25) {
  const out = [];
  for (let i = 0; i < len; i++) out.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  return out.join(" ");
}

function genId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("JustType Race Server");
});

const wss = new WebSocketServer({ server });

function broadcast(roomId, msg) {
  const room = rooms.get(roomId);
  if (!room) return;
  const data = JSON.stringify(msg);
  room.players.forEach(p => {
    if (p.ws && p.ws.readyState === 1) p.ws.send(data);
  });
}

function serializePlayers(room) {
  return room.players.map(p => ({
    id: p.id, name: p.name, status: p.status, progress: p.progress, wpm: p.wpm, accuracy: p.accuracy, finishTime: p.finishTime,
  }));
}

wss.on("connection", (ws) => {
  let player = null;
  let roomId = null;

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw);

      switch (msg.type) {

        case "create_room": {
          const id = msg.roomId || genId();
          if (rooms.has(id)) {
            const room = rooms.get(id);
            if (room.status === "racing") {
              ws.send(JSON.stringify({ type: "error", message: "Race already in progress" }));
              break;
            }
            
            // Re-creating or re-joining: treat as join room
            const name = (msg.name || "Player").slice(0, 16);
            const existing = room.players.find(p => p.name === name && p.status === "waiting");
            if (existing) {
              room.players = room.players.filter(p => p !== existing);
            }

            player = {
              id: genId(),
              name,
              ws,
              progress: 0,
              wpm: 0,
              accuracy: 100,
              status: "waiting",
            };

            room.players.push(player);
            roomId = id;

            // If room was finished, reset room back to waiting lobby status
            if (room.status === "finished") {
              room.status = "waiting";
              room.text = genText(25);
              room.startTime = null;
              if (room.finishCheckTimer) {
                clearTimeout(room.finishCheckTimer);
                room.finishCheckTimer = null;
              }
              room.players.forEach(p => {
                p.status = "waiting";
                p.progress = 0;
                p.wpm = 0;
                p.accuracy = 100;
                p.finishTime = 0;
              });
            }

            ws.send(JSON.stringify({
              type: "room_joined",
              roomId: id,
              player: { id: player.id, name: player.name },
              text: room.text,
              players: serializePlayers(room),
            }));

            broadcast(id, {
              type: "player_joined",
              players: serializePlayers(room),
              roomStatus: room.status,
            });
            break;
          }
          const text = genText(25);

          player = {
            id: genId(),
            name: (msg.name || "Player").slice(0, 16),
            ws,
            progress: 0,
            wpm: 0,
            accuracy: 100,
            status: "waiting",
          };

          rooms.set(id, {
            id,
            status: "waiting",
            hostId: player.id,
            hostName: player.name,
            text,
            players: [player],
            startTime: null,
            finishCheckTimer: null,
          });

          roomId = id;

          ws.send(JSON.stringify({
            type: "room_created",
            roomId: id,
            player: { id: player.id, name: player.name },
            text,
            players: serializePlayers(rooms.get(id)),
          }));
          break;
        }

        case "join_room": {
          const id = (msg.roomId || "").toUpperCase();
          const room = rooms.get(id);

          if (!room) {
            ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
            break;
          }

          if (room.status === "racing") {
            ws.send(JSON.stringify({ type: "error", message: "Race already in progress" }));
            break;
          }

          const name = (msg.name || "Player").slice(0, 16);
          const existing = room.players.find(p => p.name === name && p.status === "waiting");
          if (existing) {
            room.players = room.players.filter(p => p !== existing);
          }

          player = {
            id: genId(),
            name,
            ws,
            progress: 0,
            wpm: 0,
            accuracy: 100,
            status: "waiting",
          };

          room.players.push(player);
          roomId = id;

          // If room was finished, reset room back to waiting lobby status
          if (room.status === "finished") {
            room.status = "waiting";
            room.text = genText(25);
            room.startTime = null;
            if (room.finishCheckTimer) {
              clearTimeout(room.finishCheckTimer);
              room.finishCheckTimer = null;
            }
            room.players.forEach(p => {
              p.status = "waiting";
              p.progress = 0;
              p.wpm = 0;
              p.accuracy = 100;
              p.finishTime = 0;
            });
          }

          ws.send(JSON.stringify({
            type: "room_joined",
            roomId: id,
            player: { id: player.id, name: player.name },
            text: room.text,
            players: serializePlayers(room),
          }));

          broadcast(id, {
            type: "player_joined",
            players: serializePlayers(room),
            roomStatus: room.status,
          });
          break;
        }

        case "play_again": {
          if (!player || !roomId) return;
          const room = rooms.get(roomId);
          if (!room) return;

          // Only allow resetting if the room is in finished state
          if (room.status !== "finished") return;

          // Reset room status
          room.status = "waiting";
          room.text = genText(25);
          room.startTime = null;
          if (room.finishCheckTimer) {
            clearTimeout(room.finishCheckTimer);
            room.finishCheckTimer = null;
          }

          // Reset all players in the room
          room.players.forEach(p => {
            p.status = "waiting";
            p.progress = 0;
            p.wpm = 0;
            p.accuracy = 100;
            p.finishTime = 0;
          });

          // Broadcast to all players in the room that the room has been reset
          broadcast(roomId, {
            type: "room_reset",
            text: room.text,
            players: serializePlayers(room),
          });
          break;
        }

        case "ready": {
          if (!player || !roomId) return;
          const room = rooms.get(roomId);
          if (!room) return;

          player.status = "ready";

          broadcast(roomId, {
            type: "player_ready",
            players: serializePlayers(room),
          });

          const allReady = room.players.every(p => p.status === "ready");
          if (allReady && room.players.length >= 2) {
            room.status = "countdown";
            broadcast(roomId, { type: "countdown_start", seconds: 3 });

            setTimeout(() => {
              if (!rooms.has(roomId)) return;
              room.status = "racing";
              room.startTime = Date.now();
              room.players.forEach(p => {
                p.status = "racing";
                p.progress = 0;
                p.wpm = 0;
                p.accuracy = 100;
                p.finishTime = 0;
              });
              broadcast(roomId, { type: "race_start" });
            }, 3000);
          }
          break;
        }

        case "progress": {
          if (!player || !roomId) return;
          const room = rooms.get(roomId);
          if (!room || room.status !== "racing") return;
          if (player.status !== "racing") return;

          const { index, accuracy: acc, wpm: pwpm } = msg;
          const textLen = room.text.length;
          player.progress = textLen > 0 ? Math.min(1, index / textLen) : 0;
          player.accuracy = acc;
          player.wpm = pwpm;

          if (player.progress >= 1 && player.status === "racing") {
            player.status = "completed";
            player.finishTime = Date.now() - room.startTime;

            broadcast(roomId, {
              type: "player_finished",
              playerId: player.id,
              name: player.name,
              wpm: player.wpm,
              accuracy: player.accuracy,
              finishTime: player.finishTime,
              players: serializePlayers(room),
            });

            checkGameFinished(roomId);
          }
          break;
        }

        case "ping":
          ws.send(JSON.stringify({ type: "pong", t: msg.t }));
          break;
      }
    } catch (e) {
      console.error("Server error:", e);
    }
  });

  ws.on("close", () => {
    if (roomId) {
      const room = rooms.get(roomId);
      if (room && player) {
        room.players = room.players.filter(p => p !== player);

        if (room.status === "racing") {
          player.status = "disconnected";
          checkGameFinished(roomId);
        }

        broadcast(roomId, {
          type: "player_left",
          players: serializePlayers(room),
        });

        if (room.players.length === 0) {
          rooms.delete(roomId);
        }
      }
    }
  });
});

function checkGameFinished(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const allDone = room.players.every(p =>
    p.status === "completed" || p.status === "disconnected"
  );
  if (allDone) {
    room.status = "finished";
    broadcast(roomId, {
      type: "game_finished",
      players: serializePlayers(room),
    });
  }
}

setInterval(() => {
  rooms.forEach((room, id) => {
    if (room.status !== "racing") return;

    broadcast(id, {
      type: "tick",
      players: serializePlayers(room),
    });
  });
}, 50);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[JustType Server] Running on http://localhost:${PORT}`);
});
