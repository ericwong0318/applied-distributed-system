package controllers

import (
	"backend/models"
	"context"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/spf13/viper"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"math/rand"
	"net/http"
	"net/smtp"
	"strconv"
)

var (
	Client     *mongo.Client
	HmacSecret []byte
)

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

func CheckJwt(c *gin.Context) { // Read cookie for JWT
	tokenString, err := c.Cookie("tokenString")
	if err == nil { // TokenString exists
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return HmacSecret, nil
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
	if user.Email == result.Email && ComparePasswordAndHashedPassword(user.Password, result.Password) {
		// Generate JWT and set cookie
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"email":    result.Email,
			"password": result.Password,
		})
		tokenString, _ := token.SignedString(HmacSecret)
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

func CreateChannel(c *gin.Context) {
	// Bind requests
	var channel models.Channel
	if c.ShouldBind(&channel) != nil {
		c.JSON(http.StatusBadRequest, "Channel info is incorrect")
		return
	}

	// Generate channelId
	channel.ChannelId = rand.Intn(1000000)

	// Insert channel into database
	coll := Client.Database("account").Collection("channels")
	result, err := coll.InsertOne(
		context.TODO(),
		channel,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, "Channel info is incorrect")
		return
	}
	log.Println(result)

	// The user will join the channel that he just created.

	// Response JSON
	c.JSON(http.StatusOK, "Created a new channel with ID:"+strconv.Itoa(channel.ChannelId)+
		", Name:"+channel.ChannelName)
}

func ReadUser(c *gin.Context) {
	// Bind user
	var user models.User
	if c.ShouldBind(&user) != nil {
		c.JSON(http.StatusUnauthorized, "Have not login")
		return
	}

	// Select user in the database
	coll := Client.Database("account").Collection("users")
	var result models.User
	err := coll.FindOne(context.TODO(), bson.D{{"email", user.Email}}).Decode(&result)
	if err != nil {
		panic(err)
	}

	// Response JSON
	c.JSON(http.StatusOK, result)
}

func ReadMessages(c *gin.Context) {
	// Parse JSON
	var requestJson struct {
		ChannelId int
	}
	if c.Bind(&requestJson) != nil {
		panic("Input is invalid")
	}

	// Read database
	coll := Client.Database("account").Collection("messages")
	cursor, err := coll.Find(context.TODO(), bson.D{{"channelId", requestJson.ChannelId}})
	if err != nil {
		panic("Change channel fails")
	}

	// Response JSON
	var message []models.Message
	if err = cursor.All(context.TODO(), &message); err != nil {
		panic("Convert cursor to result fails")
	}
	c.JSON(http.StatusOK, message)
}

func JoinChannel(c *gin.Context) {
	// Parse JSON
	var requestJson struct {
		Email     string `form:"email" bson:"email" json:"email"`
		ChannelId int    `form:"channelId" bson:"channelId" json:"channelId"`
	}
	if err := c.ShouldBind(&requestJson); err != nil {
		panic(err)
	}

	// User join the channel
	resultChannel, err := UserJoinChannel(requestJson)
	if err != nil {
		log.Println(err)
	}

	// Response JSON
	c.JSON(http.StatusOK, "User joined channel "+resultChannel.ChannelName)
}

func UserJoinChannel(inputStruct struct {
	Email     string `form:"email" bson:"email" json:"email"`
	ChannelId int    `form:"channelId" bson:"channelId" json:"channelId"`
}) (models.Channel, error) {
	// Check the existence of the channel with the channelId
	resultChannel, err := FindChannelId(inputStruct.ChannelId)
	if err != nil {
		return models.Channel{}, err
	}

	// Update channelId into user
	coll := Client.Database("account").Collection("users")
	result, err := coll.UpdateOne(
		context.TODO(),
		bson.D{{"email", inputStruct.Email}},
		bson.D{{"$addToSet", bson.D{{"channelId", inputStruct.ChannelId}}}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		panic(err)
	}
	if result.MatchedCount != 0 {
		fmt.Println("matched and replaced an existing document")
	}
	if result.UpsertedCount != 0 {
		fmt.Printf("inserted a new document with ID %v\n", result.UpsertedID)
	}
	if result.ModifiedCount == 0 {
		fmt.Println("user already join this channel")
		return resultChannel, errors.New("insert fails: user has joined this channel")
	}
	log.Println(result)
	return resultChannel, err
}

func FindChannelId(channelId int) (models.Channel, error) {
	coll := Client.Database("account").Collection("channels")
	var resultChannel models.Channel
	err := coll.FindOne(
		context.TODO(),
		bson.D{{"channelId", channelId}},
	).Decode(&resultChannel)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Println(err)
		}
		return models.Channel{}, err
	}
	return resultChannel, err
}
