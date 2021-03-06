/// <reference path="../../../global.d.ts" />
/// <reference types="firefox-webext-browser" />
import { View } from '@quenk/wml';
import { Value, Object } from '@quenk/noni/lib/data/json';
import { Maybe } from '@quenk/noni/lib/data/maybe';
import { Column } from '@quenk/wml-widgets/lib/data/table';
import { TextChangedEvent } from '@quenk/wml-widgets/lib/control/text-field';
import { FileChangedEvent } from '@quenk/wml-widgets/lib/control/file-input';
import { Exec } from '@metasansana/testrun/lib/node/message';
export declare const ID_MAIN = "main";
export declare const ID_MOCHA = "mocha";
export declare const ID_MOCHA_SCRIPT = "testrun-mocha-script";
export declare const ID_TEST_SCRIPT = "testrun-test-script";
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
    targetTab: Maybe<browser.tabs.Tab>;
    background: browser.runtime.Port;
    node: browser.runtime.Port;
    nodeRunnerAvailable: boolean;
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
     * handleError alerts the user and dumps an error to the console.
     */
    handleError: (e: Error) => void;
    /**
     * handleNodeDisconnect handles the disconnect of the native cli runner.
     */
    handleNodeDisconnect: (p: browser.runtime.Port) => void;
    /**
     * handleMessage received from the message passing hooks.
     *
     * Messages may come from:
     * 1. Page scripts.
     * 2. Content scripts.
     * 3. Native scripts.
     * 4. This.
     */
    handleMessage: (m: object) => void;
    static create(w: Window, a: Window): Testrun;
    /**
     * isScriptPathSet detects whether the user has specified a path to read
     * "execCLIScript" targets from.
     */
    isScriptPathSet(): boolean;
    /**
     * createTargetTab is used to create a new tab for testing.
     *
     * This is only used if we detect the targetTab is not set.
     */
    createTargetTab(): Promise<browser.tabs.Tab>;
    /**
     * updateURLFromTab attempts to update the target url using the tab
     * id specified.
     */
    updateURLFromTab(id: number): Promise<void>;
    /**
     * showResults parses the html from the results and displays it
     * in the main UI.
     */
    xshowResults(msg: Message): void;
    showResults(msg: Message): void;
    /**
     * show the application.
     */
    show(): void;
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
     * runCLIScript on behalf of the running test.
     *
     * This method is the bridge between the injected script and the CLI
     * provided by this extension.
     */
    runCLIScript(e: Exec): void;
    /**
     * runSuite
     */
    runSuite(s: Suite): void;
    /**
     * run the application.
     */
    run(): void;
}
