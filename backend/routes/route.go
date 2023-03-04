package routes

import (
	"backend/services"
	"github.com/gin-gonic/gin"
	"github.com/olahol/melody"
)

func HandleRoutes(r *gin.Engine) {
	// Authentications
	// todo wrong REST API header
	r.POST("/register", services.Register)
	r.POST("/login", services.Login)
	r.POST("/reset-password", services.ResetPassword)
	r.POST("/check-jwt", services.CheckJwt)

	// Create
	r.POST("/create-channel", services.CreateChannel)
	r.POST("/create-media", services.CreateMedia)

	// Read
	r.POST("/read-messages", services.ReadMessages)
	r.POST("/read-user", services.ReadUser)
	r.POST("/download-media", services.DownloadMedia)

	// Update
	r.POST("/join-channel", services.JoinChannel)
	r.POST("/join-video-conference", services.JoinVideoConference)

	// Delete
	r.POST("/exit-channel", services.ExitChannel)
	r.POST("/delete-channel", services.DeleteChannel)
}

func HandleWebSocket(r *gin.Engine) {
	// WebSocket
	m := melody.New()
	r.GET("/channel/:name/ws", services.WebSocketHandleRequest(m))
	services.WebSocketHandleMessage(m)
}
