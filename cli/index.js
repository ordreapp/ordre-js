#!/usr/bin/env node

import minimist from 'minimist';
import run from './run.js';

const argv = minimist(process.argv.slice(2));
const command = argv._[0];
const commandToFunction = { run };

if (command in commandToFunction) {
    commandToFunction[command](argv);
} else {
    console.log("Unknown command.");
}