// No walls
const GameFlowBase = require('./GameFlowBase').GameFlowBase

class GameFlowNW extends GameFlowBase {
  constructor(gameState) {
    super(gameState);
  }

  updatePosition(player) {
    const gridsize = this.gameState.gridsize;

    if (player.pos.x + player.vel.x > gridsize - 1) player.pos.x = 0;
    else if (player.pos.x + player.vel.x < 0) player.pos.x = gridsize - 1;
    else player.pos.x += player.vel.x;

    if (player.pos.y + player.vel.y > gridsize - 1) player.pos.y = 0;
    else if (player.pos.y + player.vel.y < 0) player.pos.y = gridsize - 1;
    else player.pos.y += player.vel.y;
  }

  checkCollisions(player) {
    if (player.vel.x || player.vel.y) {
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
}

module.exports = {
  GameFlowNW: GameFlowNW
}