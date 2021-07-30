// No Collisions :D
const GameFlowBase = require('./GameFlowBase').GameFlowBase

class GameFlowNC extends GameFlowBase {
  constructor(gameState) {
    super(gameState);
  }

  checkCollisions(player) {
    if (player.vel.x || player.vel.y) {
      if (player.pos.x < 0 ||
          player.pos.x > this.gameState.gridsize - 1 ||
          player.pos.y < 0 ||
          player.pos.y > this.gameState.gridsize - 1) {
        return this.playerDie(player);
      }

      for (const cell of player.snake) {
        if (cell.x === player.pos.x && cell.y === player.pos.y) {
          return this.playerDie(player);
        }
      }
    }
  }
}

module.exports = {
  GameFlowNC: GameFlowNC
}