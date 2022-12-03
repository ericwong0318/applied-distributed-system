package controllers

import (
	"backend/models"
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/olahol/melody"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func WebSocketHandleRequest(m *melody.Melody) func(c *gin.Context) {
	return func(c *gin.Context) {
		err := m.HandleRequest(c.Writer, c.Request)
		if err != nil {
			c.JSON(http.StatusInternalServerError, "WebSocket fails")
		}
	}
}

func WebSocketHandleMessage(m *melody.Melody) {
	m.HandleMessage(func(s *melody.Session, msg []byte) {
		// Store message into database
		messageData := strings.Split(string(msg), ";")
		coll := Client.Database("account").Collection("messages")
		channelId, err := strconv.Atoi(messageData[4])
		if err != nil {
			panic("String to int fails")
		}
		message := models.Message{MessageId: messageData[3], Email: messageData[0], Time: time.Now().Unix(),
			Content: messageData[2], ChannelId: channelId}
		fmt.Println(message)
		_, err = coll.InsertOne(context.TODO(), message)
		if err != nil {
			panic("Insert fails")
		}

		// Handle broadcast
		err = m.BroadcastFilter(msg, func(q *melody.Session) bool {
			return q.Request.URL.Path == s.Request.URL.Path
		})
		if err != nil {
			panic("Broadcast fails")
		}
	})
}
