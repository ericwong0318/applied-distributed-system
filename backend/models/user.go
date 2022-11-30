package models

type User struct {
	Email       string   `form:"email" json:"email" bson:"email"`
	Password    string   `form:"password" json:"password" bson:"password"`
	ChannelId   []int    `form:"channelId" json:"channelId" bson:"channelId"`
	ChannelName []string `form:"channelName" json:"channelName" bson:"channelName"`
}
