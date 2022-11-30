export interface UserInterface {
    email: string,
    password: string,
    channels: number[]
}

export interface MessageInterface {
    messageId: string,
    email: string,
    channelId: number,
    time: string,
    content: string
}

export interface ChannelInterface {
    channelId: number,
    channelName: string,
    wiki: string
}