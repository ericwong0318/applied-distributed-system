package models

type Message struct {
	// Email and ChannelId is primary key
	Email     string
	ChannelId int
	Time      string
	Content   string
}
