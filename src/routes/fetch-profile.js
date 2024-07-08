const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB = '../database/data.json';

function getClientIp(req) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

module.exports = [
    {
        method: "GET",
        endpoint: "/fetch-profile",
        middlewares: [],
        requestListener: async function (req, res) {
            const clientIp = getClientIp(req);
            const hashedIp = crypto.createHash('sha256').update(clientIp).digest('hex');
            
            fs.readFile(path.join(__dirname, DB), 'utf8', (err, data) => {
                
                const users = JSON.parse(data);
                const user = users.find(user => user.ip === hashedIp); // search your account thanks to your ip

                if (user) {
                    res.json({ 
                        nom: user.nom,
                        points: user.points,
                        // add matchs ... 
                        win: user.win,
                        loose: user.loose
                     });
                } else {
                    res.json({ nom: "Vous n'avez pas créé de compte!" });
                }
            });
        }
    }
];