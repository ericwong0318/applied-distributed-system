package services

import (
	"github.com/livekit/protocol/auth"
	_ "github.com/livekit/server-sdk-go"
	"github.com/spf13/viper"
	"time"
)

func getToken(room string, identity string) (string, error) {
	// Get API key and secrete
	apiKey := viper.GetString("server.video-conferencing-api-key")
	apiSecret := viper.GetString("server.video-conferencing-api-secret")

	// Configure token
	canPublish := true
	canSubscribe := true

	// Generate token
	at := auth.NewAccessToken(apiKey, apiSecret)
	grant := &auth.VideoGrant{
		RoomJoin:     true,
		Room:         room,
		CanPublish:   &canPublish,
		CanSubscribe: &canSubscribe,
	}
	at.AddGrant(grant).SetIdentity(identity).SetValidFor(time.Hour)

	// Return token as JWT
	return at.ToJWT()
}
