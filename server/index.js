const { FRAME_RATE, COLORS } = require('./helpers/constHelper');
const { firstGameState, getVelocity, attachPlayerInGame } = require('./helpers/gameStateHelper');
const {
  initClientRooms,
  generateRoomID,
  assignRandomColor,
  generatePlayer,
  readFromHighscores,
  writeToHighscores
} = require('./utils/multiplayerUtils');

/// GAMEMODES
const GameFlowBase = require('./flow/GameFlowBase').GameFlowBase;
const GameFlowBR = require('./flow/GameFlowBR').GameFlowBR;
const GameFlowNC = require('./flow/GameFlowNC').GameFlowNC;
const GameFlowNW = require('./flow/GameFlowNW').GameFlowNW;

const express = require('express');
const ioServer = require('socket.io');

const app = express();
const PORT = process.env.PORT || 80;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express]: Application listens at http://localhost:${PORT}`);
})
const io = ioServer();
io.attach(server);


const USERS = {};
const CLIENTROOMS = {};
let HIGHSCORES = [];

app.use(express.static(__dirname + './../frontend'));
app.get('/userdata', (req, res) => {
  res.json(USERS);
});
app.get('/highscoresdata', (req, res) => {
  res.json(HIGHSCORES);
});
app.get('/roomdata', (req, res) => {
  res.json(initClientRooms(CLIENTROOMS));
});

readFromHighscores().then(data => HIGHSCORES = data);

