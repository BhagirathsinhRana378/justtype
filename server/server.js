/* eslint-disable @typescript-eslint/no-require-imports */
const { WebSocketServer } = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DB_FILE = path.join(__dirname, "db.json");
const SECRET_KEY = "justtype_secret_key_12345";

function loadDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { users: {} };
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load db", e);
    return { users: {} };
  }
}

function saveDb(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save db", e);
  }
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateToken(username) {
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(username).digest("hex");
  return `${username}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [username, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", SECRET_KEY).update(username).digest("hex");
  if (signature === expectedSignature) {
    return username;
  }
  return null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", (err) => reject(err));
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(data));
}


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

const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
];

const QUOTES = [
  "To be or not to be, that is the question.",
  "All that glitters is not gold.",
  "A journey of a thousand miles begins with a single step.",
  "In the middle of difficulty lies opportunity.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Believe you can and you're halfway there.",
  "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
  "The only way to do great work is to love what you do.",
  "Strive not to be a success, but rather to be of value.",
  "Do not go where the path may lead, go instead where there is no path and leave a trail.",
  "Life is what happens when you're busy making other plans.",
  "The future belongs to those who believe in the beauty of their dreams."
];

const CODE_SNIPPETS = [
  "const [state, setState] = useState(initial);",
  "function add(a, b) { return a + b; }",
  "import React, { useEffect } from 'react';",
  "const result = items.filter(x => x.active);",
  "export default function App() { return <div />; }",
  "const elapsed = (Date.now() - startTime) / 1000;",
  "const wpm = Math.round((correctChars / 5) / elapsed);",
  "try { await fetchData(); } catch (err) { console.error(err); }",
  "if (user.isAdmin) { showDashboard(); } else { redirect(); }",
  "const promise = new Promise((resolve) => setTimeout(resolve, 100));"
];

function genNumbersText(len) {
  const out = [];
  for (let i = 0; i < len; i++) {
    out.push(Math.floor(Math.random() * 9000 + 1000).toString());
  }
  return out.join(" ");
}

function genTextFromSettings(settings) {
  const textType = settings.textType || "random";
  const wordCount = parseInt(settings.wordCount) || 25;
  const customText = settings.customText || "";

  if (textType === "custom" && customText) {
    return customText.trim().replace(/\s+/g, " ");
  }
  if (textType === "quotes") {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }
  if (textType === "code") {
    return CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
  }
  if (textType === "numbers") {
    return genNumbersText(wordCount);
  }
  
  const wordList = textType === "common" ? COMMON_WORDS : WORDS;
  const out = [];
  for (let i = 0; i < wordCount; i++) {
    out.push(wordList[Math.floor(Math.random() * wordList.length)]);
  }
  return out.join(" ");
}

function genId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

const server = http.createServer(async (req, res) => {
  // CORS support
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  try {
    if (pathname === "/api/signup" && req.method === "POST") {
      const { username, password } = await readBody(req);
      const trimmedUser = (username || "").trim();
      if (!trimmedUser || !password) {
        return sendJSON(res, 400, { success: false, error: "Username and password are required" });
      }
      if (trimmedUser.length < 3) {
        return sendJSON(res, 400, { success: false, error: "Username must be at least 3 characters" });
      }
      
      const db = loadDb();
      if (db.users[trimmedUser]) {
        return sendJSON(res, 400, { success: false, error: "Username already exists" });
      }

      db.users[trimmedUser] = {
        username: trimmedUser,
        password: hashPassword(password),
        sessions: []
      };
      saveDb(db);

      const token = generateToken(trimmedUser);
      return sendJSON(res, 200, { success: true, token, username: trimmedUser });
    }

    if (pathname === "/api/login" && req.method === "POST") {
      const { username, password } = await readBody(req);
      const trimmedUser = (username || "").trim();
      if (!trimmedUser || !password) {
        return sendJSON(res, 400, { success: false, error: "Username and password are required" });
      }

      const db = loadDb();
      const user = db.users[trimmedUser];
      if (!user || user.password !== hashPassword(password)) {
        return sendJSON(res, 401, { success: false, error: "Invalid username or password" });
      }

      const token = generateToken(trimmedUser);
      return sendJSON(res, 200, { success: true, token, username: trimmedUser, sessions: user.sessions || [] });
    }

    if (pathname === "/api/sync-sessions" && req.method === "POST") {
      const authHeader = req.headers["authorization"] || "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      const username = verifyToken(token);
      if (!username) {
        return sendJSON(res, 401, { success: false, error: "Unauthorized" });
      }

      const { sessions } = await readBody(req);
      if (!Array.isArray(sessions)) {
        return sendJSON(res, 400, { success: false, error: "Sessions must be an array" });
      }

      const db = loadDb();
      const user = db.users[username];
      if (!user) {
        return sendJSON(res, 404, { success: false, error: "User not found" });
      }

      if (!user.sessions) user.sessions = [];
      
      const existingIds = new Set(user.sessions.map(s => s.id || s.timestamp.toString()));
      let merged = false;
      for (const s of sessions) {
        const sId = s.id || s.timestamp.toString();
        if (!existingIds.has(sId)) {
          user.sessions.push(s);
          merged = true;
        }
      }

      if (merged) {
        user.sessions.sort((a, b) => b.timestamp - a.timestamp);
        if (user.sessions.length > 100) {
          user.sessions = user.sessions.slice(0, 100);
        }
        saveDb(db);
      }

      return sendJSON(res, 200, { success: true, sessions: user.sessions });
    }

    if (pathname === "/api/leaderboard" && req.method === "GET") {
      const authHeader = req.headers["authorization"] || "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      const username = verifyToken(token);
      if (!username) {
        return sendJSON(res, 401, { success: false, error: "Unauthorized" });
      }

      const db = loadDb();
      const entries = [];
      for (const uName in db.users) {
        const u = db.users[uName];
        if (u.sessions && u.sessions.length > 0) {
          let best = u.sessions[0];
          for (const s of u.sessions) {
            if (s.wpm > best.wpm || (s.wpm === best.wpm && s.accuracy > best.accuracy)) {
              best = s;
            }
          }
          entries.push({
            username: uName,
            wpm: best.wpm,
            accuracy: best.accuracy,
            layout: best.layout || "qwerty",
            timestamp: best.timestamp
          });
        }
      }

      // Sort: highest WPM desc, highest accuracy desc, oldest timestamp asc
      entries.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy || a.timestamp - b.timestamp);

      // Rank entries
      const rankedEntries = entries.map((entry, idx) => ({
        rank: idx + 1,
        username: entry.username,
        wpm: entry.wpm,
        accuracy: entry.accuracy,
        layout: entry.layout,
        timestamp: entry.timestamp
      }));

      return sendJSON(res, 200, { success: true, leaderboard: rankedEntries });
    }

    // Default response
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("JustType Race Server");

  } catch (err) {
    console.error("HTTP handler error:", err);
    return sendJSON(res, 500, { success: false, error: "Internal Server Error" });
  }
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
          const settings = msg.settings || {
            duration: "unlimited",
            wordCount: "25",
            textType: "random",
            strictness: "relaxed",
            aiDiff: "medium",
            goal: "finish",
            customText: ""
          };

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
              room.text = genTextFromSettings(room.settings);
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
              settings: room.settings,
              players: serializePlayers(room),
            }));

            broadcast(id, {
              type: "player_joined",
              players: serializePlayers(room),
              roomStatus: room.status,
            });
            break;
          }

          const text = genTextFromSettings(settings);

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
            settings,
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
            settings,
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
            room.text = genTextFromSettings(room.settings);
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
            settings: room.settings,
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

          if (room.status !== "finished") return;

          // Reset room status
          room.status = "waiting";
          room.text = genTextFromSettings(room.settings);
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
            settings: room.settings,
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

              // Start Server Duration Timeout Limit if configured
              if (room.settings && room.settings.duration !== "unlimited") {
                const durationMs = parseInt(room.settings.duration) * 1000;
                if (room.finishCheckTimer) clearTimeout(room.finishCheckTimer);
                
                room.finishCheckTimer = setTimeout(() => {
                  if (!rooms.has(roomId)) return;
                  if (room.status !== "racing") return;
                  
                  room.players.forEach(p => {
                    if (p.status === "racing") {
                      p.status = "completed";
                      p.finishTime = durationMs;
                    }
                  });
                  
                  room.status = "finished";
                  broadcast(roomId, {
                    type: "game_finished",
                    players: serializePlayers(room),
                  });
                }, durationMs);
              }
            }, 3000);
          }
          break;
        }

        case "progress": {
          if (!player || !roomId) return;
          const room = rooms.get(roomId);
          if (!room || room.status !== "racing") return;
          if (player.status !== "racing") return;

          const { typed, keystrokes } = msg;
          if (typeof typed !== "string") return;

          const roomWords = room.text.split(" ");
          const typedWords = typed.split(" ");

          let correctChars = 0;

          for (let i = 0; i < typedWords.length; i++) {
            const expected = roomWords[i];
            const actual = typedWords[i];

            if (i === typedWords.length - 1) {
              if (expected && actual && expected.startsWith(actual)) {
                correctChars += actual.length;
              }
            } else {
              if (actual === expected) {
                correctChars += expected.length + 1;
              }
            }
          }

          const elapsedMin = (Date.now() - room.startTime) / 1000 / 60;
          let wpm = Math.round((correctChars / 5) / Math.max(elapsedMin, 0.01));

          if (wpm > 250) {
            console.warn(`[Anti-Cheat] Player ${player.name} flagged for WPM: ${wpm}`);
            wpm = 0;
            correctChars = 0;
          }

          let progressVal = roomWords.length > 0 ? (typedWords.length - 1) / roomWords.length : 0;
          if (typedWords.length === roomWords.length) {
            const lastExpected = roomWords[roomWords.length - 1];
            const lastActual = typedWords[typedWords.length - 1];
            if (lastExpected && lastActual && lastActual.length >= lastExpected.length) {
              progressVal = 1;
            }
          }
          if (typed.length >= room.text.length) {
            progressVal = 1;
          }
          player.progress = Math.min(1, Math.max(0, progressVal));
          player.accuracy = keystrokes > 0 ? Math.min(100, Math.round((correctChars / keystrokes) * 100)) : 100;
          player.wpm = wpm;

          if (player.progress >= 1 && player.status === "racing") {
            const elapsedSeconds = (Date.now() - room.startTime) / 1000;
            if (elapsedSeconds < 2) {
              console.warn(`[Anti-Cheat] Player ${player.name} finished instantly in ${elapsedSeconds}s`);
              player.status = "cheated";
              player.progress = 0;
              player.wpm = 0;
            } else {
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
    if (room.finishCheckTimer) {
      clearTimeout(room.finishCheckTimer);
      room.finishCheckTimer = null;
    }
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

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[JustType Server Error] Port ${PORT} is already in use. Another server instance might be running. Exiting gracefully.`);
    process.exit(0);
  } else {
    throw err;
  }
});

wss.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[JustType WebSocket Server Error] Port ${PORT} is already in use. Exiting gracefully.`);
    process.exit(0);
  } else {
    console.error("WebSocket Server Error:", err);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[JustType Server] Running on http://localhost:${PORT}`);
});
