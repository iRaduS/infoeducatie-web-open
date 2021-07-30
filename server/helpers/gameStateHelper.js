const { SZ_GRID, COUNTDOWN_TIMER, KEYCODES } = require('./constHelper');

/**
 * the player can be singleplayer / multiplayer in a room
 */
function firstGameState(players) {
	const initState = {
		gridsize: SZ_GRID,
		countdown: COUNTDOWN_TIMER,

		players: [],
		scores: [],
		food: {},
		time: 0
	};

	if (Array.isArray(players)) {
		for (const player of players) { // iterate through every player
			attachPlayerInGame(player, initState);
		}
	} else {
		attachPlayerInGame(players, initState);
	}

	return initState;
}

/**
 * adds a player to the state
 */
function attachPlayerInGame(player, state) {
	let statePlayer = generateTemplate();

	while (!checkStart(statePlayer, state)) {
		statePlayer = generateTemplate();
	}

	statePlayer.id = player.id;
	statePlayer.velUpdate = true;
	statePlayer.snakeColor = player.snakeColor;
	state.players.push(statePlayer);

	return state;
}


/**
 * generate a player's template which starts from a random position
 */
function generateTemplate() {
	const beginTemplate = {
		pos: { x: 3, y: 10 },
		vel: { x: 1, y: 0 },
		snake:[{ x: 1, y: 10}, { x: 2, y: 10 }, { x: 3, y: 10 }]
	};

	switch (getRangeRandom(0, 4)) { // this should start from a random SIDE!!! facing to the center
		case 0: {
			const yPos = randomGridSide();

			beginTemplate.pos.y = yPos;
			beginTemplate.snake.forEach(block => block.y = yPos);

			break;
		}

		case 1: {
			const xPos = randomGridSide();

			beginTemplate.pos.x = xPos;
			beginTemplate.pos.y = 3;
			beginTemplate.vel.x = 0;
			beginTemplate.vel.y = 1;
			beginTemplate.snake.forEach((block, i) =>  {
				block.x = xPos;
				block.y = i + 1;
			});

			break;
		}

		case 2: {
			const yPos = randomGridSide();

			beginTemplate.pos.y = yPos;
			beginTemplate.pos.x = SZ_GRID - 4;
			beginTemplate.vel.x = -1;
			beginTemplate.snake.forEach((block, i) => {
				block.y = yPos;
				block.x = SZ_GRID - (i + 2);
			});

			break;
		}

		case 3: {
			const xPos = randomGridSide();

			beginTemplate.pos.x = xPos;
			beginTemplate.pos.y = SZ_GRID - 4;
			beginTemplate.vel.x = 0;
			beginTemplate.vel.y = -1;
			beginTemplate.snake.forEach((block, i) => {
				block.x = xPos;
				block.y = SZ_GRID - (i + 2);
			})

			break;
		}
	}

	return beginTemplate;
}

/**
 * get a value from where the snake should start (exclude top and bot)
 */
function randomGridSide() {
	return getRangeRandom(SZ_GRID / 4, 3 * SZ_GRID / 4);
}

/**
 * check if the snake thingie can start on a certain position
 */

function checkStart(player, state) {
	if (!state.players.length) return true;

	let checker = true;
	state.players.forEach((snake) => {
		if (Math.abs(snake.pos.x - player.pos.x) <= 1 && Math.abs(snake.pos.y - player.pos.y) <= 1) {
			checker = false;
		}
	});

	for (const gridCell of player.snake) {
		if (gridCell.x === state.food.x && gridCell.y === state.food.y) {
			checker = false;
		}
	}

	return checker;
}

/**
 * position object for the keys pressed
 */

function getVelocity(keyCode) {
	switch (keyCode) {
		case KEYCODES.KEY_A:
		case KEYCODES.KEY_LEFT_ARROW: return { x: -1, y: 0 };
		case KEYCODES.KEY_D:
		case KEYCODES.KEY_RIGHT_ARROW: return { x: 1, y: 0 };
		case KEYCODES.KEY_W:
		case KEYCODES.KEY_UP_ARROW: return { x: 0, y: 1 };
		case KEYCODES.KEY_S:
		case KEYCODES.KEY_DOWN_ARROW: return { x: 0, y: -1 };
		default: return null;
	}
}

/**
 * generates a random integer between min and max
 */
function getRangeRandom(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);

	return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {
	firstGameState,
	getVelocity,
	attachPlayerInGame
}