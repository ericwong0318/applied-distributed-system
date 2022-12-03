package main

import (
	"backend/controllers"
	"backend/models"
	"context"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/olahol/melody"
	"github.com/spf13/viper"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func main() {
	// Read the configuration file
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	if err := viper.ReadInConfig(); err != nil {
		log.Fatal(err)
	}

	// Connect database
	uri := viper.GetString("database.uri")
	controllers.Client, _ = controllers.GetDBClient(uri)

	// Disconnect database
	defer func() {
		if err := controllers.Client.Disconnect(context.TODO()); err != nil {
			panic(err)
		}
	}()

	// Get HMAC secrete
	controllers.HmacSecret = []byte(viper.GetString("server.hmac-secrete"))

	// Routes

	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		// Access-Control-Allow-Origin: * is not allowed when send with credentials in frontend
		AllowOrigins: []string{"http://" + viper.GetString("front-end.host") + ":" +
			viper.GetString("front-end.port")},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Length", "Content-Type", "X-Requested-With",
			"Set-Cookie"},
		ExposeHeaders:    []string{"Set-Cookie"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Melody
	m := melody.New()

	// Authentications
	r.POST("/register", controllers.Register)
	r.POST("/login", controllers.Login)
	r.POST("/reset-password", controllers.ResetPassword)
	r.POST("/check-jwt", controllers.CheckJwt)

	// Create
	r.POST("/create-channel", controllers.CreateChannel)

	// Read
	r.POST("/read-messages", controllers.ReadMessages)
	r.POST("/read-user", controllers.ReadUser)

	// Update
	r.POST("/join-channel", controllers.JoinChannel)

	// Delete

	// WebSocket
	r.GET("/channel/:name/ws", func(c *gin.Context) {
		err := m.HandleRequest(c.Writer, c.Request)
		if err != nil {
			c.JSON(http.StatusInternalServerError, "WebSocket fails")
		}
	})

	m.HandleMessage(func(s *melody.Session, msg []byte) {
		// Store message into database
		messageData := strings.Split(string(msg), ";")
		coll := controllers.Client.Database("account").Collection("messages")
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

	// Listened port
	listenedAddress := viper.GetString("server.host") + ":" + viper.GetString("server.port")
	if err := r.Run(listenedAddress); err != nil {
		log.Fatalln("Main function failed")
		return
	}
}

// User services
