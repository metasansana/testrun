/**
 * Message is the base structure of messages exchanged between the various parts
 * of the extension.
 */
export interface Message {
    /**
     * type indicating the type of the message.
     */
    type: string;
}
