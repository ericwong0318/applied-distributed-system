package main

import (
	"backend/models"
	"context"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
	"golang.org/x/crypto/bcrypt"
	"log"
	"math/rand"
	"net/http"
	"net/smtp"
	"strconv"
)

var (
	Client *mongo.Client
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
	Client = getDBClient(uri)

	// Routes

	r := gin.Default()
	r.Use(cors.Default())

	// Authentications
	r.POST("/register", Register)
	r.POST("/login", Login)
	r.POST("/reset-password", ResetPassword)

	// Listened port
	listenedAddress := viper.GetString("server.host") + ":" + viper.GetString("server.port")
	if err := r.Run(listenedAddress); err != nil {
		log.Fatalln("Main function failed")
		return
	}

	// Disconnect database
	defer func() {
		if err := Client.Disconnect(context.TODO()); err != nil {
			panic(err)
		}
	}()
}

func getDBClient(uri string) *mongo.Client {
	// Connect database
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
	if err != nil {
		panic(err)
	}

	// Ping the primary
	if err := client.Ping(context.TODO(), readpref.Primary()); err != nil {
		panic(err)
	}
	return client
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
	if err := coll.FindOne(context.TODO(), bson.D{{"email", user.Email}}).Decode(&result); err == nil {
		// If we get ErrNoDocuments, the email is used
		c.JSON(http.StatusBadRequest, "The email is used")
		return
	}

	// Create user
	hashedPassword, err := HashPassword(user.Password)
	if err != nil {
		panic(err)
	}
	_, err = coll.InsertOne(context.TODO(), bson.D{{"email", user.Email},
		{"password", hashedPassword}})
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		log.Fatal(err)
		return
	}

	c.JSON(http.StatusCreated, "Account created")
}

func Login(c *gin.Context) {
	var user models.User
	if c.ShouldBind(&user) == nil {
		log.Println(user.Email)
	}

	// Read database
	coll := Client.Database("account").Collection("users")
	var result models.User
	err := coll.FindOne(context.TODO(), bson.D{{"email", user.Email}}).Decode(&result)

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
	result, err := coll.UpdateOne(context.TODO(), filter, update, opts)
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
