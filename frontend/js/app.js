const socket = io();

const mainScreen		= document.getElementById('main');
const defaultScreen		= document.getElementById('default-screen');
const NoConScreen		= document.getElementById('404-screen');
const roomList			= document.getElementById('room-list');
const roomListContainer	= document.getElementById('room-list-container');
const playerList		= document.getElementById('player-list');
const playerListContainer = document.getElementById('player-list-container');
const loginForm			= document.getElementById('login-form');
const roomPopup			= document.getElementById('add-room-popup');
const roomPreviewPopup	= document.getElementById('room-preview-popup');
const roomScreen		= document.getElementById('room-screen');
const roomPlayerList	= document.getElementById('room-player-list');
const timer				= document.getElementById('timer');

const INP_userName		= document.getElementById('INP_user-name');
const INP_roomName		= document.getElementById('INP_room-name');
const INP_playerMax		= document.getElementById('INP_player-max');
const INP_passwordNew	= document.getElementById('INP_password');
const INP_passwordEnter	= document.getElementById('INP_enter-room-pw');
const SEL_gameMode		= document.getElementById('SEL_game-mode');
const FORM_addRoom		= document.getElementById('FORM_add-room');
const BTN_addRoom		= document.getElementById('BTN_add-room');
const BTN_ready			= document.getElementById('BTN_ready');
const BTN_leave			= document.getElementById('BTN_leave');
const BTN_closeAdd		= document.getElementById('BTN_close_add');
const BTN_closePrev		= document.getElementById('BTN_close_prev');
const FORM_enterRoom	= document.getElementById('FORM_enter-room-pw');
const IMG_avatarSelection = document.getElementById('IMG_avatar-selection');
const CB_avatarType		= document.getElementById('CB_avatar-type');
const CB_avatarGender	= document.getElementById('CB_avatar-gender');
const LBL_avatarType	= document.getElementById('LBL_avatar-type');
const LBL_avatarGender	= document.getElementById('LBL_avatar-gender');
const BTN_avatarReroll	= document.getElementById('BTN_avatar-reroll');
const BTN_fullScreen	= document.getElementById('BTN_full-screen');
const LBL_fullScreen	= document.getElementById('LBL_full-screen');
const TBL_highscores	= document.getElementById('TBL_highscores');
const DIV_highscores	= document.getElementById('DIV_highscores');
const DIV_status		= document.getElementById('DIV_status');
const DIV_statusButtons = document.getElementById('DIV_status-buttons');
const SPA_status		= document.getElementById('SPA_status');
const BTN_statusYes		= document.getElementById('BTN_status-yes');
const BTN_statusNo		= document.getElementById('BTN_status-no');

const COLOR_STATUS_GREEN 	= '#C2FFB3';
const COLOR_STATUS_RED 		= '#FFC2B3';
const COLOR_STATUS_YELLOW 	= '#FFD966';
const COLOR_STATUS_LIGHT 	= '#F8F8F8';

window.addEventListener('load', init);
loginForm.addEventListener('submit', login);
BTN_addRoom.addEventListener('click', renderAddRoomPopup);
FORM_addRoom.addEventListener('submit', addRoom);
BTN_ready.addEventListener('click', readyClick);
BTN_leave.addEventListener('click', () => socket.emit('leaveRoom'));
BTN_closeAdd.addEventListener('click', closeAddRoomPopup);
BTN_closePrev.addEventListener('click', closeRoomPrevPopup);
FORM_enterRoom.addEventListener('submit', submitJoinRoom);
CB_avatarType.addEventListener('change', rerollAvatar);
CB_avatarGender.addEventListener('change', rerollAvatar);
BTN_avatarReroll.addEventListener('click', rerollAvatar);
BTN_fullScreen.addEventListener('change', setFullScreen);

