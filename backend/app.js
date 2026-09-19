const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5000;

const DATA_DIR = path.join(__dirname);
const USERS_FILE = path.join(DATA_DIR, "users.json");

function loadUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            fs.writeFileSync(USERS_FILE, "[]");
        }

        const data = fs.readFileSync(
            USERS_FILE,
            "utf8"
        );

        const users = JSON.parse(data);

        if (Array.isArray(users)) {
            return users;
        }

        return [];

    } catch (error) {
        console.error("Could not read users.json:", error);
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(
        USERS_FILE,
        JSON.stringify(users, null, 2)
    );
}

function sendJSON(res, status, data) {
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    });

    res.end(JSON.stringify(data));
}

function getBody(req) {
    return new Promise((resolve, reject) => {

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {

            if (!body) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }

        });

        req.on("error", reject);

    });
}

function normalizeUser(user) {

    if (!user.friends) {
        user.friends = [];
    }

    if (!user.incomingRequests) {
        user.incomingRequests = [];
    }

    if (!user.outgoingRequests) {
        user.outgoingRequests = [];
    }

    return user;
}

function findUser(users, username) {

    if (!username) {
        return null;
    }

    const wanted =
        String(username)
            .trim()
            .toLowerCase();

    return users.find(user =>
        String(user.username)
            .toLowerCase() === wanted
    ) || null;
}

function safeUser(user) {

    return {
        username: user.username
    };

}

