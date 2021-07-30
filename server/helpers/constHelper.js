const SZ_GRID = 40;
const COUNTDOWN_TIMER = 3;
const FRAME_RATE = 15;
const COLORS = [
	'#ff0000',
	'#00ff00',
	'#0000ff',
	'#ffff00',
	'#ff00ff',
	'#00ffff',
	'#8000ff',
	'#007f00',
	'#c284ff',
	'#c2c2c2'
];
const KEYCODES = {
	KEY_A: 65,
	KEY_LEFT_ARROW: 37,

	KEY_S: 87,
	KEY_DOWN_ARROW: 38,

	KEY_D: 68,
	KEY_RIGHT_ARROW: 39,

	KEY_W: 83,
	KEY_UP_ARROW: 40,
}

module.exports = {
	SZ_GRID,
	COUNTDOWN_TIMER,
	FRAME_RATE,
	COLORS,
	KEYCODES
}