socket.on('updateUserList', updateUserList);
socket.on('updateRoomList', updateRoomList);
socket.on('updateRoomPlayerList', updateRoomPlayerList);
socket.on('updateHighscores', handleUpdateHighscores);
socket.on('joinRoom', handleJoinRoom);
socket.on('leaveRoom', handleLeaveRoom);
socket.on('roomAlreadyFull', handleRoomAlreadyFull);
socket.on('refuseNewRoom', handleRefuseNewRoom);
socket.on('passwordValid', handlePasswordValidation);
socket.on('remainingRoomColors', setColorPicker);
socket.on('playerInvited', handleInvited);
socket.on('inviteFailed', handleInviteFailed);
socket.on('gameStart', handleGameStart);
socket.on('gameOver', handleGameOver);
socket.on('disconnect', handleDisconnect);

function updateUserList(Users) {
  playerList.innerHTML = '';

  const usersSorted = Object.values(Users);
  usersSorted.sort((a, b) => {
    if (a.scores.length === 0) return 1;
    if (b.scores.length === 0) return -1;
    return (a.scores[0].score > b.scores[0].score) ? -1 : 1;
  });

  for (const user of usersSorted) {
    addListItem(playerList, user);
  }
}

function updateRoomList(clientRooms) {
  while (roomList.childElementCount > 1) {
    roomList.removeChild(roomList.lastChild);
  }

  for (const room of Object.values(clientRooms)) {
    addListItem(roomList, room);

    if (room.players.some(p => p.userid === socket.id)) {
      document.getElementById(room.roomId).classList.add('joined');
    } else {
      document.getElementById(room.roomId).classList.remove('joined');
    }
  }
}

function updateRoomPlayerList(players) {
  roomPlayerList.innerHTML = '';

  players = Object.values(players);
  players.forEach(player => addListItem(roomPlayerList, player));

  for (let i = timers.length - 1; i >= 0; i--) {
    if (timers[i].type === 'game-started') {
      clearInterval(timers[i].intervalId);
      timers.splice(i, 1);
    }
  }
}

function handleUpdateHighscores(highscores) {
  TBL_highscores.innerHTML = '';

  if (highscores.every(scr => scr.score === 0)) DIV_highscores.classList.add('empty');
  else {
    DIV_highscores.classList.remove('empty');
    for (let i = highscores.length - 1; i >= 0; i--) {
      const entry = highscores[i];

      if (entry.score > 0) {
        const row = TBL_highscores.insertRow(0);
        const playerCell = row.insertCell(0);
        const modusCell  = row.insertCell(1);
        const pointsCell = row.insertCell(2);

        row.classList.add('table-row');

        const playerDIV = document.createElement('div');
        const playerP = document.createElement('p');
        playerP.innerHTML = `${entry.username}`;
        setAvatarImg(entry.avatar, playerDIV, false, 3.5);

        playerDIV.append(playerP),
            playerCell.append(playerDIV);

        let modeText = getGameModeText(entry.mode);
        modeText = entry.mode === 'SP' ? 'Single Player' : modeText;
        modeText = entry.mode === 'MP' ? 'Multi Player' : modeText;

        modusCell.innerHTML = `${modeText.length > 0 ? modeText : entry.mode}`;
        pointsCell.innerHTML = `${entry.score}`;
      }
    }
  }
}

function handleJoinRoom(room) {
  closeAddRoomPopup();
  openMainView(roomScreen);
  document.getElementById('headerRoom').innerHTML = room.name;
  document.getElementById('headerRoomModi').innerHTML = getGameModeText(room.gameMode);
}

function handleLeaveRoom() {
  openMainView(defaultScreen);
  BTN_ready.disabled = false;
}

function handleRoomAlreadyFull() {
  status('This room is already full.', COLOR_STATUS_RED);
  closeRoomPrevPopup();
}

function handleRefuseNewRoom(reason) {
  switch (reason) {
    case 'empty':
      status('Please fill in all fields.', COLOR_STATUS_RED);
      break;
    case 'maxPlayers':
      status('The maximum number of players must be between 1 and 6.', COLOR_STATUS_RED);
      break;
    case 'nameTaken':
      status('The room name is already taken.', COLOR_STATUS_RED);
      break;
  }
}

