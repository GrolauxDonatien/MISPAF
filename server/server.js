const fs = require("fs");
const path = require("path");
const express = require("express");
const config = require("./config.js");
const db = require("better-sqlite3")(config.dbfile);
const jwt = require("jsonwebtoken");
const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();

const server = express();
let expressWs = null;
let wsListeners = {};

if (!("websocket" in config)) config.websocket = false;
if (config.websocket === true) {
    expressWs = require('express-ws')(server);
}
server.use(express.json());
server.use(express.urlencoded({ extended: false, limit: config.maxupload || "10mb" }));
server.use(require('cookie-parser')());
if (config.uploadDirectory) {
    let conf = {
        createParentPath: true,
        limits: {
            fieldNameSize: 100,
            files: 1
        }
    }
    if ("useTempFiles" in config) conf.useTempFiles = config.useTempFiles;
    if ("tempFileDir" in config) conf.tempFileDir = config.tempFileDir;
    if ("maxupload" in config) conf.limits.fileSize = config.maxupload;
    server.use(require('express-fileupload')({
        createParentPath: true,
    }));
}

if (!config.virtualPath || config.virtualPath.length == 0) config.virtualPath = "/";

server.use(config.virtualPath, express.static(config.www || "./www"));
server.use(path.join(config.virtualPath,"assets","bootstrap").replace(/\\/g,"/"), express.static(path.join(__dirname,'..','node_modules','bootstrap','dist')));

class HTTPError extends Error {
    constructor(message, status) {
        super(message || "Internal Server Error");
        this.status = status || 500;
    }
}

const context = {
    config, model: {}, HTTPError
}

