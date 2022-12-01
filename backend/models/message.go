package models

type Message struct {
	MessageId string `form:"messageID" json:"messageId" bson:"messageId"`
	Email     string `form:"email" json:"email" bson:"email"`
	ChannelId int    `form:"channelId" json:"channelId" bson:"channelId"`
	Time      int64  `form:"time" json:"time" bson:"time"`
	Content   string `form:"content" json:"content" bson:"content"`
}
