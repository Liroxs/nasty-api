const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const MATCHES_DB = path.join(__dirname, '../database/data-matches.json');
const DB = path.join(__dirname, '../database/data.json');

function getClientIp(req) {
    // ipinfo
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
}

module.exports = [
    {
        method: "GET",
        endpoint: "/check-match",
        middlewares: [],
        requestListener: async function (req, res) {
            const matchId = req.query.id;
            if (!fs.existsSync(MATCHES_DB)) {
                fs.writeFileSync(MATCHES_DB, JSON.stringify({}));
            }

            fs.readFile(MATCHES_DB, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading matches database:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                const matches = JSON.parse(data || '{}');
                const match = matches.find(m => m.matchId === matchId);

                if (match) {
                    res.json({ valid: true });
                } else {
                    res.json({ valid: false });
                }
            });
        }
    },
    {
        method: "POST",
        endpoint: "/submit-result",
        middlewares: [],
        requestListener: async function (req, res) {
            const { matchId, result, token } = req.body;
            if (match && (match.player1.token === token || match.player2.token === token)) {
                
            }
        }
    }
];