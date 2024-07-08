const fs = require('fs');
const expressapi = require("@borane/expressapi");
const crypto = require('crypto');
const path = require('path');
const jsonToken = new expressapi.JsonToken("JWT_T0k3n_S3cur7_f0r_N4st7_Clxn_R4nk3d_W3bs1t3"); // securekey

// Toutes les bases de données utilisées
const DB = path.join(__dirname, '../database/data.json');
const QUEUE_DB = path.join(__dirname, '../database/data-file-attente.json');
const MATCHES_DB = path.join(__dirname, '../database/data-matches.json');

function readData(filePath) {
    if (fs.existsSync(filePath)) {
        const json = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(json);
    } else {
        return [];
    }
}

function writeData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getClientIp(req) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

function isPlayerInMatch(playerId) {
    const matches = readData(MATCHES_DB);
    return matches.some(match =>
        match.players.some(player => player.nom === playerId)
    );
}

function findMatch(queue, player) {
    for (let opponent of queue) {
        const pointDiff = Math.abs(opponent.points - player.points);
        if (pointDiff <= 50 && opponent.nom !== player.nom) {
            console.log(`Match trouvé avec ${opponent.nom}`);
            return opponent;
        }
    }
    console.log("Aucun match trouvé");
    return undefined;
}

function createMatch(player1, player2) {
    if (!player1 || !player2) {
        console.error("Erreur: Impossible de créer un match avec des joueurs manquants");
        return null;
    }
    const matchId = crypto.randomBytes(16).toString('hex');
    const token1 = jsonToken.sign({ playerId: player1.nom, matchId });
    const token2 = jsonToken.sign({ playerId: player2.nom, matchId });
    return {
        matchId,
        players: [
            { ...player1, token: token1 },
            { ...player2, token: token2 }
        ],
        status: 'match_in_progress',
        expireTimestamp: Date.now() + 1000 * 60 * 30
    };
}

module.exports = [
    {
        method: "GET",
        endpoint: "/join-queue",
        middlewares: [],
        requestListener: async function (req, res) {
            const clientIp = getClientIp(req);
            const hashedIp = crypto.createHash('sha256').update(clientIp).digest('hex');
            const data = readData(DB);
            const player = data.find(player => player.ip === hashedIp);

            if (!player) {
                return res.status(404).json({ message: 'Player not found' });
            }

            if (isPlayerInMatch(player.nom)) {
                return res.status(400).json({ message: 'Vous êtes déjà dans un match'});
            }
            let queue = readData(QUEUE_DB);
            const playerInQueue = queue.find(queuedPlayer => queuedPlayer.nom === player.nom);

            if (!playerInQueue) {
                queue.push({ nom: player.nom, points: player.points });
                writeData(QUEUE_DB, queue);
                console.log(`${player.nom} est ajouté à la file d'attente.`);
            } else {
                console.log(`${player.nom} est déjà dans la file d'attente.`);
            }

            const opponent = findMatch(queue, player);

            if (opponent && opponent.nom) {
                const match = createMatch(player, opponent);
                queue = queue.filter(p => p.nom !== player.nom && p.nom !== opponent.nom); // supprime de la queue les joueurs
                writeData(QUEUE_DB, queue);

                let matches = readData(MATCHES_DB);
                matches.push(match);
                writeData(MATCHES_DB, matches);
                return res.json({
                    status: "match_found",
                    token: match.players.find(p => p.nom === player.nom).token,
                    opponent: opponent.nom,
                    redirectUrl: `/match?id=${match.matchId}`
                });
            }

            res.json({ message: 'Joueur ajouté à la queue pour'});
        }
    }
];