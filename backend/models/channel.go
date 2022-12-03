package models

type Channel struct {
	ChannelId   int    `form:"channelId" bson:"channelid" json:"channelId"`
	ChannelName string `form:"channelName" bson:"channelname" json:"channelName"`
	Wiki        string `form:"wiki" bson:"wiki" json:"wiki"`
}