io.on('connection', client => {
  client.on('newUser', handleNewUser);
  client.on('newRoom', handleNewRoom);
  client.on('disconnecting', handleDisconnect);
  client.on('joinRoom', handleJoinRoom);
  client.on('leaveRoom', handleLeaveRoom);
  client.on('checkPassword', handleCheckPassword);
  client.on('sendInvite', handleInvitePlayer);
  client.on('reqRoomPlayerColors', handleColorRequest);
  client.on('changeSnakeColor', handleChangeSnakeColor);
  client.on('isReady', handleIsReady);
  client.on('keydown', handleKeydown);

  function handleNewUser(newUser) {
    USERS[newUser.userid] = newUser;
    newUser.scores = [];
    newUser.roomScores = [];

    io.emit('updateUserList', USERS);
    client.emit('updateRoomList', initClientRooms(CLIENTROOMS));
    client.emit('updateHighscores', HIGHSCORES);
  }
  
  function handleNewRoom(newRoom) {
    newRoom.roomId = generateRoomID(CLIENTROOMS);

    if (newRoom.name === '' || newRoom.maxPlayers === '' || newRoom.gameMode === '') {
      client.emit('refuseNewRoom', 'empty');
      return;
    }
    if (newRoom.maxPlayers < 1 || newRoom.maxPlayers > 6) {
      client.emit('refuseNewRoom', 'maxPlayers');
      return;
    }
    let nameTaken = false;
    for (const value of Object.values(CLIENTROOMS)) {
      if (newRoom.name.toLowerCase() === value.name.toLowerCase()) nameTaken = true;
    }
    if (nameTaken) {
      client.emit('refuseNewRoom', 'nameTaken');
      return;
    }

    CLIENTROOMS[newRoom.roomId] = newRoom;
    handleJoinRoom(newRoom.roomId);
    io.emit('updateRoomList', initClientRooms(CLIENTROOMS));
  }

  function handleDisconnect() {
    if (USERS[client.id]) {
      handleLeaveRoom();

      delete USERS[client.id];
      io.emit('updateUserList', USERS);
    }
  }

  function handleJoinRoom(roomId) {
    const user = USERS[client.id];

    if (user.inRoom === roomId) return;

    const newRoom = CLIENTROOMS[roomId];

    if (newRoom.players.length >= newRoom.maxPlayers) {
      client.emit('roomAlreadyFull');
      return;
    }

    handleLeaveRoom();

    user.inRoom = roomId;
    user.snakeColor = assignRandomColor(newRoom);

    newRoom.players.push(user);
    client.join(roomId);

    if (newRoom.gameState != null) {
      client.emit('gameState', newRoom.gameState);
    }

    const flatRooms = initClientRooms(CLIENTROOMS);

    client.emit('joinRoom', flatRooms[roomId]);
    io.emit('updateRoomList', flatRooms);
    io.in(roomId).emit('updateRoomPlayerList', flatRooms[roomId].players);
  }
  
  function handleLeaveRoom() {
    const user = USERS[client.id];
    const roomId = user.inRoom;

    if (!roomId) return;
    const room = CLIENTROOMS[roomId];

    user.inRoom = null;
    user.isReady = false;
    user.roomScores = [];

    room.players = room.players.filter(player => player.userid !== client.id);

    if (room.gameState != null) {
      room.gameState.players = room.gameState.players.filter(player => player.id !== client.id);
      io.in(roomId).emit('gameState', room.gameState);
    }
    client.leave(roomId);

    if (room.players.length === 0) {
      delete CLIENTROOMS[roomId];
    } else {
      io.in(roomId).emit('updateRoomPlayerList', room.players);
      CheckEveryoneReady(room);
    }
    io.emit('updateRoomList', initClientRooms(CLIENTROOMS));
    client.emit('leaveRoom');
  }

  function handleCheckPassword(roomId, password) {
    const room = CLIENTROOMS[roomId];

    if (room) {
      if (room.password.toString() === password) {
        return client.emit('passwordValid', true, room.roomId);
      }
    }

    client.emit('passwordValid', false, roomId);
  }

  function handleInvitePlayer(playerId) {
    const inviter = USERS[client.id];
    const inviterRoom = CLIENTROOMS[inviter.inRoom];
    const player = USERS[playerId];
    const inRoom = player.inRoom;
    let failReason;

    if (inviterRoom == null) {
      failReason = 'noInviterRoom';
    } else if (inRoom != null) {
      failReason = 'alreadyInRoom';
    } else if (inviterRoom.players.length >= inviterRoom.maxPlayers) {
      failReason = 'roomFull';
    }

    if (failReason) client.emit('inviteFailed', failReason);
    else io.to(playerId).emit('playerInvited', inviterRoom.roomId, inviter.username);
  }

  function handleColorRequest() {
    const room = CLIENTROOMS[USERS[client.id].inRoom];
    const playerColors = room.players.map(p => p.snakeColor);
    const colorList = COLORS.filter(c => !playerColors.includes(c));

    client.emit('remainingRoomColors', client.id, colorList);
  }

  function handleChangeSnakeColor(color) {
    USERS[client.id].snakeColor = color;
    const room = CLIENTROOMS[USERS[client.id].inRoom];

    io.in(room.roomId).emit('updateRoomPlayerList', room.players);
  }

  function handleIsReady() {
    const user = USERS[client.id];
    const room = CLIENTROOMS[user.inRoom];

    if (room.gameStarted) return;

    user.isReady = true;
    io.in(room.roomId).emit('updateRoomPlayerList', room.players);

    if (room.gameState == null) {
      room.gameState = firstGameState(generatePlayer(user));
    } else {
      attachPlayerInGame(room.gameState, generatePlayer(user));
    }

    io.in(room.roomId).emit('gameState', room.gameState);
    CheckEveryoneReady(room);
  }

  function handleKeydown(keyCode) {
    if (!USERS[client.id]) return;

    const room = CLIENTROOMS[USERS[client.id].inRoom];

    if (typeof room === 'undefined') return;
    if (!room.gameStarted) return;

    try {
      keyCode = parseInt(keyCode);
    } catch (e) {
      console.error(e);
      return;
    }

    const vel = getVelocity(keyCode);
    const player = room.gameState.players.find(p => p.id === client.id);

    if (vel && player) {
      if (player.vel.x * vel.x + player.vel.y * vel.y !== -1 &&
          (player.vel.x !== vel.x && player.vel.y !== vel.y)) {
        if (player.velUpdate) {
          player.vel = vel;
          player.velUpdate = false;
        }
      }
    }
  }
});

