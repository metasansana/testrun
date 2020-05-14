import { Message } from '../message';

export const MSG_EXEC = 'testrun-exec-cli-script';
export const MSG_EXEC_RESULT = 'testrun-exec-cli-script-result';
export const MSG_EXEC_FAIL = 'testrun-exec-cli-script-error';

export const REGEX_SAFE_STRING = /[\w]+/

/**
 * NodeMessage is the base structure of messages exchanged between the node
 * backend and the extension.
 */
export interface NodeMessage extends Message {

    /**
     * id of the target callback.
     */
    id: number,

}

/**
 * Exec message structure.
 */
export interface Exec extends NodeMessage {

    /**
     * name of the script to be executed.
     */
    name: string,

    /**
     * args is a space delimited list of strings representing arguments
     * to be passed to the script. Must comply with isCLISafe.
     */
    args: string

}

/**
 * Fail message structure.
 */
export interface Fail extends NodeMessage {

    /**
     * message describing the failure.
     */
    message: string

}

/**
 * Result message structure.
 */
export interface Result extends NodeMessage {

    /**
     * value output from the execution of the program.
     */
    value: string

}

/**
 * NewExec constructor.
 */
export class NewExec implements Exec {

    constructor(
        public id: number,
        public name: string,
        public args: string) { }

    type = MSG_EXEC;

}

/**
 * NewFail constructor.
 */
export class NewFail implements Fail {

    constructor(
        public id: number,
        public message: string) { }

    type = MSG_EXEC_FAIL;

}

/**
 * NewResult constructor.
 */
export class NewResult implements Result {

    constructor(
        public id: number,
        public value: string) { }

    type = MSG_EXEC_RESULT;

}

/**
 * isCLISafe tests whether a string passed is "safe" for use on the cli.
 *
 * Safe in this regards means the string complies with REGEX_SAFE_STRING.
 */
export const isCLISafe = (value: string) =>
    value.split(' ').every(a => REGEX_SAFE_STRING.test(a));
