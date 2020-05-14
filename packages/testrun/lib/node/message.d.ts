import { Message } from '../message';
export declare const MSG_EXEC = "testrun-exec-cli-script";
export declare const MSG_EXEC_RESULT = "testrun-exec-cli-script-result";
export declare const MSG_EXEC_FAIL = "testrun-exec-cli-script-error";
export declare const REGEX_SAFE_STRING: RegExp;
/**
 * NodeMessage is the base structure of messages exchanged between the node
 * backend and the extension.
 */
export interface NodeMessage extends Message {
    /**
     * id of the target callback.
     */
    id: number;
}
/**
 * Exec message structure.
 */
export interface Exec extends NodeMessage {
    /**
     * name of the script to be executed.
     */
    name: string;
    /**
     * args is a space delimited list of strings representing arguments
     * to be passed to the script. Must comply with isCLISafe.
     */
    args: string;
}
/**
 * Fail message structure.
 */
export interface Fail extends NodeMessage {
    /**
     * message describing the failure.
     */
    message: string;
}
/**
 * Result message structure.
 */
export interface Result extends NodeMessage {
    /**
     * value output from the execution of the program.
     */
    value: string;
}
/**
 * NewExec constructor.
 */
export declare class NewExec implements Exec {
    id: number;
    name: string;
    args: string;
    constructor(id: number, name: string, args: string);
    type: string;
}
/**
 * NewFail constructor.
 */
export declare class NewFail implements Fail {
    id: number;
    message: string;
    constructor(id: number, message: string);
    type: string;
}
/**
 * NewResult constructor.
 */
export declare class NewResult implements Result {
    id: number;
    value: string;
    constructor(id: number, value: string);
    type: string;
}
/**
 * isCLISafe tests whether a string passed is "safe" for use on the cli.
 *
 * Safe in this regards means the string complies with REGEX_SAFE_STRING.
 */
export declare const isCLISafe: (value: string) => boolean;