function CheckEveryoneReady(room) {
  if (!room) return;
  if (room.players.every(player => player.isReady) && room.gameStarted === false) {
    room.gameStarted = true;

    startCountdown(room);

    room.players.forEach(player => player.isReady = false);
    io.in(room.roomId).emit('gameStart');
    io.emit('updateRoomList', initClientRooms(CLIENTROOMS));
  }
}

function startCountdown(room) {
  io.in(room.roomId).emit('gameState', room.gameState);
  io.in(room.roomId).emit('countDown', room.gameState.countdown);

  // countdown the timer
  const intervalId = setInterval(() => {
    if (room.gameState.countdown > 0) {
      room.gameState.countdown--;
      io.in(room.roomId).emit('countDown', room.gameState.countdown);
    } else {
      clearInterval(intervalId);
      io.in(room.roomId).emit('countDown', null);
      startGameInterval(room);
    }
  }, 1000);
}

function startGameInterval(room) {
  room.gameState.isMP = (room.players.length > 1);

  let gameLoop;
  switch (room.gameMode) {
    case 'standard':
      gameLoop = new GameFlowBase(room.gameState);
      break;
    case 'NC':
      gameLoop = new GameFlowNC(room.gameState);
      break;
    case 'INF':
      gameLoop = new GameFlowNW(room.gameState);
      break;
    case 'BR':
      gameLoop = new GameFlowBR(room.gameState);
      break;
    default:
      gameLoop = new GameFlowBase(room.gameState);
      break;
  }

  const intervalId = setInterval(() => {
    if (!room.gameState.isMP && room.gameState.players.length === 1 ||
        room.gameState.isMP && room.gameState.players.length > 1) {

      room.gameState = gameLoop.run();
      room.gameState.players.forEach(player => player.velUpdate = true);

      io.in(room.roomId).emit('gameState', room.gameState);
    } else {
      clearInterval(intervalId);
      if (room.gameState.isMP && room.gameState.players[0]) {
        const winner = room.gameState.players[0];
        const winnerPoints = gameLoop.evaluatePoints(winner);

        room.gameState.players[0].points = winnerPoints;
        room.gameState.scores.unshift({
          player: winner.id,
          color: winner.snakeColor,
          score: winnerPoints
        });
      }

      room.gameState.scores.forEach(score => {
        score.username = room.players.find(p => p.userid === score.player).username;
      });
      io.in(room.roomId).emit('gameOver', room.gameState.scores);

      let tempScore;
      room.gameState.scores.forEach(score => {
        tempScore = generateScore(room.gameMode, room.gameState.isMP, score);
        addScore(USERS[score.player].scores, tempScore);
        addScore(USERS[score.player].roomScores, tempScore);
        addScore(HIGHSCORES, tempScore, score.player);
      });

      room.gameStarted = false;
      room.gameState = null;

      io.emit('updateUserList', USERS);
      io.in(room.roomId).emit('updateRoomPlayerList', room.players);
      io.emit('updateRoomList', initClientRooms(CLIENTROOMS));
    }
  }, 1000 / FRAME_RATE);
}

function generateScore(gameMode, isMP, score) {
  const mode = gameMode !== 'standard' ? gameMode : isMP ? 'MP' : 'SP';
  const tempScore = {
    mode: mode,
    score: score.score
  };
  return tempScore;
}

function addScore(scoreBoard, score, id) {
  if (typeof scoreBoard.find(s => s.mode === score.mode) === 'undefined') {
    if (id) {
      score.username = USERS[id].username;
      score.avatar = USERS[id].avatar;
    }
    scoreBoard.push(score);
    scoreBoard.sort((a, b) => (a.score > b.score) ? -1 : ((b.score > a.score) ? 1 : 0));
  } else {
    const i = scoreBoard.find(s => s.mode === score.mode);
    if (i.score < score.score) {
      i.score = score.score;
      if (id) {
        i.username = USERS[id].username;
        i.avatar = USERS[id].avatar;
      }
      scoreBoard.sort((a, b) => (a.score > b.score) ? -1 : ((b.score > a.score) ? 1 : 0));
    }
  }

  if (id) writeToHighscores(HIGHSCORES);
  io.emit('updateHighscores', HIGHSCORES);
}
