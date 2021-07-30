const { SZ_GRID, COUNTDOWN_TIMER, KEYCODES } = require('./constants');

/**
 * the player can be singleplayer / multiplayer in a room
 */
function firstGameState(players) {
	const initState = {
		gridSize: SZ_GRID,
		countDown: COUNTDOWN_TIMER,

		players: [],
		scores: [],
		food: {},
		timer: 0
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

	statePlayer.color = player.color;
	statePlayer.id = player.id;
	statePlayer.velocityUpdate = true;
	statePlayer.snakeColor = player.snakeColor;
	state.players.push(statePlayer);

	return state;
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