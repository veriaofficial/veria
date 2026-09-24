const fs = require("fs");
const path = require("path");

const GAMES_FILE = path.join(__dirname, "games.json");

const games = new Map();
const players = new Map();

function makeId() {
    return "game_" + Date.now() + "_" +
        Math.random().toString(36).substring(2, 8);
}

function loadGames() {
    try {
        if (!fs.existsSync(GAMES_FILE)) {
            fs.writeFileSync(GAMES_FILE, "[]");
            return;
        }

        const data = fs.readFileSync(
            GAMES_FILE,
            "utf8"
        );

        const savedGames = JSON.parse(data);

        if (Array.isArray(savedGames)) {
            for (const game of savedGames) {
                if (game && game.id) {
                    games.set(game.id, game);
                }
            }
        }

    } catch (error) {
        console.error(
            "Could not read games.json:",
            error
        );
    }
}

function saveGames() {
    try {
        fs.writeFileSync(
            GAMES_FILE,
            JSON.stringify(
                Array.from(games.values()),
                null,
                2
            )
        );
    } catch (error) {
        console.error(
            "Could not save games.json:",
            error
        );
    }
}

function moderateGame(game) {

    const blockedTerms = [
        "porn",
        "pornography",
        "sexual",
        "sex",
        "nude",
        "nudity",
        "nsfw",
        "hentai",
        "rape",
        "gore",
        "terrorist",
        "terrorism",
        "suicide",
        "self harm",
        "self-harm"
    ];

    const textParts = [];

    textParts.push(
        String(game.name || "")
    );

    textParts.push(
        String(game.description || "")
    );

    textParts.push(
        String(game.creator || "")
    );

    if (Array.isArray(game.parts)) {

        for (const part of game.parts) {

            if (!part) continue;

            textParts.push(
                String(part.name || "")
            );

            textParts.push(
                String(part.text || "")
            );

            textParts.push(
                String(part.type || "")
            );

        }

    }

    const text =
        textParts
            .join(" ")
            .toLowerCase();

    for (const term of blockedTerms) {

        if (text.includes(term)) {

            return {
                approved: false,
                reason:
                    "This game contains content that cannot be published on Veria."
            };

        }

    }

    return {
        approved: true,
        reason: ""
    };
}

function publishGame(game) {

    const moderation =
        moderateGame(game);

    if (!moderation.approved) {

        const error =
            new Error(
                moderation.reason
            );

        error.code =
            "GAME_MODERATION_REJECTED";

        throw error;
    }

    if (!game.id) {
        game.id = makeId();
    }

    game.published = true;

    game.createdAt =
        game.createdAt ||
        Date.now();

    games.set(
        game.id,
        game
    );

    saveGames();

    return game;
}

function getPublishedGames() {

    return Array.from(
        games.values()
    )
        .filter(
            game =>
                game.published === true
        );
}

function joinGame(
    gameId,
    username
) {

    const game =
        games.get(gameId);

    if (!game || !game.published) {
        return null;
    }

    if (!players.has(gameId)) {
        players.set(
            gameId,
            new Map()
        );
    }

    players
        .get(gameId)
        .set(username, {
            username: username,
            x: 0,
            y: 0,
            z: 0,
            lastUpdate: Date.now()
        });

    return game;
}

function updatePlayer(
    gameId,
    username,
    position
) {

    if (!players.has(gameId)) {

        players.set(
            gameId,
            new Map()
        );

    }

    players
        .get(gameId)
        .set(username, {
            username: username,
            x: Number(position.x) || 0,
            y: Number(position.y) || 0,
            z: Number(position.z) || 0,
            lastUpdate: Date.now()
        });
}

function getPlayers(gameId) {

    const gamePlayers =
        players.get(gameId);

    if (!gamePlayers) {
        return [];
    }

    const now =
        Date.now();

    for (
        const [
            username,
            player
        ] of gamePlayers
    ) {

        if (
            now - player.lastUpdate >
            15000
        ) {

            gamePlayers.delete(
                username
            );

        }

    }

    return Array.from(
        gamePlayers.values()
    );
}

function leaveGame(
    gameId,
    username
) {

    if (players.has(gameId)) {

        players
            .get(gameId)
            .delete(username);

    }

}

loadGames();

module.exports = {
    publishGame,
    getPublishedGames,
    joinGame,
    updatePlayer,
    getPlayers,
    leaveGame
};