function handlePasswordValidation(isValid, roomId) {
  FORM_enterRoom.classList.add('submitted');

  if (isValid) {
    INP_passwordEnter.classList.remove('invalid');
    socket.emit('joinRoom', roomId);
    closeRoomPrevPopup();
  } else {
    INP_passwordEnter.classList.add('invalid');
    INP_passwordEnter.style.outline = 'none';
  }
}

function setColorPicker(playerId, colors) {
  const picker = document.getElementById(`color${playerId}`);
  picker.classList.add('active');
  picker.innerHTML = '';

  for (let i = 0; i < colors.length; i++) {
    const div = document.createElement('div');

    div.classList.add('color-selector');
    div.style.backgroundColor = colors[i];
    div.addEventListener('click', () => {
      socket.emit('changeSnakeColor', colors[i]);
    });

    picker.appendChild(div);
  }
}

function handleInvited(inviterInRoom, invitername) {
  status(`Sie wurden von ${invitername} invited you to the room. Accept?`, COLOR_STATUS_LIGHT, 0, true);

  addStatusEventListner(BTN_statusYes, acceptInvite.bind(this, inviterInRoom));
  addStatusEventListner(BTN_statusNo, denyInvite);
}

function handleGameStart() {
  const listElements = roomPlayerList.children;
  for (let i = 0; i < listElements.length; i++) {
    listElements[i].classList.remove('ready');
  }

  for (let i = timers.length - 1; i >= 0; i--) {
    if (timers[i].type === 'ready') {
      clearInterval(timers[i].intervalId);
      timers.splice(i, 1);
    }
  }
}

function handleGameOver() {
  BTN_ready.disabled = false;
  BTN_leave.disabled = false;

  const colorPicker = document.getElementById(`color${socket.id}`);
  colorPicker.disabled = false;
  colorPicker.style.pointerEvents = 'auto';
}

function handleDisconnect() {
  document.body.style.gridTemplateColumns = '1fr';
  hideDiv(roomListContainer, playerListContainer);
  LBL_fullScreen.classList.add('disabled');
  clearStatus();
  openMainView(NoConScreen);
}

function init() {
  const seed = Math.floor(Math.random() * 1000);
  IMG_avatarSelection.src = `https://avatars.dicebear.com/api/identicon/${seed}.svg`;

  CB_avatarType.checked = false;
  BTN_fullScreen.checked = false;
}

function login(e) {
  e.preventDefault();

  const newUser = {
    userid: socket.id,
    username: (INP_userName.value === '') ? 'Guest' : INP_userName.value,
    inRoom: null,
    isReady: false,
    snakeColor: null,
    avatar: IMG_avatarSelection.src
  };

  socket.emit('newUser', newUser);

  openMainView(defaultScreen);
  showDiv(roomListContainer, playerListContainer, LBL_fullScreen);
  document.body.style.gridTemplateColumns = 'minmax(200px, 1fr) 3fr minmax(200px, 1fr)';
  document.addEventListener('keydown', keydown, {
    capture: true,
    passive: false
  });
}

function renderAddRoomPopup() {
  openMainView(roomPopup, true);
  INP_roomName.focus();
}

function addRoom(e) {
  e.preventDefault();

  let isValid = true;
  isValid = INP_roomName.validity.valid ? isValid : false;
  isValid = INP_playerMax.validity.valid ? isValid : false;
  isValid = SEL_gameMode.validity.valid ? isValid : false;

  FORM_addRoom.classList.add('submitted');

  if (isValid) {
    const newRoom = {
      name:		 INP_roomName.value,
      maxPlayers : INP_playerMax.value,
      roomId :	 '',
      password:	 INP_passwordNew.value === '' ? null : INP_passwordNew.value,
      isPrivate:	 INP_passwordNew.value === '' ? false : true,
      gameMode:	 SEL_gameMode.value,
      players:	 [],
      gameStarted: false,
      gameState:	 null
    };
    socket.emit('newRoom', newRoom);
  }
}

