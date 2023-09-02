import open from 'open';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
const BE_DOMAIN = 'localhost:8000';
const FE_URL = 'http://127.0.0.1:5173';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configFileFullPath = `${__dirname}/.config.json`;

function log(message) {
    //console.log(`ordre-test cli/run.js - ${message}`);
    console.log(message);
}

function startRun(authorizationType, token) {
    log(`startRun entered (authorizationType=${authorizationType}, token=${token})`);
}

function obtainToken() {
    try {
        const runId = genRanHex(16);
        const socket = new WebSocket(`ws://${BE_DOMAIN}/cli/cli_consumer/`);
        socket.onopen = function() {
            const body = JSON.stringify({ runId });
            socket.send(body);
            log("Opening browser to obtain credentials.");
            open(`${FE_URL}/cli/token/obtain?runId=${runId}`);
        };
        socket.onmessage = function(event) {
            //log("onmessage entered");
            const data = event.data;
            const json = JSON.parse(data);
            //log(JSON.stringify(json));
            const type = json["type"];
            if (type == "send_token_info") {
                if (!("authorization_type" in json) || !("token" in json)) {
                    log("Error obtaining credentials.");
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
                startRun(authorizationType, token);
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
                    startRun(configDict["authorizationType"], configDict["token"]);
                }
            } else {
                obtainToken();
            }
        });
    } catch(e) {
        log(`exception: ${e}`);
    }
}