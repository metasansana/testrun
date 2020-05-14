import { Message } from '../message';

export const MSG_TARGET_TAB = 'testrun-target-tab';

/**
 * TargetTab messages provides the id of the active tab the user activates the 
 * extension on.
 */
export interface TargetTab extends Message {

    /**
     * id of the tab.
     */
    id: number

}
