export interface UserInterface {
    email: string,
    password: string,
    channels: number[]
}

export interface MessageInterface {
    messageId: string,
    email: string,
    channelId: number,
    time: number,
    content: string
}

export interface ChannelInterface {
    channelId: number,
    channelName: string,
    wiki: string
}

export interface TextFieldEventInterface {
    target: {
        value: string
    }
}