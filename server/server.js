const { WebSocketServer } = require("ws");
const http = require("http");

const PORT = process.env.PORT || 3001;

const rooms = new Map(); // roomId -> roomState
let matchmakingQueue = []; // array of ws clients

const WORD_POOLS = {
  easy: ["the", "and", "of", "to", "in", "is", "you", "that", "it", "he", "was", "for", "on", "are", "as", "with", "his", "they", "at", "be", "this", "have", "from", "one", "had", "by", "word", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "use", "an", "each", "she", "do", "how", "if", "will", "up", "out", "many", "then", "them", "so", "some", "her", "make", "like", "him", "into", "time", "has", "look", "two", "more", "go", "see", "no", "way", "my", "than", "call", "who", "its", "now", "find", "long", "down", "day", "did", "get", "come", "made", "may", "part", "new", "take", "place", "live", "back", "give", "most", "very"],
  medium: ["about", "above", "across", "action", "actor", "admit", "adopt", "advice", "affect", "agency", "agent", "agree", "ahead", "allow", "almost", "alone", "along", "animal", "answer", "anxiety", "anyway", "apart", "appeal", "appear", "apply", "argue", "arise", "around", "arrive", "artist", "aspect", "assert", "assess", "assets", "assign", "assist", "assume", "assure", "athlete", "attach", "attack", "attend", "author", "better", "faster", "typing", "science", "measure", "latency", "rhythm", "cadence", "neural", "engine", "growth", "privacy", "sprint", "consult", "tactile", "memory", "mistake", "remedy", "routine", "program", "develop", "complex", "elegant", "minimal", "builder", "layout", "control", "command", "trigger", "resolve", "warning", "optimal", "systems", "digital", "product", "network", "service", "dynamic", "latency", "balance", "perfect", "profile", "numbers", "context", "history", "support", "process"],
  hard: ["mechanical", "optimization", "synchronous", "asynchronous", "configuration", "biometric", "encapsulation", "polymorphism", "telemetry", "analytical", "regression", "coefficients", "forecaster", "consistency", "performance", "hesitation", "calibration", "fingerprint", "sophistication", "discipline", "premature", "compatibility", "permissions", "vulnerability", "cryptography", "consequences", "transposition", "remediation", "metronome", "fluctuation", "acceleration", "inefficient", "juxtaposition", "extraordinary", "unprecedented", "revolutionary", "implementation", "unpredictable", "questionnaire", "xenophobia", "equilibrium", "characteristic", "acknowledgement", "infrastructure", "representative", "procrastinate", "misunderstanding", "satisfactorily"]
};

const PRESET_QUOTES = [
  "Simplicity is the ultimate sophistication. Leonardo da Vinci.",
  "Make it simple, but significant. Don Draper.",
  "If you cannot do great things, do small things in a great way.",
  "Knowledge is power. Information is liberating. Education is the premise of progress.",
  "Choose a job you love, and you will never have to work a day in your life.",
  "Design is not just what it looks like and feels like. Design is how it works.",
  "Move fast and break things. Unless you are breaking things, you are not moving fast enough.",
  "First, solve the problem. Then, write the code.",
  "Talk is cheap. Show me the code. Linus Torvalds, creator of Linux.",
  "The only way to do great work is to love what you do.",
  "Premature optimization is the root of all evil in programming.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts."
];

function generateRaceText(mode, length = 45) {
  if (mode === "quote") {
    return PRESET_QUOTES[Math.floor(Math.random() * PRESET_QUOTES.length)];
  }
  if (mode === "marathon") {
    length = 150; // Extra long texts for endurance
  }
  const pool = [...WORD_POOLS.easy, ...WORD_POOLS.medium, ...WORD_POOLS.hard];
  const words = [];
  for (let i = 0; i < length; i++) {
    words.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return words.join(" ");
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("JustType WebSocket Race Server is running fully .\n");
});

const wss = new WebSocketServer({ server });

function broadcastToRoom(roomId, messageObj) {
  const room = rooms.get(roomId);
  if (!room) return;

  const serialized = JSON.stringify(messageObj);
  room.players.forEach(p => {
    if (p.ws && p.ws.readyState === 1 && !p.isBoss) {
      p.ws.send(serialized);
    }
  });

  room.spectators.forEach(s => {
    if (s.readyState === 1) {
      s.send(serialized);
    }
  });
}

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getPointsForRank(rank) {
  if (rank === 1) return 10;
  if (rank === 2) return 8;
  if (rank === 3) return 6;
  if (rank === 4) return 4;
  return 2;
}