function readyClick() {
  BTN_ready.disabled = true;
  BTN_ready.blur();
  socket.emit('isReady');
}

function closeAddRoomPopup() {
  FORM_addRoom.reset();
  FORM_addRoom.classList.remove('submitted');
  hideDiv(roomPopup);
}

function acceptInvite(roomId) {
  socket.emit('joinRoom', roomId);
  clearStatus();
}

function denyInvite() {
  clearStatus();
}

function closeRoomPrevPopup() {
  FORM_enterRoom.reset();
  FORM_enterRoom.classList.remove('submitted');
  hideDiv(roomPreviewPopup);
}

function rerollAvatar() {
  const seed		= Math.floor(Math.random() * 1000000);
  const gender	= CB_avatarGender.checked ? 'female' : 'male';
  const type		= CB_avatarType.checked   ? gender : 'identicon';
  const avatarUrl	= `https://avatars.dicebear.com/api/${type}/${seed}.svg`;

  if (CB_avatarType.checked) {
    LBL_avatarType.innerHTML = CB_avatarGender.checked ? '👧' : '👦';
    LBL_avatarGender.style.opacity = 1;
    LBL_avatarGender.style.pointerEvents = 'inherit';
  } else {
    LBL_avatarType.innerHTML = '&plusb;';
    LBL_avatarGender.style.opacity = 0;
    LBL_avatarGender.style.pointerEvents = 'none';
  }
  LBL_avatarGender.innerHTML = CB_avatarGender.checked ? '&#9792;' : '&#9794;';

  IMG_avatarSelection.src = avatarUrl;
}

function setFullScreen(e) {
  if (e.target.checked) {
    document.body.style.gridTemplateColumns = '0 100vw 0';
    roomScreen.style.gridTemplateColumns = 'minmax(200px, 1fr) 3fr';
    LBL_fullScreen.innerHTML = '-';

    const newCanvasSize = vmin(80) > 600 ? vmin(80) : 600;

    document.body.style.setProperty('--CANVAS-WIDTH', `${newCanvasSize}px`);
    resizeCanvas(newCanvasSize, newCanvasSize);
  } else {
    document.body.style.gridTemplateColumns = 'minmax(200px, 1fr) 3fr minmax(200px, 1fr)';
    roomScreen.style.gridTemplateColumns = 'minmax(200px, 1fr) 2fr';

    LBL_fullScreen.innerHTML = '+';
    document.body.style.setProperty('--CANVAS-WIDTH', '600px');
    resizeCanvas(600, 600);
  }
}

function submitJoinRoom(e) {
  e.preventDefault();
  const roomId 		= FORM_enterRoom.dataset.roomId;
  const roomIsPrivate = FORM_enterRoom.dataset.roomIsPrivate;

  if (roomIsPrivate === true) {
    socket.emit('checkPassword', roomId, INP_passwordEnter.value);
  } else {
    socket.emit('joinRoom', roomId);
    closeRoomPrevPopup();
  }
}

function invitePlayer(player) {
  BTN_statusNo.removeEventListener('click', dontInvitePlayer);
  socket.emit('sendInvite', player.userid);
  clearStatus();
}

function dontInvitePlayer() {
  BTN_statusYes.removeEventListener('click', invitePlayer);
  clearStatus();
}

function handleInviteFailed(failReason) {
  let text;
  switch (failReason) {
    case 'noInviterRoom':
      text = 'You need to be in a room to invite another player.';
      break;
    case 'alreadyInRoom':
      text = 'The player is already in a room.';
      break;
    case 'roomFull':
      text = 'The room is already full.';
      break;
  }
  status(text, COLOR_STATUS_RED);
}

