const { COLORS } = require('./../helpers/constHelper');
const fs = require('fs').promises;
const path = require('path');

function initClientRooms(rooms) {
	const tempRooms = {};

	for(const [key, room] of Object.entries(rooms)) {
		tempRooms[key] = {
			roomId: room.roomId,
			name: room.name,
			gameMode: room.gameMode,
			players: room.players,
			maxPlayers: room.maxPlayers,
			isPrivate: room.isPrivate,
			gameStarted: room.gameStarted
		};
	}

	return tempRooms;
}

function generateRoomID(rooms) {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let roomID = "";

	for (let i = 0; i < 15; i++) {
		roomID += characters.charAt(Math.floor(Math.random() * characters.length));
	}

	if (roomID in rooms) return generateRoomID();
	return roomID;
}

function assignRandomColor(room) {
	const color = COLORS[Math.floor(Math.random() * COLORS.length)];


	for (const player of room.players) {
		if (color === player.snakeColor) {
			return assignRandomColor(room);
		}
	}

	return color;
}

////////////////////////////HIGHSCORES
function readFromHighscores() {
	try {
		const data = await fs.readFile(path.join(__dirname, './../scores.json'), 'utf8');

		return JSON.parse(data);
	} catch (e) {
		console.log(`Error: Reading scores.json ${e}.`);

		return [
			{ 'mode': 'SP', 'score': 0, 'username': 'N/A' }, 
			{ 'mode': 'MP', 'score': 0, 'username': 'N/A' }, 
			{ 'mode': 'NC', 'score': 0, 'username': 'N/A' }
		];
	}
}

function writeToHighscores(highScores) {
	fs.writeFile(path.join(__dirname, './../scores.json'), JSON.stringify(highScores), err => {
		if (err) {
			console.log(`Error: Write scores.json ${e}.`);
		}
	})
}

//////////////////////////PlayerStuff
function generatePlayer(player) {
	return {
		id: player.userID,
		color: player.color
	};
}

module.exports = {
	initClientRooms,
	generateRoomID,
	assignRandomColor,
	generatePlayer,
	readFromHighscores,
	writeToHighscores
}