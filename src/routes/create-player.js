const fs = require('fs');
const path = require('path');
const escapeHtml = require('escape-html');
const crypto = require('crypto');
const DB = path.join(__dirname, '../database/data.json');

function readPlayers() {
    if (fs.existsSync(DB)) {
        const json = fs.readFileSync(DB, 'utf-8');
        return JSON.parse(json);
    } else {
        return [];
    }
}

function getClientIp(req) {
    // ipinfo
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
}

function sendData(players) {
    const json = JSON.stringify(players, null, 2);
    fs.writeFileSync(DB, json, 'utf-8');
}

module.exports = [
    {
        method: "POST",
        endpoint: "/create-player",
        middlewares: [],
        requestListener: async function (req, res) {
            let { pseudo } = req.body;

            const winner = "";
            const looser = "";
            
            const ip = getClientIp(req);

            if (!pseudo) {
                res.status(400).json({ error: "Le pseudo est requis." });
                return;
            }

            pseudo = escapeHtml(pseudo.trim());
            let players = readPlayers();
            const hashedIp = crypto.createHash('sha256').update(ip).digest('hex');

            const existingPlayer = players.find(player => player.nom === pseudo);

            if (existingPlayer && existingPlayer.ip !== hashedIp) {
                res.status(400).json({ error: "Ce nom d\'utilisateur est déjà pris. Veuillez choisir un autre nom." });
                return;
            }

            if (players.some(player => player.ip === hashedIp)) {
                res.status(400).json({ error: "Un compte a déjà été créé avec cette adresse IP." });
                return;
            }

            players.push(
                { 
                    nom: pseudo,
                    points: 10,
                    ip: hashedIp,
                    matchs: [
                        {
                            winner: winner,
                            looser: looser
                        }
                    ],
                    win: 0,
                    loose: 0
                });
            
            sendData(players);
            res.status(200).json(players);
        }
    }
];
