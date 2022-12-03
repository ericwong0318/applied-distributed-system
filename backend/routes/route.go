package routes

import (
	"backend/controllers"
	"github.com/gin-gonic/gin"
	"github.com/olahol/melody"
)

func HandleRoutes(r *gin.Engine) {
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
}

func HandleWebSocket(r *gin.Engine) {
	// WebSocket
	m := melody.New()
	r.GET("/channel/:name/ws", controllers.WebSocketHandleRequest(m))
	controllers.WebSocketHandleMessage(m)
}
