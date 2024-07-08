const fs = require('fs');
const path = require('path');

const jsonFile = path.join(__dirname, '../database/data-sms.json');

module.exports = [
    {
        method: "GET",
        endpoint: "/fetch-messages",
        middlewares: [],
        requestListener: async function (req, res) {
            if (!fs.existsSync(jsonFile)) {
                fs.writeFileSync(jsonFile, JSON.stringify([]));
            }

            fs.readFile(jsonFile, 'utf8', (err, data) => {
                if (err) {
                    console.error('Erreur lors de la lecture du fichier JSON', err);
                    return res.status(500).json({ error: 'Erreur lors de la lecture du fichier JSON.' });
                }

                let messages;
                try {
                    messages = JSON.parse(data);
                } catch (e) {
                    console.error('Erreur lors du décodage du fichier JSON', e);
                    return res.status(500).json({ error: 'Erreur lors du décodage du fichier JSON.' });
                }
                res.json({ messages });
            });
        }
    }
];