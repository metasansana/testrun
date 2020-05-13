#!/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const child_process_1 = require("child_process");
const json_1 = require("@quenk/noni/lib/data/json");
const type_1 = require("@quenk/noni/lib/data/type");
let q = [];
const flushQ = () => {
    q.splice(0);
};
const processChunks = () => {
    let buf = Buffer.concat(q);
    if (buf.length > 4) {
        let expectedSize = buf.readUInt32LE(0);
        if (buf.length >= (expectedSize + 4)) {
            let eData = json_1.parse(buf.slice(4).toString('utf8'));
            if (eData.isLeft()) {
                let err = eData.takeLeft();
                sendMessage({
                    type: 'error',
                    message: err.message,
                    stack: err.stack
                });
            }
            else {
                let data = eData.takeRight();
                if (type_1.isObject(data) && type_1.isString(data.name) && type_1.isString(data.args)) {
                    let { id, name, args } = data;
                    //TODO: escape command for cli.
                    child_process_1.exec(`${name} ${args}`, (e, stdout) => {
                        if (e != null) {
                            sendMessage({
                                id,
                                type: 'testrun-exec-cli-script-error',
                                message: e.message
                            });
                        }
                        else {
                            sendMessage({
                                id,
                                type: 'testrun-exec-cli-script-result',
                                value: stdout
                            });
                        }
                    });
                }
            }
            flushQ();
        }
    }
};
const sendMessage = (o) => {
    let res = Buffer.from(JSON.stringify(o));
    let lenBuf = Buffer.alloc(4);
    if (os.endianness() === 'LE')
        lenBuf.writeUInt32LE(res.length, 0);
    else
        lenBuf.writeUInt32BE(res.length, 0);
    process.stdout.write(Buffer.concat([lenBuf, res]));
};
const handleInput = () => {
    let chunk;
    while ((chunk = process.stdin.read()) !== null)
        q.push(chunk);
    processChunks();
};
const main = () => {
    process.stdin.on('readable', handleInput);
};
main();
//# sourceMappingURL=main.js.map