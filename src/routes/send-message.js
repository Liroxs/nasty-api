const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const jsonFile = path.join(__dirname, '../database/data-sms.json');

function getClientIp(req) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

let lastRequestTimes = {}; 

module.exports = [
    {
        method: "POST",
        endpoint: "/send-message",
        middlewares: [],
        requestListener: async function (req, res) {
            const { username, message } = req.body;

            if (!username || !message) {
                return res.status(400).json({ error: 'Le nom d\'utilisateur et le message ne peuvent pas être vides.' });
            }

            if (message.length > 150) {
                return res.status(400).json({ error: 'Vous ne pouvez pas écrire plus de 150 caractères.' });
            }

            const safeUsername = username.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const ip = getClientIp(req);
            const hashedIp = crypto.createHash('sha256').update(ip).digest('hex');

            // Anti-spam 
            const currentTime = Date.now();
            if (lastRequestTimes[hashedIp] && (currentTime - lastRequestTimes[hashedIp] < 5000)) {
                return res.status(429).json({ error: 'Vous devez attendre 5 secondes avant d\'envoyer un autre message.' });
            }

            lastRequestTimes[hashedIp] = currentTime;

            fs.readFile(jsonFile, 'utf8', (err, data) => {
                if (err) {
                    console.error('Erreur lors de la lecture du fichier JSON', err);
                    return res.status(500).json({ error: 'Erreur lors de la lecture du fichier JSON.' });
                }

                let users = JSON.parse(data || '[]');

                for (let user of users) {
                    if (user.sender === safeUsername && user.ip !== hashedIp) {
                        return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris. Veuillez choisir un autre nom.' });
                    }
                }

                let userFound = false;
                for (let user of users) {
                    if (user.ip === hashedIp) {
                        user.sender = safeUsername;
                        user.messages.push({
                            content: safeMessage,
                            timestamp: currentTime
                        });
                        userFound = true;
                        break;
                    }
                }

                if (!userFound) {
                    users.push({
                        sender: safeUsername,
                        ip: hashedIp,
                        messages: [
                            {
                                content: safeMessage,
                                timestamp: currentTime
                            }
                        ]
                    });
                }

                fs.writeFile(jsonFile, JSON.stringify(users, null, 2), 'utf8', (err) => {
                    if (err) {
                        console.error('Erreur lors de l\'écriture dans le fichier JSON', err);
                        return res.status(500).json({ error: 'Erreur lors de l\'écriture dans le fichier JSON.' });
                    }
                    res.json({ success: true });
                });
            });
        }
    }
];
