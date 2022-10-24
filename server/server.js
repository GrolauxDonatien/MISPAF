const fs = require("fs");
const path = require("path");
const express = require("express");
const config = require("./config.js");
const db = require("better-sqlite3")(config.dbfile);
const jwt = require("jsonwebtoken");

const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: false, limit: config.maxupload || "10mb" }));
server.use(require('cookie-parser')());

if (!config.virtualPath || config.virtualPath.length == 0) config.virtualPath = "/";

server.use(config.virtualPath, express.static(config.www || "./www"));

class HTTPError extends Error {
    constructor(message, status) {
        super(message || "Internal Server Error");
        this.status = status || 500;
    }
}

const context = {
    config, model: {}, HTTPError
}

const manager = (() => {

    server.param('action', function (req, res, next, action) {
        req.action = action;
        next();
    })

    function getUser(request, response) {
        let token = request.cookies.tokenid;
        if (token) {
            try {
                let result = jwt.verify(token, config.secret);
                return result;
            } catch (error) {
                // remove the cookie as it is not valid
                response.cookie("token_user", "", { maxAge: 0 });
                return null;
            }
        } else {
            return null;
        }
    }

    function addControler(path, controler) {
        if (config.virtualPath.endsWith("/")) {
            path = config.virtualPath + path;
        } else {
            path = config.virtualPath + '/' + path;
        }
        server.post(path + "/:action", async (request, response) => {
            try {
                if (request.action == "requireAuth") throw new HTTPError("Unknown action", 404);
                if (request.action == "require") throw new HTTPError("Unknown action", 404);
                let user = getUser(request, response);
                if (controler.requireAuth !== false && user === null) {
                    throw new HTTPError("Unauthorized", 401);
                }
                let ctx = {};
                Object.assign(ctx, context);
                ctx.setUser = (user) => {
                    let token = jwt.sign(user, config.secret);
                    response.cookie("tokenid", token, { maxAge: 24 * 60 * 60 * 1000 });
                }
                ctx.clearUser = () => {
                    response.cookie("tokenid", "", { maxAge: 0 });
                }
                ctx.request = request;
                ctx.response = response;
                ctx.params = request.body;
                for (let k in ctx.params) {
                    if (k.endsWith("___encoded")) {
                        let nk = k.substring(0, k.length - 11);
                        ctx.params[nk] = JSON.parse(ctx.params[k]);
                        delete ctx.params[k];
                        for (let i = 0; i < ctx.params[nk].length; i++) {
                            ctx.params[nk][i].buffer = Buffer.from(ctx.params[nk][i].base64, 'base64');
                            delete ctx.params[nk][i].base64;
                        }
                    }
                }
                ctx.user = user;
                if ("require" in controler) {
                    controler.require(ctx);
                }
                if (request.action in controler) {
                    let ret = await controler[request.action](ctx);
                    if (!response.writableEnded) {
                        if (ret === undefined) { // no response, call end() to conclude the request
                            response.end();
                        } else {
                            let enc = new TextEncoder("utf-8").encode(JSON.stringify(ret));
                            response.setHeader("Content-Type", "application/json; charset=utf-8");
                            response.setHeader("Content-Length", enc.length);
                            response.end(Buffer.from(enc));
                        }
                    }
                } else {
                    throw new HTTPError("Unknown action", 404);
                }
            } catch (e) {
                if (e instanceof HTTPError) {
                    response.status(e.status);
                } else {
                    response.status(500);
                    console.error(e); // proper error should be logged
                }
                if (e instanceof Error) {
                    let enc = new TextEncoder("utf-8").encode(JSON.stringify(e.message));
                    response.setHeader("Content-Type", "application/json; charset=utf-8");
                    response.setHeader("Content-Length", enc.length);
                    response.end(Buffer.from(enc));
                } else {
                    response.end('Internal Server Error'); // ensure a response is sent
                }
            }
        });
    }

    return {
        addControler
    }
})();

context.manager = manager;

function loadModel(dir) {
    let configWithDB = {};
    for (let k in config) configWithDB[k] = config[k];
    configWithDB.db = db;
    let files = fs.readdirSync(path.join(__dirname, dir)); // get files in directory
    for (let i = 0; i < files.length; i++) {
        if (files[i].endsWith(".js")) { // if it ends by .js
            let model = require(path.join(__dirname, dir, files[i]))(configWithDB); // dynamically require it, expects a function which is given the db
            context.model[files[i].substring(0, files[i].length - 3)] = model;
            console.log("Loaded model: " + files[i]);
        }
    }
}

function loadControler(dir) {
    let files = fs.readdirSync(path.join(__dirname, dir)); // get files in directory
    for (let i = 0; i < files.length; i++) {
        if (files[i].endsWith(".js")) { // if it ends by .js
            let controler = require(path.join(__dirname, dir, files[i])); // dynamically require it, expects a function which is given the context
            manager.addControler(files[i].substring(0, files[i].length - 3), controler);
            console.log("Loaded controller: " + files[i]);
        }
    }
}

// auto load models & controlers
loadModel("models");
loadControler("controlers", true);

if (config.port === undefined) config.port = 8080;
server.listen(config.port);
console.log("Server is running: http://localhost:" + config.port + config.virtualPath);
