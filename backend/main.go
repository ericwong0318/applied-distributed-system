package main

import (
	"backend/routes"
	"backend/services"
	"context"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"log"
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
	services.Client, _ = services.GetDBClient(uri)

	// Disconnect database
	defer func() {
		if err := services.Client.Disconnect(context.TODO()); err != nil {
			panic(err)
		}
	}()

	// Get HMAC secrete
	services.HmacSecret = []byte(viper.GetString("server.hmac-secrete"))

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

	// Routes
	routes.HandleRoutes(r)

	// WebSocket
	routes.HandleWebSocket(r)

	// Listened port
	listenedAddress := viper.GetString("server.host") + ":" + viper.GetString("server.port")
	if err := r.Run(listenedAddress); err != nil {
		log.Fatalln("Main function failed")
		return
	}
}