const begin = db.prepare('BEGIN');
const commit = db.prepare('COMMIT');
const rollback = db.prepare('ROLLBACK');

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
                if (response) response.cookie("token_user", "", { maxAge: 0 });
                return {};
            }
        } else {
            return {}; // empty object
        }
    }

    function decodeParams(params) {
        for (let k in params) {
            if (k.endsWith("___encoded")) {
                let nk = k.substring(0, k.length - 11);
                params[nk] = JSON.parse(params[k]);
                delete params[k];
                for (let i = 0; i < params[nk].length; i++) {
                    params[nk][i].buffer = Buffer.from(params[nk][i].base64, 'base64');
                    delete params[nk][i].base64;
                }
            }
        }
        return params;
    }

    function error(e, response) {
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

    function wsError(ajaxid, e, ws) {
        try {
            ws.send(JSON.stringify({
                ajax: ajaxid,
                error: e.message,
                status: (e instanceof HTTPError) ? e.status : 500
            }));
        } catch (_) { }
    }

    function addControler(path, controlerFn) {
        if (config.virtualPath.endsWith("/")) {
            path = config.virtualPath + path;
        } else {
            path = config.virtualPath + '/' + path;
        }
        let assert = null;
        let wsMode = false;
        let controler;

        async function run(action, params) {
            // execute action in its own transaction
            if (db.inTransaction) {
                return await controler[action](params);
            } else {
                begin.run();
                try {
                    let ret=await controler[action](params);
                    commit.run();
                    return ret;
                } finally {
                    if (db.inTransaction) {
                        rollback.run();
                    }
                }    
            }
        }

        controler = controlerFn({
            HTTPError,
            model: context.model,
            config: context.config,
            setUser(user) {
                let token = jwt.sign(user, config.secret);
                asyncLocalStorage.getStore().response.cookie("tokenid", token, { maxAge: 24 * 60 * 60 * 1000 });
            },
            user: new Proxy({}, {
                get(_, k) {
                    if (k == "toJSON") {
                        return () => asyncLocalStorage.getStore().user;
                    } else {
                        return asyncLocalStorage.getStore().user[k];
                    }
                },
                set() { throw new Error("This user variable is read-only") },
                ownKeys() {
                    return Reflect.ownKeys(asyncLocalStorage.getStore().user);
                }
            }),
            getRequest() {
                return asyncLocalStorage.getStore().request;
            },
            getResponse() {
                return asyncLocalStorage.getStore().response;
            },
            clearUser() {
                asyncLocalStorage.getStore().response.cookie("tokenid", "", { maxAge: 0 });
                let user = asyncLocalStorage.getStore(); // empty in-memory user
                for (let k in user) delete user[k];
            },
            assert(fn) {
                assert = fn;
            },
            enableWebSocketMode() {
                wsMode = true;
            },
            send(msg) {
                asyncLocalStorage.getStore().client.send(JSON.stringify({ broadcast: msg }));
            },
            ws() {
                return asyncLocalStorage.getStore().client;
            },
            broadcast(canal, msg, oclient) {
                let fns = wsListeners[canal];
                if (!fns) return; // nobody is listening
                let clients = expressWs.getWss().clients;
                for (let i = fns.length - 1; i >= 0; i--) {
                    if (fns[i].client == oclient) continue; // avoird self broadcasting
                    if (!clients.has(fns[i].client)) {
                        // this client does not exists anymore
                        fns.splice(i, 1);
                        continue;
                    }
                    let client = fns[i].client;
                    asyncLocalStorage.run({
                        client,
                    }, () => {
                        try {
                            fns[i].fn(msg);
                        } catch (e) {
                            if (client.readyState >= 3) { // send failed due to closing or closed client
                                context.removeListener(canal, fns[i]); // forget about it
                            } else {
                                throw e;
                            }
                        }
                    });
                }
            },
            addListener(canal, fn) {
                let client = asyncLocalStorage.getStore().client;
                let l = wsListeners[canal];
                if (l === undefined) {
                    l = [];
                    wsListeners[canal] = l;
                }
                l.push({
                    client, fn
                });
            },
            removeListener(canal, fn) {
                let l = wsListeners[canal];
                if (l === undefined) return;
                let idx = -1;
                for (let i = 0; i < l.length; i++) {
                    if (l[i].fn == fn) {
                        idx = i;
                        break;
                    }
                }
                if (idx != -1) l.splice(idx, 1);
            }
        })

        if (wsMode == true) {
            let sid=0;
            if (config.websocket !== true) {
                throw new Error(path + " uses a websocket while it is not enabled in config.js. Add websocket:true to enable.");
            }
            server.ws(path, function (ws, req) {
                ws.sid=sid++;
                let user = getUser(req, null);
                ws.on('close', function(){ // remove all listeners for this client
                    for(let k in wsListeners) {
                        let l=wsListeners[k];
                        for(let i=l.length-1; i>=0; i--) {
                            if (l[i].client==ws) l.splice(i,1);
                        }
                    }
                });
                ws.on('message', function (msg) {
                    let json = JSON.parse(msg);
                    if ("ajax" in json) {
                        asyncLocalStorage.run({
                            user: user,
                            client: ws
                        }, async () => {
                            try {
                                let params = decodeParams(json.params);
                                if (assert !== null) {
                                    assert(params);
                                }
                                if (json.action in controler) {
                                    let ret = await run(json.action,params);
                                    ws.send(JSON.stringify({
                                        ajax: json.ajax,
                                        success: ret
                                    }));
                                } else {
                                    throw new HTTPError("Unknown action", 404);
                                }
                            } catch (e) {
                                if (!(e instanceof HTTPError)) {
                                    console.error(e);
                                }
                                wsError(json.ajax, e, ws);
                            }
                        });
                    };
                    // in the future, more message types may be supported
                });
            });
        } else {
            server.post(path + "/:action", (request, response) => {
                let user;
                try {
                    user = getUser(request, response);
                } catch (e) {
                    error(e, response);
                }
                asyncLocalStorage.run({
                    user: user,
                    request: request,
                    response: response
                }, async () => {
                    try {
                        let params = decodeParams(request.body);
                        if (assert !== null) {
                            assert(params);
                        }
                        if (request.action in controler) {
                            let ret = await run(request.action,params);
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
                        error(e, response);
                    }
                });
            });
        }

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
            let controlerFn = require(path.join(__dirname, dir, files[i])); // dynamically require it, expects a function which is given the context
            manager.addControler(files[i].substring(0, files[i].length - 3), controlerFn);
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
