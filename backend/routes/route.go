package routes

import (
	"backend/controllers"
	"github.com/gin-gonic/gin"
	"github.com/olahol/melody"
)

func HandleRoutes(r *gin.Engine) {
	// Authentications
	// todo wrong REST API header
	r.POST("/register", controllers.Register)
	r.POST("/login", controllers.Login)
	r.POST("/reset-password", controllers.ResetPassword)
	r.POST("/check-jwt", controllers.CheckJwt)

	// Create
	r.POST("/create-channel", controllers.CreateChannel)
	r.POST("/create-media", controllers.CreateMedia)

	// Read
	r.POST("/read-messages", controllers.ReadMessages)
	r.POST("/read-user", controllers.ReadUser)
	r.POST("/download-media", controllers.DownloadMedia)

	// Update
	r.POST("/join-channel", services.JoinChannel)
	r.POST("/join-video-conference", services.JoinVideoConference)

	// Delete
	r.POST("/exit-channel", controllers.ExitChannel)
	r.POST("/delete-channel", controllers.DeleteChannel)
}

func HandleWebSocket(r *gin.Engine) {
	// WebSocket
	m := melody.New()
	r.GET("/channel/:name/ws", controllers.WebSocketHandleRequest(m))
	controllers.WebSocketHandleMessage(m)
}