// Remove player helper
function removePlayer(room, player, roomId) {
  room.players = room.players.filter(p => p.id !== player.id);
  const realPlayers = room.players.filter(p => !p.isBoss);
  if (realPlayers.length === 0) {
    rooms.delete(roomId);
  } else {
    if (room.hostId === player.id) {
      const newHost = realPlayers[0];
      room.hostId = newHost.id;
      room.hostName = newHost.name;
    }
    broadcastToRoom(roomId, {
      type: "player_left",
      playerId: player.id,
      players: room.players.map(p => ({ id: p.id, name: p.name, status: p.status, carType: p.carType, isBoss: p.isBoss }))
    });
  }
}

// Active tick game loop running at 20Hz (every 50ms)
setInterval(() => {
  rooms.forEach((room, roomId) => {
    if (room.status !== "racing") return;

    const now = Date.now();
    const elapsedSec = (now - room.startTime) / 1000;
    const textLength = room.text.length;

    // 1. Process AI Bosses
    room.players.forEach(p => {
      if (p.isBoss) {
        let cps = (p.bossWpm * 5) / 60;

        // Boss rubber-banding: speed up/slow down relative to leading human
        const humanPlayers = room.players.filter(hp => !hp.isBoss && hp.status === "racing");
        if (humanPlayers.length > 0) {
          humanPlayers.sort((a, b) => b.progress - a.progress);
          const leader = humanPlayers[0];
          const bossProgress = p.progress;

          if (bossProgress < leader.progress - 0.08) {
            cps *= 1.25; // catch up
          } else if (bossProgress > leader.progress + 0.12) {
            cps *= 0.85; // slow down
          }
        }

        const charsTyped = cps * 0.05;
        p.index = Math.min(textLength, p.index + charsTyped);
        p.progress = p.index / textLength;
        p.wpm = Math.round(p.bossWpm);
        p.accuracy = 99;

        if (p.index >= textLength && p.status !== "completed") {
          p.status = "completed";
          p.finishTime = now;
          p.rank = room.players.filter(x => x.status === "completed").length;

          room.replays.push({
            t: now - room.startTime,
            playerId: p.id,
            type: "finish",
            wpm: p.wpm,
            acc: p.accuracy,
            pos: 1.0
          });

          broadcastToRoom(roomId, {
            type: "player_finished",
            playerId: p.id,
            rank: p.rank,
            name: p.name,
            wpm: p.wpm
          });
        }
      }
    });

    // 2. Mode Specific Rules (Elimination, Battle Royale, Team Relay)
    if (room.gameMode === "elimination") {
      const secondsInRound = Math.floor(elapsedSec);
      if (secondsInRound > 0 && secondsInRound % 15 === 0 && !room.eliminationsTriggered[secondsInRound]) {
        room.eliminationsTriggered[secondsInRound] = true;

        const activePlayers = room.players.filter(p => p.status === "racing");
        if (activePlayers.length > 1) {
          activePlayers.sort((a, b) => a.progress - b.progress);
          const toEliminate = activePlayers[0];
          toEliminate.status = "eliminated";

          room.replays.push({
            t: now - room.startTime,
            playerId: toEliminate.id,
            type: "mistake",
            wpm: toEliminate.wpm,
            acc: toEliminate.accuracy,
            pos: toEliminate.progress
          });

          broadcastToRoom(roomId, {
            type: "player_eliminated",
            playerId: toEliminate.id,
            name: toEliminate.name
          });
        }
      }
    }

    if (room.gameMode === "battle-royale") {
      const racers = room.players.filter(p => p.status === "racing");
      if (racers.length > 0) {
        const avgProgress = racers.reduce((sum, p) => sum + p.progress, 0) / racers.length;
        racers.forEach(p => {
          if (p.isBoss) return;
          if (p.progress < avgProgress) {
            p.shield = Math.max(0, p.shield - (2.5 * 0.05)); // drain
          }
          if (p.shield <= 0 && p.status === "racing") {
            p.status = "eliminated";
            broadcastToRoom(roomId, {
              type: "player_eliminated",
              playerId: p.id,
              name: p.name,
              reason: "Shield Depleted"
            });
          }
        });
      }
    }

    // 3. Draft/Slipstream check
    room.players.forEach(p1 => {
      if (p1.status !== "racing") return;
      p1.inSlipstream = false;

      room.players.forEach(p2 => {
        if (p1.id === p2.id || p2.status !== "racing") return;
        const diff = p2.progress - p1.progress;
        if (diff > 0.04 && diff < 0.12) {
          p1.inSlipstream = true;
        }
      });
    });

    // 4. Update Rankings
    const rankedPlayers = [...room.players];
    rankedPlayers.sort((a, b) => {
      if (a.status === "completed" && b.status === "completed") {
        return a.rank - b.rank;
      }
      if (a.status === "completed") return -1;
      if (b.status === "completed") return 1;
      if (a.status === "eliminated" && b.status === "eliminated") return 0;
      if (a.status === "eliminated") return 1;
      if (b.status === "eliminated") return -1;
      return b.progress - a.progress;
    });

    rankedPlayers.forEach((player, idx) => {
      const prevRank = player.lastRank;
      const curRank = idx + 1;
      player.lastRank = curRank;

      if (prevRank && curRank < prevRank && prevRank !== 1) {
        broadcastToRoom(roomId, {
          type: "overtake",
          playerId: player.id,
          name: player.name,
          overtookId: rankedPlayers[idx + 1]?.id,
          overtookName: rankedPlayers[idx + 1]?.name
        });
      }
    });

    // End condition
    const stillRacing = room.players.filter(p => p.status === "racing");
    const isOver = stillRacing.length === 0;

    if (isOver) {
      room.status = "finished";

      // If Circuit mode: compile score standings
      if (room.gameMode === "circuit") {
        // Award points based on rankings
        rankedPlayers.forEach((p, idx) => {
          const rank = p.status === "completed" ? (p.rank || idx + 1) : idx + 1;
          const pts = getPointsForRank(rank);
          room.circuitScores[p.id] = (room.circuitScores[p.id] || 0) + pts;
        });

        const standings = room.players.map(p => ({
          id: p.id,
          name: p.name,
          wpm: p.wpm,
          accuracy: p.accuracy,
          roundPoints: getPointsForRank(p.rank || 4),
          totalPoints: room.circuitScores[p.id] || 0
        })).sort((a, b) => b.totalPoints - a.totalPoints);

        broadcastToRoom(roomId, {
          type: "game_finished",
          players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            wpm: p.wpm,
            accuracy: p.accuracy,
            rank: p.rank || room.players.length,
            status: p.status
          })),
          replays: room.replays,
          isCircuit: true,
          circuitRound: room.circuitRound,
          maxRounds: room.maxRounds,
          standings
        });
      } else {
        broadcastToRoom(roomId, {
          type: "game_finished",
          players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            wpm: p.wpm,
            accuracy: p.accuracy,
            rank: p.rank || room.players.length,
            status: p.status
          })),
          replays: room.replays
        });
      }
      return;
    }

    // Broadcast positions update
    broadcastToRoom(roomId, {
      type: "tick",
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        index: Math.round(p.index),
        progress: p.progress,
        wpm: p.wpm,
        accuracy: p.accuracy,
        streak: p.streak,
        nitroActive: p.nitroActive,
        inSlipstream: p.inSlipstream,
        status: p.status,
        shield: p.shield,
        carType: p.carType,
        isBoss: p.isBoss,
        team: p.team
      }))
    });
  });
}, 50);