function addListItem(list, item) {
  if (list.nodeName && list.nodeName.toLowerCase() === 'ul') {
    let tempLI = document.createElement('li');

    switch (list.id) {
      case 'room-list':		 tempLI = buildRoomListItem(item); break;
      case 'player-list':		 tempLI = buildPlayerListItem(item); break;
      case 'room-player-list': tempLI = buildRoomPlayerListItem(item); break;
      default: return;
    }

    tempLI.classList.add('list-item');

    if ((list.id === 'player-list' || list.id === 'room-player-list') &&
        item.userid === socket.id) {
      list.prepend(tempLI);
    } else {
      list.appendChild(tempLI);
    }
  }
}

function buildRoomListItem(room) {
  const tempLI 	= document.createElement('li');
  const tempDIV = document.createElement('div');
  const tempH3 	= document.createElement('h3');
  const tempP 	= document.createElement('p');

  tempDIV.style.minWidth = 0;
  tempDIV.style.flex = 1;
  tempH3.classList.add('truncate');
  tempP.classList.add('truncate', 'list-subtitle');

  tempLI.style.cursor = 'pointer';
  tempLI.id = room.roomId;
  if (room.isPrivate) tempLI.classList.add('private-room');
  else tempLI.classList.remove('private-room');

  tempLI.addEventListener('click', () => renderRoomPreviewPopup(room));

  if (room.gameStarted) {
    tempLI.classList.add('game-started');

    const playerCount = room.players.length;
    const snakeLength = 360 / playerCount;

    let gradientString = 'conic-gradient(from var(--ANGLE-RUNNING)';
    room.players.forEach((player, index) => {
      gradientString += `, ${player.snakeColor} ${snakeLength * index}deg ${snakeLength * index + (snakeLength / 2)}deg, var(--COLOR-LIGHTGREY) ${snakeLength * index + (snakeLength / 2)}deg ${snakeLength * index + snakeLength}deg`;
    });
    gradientString += ') 1';

    tempLI.style.borderImage = gradientString;

    if (!timers.some(t => t.type === 'game-started')) {
      setTimer('game-started', () => {
        const angleProperty = document.styleSheets[0].cssRules[1].style.getPropertyValue('--ANGLE-RUNNING');
        let angle = parseInt(angleProperty.match(/\d+/)[0]);
        angle = (angle + 2) % 360;
        document.styleSheets[0].cssRules[1].style.setProperty('--ANGLE-RUNNING', `${angle}deg`);
      }, 30);
    }
  }

  tempH3.appendChild(document.createTextNode(`${room.name}`));
  tempP.appendChild(document.createTextNode(`${room.players.length}/${room.maxPlayers} Players - ${getGameModeText(room.gameMode)}`));
  tempDIV.appendChild(tempH3);
  tempDIV.appendChild(tempP);
  tempLI.appendChild(tempDIV);

  return tempLI;
}

function buildPlayerListItem(player) {
  const tempLI	= document.createElement('li');
  const tempDIV	= document.createElement('div');
  const tempH3	= document.createElement('h3');
  const tempP		= document.createElement('p');

  const me = player.userid === socket.id;
  setAvatarImg(player.avatar, tempLI, me);

  tempDIV.style.minWidth = 0;
  tempDIV.style.flex = 1;
  tempLI.style.cursor = 'pointer';
  tempH3.classList.add('truncate');
  tempP.classList.add('truncate', 'list-subtitle');

  tempH3.appendChild(document.createTextNode(`${player.username}`));
  if (!me) {
    tempLI.addEventListener('click', () => {
      status('Would you like to invite this player into your room?', COLOR_STATUS_LIGHT, 0, true);

      addStatusEventListner(BTN_statusYes, invitePlayer.bind(this, player));
      addStatusEventListner(BTN_statusNo, dontInvitePlayer);
    });
  }

  tempP.innerHTML = `${getScoreText(player, false)}`;
  tempDIV.appendChild(tempH3);
  tempDIV.appendChild(tempP);
  tempLI.appendChild(tempDIV);

  return tempLI;
}

