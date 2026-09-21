const games = new Map();
const players = new Map();

function createGameId() {
    return "game_" + Date.now() + "_" +
        Math.random().toString(36).slice(2,8);
}

function publishGame(game) {

    if (!game.id) {
        game.id = createGameId();
    }

    game.published = true;
    game.updatedAt = Date.now();

    games.set(game.id, game);

    return game;
}

function getPublishedGames() {

    return Array.from(games.values())
        .filter(game => game.published)
        .map(game => ({
            id: game.id,
            name: game.name,
            description: game.description || "",
            creator: game.creator || "Unknown",
            template: game.template || "Empty World",
            parts: Array.isArray(game.parts)
                ? game.parts
                : [],
            createdAt: game.createdAt || Date.now(),
            updatedAt: game.updatedAt || Date.now()
        }));
}

function joinGame(gameId, username) {

    if (!games.has(gameId)) {
        return null;
    }

    const key = gameId + ":" + username;

    players.set(key, {
        gameId,
        username,
        x: 0,
        y: 1,
        z: 0,
        updatedAt: Date.now()
    });

    return players.get(key);
}

function updatePlayer(gameId, username, position) {

    const key = gameId + ":" + username;

    if (!players.has(key)) {
        return null;
    }

    const player = players.get(key);

    player.x = Number(position.x) || 0;
    player.y = Number(position.y) || 1;
    player.z = Number(position.z) || 0;
    player.updatedAt = Date.now();

    return player;
}

function getPlayers(gameId) {

    const now = Date.now();
    const result = [];

    for (const [key, player] of players) {

        if (now - player.updatedAt > 15000) {
            players.delete(key);
            continue;
        }

        if (player.gameId === gameId) {
            result.push({
                username: player.username,
                x: player.x,
                y: player.y,
                z: player.z
            });
        }
    }

    return result;
}

function leaveGame(gameId, username) {

    players.delete(
        gameId + ":" + username
    );
}

module.exports = {
    publishGame,
    getPublishedGames,
    joinGame,
    updatePlayer,
    getPlayers,
    leaveGame
};
