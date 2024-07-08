const fs = require('fs');
const path = require('path');
const escapeHtml = require('escape-html');

const DB = path.join(__dirname, '../database/data.json');

function readPlayers() {
    if (fs.existsSync(DB)) {
        const json = fs.readFileSync(DB, 'utf-8');
        return JSON.parse(json);
    } else {
        return [];
    }
}

function attributeRank(points) {
    if (points >= 0 && points <= 20) {
        return 'Fer 1';
    } else if (points > 20 && points <= 40) {
        return 'Fer 2';
    } else if (points > 40 && points <= 60) {
        return 'Fer 3';
    } else if (points > 60 && points <= 80) {
        return 'Bronze 1';
    } else if (points > 80 && points <= 100) {
        return 'Bronze 2';
    } else if (points > 100 && points <= 120) {
        return 'Bronze 3';
    } else if (points > 120 && points <= 160) {
        return 'Argent 1';
    } else if (points > 160 && points <= 200) {
        return 'Argent 2';
    } else if (points > 200 && points <= 240) {
        return 'Argent 3';
    } else if (points > 240 && points <= 280) {
        return 'Or 1';
    } else if (points > 280 && points <= 320) {
        return 'Or 2';
    } else if (points > 320 && points <= 360) {
        return 'Or 3';
    } else if (points > 360 && points <= 420) {
        return 'Platine 1';
    } else if (points > 420 && points <= 480) {
        return 'Platine 2';
    } else if (points > 480 && points <= 540) {
        return 'Platine 3';
    } else if (points > 540 && points <= 600) {
        return 'Diamant 1';
    } else if (points > 600 && points <= 660) {
        return 'Diamant 2';
    } else if (points > 660 && points <= 720) {
        return 'Diamant 3';
    } else if (points > 720 && points <= 900) {
        return 'Emeraude 1';
    } else if (points > 900 && points <= 1080) {
        return 'Emeraude 2';
    } else if (points > 1080 && points <= 1200) {
        return 'Emeraude 3';
    } else if (points > 1200 && points <= 1350) {
        return 'Conquérant';
    } else if (points >= 1500 && points < 2400) {
        return 'Légende';
    } else {
        return 'Rang indéfini';
    }
}

module.exports = [
    {
        method: "GET",
        endpoint: "/fetch-players",
        middlewares: [],
        requestListener: async function (req, res) {
            let players = readPlayers();

            players.sort((a, b) => b.points - a.points);

            players = players.map(player => ({
                nom: escapeHtml(player.nom),
                points: escapeHtml(player.points.toString()),
                rank: attributeRank(player.points)
            }));

            res.status(200).json(players);
        }
    }
];