///BattleRoyale * Obstacles!!!
const GameFlowBase = require('./GameFlowBase').GameFlowBase

class GameFlowBR extends GameFlowBase {
  constructor(gameState) {
    super(gameState);
    this.gameState['blocks'] = [];
    this.blocks = this.buildBlocks();
  }

  buildBlocks() {
    let side = 't';
    let max = this.gameState.gridsize - 1;
    let min = 0;
    const blocks = [];

    while (min <= max) {
      if (side === 't') {
        for (let i = min + 1; i < max; i++) {
          blocks.push({ x: i, y: min });
        }
        side = 'r';
      }
      if (side === 'r') {
        for (let i = min + 1; i < max; i++) {
          blocks.push({ x: max, y: i });
        }
        side = 'b';
      }
      if (side === 'b') {
        for (let i = max - 1; i > min; i--) {
          blocks.push({ x: i, y: max });
        }
        max -= 1;
        side = 'l';
      }
      if (side === 'l') {
        for (let i = max; i > min; i--) {
          blocks.push({ x: min, y: i });
        }
        min += 1;
        side = 't';
      }
    }
    return blocks;
  }

  run() {
    if (!this.gameState) return;

    this.setTime();
    this.addBlock();
    for (let i = this.gameState.players.length - 1; i >= 0; i--) {
      const player = this.gameState.players[i];
      this.updatePosition(player);
      this.checkCollisions(player);
      this.movePlayer(player);
    }

    return this.gameState;
  }

  addBlock() {
    const time = Math.floor(this.gameState.time / 100);

    if (this.blocks[time]) this.gameState.blocks.push(this.blocks[time]);

    if (this.blocks[time].x === this.gameState.food.x &&
        this.blocks[time].y === this.gameState.food.y) {
      this.generateFood();
    }
  }

  checkCollisions(player) {
    if (player.vel.x || player.vel.y) {
      if (player.pos.x < 0 ||
          player.pos.x > this.gameState.gridsize - 1 ||
          player.pos.y < 0 ||
          player.pos.y > this.gameState.gridsize - 1) {
        return this.playerDie(player);
      }

      for (const block of this.gameState.blocks) {
        if (block.x === player.pos.x && block.y === player.pos.y) {
          return this.playerDie(player);
        }
      }

      for (const cell of player.snake) {
        if (cell.x === player.pos.x && cell.y === player.pos.y) {
          return this.playerDie(player);
        }
      }

      for (const enemy of this.gameState.players) {
        if (enemy.id !== player.id) {
          for (const cell of enemy.snake) {
            if (cell.x === player.pos.x && cell.y === player.pos.y) {
              return this.playerDie(player);
            }
          }
        }
      }
    }
  }

  generateFood() {
    const food = {
      x: Math.floor(Math.random() * this.gameState.gridsize),
      y: Math.floor(Math.random() * this.gameState.gridsize),
    };


    for (const player of this.gameState.players) {
      for (const cell of player.snake) {
        if (cell.x === food.x && cell.y === food.y) {
          return this.generateFood();
        }
      }
    }

    if (this.gameState.blocks) {
      for (const block of this.gameState.blocks) {
        if (block.x === food.x && block.y === food.y) {
          return this.generateFood();
        }
      }
    }

    this.gameState.food = food;
  }
}

module.exports = {
  GameFlowBR: GameFlowBR
}