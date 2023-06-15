package routes

import (
	"backend/services"
	"github.com/gin-gonic/gin"
	"github.com/olahol/melody"
)

func HandleRoutes(r *gin.Engine) {
	r.GET("/", services.ShowIndex)

	// Authentications
	r.POST("/register", services.Register)
	r.POST("/login", services.Login)
	r.PUT("/reset-password", services.ResetPassword)
	r.POST("/check-jwt", services.CheckJwt)

	// Create
	r.POST("/create-channel", services.CreateChannel)
	r.POST("/create-media", services.CreateMedia)

	// Read
	r.GET("/read-messages", services.ReadMessages)
	r.GET("/read-user", services.ReadUser)
	r.GET("/download-media", services.DownloadMedia)

	// Update
	r.PUT("/join-channel", services.JoinChannel)
	r.PUT("/join-video-conference", services.JoinVideoConference)

	// Delete
	r.DELETE("/exit-channel", services.ExitChannel)
	r.DELETE("/delete-channel", services.DeleteChannel)
}

func HandleWebSocket(r *gin.Engine) {
	// WebSocket
	m := melody.New()
	r.GET("/channel/:name/ws", services.WebSocketHandleRequest(m))
	services.WebSocketHandleMessage(m)
}
