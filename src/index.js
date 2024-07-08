const expressapi = require("@borane/expressapi");
const fs = require("fs");
const config = require('../config.json');
const services = {};

function listFilesInFolder(path) {
    return fs.readdirSync(path, { withFileTypes: true }).flatMap(entry => {
        const subpath = `${path}/${entry.name}`;
        return entry.isDirectory() ? listFilesInFolder(subpath) : subpath;
    });
}


const httpServer = new expressapi.HttpServer(5050);

httpServer.use((req, res) => {
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS"); // all methode use

    if (config.cors.includes(req.headers.origin))
        res.setHeader("Access-Control-Allow-Origin", req.headers.origin); // cors 
});

for (let path of listFilesInFolder(`${__dirname}/routes`)) {
    const module = require(path);
    
    for (let route of module) {
        httpServer[route.method.toLowerCase()](
            route.endpoint,
            route.requestListener.bind(services),
            route.middlewares.map(m => m.bind(services))
        );
    }
}

httpServer.listen();