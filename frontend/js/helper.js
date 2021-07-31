const BG_COLOR = '#231F20';
const FOOD_COLOR = '#E66916';

socket.on('gameState', handleGameState);
socket.on('leaveRoom', handleLeaveRoom);
socket.on('gameOver', handleGameOver);
socket.on('countDown', handleCountDown);

let canvas;
let gameState = null;
let scores = null;
let countdown = null;

function handleGameState(serverGameState) {
  gameState = serverGameState;
}

function handleLeaveRoom() {
  gameState = null;
  scores = null;
  countdown = null;
}

function handleGameOver(scoreData) {
  gameState = null;
  scores = scoreData;
}

function handleCountDown(CountdownData) {
  countdown = CountdownData;
}

function setup() {
  canvas = createCanvas(600, 600);
  canvas.parent('canvas-container');
  canvas.id('canvas');

  frameRate(60);
}

function keydown(e) {
  if ([37, 38, 39, 40].includes(e.keyCode)) {
    e.preventDefault();
  }
  socket.emit('keydown', e.keyCode);
}

function draw() {
  fill(BG_COLOR);
  rect(0, 0, width, height);

  if (gameState) {
    const food = gameState.food;
    const gridsize = gameState.gridsize;
    const size = width / gridsize;

    noStroke();
    fill(FOOD_COLOR);
    ellipse((food.x + 0.5) * size, (food.y + 0.5) * size, size, size);

    gameState.players.forEach(player => {
      paintPlayerP5(player, size, player.snakeColor);
    });

    if ('blocks' in gameState) drawBlocks(gameState.blocks, size);
    timer.innerHTML = getTimerString(gameState.time);
  } else if (scores) {
    const highscoreSnakeScale = 15;

    for (let i = 0; i < scores.length; i++) {
      fill(scores[i].color);
      textSize(30);
      text(scores[i].username + ' : ' + scores[i].score, 30, 60 * (i + 1.5));
      const ySnake = 1 * (4 * i + 3);
      const player = { 'pos':{ 'x':2, 'y':ySnake }, 'snake':[{ 'x':2, 'y':ySnake }, { 'x':3, 'y':ySnake }] };
      const length = min(Math.floor(Math.sqrt(scores[i].score)), (width / highscoreSnakeScale) - 8);

      for (let j = 0; j < length; j++) {
        player.snake.push({ 'x': 4 + j, 'y': ySnake });
      }
      paintPlayerP5(player, highscoreSnakeScale, scores[i].color);
    }
  }
  if (countdown !== null) {
    push();
    textAlign(CENTER, CENTER);
    fill(180);
    if (countdown > 0) {
      textSize(250);
      text(countdown, width / 2, height / 2);
    } else {
      textSize(150);
      text('START', width / 2, height / 2);
    }
    pop();
  }
}

function paintPlayerP5(playerState, size, color) {
  noStroke();
  const snake = playerState.snake;
  fill(color);
  for (const cell of snake) {
    rect(cell.x * size, cell.y * size, size, size);
  }

  fill('white');
  ellipse(playerState.pos.x * size + 2, playerState.pos.y * size + 2, 10);
  ellipse(playerState.pos.x * size + size - 2, playerState.pos.y * size + 2, 10);
  fill('black');
  ellipse(playerState.pos.x * size + 2, playerState.pos.y * size + 2, 3);
  ellipse(playerState.pos.x * size + size - 2, playerState.pos.y * size + 2, 3);
}

function drawBlocks(blocks, size) {
  blocks.forEach(block => {
    stroke('#777');
    strokeWeight(3);
    fill('#999');
    rect((block.x * size) + 2, (block.y * size) + 2, size - 4, size - 4);
  });
}

function getTimerString(time) {
  time = Math.floor(time / 1000);
  const seconds = time % 60;
  const minutes = Math.floor(time / 60);

  return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}