wss.on("connection", (ws) => {
  let currentPlayer = null;
  let currentRoomId = null;
  let isSpectating = false;

  ws.on("message", (messageData) => {
    try {
      const msg = JSON.parse(messageData);

      switch (msg.type) {
        case "ping":
          ws.send(JSON.stringify({
            type: "pong",
            t: msg.t,
            serverTime: Date.now()
          }));
          break;

        case "join_lobby":
          ws.send(JSON.stringify({
            type: "lobby_info",
            activeRooms: Array.from(rooms.entries()).map(([id, r]) => ({
              id,
              host: r.hostName,
              playersCount: r.players.length,
              mode: r.gameMode,
              status: r.status
            }))
          }));
          break;

        case "create_room": {
          const roomId = msg.roomId?.toUpperCase() || generateId();
          const roomText = generateRaceText(msg.gameMode || "sprint");

          currentPlayer = {
            id: generateId(),
            name: msg.name || "Anonymous Racer",
            ws: ws,
            index: 0,
            progress: 0,
            wpm: 0,
            accuracy: 100,
            streak: 0,
            nitroActive: false,
            inSlipstream: false,
            status: "waiting",
            shield: 100,
            lastRank: 1,
            carType: msg.carType || "sports",
            isBoss: false
          };

          const roomState = {
            id: roomId,
            status: "waiting",
            hostId: currentPlayer.id,
            hostName: currentPlayer.name,
            gameMode: msg.gameMode || "sprint",
            text: roomText,
            players: [currentPlayer],
            spectators: [],
            startTime: null,
            replays: [],
            eliminationsTriggered: {},
            
            // Circuit structures
            circuitRound: 1,
            maxRounds: 3,
            circuitScores: {},

            // Team relay structures
            redActiveIdx: 0,
            blueActiveIdx: 0
          };

          if (msg.gameMode === "ai-boss") {
            const boss = {
              id: "BOSS_" + generateId(),
              name: msg.bossName || "Neural Overlord",
              ws: null,
              index: 0,
              progress: 0,
              wpm: 0,
              accuracy: 99,
              streak: 0,
              nitroActive: false,
              inSlipstream: false,
              status: "waiting",
              shield: 100,
              lastRank: 2,
              carType: "boss_ship",
              isBoss: true,
              bossWpm: msg.bossWpm || 80
            };
            roomState.players.push(boss);
          }

          rooms.set(roomId, roomState);
          currentRoomId = roomId;

          ws.send(JSON.stringify({
            type: "room_created",
            roomId,
            player: { id: currentPlayer.id, name: currentPlayer.name },
            text: roomText,
            players: roomState.players.map(p => ({ id: p.id, name: p.name, status: p.status, carType: p.carType, isBoss: p.isBoss })),
            gameMode: roomState.gameMode
          }));
          break;
        }

        case "join_room": {
          const roomId = msg.roomId?.toUpperCase();
          const room = rooms.get(roomId);

          if (!room) {
            ws.send(JSON.stringify({ type: "error", message: "Room not found." }));
            break;
          }

          currentRoomId = roomId;

          // Check if reconnecting player
          const existingPlayer = room.players.find(p => p.name === msg.name && p.status === "disconnected");
          if (existingPlayer) {
            if (existingPlayer.disconnectTimeout) {
              clearTimeout(existingPlayer.disconnectTimeout);
              existingPlayer.disconnectTimeout = null;
            }
            currentPlayer = existingPlayer;
            currentPlayer.ws = ws;
            currentPlayer.status = room.status === "racing" ? "racing" : "waiting";

            ws.send(JSON.stringify({
              type: "room_joined",
              roomId,
              player: { id: currentPlayer.id, name: currentPlayer.name },
              text: room.text,
              players: room.players.map(p => ({ id: p.id, name: p.name, status: p.status, carType: p.carType, isBoss: p.isBoss })),
              gameMode: room.gameMode
            }));

            broadcastToRoom(roomId, {
              type: "player_joined",
              players: room.players.map(p => ({ id: p.id, name: p.name, status: p.status, carType: p.carType, isBoss: p.isBoss }))
            });
            break;
          }

          if (room.status === "racing" || room.status === "finished") {
            isSpectating = true;
            room.spectators.push(ws);
            ws.send(JSON.stringify({
              type: "spectate_joined",
              roomId,
              text: room.text,
              gameMode: room.gameMode,
              status: room.status,
              players: room.players.map(p => ({
                id: p.id,
                name: p.name,
                progress: p.progress,
                wpm: p.wpm,
                accuracy: p.accuracy,
                status: p.status,
                carType: p.carType,
                isBoss: p.isBoss
              }))
            }));
            break;
          }

          currentPlayer = {
            id: generateId(),
            name: msg.name || "Anonymous Racer",
            ws: ws,
            index: 0,
            progress: 0,
            wpm: 0,
            accuracy: 100,
            streak: 0,
            nitroActive: false,
            inSlipstream: false,
            status: "waiting",
            shield: 100,
            lastRank: room.players.length + 1,
            carType: msg.carType || "f1",
            isBoss: false
          };

          room.players.push(currentPlayer);

          ws.send(JSON.stringify({
            type: "room_joined",
            roomId,
            player: { id: currentPlayer.id, name: currentPlayer.name },
            text: room.text,
            players: room.players.map(p => ({ id: p.id, name: p.name, status: p.status, carType: p.carType, isBoss: p.isBoss })),
            gameMode: room.gameMode
          }));

          broadcastToRoom(roomId, {
            type: "player_joined",
            players: room.players.map(p => ({ id: p.id, name: p.name, status: p.status, carType: p.carType, isBoss: p.isBoss }))
          });
          break;
        }

        case "ready": {
          if (!currentPlayer || !currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          currentPlayer.status = "ready";

          broadcastToRoom(currentRoomId, {
            type: "player_ready",
            players: room.players.map(p => ({ id: p.id, name: p.name, status: p.status, carType: p.carType, isBoss: p.isBoss }))
          });

          const humanPlayers = room.players.filter(p => !p.isBoss);
          const allReady = humanPlayers.every(p => p.status === "ready");

          if (allReady) {
            room.status = "countdown";
            broadcastToRoom(currentRoomId, { type: "countdown_start", seconds: 5 });

            setTimeout(() => {
              if (rooms.has(currentRoomId)) {
                room.status = "racing";
                room.startTime = Date.now();

                // Divvy up Red/Blue teams for Relay
                if (room.gameMode === "team-relay") {
                  room.players.forEach((p, idx) => {
                    p.team = idx % 2 === 0 ? "red" : "blue";
                  });
                  room.redActiveIdx = 0;
                  room.blueActiveIdx = 0;
                }

                room.players.forEach(p => {
                  p.status = "racing";
                  p.index = 0;
                  p.progress = 0;
                  p.shield = 100;
                });
                broadcastToRoom(currentRoomId, { type: "race_start" });
              }
            }, 5000);
          }
          break;
        }

        case "progress": {
          if (!currentPlayer || !currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room || room.status !== "racing") return;
          if (currentPlayer.status !== "racing") return;

          const { index, typed, accuracy, streak, keyTelemetry, isMistake } = msg;

          // Team Relay Segment boundaries check
          if (room.gameMode === "team-relay") {
            const teamPlayers = room.players.filter(p => p.team === currentPlayer.team);
            const myTeamPos = teamPlayers.indexOf(currentPlayer);
            const activeIdx = currentPlayer.team === "red" ? room.redActiveIdx : room.blueActiveIdx;

            // Reject if it is not this player's active turn to run
            if (myTeamPos !== activeIdx) {
              break;
            }

            // Segments sizes
            const segmentSize = Math.floor(room.text.length / teamPlayers.length);
            const startLimit = myTeamPos * segmentSize;
            const endLimit = myTeamPos === teamPlayers.length - 1 ? room.text.length : (myTeamPos + 1) * segmentSize;

            // Clamp progress to this player's segment limits
            const relativeIndex = startLimit + index;
            
            // Advance active index if finished segment
            if (relativeIndex >= endLimit) {
              currentPlayer.status = "completed";
              currentPlayer.progress = endLimit / room.text.length;
              currentPlayer.index = endLimit;

              if (currentPlayer.team === "red") room.redActiveIdx++;
              else room.blueActiveIdx++;

              broadcastToRoom(currentRoomId, {
                type: "baton_passed",
                team: currentPlayer.team,
                nextIndex: activeIdx + 1
              });
            } else {
              currentPlayer.index = relativeIndex;
              currentPlayer.progress = relativeIndex / room.text.length;
            }
          } else {
            // Standard individual modes progress
            currentPlayer.index = index;
            currentPlayer.progress = index / room.text.length;
          }

          currentPlayer.accuracy = accuracy;
          currentPlayer.streak = streak;

          // Battle Royale: mistakes deal shield damage, streaks restore shield
          if (room.gameMode === "battle-royale") {
            if (isMistake) {
              currentPlayer.shield = Math.max(0, currentPlayer.shield - 5);
            } else if (streak > 0 && streak % 15 === 0) {
              currentPlayer.shield = Math.min(100, currentPlayer.shield + 2);
            }
          }

          // Anti-Cheat: Impossible WPM / timing variance check
          if (keyTelemetry && keyTelemetry.length >= 10) {
            const latencies = keyTelemetry.map(k => k.latency).filter(l => l > 0);
            if (latencies.length > 5) {
              const mean = latencies.reduce((s, x) => s + x, 0) / latencies.length;
              const variance = latencies.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / latencies.length;
              const stdDev = Math.sqrt(variance);

              if (stdDev < 5 && mean < 100) {
                currentPlayer.cheatingFlagged = true;
              }
            }
          }

          // WPM computation
          const elapsedMin = (Date.now() - room.startTime) / 60000;
          if (elapsedMin > 0.001) {
            const serverWPM = Math.round((currentPlayer.index / 5) / elapsedMin);
            if (serverWPM > 220) {
              currentPlayer.wpm = 220;
              currentPlayer.cheatingFlagged = true;
            } else {
              currentPlayer.wpm = serverWPM;
            }
          }

          // Nitro spark flag
          if (streak >= 100) {
            if (!currentPlayer.nitroActive) {
              currentPlayer.nitroActive = true;
              room.replays.push({
                t: Date.now() - room.startTime,
                playerId: currentPlayer.id,
                type: "boost",
                wpm: currentPlayer.wpm,
                acc: accuracy,
                pos: currentPlayer.progress
              });
            }
          } else {
            currentPlayer.nitroActive = false;
          }

          if (isMistake) {
            room.replays.push({
              t: Date.now() - room.startTime,
              playerId: currentPlayer.id,
              type: "mistake",
              wpm: currentPlayer.wpm,
              acc: accuracy,
              pos: currentPlayer.progress
            });
          }

          room.replays.push({
            t: Date.now() - room.startTime,
            playerId: currentPlayer.id,
            type: "key",
            wpm: currentPlayer.wpm,
            acc: accuracy,
            pos: currentPlayer.progress
          });

          // Check if finished entire text
          if (currentPlayer.index >= room.text.length && currentPlayer.status !== "completed") {
            currentPlayer.status = "completed";
            currentPlayer.finishTime = Date.now();
            currentPlayer.rank = room.players.filter(p => p.status === "completed").length;

            room.replays.push({
              t: Date.now() - room.startTime,
              playerId: currentPlayer.id,
              type: "finish",
              wpm: currentPlayer.wpm,
              acc: accuracy,
              pos: 1.0
            });

            broadcastToRoom(currentRoomId, {
              type: "player_finished",
              playerId: currentPlayer.id,
              rank: currentPlayer.rank,
              name: currentPlayer.name,
              wpm: currentPlayer.wpm
            });
          }
          break;
        }

        case "reaction":
          if (!currentRoomId) return;
          broadcastToRoom(currentRoomId, {
            type: "reaction_broadcast",
            playerId: currentPlayer?.id || "spectator",
            name: currentPlayer?.name || "Spectator",
            emoji: msg.emoji
          });
          break;

        case "voice_state":
          if (!currentRoomId || !currentPlayer) return;
          broadcastToRoom(currentRoomId, {
            type: "voice_state_broadcast",
            playerId: currentPlayer.id,
            name: currentPlayer.name,
            isMuted: msg.isMuted,
            isSpeaking: msg.isSpeaking
          });
          break;

        case "rematch": {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          // If Circuit Mode: Check if there's a next round
          if (room.gameMode === "circuit" && room.circuitRound < room.maxRounds) {
            room.circuitRound++;
            room.status = "waiting";
            room.startTime = null;
            room.replays = [];
            room.eliminationsTriggered = {};

            // Round 2 = Marathon, Round 3 = Elimination
            const roundMode = room.circuitRound === 2 ? "marathon" : "quote";
            room.text = generateRaceText(roundMode);

            room.players.forEach(p => {
              p.index = 0;
              p.progress = 0;
              p.wpm = 0;
              p.accuracy = 100;
              p.streak = 0;
              p.nitroActive = false;
              p.inSlipstream = false;
              p.status = "waiting";
              p.shield = 100;
              p.finishTime = null;
              p.rank = null;
            });

            broadcastToRoom(currentRoomId, {
              type: "rematch_triggered",
              text: room.text,
              players: room.players.map(p => ({ id: p.id, name: p.name, status: p.status, carType: p.carType, isBoss: p.isBoss })),
              circuitRound: room.circuitRound,
              isCircuit: true
            });
            break;
          }

          // Otherwise normal Sprint rematch reset
          room.circuitRound = 1;
          room.circuitScores = {};
          room.status = "waiting";
          room.startTime = null;
          room.replays = [];
          room.eliminationsTriggered = {};
          
          room.players.forEach(p => {
            p.index = 0;
            p.progress = 0;
            p.wpm = 0;
            p.accuracy = 100;
            p.streak = 0;
            p.nitroActive = false;
            p.inSlipstream = false;
            p.status = "waiting";
            p.shield = 100;
            p.lastRank = 1;
            p.finishTime = null;
            p.rank = null;
          });

          room.text = generateRaceText(room.gameMode === "ai-boss" ? "sprint" : room.gameMode);

          broadcastToRoom(currentRoomId, {
            type: "rematch_triggered",
            text: room.text,
            players: room.players.map(p => ({ id: p.id, name: p.name, status: p.status, carType: p.carType, isBoss: p.isBoss }))
          });
          break;
        }

        case "search_matchmaking": {
          if (!matchmakingQueue.includes(ws)) {
            matchmakingQueue.push(ws);
          }

          if (matchmakingQueue.length >= 2) {
            const player1WS = matchmakingQueue.shift();
            const player2WS = matchmakingQueue.shift();
            const roomId = "MATCH_" + generateId();
            const roomText = generateRaceText("sprint");

            const p1 = {
              id: generateId(),
              name: msg.name || "Racer 1",
              ws: player1WS,
              index: 0,
              progress: 0,
              wpm: 0,
              accuracy: 100,
              streak: 0,
              status: "waiting",
              shield: 100,
              carType: msg.carType || "sports"
            };

            const p2 = {
              id: generateId(),
              name: "Opponent Racer",
              ws: player2WS,
              index: 0,
              progress: 0,
              wpm: 0,
              accuracy: 100,
              streak: 0,
              status: "waiting",
              shield: 100,
              carType: "f1"
            };

            const roomState = {
              id: roomId,
              status: "waiting",
              hostId: p1.id,
              hostName: p1.name,
              gameMode: "sprint",
              text: roomText,
              players: [p1, p2],
              spectators: [],
              startTime: null,
              replays: [],
              eliminationsTriggered: {}
            };

            rooms.set(roomId, roomState);

            const initPayload = {
              type: "matchmaking_found",
              roomId,
              text: roomText,
              players: roomState.players.map(p => ({ id: p.id, name: p.name, status: p.status, carType: p.carType, isBoss: p.isBoss }))
            };

            p1.ws.send(JSON.stringify({ ...initPayload, player: { id: p1.id, name: p1.name } }));
            p2.ws.send(JSON.stringify({ ...initPayload, player: { id: p2.id, name: p2.name } }));
          } else {
            ws.send(JSON.stringify({ type: "matchmaking_queued" }));
          }
          break;
        }

        case "cancel_matchmaking":
          matchmakingQueue = matchmakingQueue.filter(client => client !== ws);
          ws.send(JSON.stringify({ type: "matchmaking_cancelled" }));
          break;
      }
    } catch (e) {
      console.error("Error handling message: ", e);
    }
  });

  ws.on("close", () => {
    matchmakingQueue = matchmakingQueue.filter(client => client !== ws);

    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        if (isSpectating) {
          room.spectators = room.spectators.filter(s => s !== ws);
        } else if (currentPlayer) {
          // Graceful Reconnect: set player status to disconnected and allow 15 seconds buffer
          if (room.status === "racing") {
            currentPlayer.status = "disconnected";
            currentPlayer.disconnectTimeout = setTimeout(() => {
              removePlayer(room, currentPlayer, currentRoomId);
            }, 15000);
          } else {
            removePlayer(room, currentPlayer, currentRoomId);
          }
        }
      }
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[JustType Server] Running on http://localhost:${PORT}`);
});
