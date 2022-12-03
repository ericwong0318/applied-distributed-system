package controllers

import (
	"backend/models"
	"context"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/olahol/melody"
	"log"
	"net/http"
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
		// Convert msg bytes to struct
		var message models.Message
		if err := json.Unmarshal(msg, &message); err != nil {
			panic(err)
		}

		// Store message into database
		coll := Client.Database("account").Collection("messages")
		fmt.Println(message)
		_, err := coll.InsertOne(context.TODO(), message)
		if err != nil {
			panic("Insert fails")
		}
		log.Println()

		// Handle broadcast
		err = m.BroadcastFilter(msg, func(q *melody.Session) bool {
			return q.Request.URL.Path == s.Request.URL.Path
		})
		if err != nil {
			panic("Broadcast fails")
		}
	})
}
