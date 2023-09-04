import open from 'open';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BE_DOMAIN, FE_URL } from '../globals';

const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configFileFullPath = `${__dirname}/.config.json`;

function log(message) {
    //console.log(`ordre-test cli/run.js - ${message}`);
    console.log(message);
}

function startRun(runId) {
    log(`startRun entered (runId=${runId})`);

}

function createRun(authorizationType, token) {
    log(`createRun entered (authorizationType=${authorizationType}, token=${token})`);
    const url = `${BE_URL}/run/start`;
    const body = JSON.stringify({
        
    });
    fetch(url, {
        method: "POST",
        body
    }).then(response => response.json()).then(json => {
        if (!("id" in json)) {
            log("Unable to create run 'id'.");
            return;
        }
        startRun(json["id"]);
    }).catch(err => {
        console.err(`${url} catch: ${err.toString()}`);
    });
}

function obtainToken() {
    try {
        const obtainTokenId = genRanHex(16);
        const socket = new WebSocket(`ws://${BE_DOMAIN}/cli/cli_consumer/`);
        socket.onopen = function() {
            const body = JSON.stringify({ obtainTokenId });
            socket.send(body);
            log("Opening browser to obtain credentials.");
            open(`${FE_URL}/cli/token/obtain?id=${obtainTokenId}`);
        };
        socket.onmessage = function(event) {
            //log("onmessage entered");
            const data = event.data;
            const json = JSON.parse(data);
            //log(JSON.stringify(json));
            const type = json["type"];
            if (type == "send_token_info") {
                socket.close();
                if (!("authorization_type" in json) || !("token" in json)) {
                    log("Error obtaining credentials.");
                    return;
                }
                log("Credentials correctly obtained!");
                const authorizationType = json["authorization_type"];
                const token = json["token"];
                const configDict = {
                    authorizationType,
                    token
                };
                const configJson = JSON.stringify(configDict);
                //const content = `authorizationType=${authorizationType}\ntoken=${token}`;
                fs.writeFile(configFileFullPath, configJson, function(err) {
                    if (err) {
                        log(`Error writing .config.json file: ${err}`);
                    }
                });
                createRun(authorizationType, token);
            }
        };
    } catch(e) {
        log(`obtainToken exception: ${e}`);
    }
}

export default function() {
    try {
        fs.readFile(configFileFullPath, (err, data) => {
            if (!err && data) {
                //log('.config.json data: ' + data);
                const configDict = JSON.parse(data);
                if (!("authorizationType" in configDict) || !("token" in configDict)) {
                    obtainToken();
                } else {
                    createRun(configDict["authorizationType"], configDict["token"]);
                }
            } else {
                obtainToken();
            }
        });
    } catch(e) {
        log(`exception: ${e}`);
    }
}