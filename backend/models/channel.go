package models

type Channel struct {
	ChannelId   int    `form:"channelId" bson:"channelId" json:"channelId"`
	ChannelName string `form:"channelName" bson:"channelName" json:"channelName"`
	Wiki        string `form:"wiki" bson:"wiki" json:"wiki"`
}
