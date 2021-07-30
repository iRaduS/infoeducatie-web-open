const { FRAME_RATE } = require('./../helpers/constHelper');

class GameFlowBase {
	constructor(gameState) {
		this.gameState = gameState;
		this.FRAME_RATE = FRAME_RATE;
		this.generateFood();
	}

	run() {
		if (!this.gameState) return;

		this.setTime();
		for (let i = this.gameState.players.length - 1; i >= 0; i--) {
			const player = this.gameState.players[i];
			this.updatePosition(player);
			this.checkCollisions(player);
			this.movePlayer(player);
		}

		return this.gameState;
	}

	setTime() {
		this.gameState.time = this.gameState.time + (1000 / FRAME_RATE);
	}

	updatePosition(player) {
		player.pos.x += player.vel.x;
		player.pos.y += player.vel.y;
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

			for (const enemy of this.gameState.players) {
				if (enemy.id !== player.id) {
					for (const cell of enemy.snake) {
						if (cell.x === player.pos.x && cell.y === player.pos.y) {
							enemy.points += Math.floor(player.points / 2);
							return this.playerDie(player);
						}
					}
				}
			}
		}
	}

	movePlayer(player) {
		player.snake.push({ ...player.pos });
		if (this.gameState.food.x === player.pos.x && this.gameState.food.y === player.pos.y) {
			player.points += 1;
			this.generateFood();
		} else {
			player.snake.shift();
		}
	}

	playerDie(player) {
		const index = this.indexOf(player);

		if (index !== -1 && index !== null) {
			const points = this.evaluatePoints(player);

			this.gameState.players[index].points = points;
			this.gameState.scores.unshift({
				player:	player.id,
				color:	player.snakeColor,
				score:	points
			});

			this.gameState.players.splice(index, 1);
		}
	}

	evaluatePoints(player) {
		return Math.floor(player.points * this.gameState.time / 1000);
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

		this.gameState.food = food;
	}

	indexOf(player) {
		if (player) return this.gameState.players.findIndex(p => p.id === player.id);
		return null;
	}
}

module.exports = {
	GameFlowBase: GameFlowBase
}