#!/bin/env node

import * as os from 'os';

import { exec } from 'child_process';

import { Object, parse } from '@quenk/noni/lib/data/json';
import { isString, isObject } from '@quenk/noni/lib/data/type';

let q: Buffer[] = [];

const flushQ = () => {

    q.splice(0);

}

const processChunks = () => {

    let buf = Buffer.concat(q);

    if (buf.length > 4) {

        let expectedSize = buf.readUInt32LE(0);

        if (buf.length >= (expectedSize + 4)) {

            let eData = parse(buf.slice(4).toString('utf8'));

            if (eData.isLeft()) {

                let err = eData.takeLeft();

                sendMessage({

                    type: 'error',

                    message: err.message,

                    stack: err.stack

                });

            } else {

                let data = <Object>eData.takeRight();

                if (isObject(data) && isString(data.name) && isString(data.args)) {

                    let { id, name, args } = data;

                    //TODO: escape command for cli.
                    exec(`${name} ${args}`, (e: Error | null, stdout: string) => {

                        if (e != null) {

                            sendMessage({

                                id,

                                type: 'testrun-exec-cli-script-error',

                                message: e.message,

                                stack: e.stack

                            });

                        } else {

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

}

const sendMessage = (o: object) => {

    let res = Buffer.from(JSON.stringify(o));

    let lenBuf = Buffer.alloc(4);

    if (os.endianness() === 'LE')
        lenBuf.writeUInt32LE(res.length, 0);
    else
        lenBuf.writeUInt32BE(res.length, 0);

    process.stdout.write(Buffer.concat([lenBuf, res]))

}

const handleInput = () => {

    let chunk: Buffer;

    while ((chunk = process.stdin.read()) !== null)
        q.push(chunk);

    processChunks();

}

const main = () => {

    process.stdin.on('readable', handleInput);

}

main();