const server = http.createServer(
    async (req, res) => {

        /*
         * CORS preflight
         */

        if (req.method === "OPTIONS") {

            res.writeHead(204, {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods":
                    "GET, POST, OPTIONS"
            });

            res.end();

            return;
        }


        /*
         * SERVE VERIA WEBSITE
         */

        if (
            req.method === "GET" &&
            req.url === "/"
        ) {

            const indexPath =
                path.join(
                    __dirname,
                    "..",
                    "index.html"
                );

            fs.readFile(
                indexPath,
                (error, data) => {

                    if (error) {

                        console.error(error);

                        sendJSON(
                            res,
                            500,
                            {
                                error:
                                    "Could not load Veria index.html"
                            }
                        );

                        return;
                    }

                    res.writeHead(
                        200,
                        {
                            "Content-Type":
                                "text/html; charset=utf-8"
                        }
                    );

                    res.end(data);

                }
            );

            return;
        }


        /*
         * SIGN UP
         */

        if (
            req.method === "POST" &&
            req.url === "/signup"
        ) {

            try {

                const body =
                    await getBody(req);

                const username =
                    String(
                        body.username || ""
                    ).trim();

                const password =
                    String(
                        body.password || ""
                    );

                if (username.length < 3) {

                    sendJSON(
                        res,
                        400,
                        {
                            error:
                                "Username must be at least 3 characters."
                        }
                    );

                    return;
                }

                if (password.length < 4) {

                    sendJSON(
                        res,
                        400,
                        {
                            error:
                                "Password must be at least 4 characters."
                        }
                    );

                    return;
                }

                const users =
                    loadUsers();

                const existing =
                    findUser(
                        users,
                        username
                    );

                if (existing) {

                    sendJSON(
                        res,
                        400,
                        {
                            error:
                                "Username already exists."
                        }
                    );

                    return;
                }

                const user = {
                    username,
                    password,
                    friends: [],
                    incomingRequests: [],
                    outgoingRequests: []
                };

                users.push(user);

                saveUsers(users);

                sendJSON(
                    res,
                    200,
                    {
                        message:
                            "Account created.",
                        user:
                            safeUser(user)
                    }
                );

            } catch (error) {

                console.error(error);

                sendJSON(
                    res,
                    500,
                    {
                        error:
                            "Could not create account."
                    }
                );

            }

            return;
        }


        /*
         * LOGIN
         */

        if (
            req.method === "POST" &&
            req.url === "/login"
        ) {

            try {

                const body =
                    await getBody(req);

                const username =
                    String(
                        body.username || ""
                    ).trim();

                const password =
                    String(
                        body.password || ""
                    );

                const users =
                    loadUsers();

                const user =
                    findUser(
                        users,
                        username
                    );

                if (
                    !user ||
                    user.password !== password
                ) {

                    sendJSON(
                        res,
                        401,
                        {
                            error:
                                "Invalid username or password."
                        }
                    );

                    return;
                }

                normalizeUser(user);

                saveUsers(users);

                sendJSON(
                    res,
                    200,
                    {
                        message:
                            "Login successful.",
                        user:
                            safeUser(user)
                    }
                );

            } catch (error) {

                console.error(error);

                sendJSON(
                    res,
                    500,
                    {
                        error:
                            "Could not log in."
                    }
                );

            }

            return;
        }


        /*
         * SEARCH USERS
         */

        if (
            req.method === "GET" &&
            req.url.startsWith(
                "/search-users"
            )
        ) {

            try {

                const url =
                    new URL(
                        req.url,
                        `http://localhost:${PORT}`
                    );

                const username =
                    url.searchParams
                        .get("username") || "";

                const users =
                    loadUsers();

                const search =
                    username
                        .trim()
                        .toLowerCase();

                const results =
                    users
                        .filter(user =>
                            String(
                                user.username
                            )
                                .toLowerCase()
                                .includes(search)
                        )
                        .slice(0, 20)
                        .map(user =>
                            safeUser(user)
                        );

                sendJSON(
                    res,
                    200,
                    results
                );

            } catch (error) {

                console.error(error);

                sendJSON(
                    res,
                    500,
                    {
                        error:
                            "Could not search users."
                    }
                );

            }

            return;
        }


        /*
         * GET FRIEND DATA
         */

        if (
            req.method === "GET" &&
            req.url.startsWith(
                "/friends"
            )
        ) {

            try {

                const url =
                    new URL(
                        req.url,
                        `http://localhost:${PORT}`
                    );

                const username =
                    url.searchParams
                        .get("username");

                const users =
                    loadUsers();

                const user =
                    findUser(
                        users,
                        username
                    );

                if (!user) {

                    sendJSON(
                        res,
                        404,
                        {
                            error:
                                "User not found."
                        }
                    );

                    return;
                }

                normalizeUser(user);

                const friendUsers =
                    user.friends
                        .map(name =>
                            findUser(
                                users,
                                name
                            )
                        )
                        .filter(Boolean)
                        .map(friend => ({
                            username:
                                friend.username,
                            status:
                                "Offline"
                        }));

                const incoming =
                    user.incomingRequests
                        .map(name =>
                            findUser(
                                users,
                                name
                            )
                        )
                        .filter(Boolean)
                        .map(friend =>
                            safeUser(friend)
                        );

                const outgoing =
                    user.outgoingRequests
                        .map(name =>
                            findUser(
                                users,
                                name
                            )
                        )
                        .filter(Boolean)
                        .map(friend =>
                            safeUser(friend)
                        );

                sendJSON(
                    res,
                    200,
                    {
                        friends:
                            friendUsers,
                        incomingRequests:
                            incoming,
                        outgoingRequests:
                            outgoing
                    }
                );

            } catch (error) {

                console.error(error);

                sendJSON(
                    res,
                    500,
                    {
                        error:
                            "Could not load friends."
                    }
                );

            }

            return;
        }


        /*
         * SEND FRIEND REQUEST
         */

        if (
            req.method === "POST" &&
            req.url === "/friends/request"
        ) {

            try {

                const body =
                    await getBody(req);

                const fromUsername =
                    String(
                        body.from || ""
                    ).trim();

                const toUsername =
                    String(
                        body.to || ""
                    ).trim();

                if (
                    !fromUsername ||
                    !toUsername
                ) {

                    sendJSON(
                        res,
                        400,
                        {
                            error:
                                "Missing username."
                        }
                    );

                    return;
                }

                if (
                    fromUsername.toLowerCase() ===
                    toUsername.toLowerCase()
                ) {

                    sendJSON(
                        res,
                        400,
                        {
                            error:
                                "You cannot add yourself."
                        }
                    );

                    return;
                }

                const users =
                    loadUsers();

                const fromUser =
                    findUser(
                        users,
                        fromUsername
                    );

                const toUser =
                    findUser(
                        users,
                        toUsername
                    );

                if (!fromUser) {

                    sendJSON(
                        res,
                        404,
                        {
                            error:
                                "Your account was not found."
                        }
                    );

                    return;
                }

                if (!toUser) {

                    sendJSON(
                        res,
                        404,
                        {
                            error:
                                "User not found."
                        }
                    );

                    return;
                }

                normalizeUser(
                    fromUser
                );

                normalizeUser(
                    toUser
                );

                const fromName =
                    fromUser.username;

                const toName =
                    toUser.username;

                const alreadyFriends =
                    fromUser.friends.some(
                        name =>
                            name.toLowerCase() ===
                            toName.toLowerCase()
                    );

                if (alreadyFriends) {

                    sendJSON(
                        res,
                        400,
                        {
                            error:
                                "You are already friends."
                        }
                    );

                    return;
                }

                const alreadySent =
                    fromUser.outgoingRequests.some(
                        name =>
                            name.toLowerCase() ===
                            toName.toLowerCase()
                    );

                if (alreadySent) {

                    sendJSON(
                        res,
                        400,
                        {
                            error:
                                "Friend request already sent."
                        }
                    );

                    return;
                }

                const alreadyIncoming =
                    fromUser.incomingRequests.some(
                        name =>
                            name.toLowerCase() ===
                            toName.toLowerCase()
                    );

                if (alreadyIncoming) {

                    sendJSON(
                        res,
                        400,
                        {
                            error:
                                "This person already sent you a request."
                        }
                    );

                    return;
                }

                const reverseRequest =
                    toUser.outgoingRequests.some(
                        name =>
                            name.toLowerCase() ===
                            fromName.toLowerCase()
                    );

                if (reverseRequest) {

                    sendJSON(
                        res,
                        400,
                        {
                            error:
                                "This person already sent you a friend request. Check your notifications."
                        }
                    );

                    return;
                }

                fromUser.outgoingRequests.push(
                    toName
                );

                toUser.incomingRequests.push(
                    fromName
                );

                saveUsers(users);

                sendJSON(
                    res,
                    200,
                    {
                        message:
                            "Friend request sent."
                    }
                );

            } catch (error) {

                console.error(error);

                sendJSON(
                    res,
                    500,
                    {
                        error:
                            "Could not send friend request."
                    }
                );

            }

            return;
        }


        /*
         * ACCEPT FRIEND REQUEST
         */

        if (
            req.method === "POST" &&
            req.url === "/friends/accept"
        ) {

            try {

                const body =
                    await getBody(req);

                const username =
                    String(
                        body.username || ""
                    ).trim();

                const requester =
                    String(
                        body.requester || ""
                    ).trim();

                const users =
                    loadUsers();

                const user =
                    findUser(
                        users,
                        username
                    );

                const requesterUser =
                    findUser(
                        users,
                        requester
                    );

                if (
                    !user ||
                    !requesterUser
                ) {

                    sendJSON(
                        res,
                        404,
                        {
                            error:
                                "User not found."
                        }
                    );

                    return;
                }

                normalizeUser(user);
                normalizeUser(requesterUser);

                const requestIndex =
                    user.incomingRequests.findIndex(
                        name =>
                            name.toLowerCase() ===
                            requesterUser.username.toLowerCase()
                    );

                if (
                    requestIndex === -1
                ) {

                    sendJSON(
                        res,
                        400,
                        {
                            error:
                                "Friend request not found."
                        }
                    );

                    return;
                }

                user.incomingRequests.splice(
                    requestIndex,
                    1
                );

                requesterUser.outgoingRequests =
                    requesterUser.outgoingRequests
                        .filter(
                            name =>
                                name.toLowerCase() !==
                                user.username.toLowerCase()
                        );

                if (
                    !user.friends.some(
                        name =>
                            name.toLowerCase() ===
                            requesterUser.username.toLowerCase()
                    )
                ) {

                    user.friends.push(
                        requesterUser.username
                    );

                }

                if (
                    !requesterUser.friends.some(
                        name =>
                            name.toLowerCase() ===
                            user.username.toLowerCase()
                    )
                ) {

                    requesterUser.friends.push(
                        user.username
                    );

                }

                saveUsers(users);

                sendJSON(
                    res,
                    200,
                    {
                        message:
                            "Friend request accepted."
                    }
                );

            } catch (error) {

                console.error(error);

                sendJSON(
                    res,
                    500,
                    {
                        error:
                            "Could not accept request."
                    }
                );

            }

            return;
        }


        /*
         * DECLINE FRIEND REQUEST
         */

        if (
            req.method === "POST" &&
            req.url === "/friends/decline"
        ) {

            try {

                const body =
                    await getBody(req);

                const username =
                    String(
                        body.username || ""
                    ).trim();

                const requester =
                    String(
                        body.requester || ""
                    ).trim();

                const users =
                    loadUsers();

                const user =
                    findUser(
                        users,
                        username
                    );

                const requesterUser =
                    findUser(
                        users,
                        requester
                    );

                if (
                    !user ||
                    !requesterUser
                ) {

                    sendJSON(
                        res,
                        404,
                        {
                            error:
                                "User not found."
                        }
                    );

                    return;
                }

                normalizeUser(user);
                normalizeUser(requesterUser);

                user.incomingRequests =
                    user.incomingRequests.filter(
                        name =>
                            name.toLowerCase() !==
                            requesterUser.username.toLowerCase()
                    );

                requesterUser.outgoingRequests =
                    requesterUser.outgoingRequests.filter(
                        name =>
                            name.toLowerCase() !==
                            user.username.toLowerCase()
                    );

                saveUsers(users);

                sendJSON(
                    res,
                    200,
                    {
                        message:
                            "Friend request declined."
                    }
                );

            } catch (error) {

                console.error(error);

                sendJSON(
                    res,
                    500,
                    {
                        error:
                            "Could not decline request."
                    }
                );

            }

            return;
        }


        /*
         * UNKNOWN ROUTE
         */

        sendJSON(
            res,
            404,
            {
                error:
                    "Veria API route not found."
            }
        );

    }
);


server.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "================================"
        );
        console.log(
            "       VERIA ACCOUNT SERVER"
        );
        console.log(
            "================================"
        );
        console.log("");
        console.log(
            `Running on http://localhost:${PORT}`
        );
        console.log("");

    }
);