function buildRoomPlayerListItem(player) {
  const tempLI	= document.createElement('li');
  const tempDIV	= document.createElement('div');
  const tempH3	= document.createElement('h3');
  const tempP		= document.createElement('p');

  const me = player.userid === socket.id ? true : false;
  setAvatarImg(player.avatar, tempLI, me);

  tempH3.classList.add('truncate');
  tempP.classList.add('truncate', 'list-subtitle');
  tempDIV.style.minWidth = 0;
  tempDIV.style.flex = 1;

  const colorIndicator = document.createElement('div');

  colorIndicator.classList.add('color-indicator', 'align-center');
  colorIndicator.style.backgroundColor = player.snakeColor;
  colorIndicator.id = `color${player.userid}`;

  if (player.userid === socket.id) {
    socket.emit('reqRoomPlayerColors');
    colorIndicator.style.cursor = 'pointer';
  }

  if (player.isReady === true) {
    tempLI.classList.add('ready');
    tempLI.style.setProperty('--COLOR-SNAKE', player.snakeColor);

    colorIndicator.disabled = true;
    colorIndicator.style.pointerEvents = 'none';
    colorIndicator.style.cursor = 'auto';

    if (!timers.some(t => t.type === 'ready')) {
      setTimer('ready', () => {
        const angleProperty = document.styleSheets[0].cssRules[1].style.getPropertyValue('--ANGLE-READY');
        let angle = parseInt(angleProperty.match(/\d+/)[0]);
        angle = (angle + 2) % 360;
        document.styleSheets[0].cssRules[1].style.setProperty('--ANGLE-READY', `${angle}deg`);
      }, 30);
    }
  }

  tempH3.appendChild(document.createTextNode(`${player.username}`));
  tempP.innerHTML = `${getScoreText(player, true)}`;
  tempDIV.appendChild(tempH3);
  tempDIV.appendChild(tempP);
  tempLI.appendChild(tempDIV);
  tempLI.appendChild(colorIndicator);
  tempLI.id = `RoomLI${player.userid}`;

  return tempLI;
}

function setAvatarImg(url, parent, me, size = 45) {
  const tempIMG = document.createElement('img');
  const tempDIV = document.createElement('div');

  tempIMG.setAttribute('src', url);
  tempIMG.classList.add('user-avatar');

  if (me) tempDIV.classList.add('me');
  tempDIV.classList.add('user-avatar-container');
  if (size > 5) {
    tempDIV.style.height = `${size}px`;
    tempDIV.style.width = `${size}px`;
  } else if (size > 0 && size <= 5) {
    tempDIV.style.height = `${size}vmin`;
    tempDIV.style.width = `${size}vmin`;
  }

  tempDIV.appendChild(tempIMG);
  parent.appendChild(tempDIV);
}

function updateRoomPreview(room) {
  document.getElementById('H1_room-name').innerHTML = room.name;
  document.getElementById('P_room-member-count').innerHTML =
      room.players.length < room.maxPlayers ? `${room.players.length}/${room.maxPlayers}` : 'Full room';

  const playerList = document.getElementById('UL_room-members');
  playerList.style.listStyleType = 'none';
  playerList.innerHTML = '';

  // Fill Player List
  if (room.players.length < 1) {
    const tempLI = document.createElement('li');
    tempLI.innerHTML = 'The room is empty.';
    playerList.appendChild(tempLI);
  } else {
    room.players.forEach(player => {
      const tempLI = document.createElement('li');
      tempLI.style.paddingBottom = '5px';
      tempLI.classList.add('flex-row');

      setAvatarImg(player.avatar, tempLI, false, 20);

      const tempP = document.createElement('p');
      tempP.style.paddingLeft = '10px';
      tempP.classList.add('truncate');
      tempP.innerText = `${player.username}`;

      tempLI.append(tempP);
      playerList.appendChild(tempLI);
    });
  }

  document.getElementById('SPN_game-mode').innerHTML = `${getGameModeText(room.gameMode)}`;

  if (room.isPrivate)	showDiv(document.getElementById('DIV_enter-room-pw'));
  else 				hideDiv(document.getElementById('DIV_enter-room-pw'));
}

