/// <reference types="firefox-webext-browser" />
import { View } from '@quenk/wml';
import { Value, Object } from '@quenk/noni/lib/data/json';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Column } from '@quenk/wml-widgets/lib/data/table';
import { TextChangedEvent } from '@quenk/wml-widgets/lib/control/text-field';
import { FileChangedEvent } from '@quenk/wml-widgets/lib/control/file-input';
export declare const ID_MAIN = "main";
export declare const ID_MOCHA = "mocha";
export declare const ID_MOCHA_SCRIPT = "testrun-mocha-script";
export declare const ID_TEST_SCRIPT = "testrun-test-script";
export declare const MSG_NO_PARENT: string;
export declare const URL_MOCHA_JS = "testrun/mocha.js";
export declare const MSG_TYPE_RESULTS = "results";
/**
 * CLIScriptRequest
 */
export interface CLIScriptRequest {
    id: string;
    type: string;
    name: string;
    args: string;
}
/**
 * Message is the data structure we use to pass data between
 * the background, content and page contexts.
 */
export interface Message {
    [key: string]: any;
    /**
     * type of message
     */
    type: string;
}
/**
 * Suite describes a test suite that can be run.
 */
export interface Suite extends Object {
    /**
     * name of the suite (file name).
     */
    name: string;
    /**
     * code to run in order to execute the test.
     */
    code: string;
}
/**
 * Testrun
 */
export declare class Testrun {
    window: Window;
    app: Window;
    constructor(window: Window, app: Window);
    view: View;
    tab: number;
    currentTab: Maybe<browser.tabs.Tab>;
    runner: browser.runtime.Port;
    values: {
        url: {
            name: string;
            label: string;
            value: string;
            onChange: (e: TextChangedEvent) => void;
        };
        exec: {
            name: string;
            label: string;
            value: string;
            onChange: (e: TextChangedEvent) => void;
        };
        files: {
            text: string;
            multiple: boolean;
            onChange: (e: FileChangedEvent) => void;
        };
        table: {
            data: Suite[];
            columns: Column<Value, Suite>[];
        };
        results: {
            content: HTMLElement;
        };
    };
    /**
     * handleMessage dispatches messages received via the postMessage() api.
     */
    handleMessage: (m: object) => void;
    static create(w: Window, a: Window): Testrun;
    /**
     * @private
     */
    loadFromFiles(list: File[]): void;
    /**
     * @private
     */
    clearSuite(): void;
    /**
     * @private
     */
    runMocha(f: () => void): void;
    /**
     * showResults parses the html from the results and displays it
     * in the main UI.
     */
    showResults(msg: Message): void;
    /**
     * showError alerts the user and dumps an error to the console.
     */
    showError(e: Error): void;
    runCLIScript(e: CLIScriptRequest): void;
    /**
     * runSuite
     */
    runSuite(s: Suite): void;
    /**
     * run the application.
     */
    run(): void;
}
