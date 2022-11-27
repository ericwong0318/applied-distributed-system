package main

import (
	"backend/models"
	"context"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/olahol/melody"
	"github.com/spf13/viper"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
	"log"
	"math/rand"
	"net/http"
	"net/smtp"
	"strconv"
	"strings"
	"time"
)

var (
	Client     *mongo.Client
	ctx        context.Context
	hmacSecret []byte
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
	Client, ctx = getDBClient(uri)

	// Disconnect database
	defer func() {
		if err := Client.Disconnect(ctx); err != nil {
			panic(err)
		}
	}()

	// Get HMAC secrete
	hmacSecret = []byte(viper.GetString("server.hmac-secrete"))

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
	r.POST("/register", Register)
	r.POST("/login", Login)
	r.POST("/reset-password", ResetPassword)
	r.POST("/check-jwt", CheckJwt)

	// WebSocket
	r.GET("/channel/:name/ws", func(c *gin.Context) {
		err := m.HandleRequest(c.Writer, c.Request)
		if err != nil {
			c.JSON(http.StatusInternalServerError, "WebSocket fails")
		}
	})

	m.HandleMessage(func(s *melody.Session, msg []byte) {
		// Store message into database
		fmt.Println(string(msg))
		messageData := strings.Split(string(msg), ";")
		coll := Client.Database("account").Collection("messages")
		message := models.Message{Email: messageData[0], Time: messageData[1], Content: messageData[2]}
		fmt.Println(message)
		_, err := coll.InsertOne(ctx, message)
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

func getDBClient(uri string) (*mongo.Client, context.Context) {
	// Connect database
	serverAPIOptions := options.ServerAPI(options.ServerAPIVersion1)
	clientOptions := options.Client().
		ApplyURI(uri).
		SetServerAPIOptions(serverAPIOptions)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal(err)
	}
	return client, ctx
}

// Hashing

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	return string(bytes), err
}

func comparePasswordAndHashedPassword(password, hash string) bool {
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return false
	}
	return true
}

// User services

func Register(c *gin.Context) {
	var user models.User
	if err := c.ShouldBind(&user); err != nil {
		panic(err)
	}

	// Check email is registered
	coll := Client.Database("account").Collection("users")
	var result models.User
	if err := coll.FindOne(ctx, bson.D{{"email", user.Email}}).Decode(&result); err == nil {
		// If we get ErrNoDocuments, the email is used
		c.JSON(http.StatusBadRequest, "The email is used")
		return
	}

	// Create user
	hashedPassword, err := HashPassword(user.Password)
	if err != nil {
		panic(err)
	}
	_, err = coll.InsertOne(ctx, bson.D{{"email", user.Email},
		{"password", hashedPassword}})
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		log.Fatal(err)
		return
	}

	c.JSON(http.StatusCreated, "Account created")
}

func CheckJwt(c *gin.Context) { // Read cookie for JWT
	tokenString, err := c.Cookie("tokenString")
	if err == nil { // TokenString exists
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return hmacSecret, nil
		})
		if _, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			c.JSON(http.StatusOK, "JWT is valid")
		} else {
			fmt.Println(err)
		}
	} else if err == http.ErrNoCookie {
		c.JSON(http.StatusUnauthorized, "Have not login")
	} else {
		c.JSON(http.StatusInternalServerError, "Cookie error")
	}
	return
}

func Login(c *gin.Context) {
	var user models.User
	if c.ShouldBind(&user) != nil {
		c.JSON(http.StatusUnauthorized, "Have not login")
		return
	}

	// Read database
	coll := Client.Database("account").Collection("users")
	var result models.User
	err := coll.FindOne(ctx, bson.D{{"email", user.Email}}).Decode(&result)

	// Email not found
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, "Email not found")
			return
		}
		panic(err)
	}

	// Check email and password
	if user.Email == result.Email && comparePasswordAndHashedPassword(user.Password, result.Password) {
		// Generate JWT and set cookie
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"email":    result.Email,
			"password": result.Password,
		})
		tokenString, _ := token.SignedString(hmacSecret)
		c.SetSameSite(http.SameSiteNoneMode)
		c.SetCookie("tokenString", tokenString, 60*60*1000, "/",
			viper.GetString("server.host"), true, false) // maxAge = second * 1000
		c.JSON(http.StatusOK, "Login successfully")
	} else {
		c.JSON(http.StatusForbidden, "Wrong password")
	}
}

func ResetPassword(c *gin.Context) {
	var user models.User
	if err := c.ShouldBind(&user); err != nil {
		panic(err)
	}

	// Generate random password
	// Seed(1)
	randomPassword := strconv.Itoa(rand.Intn(1000000)) // 6 digits random password

	// Update password to random password in database.
	hashedPassword, err := HashPassword(randomPassword)
	coll := Client.Database("account").Collection("users")
	filter := bson.D{{"email", user.Email}}
	update := bson.D{{"$set", bson.D{{"password", hashedPassword}}}}
	opts := options.Update().SetUpsert(false)
	result, err := coll.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		log.Fatal(err)
	}
	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, "Account not found")
		return
	} else {
		fmt.Println("Updated successful")
	}

	// Send email
	senderEmail := viper.GetString("server.email-address")
	host := viper.GetString("server.email-host")
	auth := smtp.PlainAuth("", senderEmail, viper.GetString("server.email-address-password"), host)
	toEmail := []string{user.Email}
	msg := []byte(
		"To: " + toEmail[0] + "\r\n" + "Subject: Reset password\r\n" + "\r\n" +
			"The Chat App has reset your password. The previous password is changed to this new password: " +
			randomPassword + " \r\n")
	if err := smtp.SendMail(host+":587", auth, senderEmail, toEmail, msg); err != nil {
		c.JSON(http.StatusInternalServerError, "Send email failed")
		log.Fatal(err)
	}
	c.JSON(http.StatusOK, "Email sent")
}