function renderRoomPreviewPopup(room) {
  updateRoomPreview(room);
  openMainView(roomPreviewPopup, true);
  FORM_enterRoom.dataset.roomId = room.roomId;
  FORM_enterRoom.dataset.roomIsPrivate = room.isPrivate;
}

function showDiv() {
  const args = Array.from(arguments);

  if (args.length > 0) {
    args.forEach(arg => {
      if (arg.nodeName && arg.nodeName.toLowerCase() === 'div' || arg.nodeName.toLowerCase() === 'label') {
        arg.classList.remove('disabled');
      }
    });
  }
}

function hideDiv() {
  const args = Array.from(arguments);

  if (args.length > 0) {
    args.forEach(arg => {
      if (arg.nodeName && arg.nodeName.toLowerCase() === 'div') {
        arg.classList.add('disabled');
      }
    });
  }
}

function openMainView(view, popup = false) {
  if (!popup) {
    mainScreen.children.forEach(c => {
      if (c.id !== view.id) hideDiv(c);
    });
  }
  showDiv(view);
}

function vh(v) {
  const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  return (v * h) / 100;
}

function vw(v) {
  const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  return (v * w) / 100;
}

function vmin(v) {
  return Math.min(vh(v), vw(v));
}

function getGameModeText(value) {
  const option = Array.from(SEL_gameMode.options).find(opt => opt.value.toLowerCase() === value.toLowerCase());
  return option ? option.text : '';
}

const timers = [];
function setTimer(type, callback, interval = 1000) {
  timers.push({
    type,
    callback,
    interval,
    intervalId: setInterval(callback, interval)
  });
}

function status(message, color, timeout = 3000, buttons = false) {
  if (color) color = color.toUpperCase();
  else color = 'COLOR_STATUS_LIGHT';
  let color_foreground = '';

  if (color === 'COLOR_STATUS_GREEN' || color === COLOR_STATUS_GREEN) {
    color_foreground = '#326F21';
    color = COLOR_STATUS_GREEN;
  } else if (color === 'COLOR_STATUS_RED' || color === COLOR_STATUS_RED) {
    color_foreground = '#e8172c';
    color = COLOR_STATUS_RED;
  } else if (color === 'COLOR_STATUS_YELLOW' || color === COLOR_STATUS_YELLOW) {
    color_foreground = '#826307';
    color = COLOR_STATUS_YELLOW;
  } else if (color === 'COLOR_STATUS_LIGHT' || color === COLOR_STATUS_LIGHT) {
    color_foreground = '#000000';
    color = COLOR_STATUS_LIGHT;
  } else
    color_foreground = '#000000';

  document.documentElement.style.setProperty('--COLOR-STATUS-FG', `${color_foreground}`);
  document.documentElement.style.setProperty('--COLOR-STATUS-BG', `${color}`);

  DIV_status.classList.add('show');
  SPA_status.innerHTML = message;

  if (buttons) DIV_statusButtons.classList.add('show');
  else setTimeout(clearStatus, timeout);
}

function clearStatus() {
  DIV_status.classList.remove('show');
  DIV_statusButtons.classList.remove('show');
  SPA_status.innerHTML = '';
  clearStatusEventListeners();
}

let statusButtonEvents = [];
function addStatusEventListner(element, callback) {
  element.addEventListener('click', callback);
  statusButtonEvents.push({
    callback,
    element
  });
}

function clearStatusEventListeners() {
  statusButtonEvents.forEach(listener => {
    listener.element.removeEventListener('click', listener.callback);
  })
  statusButtonEvents = [];
}

function getScoreText(user, inRoom) {
  const prop = inRoom ? 'roomScores' : 'scores';
  let scoreString = '';

  user[prop].forEach((scr, i) => {
    scoreString += `<span class='scores'>${scr.mode}: <span>${scr.score}</span>${(i < user[prop].length - 1) ? '  \t' : ''}</span>`;
  });

  return scoreString;
}
