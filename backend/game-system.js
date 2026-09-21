const games = new Map();
const players = new Map();

function makeId() {
    return "game_" + Date.now() + "_" +
        Math.random().toString(36).substring(2, 8);
}

function publishGame(game) {
    if (!game.id) {
        game.id = makeId();
    }

    game.published = true;
    game.createdAt = game.createdAt || Date.now();

    games.set(game.id, game);

    return game;
}

function getPublishedGames() {
    return Array.from(games.values())
        .filter(game => game.published);
}

function joinGame(gameId, username) {
    const game = games.get(gameId);

    if (!game) {
        return null;
    }

    if (!players.has(gameId)) {
        players.set(gameId, new Map());
    }

    players.get(gameId).set(username, {
        username: username,
        x: 0,
        y: 0,
        z: 0,
        lastUpdate: Date.now()
    });

    return game;
}

function updatePlayer(gameId, username, position) {
    if (!players.has(gameId)) {
        players.set(gameId, new Map());
    }

    players.get(gameId).set(username, {
        username: username,
        x: Number(position.x) || 0,
        y: Number(position.y) || 0,
        z: Number(position.z) || 0,
        lastUpdate: Date.now()
    });
}

function getPlayers(gameId) {
    const gamePlayers = players.get(gameId);

    if (!gamePlayers) {
        return [];
    }

    const now = Date.now();

    for (const [username, player] of gamePlayers) {
        if (now - player.lastUpdate > 15000) {
            gamePlayers.delete(username);
        }
    }

    return Array.from(gamePlayers.values());
}

function leaveGame(gameId, username) {
    if (players.has(gameId)) {
        players.get(gameId).delete(username);
    }
}

module.exports = {
    publishGame,
    getPublishedGames,
    joinGame,
    updatePlayer,
    getPlayers,
    leaveGame
};
