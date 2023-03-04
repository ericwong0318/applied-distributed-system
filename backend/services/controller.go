package services

import (
	"backend/models"
	"bytes"
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/spf13/viper"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/gridfs"
	"go.mongodb.org/mongo-driver/mongo/options"
	"io"
	"log"
	"math/rand"
	"net/http"
	"net/smtp"
	"os"
	"strconv"
	"time"
)

var (
	Client     *mongo.Client
	HmacSecret []byte
)

// Authentication

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

// Create

func CreateChannel(c *gin.Context) {
	// Bind requests
	var requestJson struct {
		Email       string `form:"email"`
		ChannelName string `form:"channelName"`
	}
	if c.ShouldBind(&requestJson) != nil {
		c.JSON(http.StatusBadRequest, "Request is incorrect")
		return
	}

	var channel models.Channel
	channel.ChannelName = requestJson.ChannelName

	// Generate channelId
	rand.Seed(time.Now().UnixNano())
	channel.ChannelId = rand.Intn(100000000) // 8 digit channelId

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
	_, err = InsertUserInChannel(struct {
		Email     string `form:"email" bson:"email" json:"email"`
		ChannelId int    `form:"channelId" bson:"channelId" json:"channelId"`
	}(struct {
		Email     string
		ChannelId int
	}{Email: requestJson.Email, ChannelId: channel.ChannelId}))
	if err != nil {
		return
	}

	// Response JSON
	c.JSON(http.StatusOK, "Created a new channel with ID:"+strconv.Itoa(channel.ChannelId)+
		", Name:"+channel.ChannelName)
}

func CreateMedia(c *gin.Context) {
	// Bind request
	var requestJson struct {
		Email string `form:"email"`
	}
	if c.ShouldBind(&requestJson) != nil {
		c.JSON(http.StatusBadRequest, "Request is incorrect")
		return
	}

	file, header, err := c.Request.FormFile("media")
	if err != nil {
		panic(err)
	}
	filename := header.Filename

	// Use BSON to upload media in GridFS
	db := Client.Database("account")
	opts := options.GridFSBucket().SetName("medias")
	bucket, err := gridfs.NewBucket(db, opts)
	if err != nil {
		panic(err)
	}
	uploadOpts := options.GridFSUpload().SetMetadata(bson.D{{"email", requestJson.Email}})
	objectID, err := bucket.UploadFromStream(filename, io.Reader(file), uploadOpts)
	if err != nil {
		panic(err)
	}
	fmt.Printf("New file uploaded with ID %s", objectID)

	// Response JSON
	c.JSON(http.StatusOK, objectID)
}

// Read

func ReadUser(c *gin.Context) {
	// Bind user
	var user models.User
	if c.ShouldBind(&user) != nil {
		c.JSON(http.StatusUnauthorized, "Have not login")
		return
	}

	// Select the user and the channels in the database
	coll := Client.Database("account").Collection("users")
	matchStage := bson.D{{"$match", bson.D{{"email", user.Email}}}}
	lookupStage := bson.D{{"$lookup", bson.D{{"from", "channels"},
		{"localField", "channelId"}, {"foreignField", "channelId"},
		{"as", "channelResults"}}}}
	unwindStage := bson.D{{"$unwind", bson.D{{"path", "$channelResults"},
		{"preserveNullAndEmptyArrays", false}}}}
	showLoadedCursor, err := coll.Aggregate(context.TODO(), mongo.Pipeline{matchStage, lookupStage, unwindStage})
	if err != nil {
		panic(err)
	}
	var showsLoaded []bson.M
	if err = showLoadedCursor.All(context.TODO(), &showsLoaded); err != nil {
		panic(err)
	}
	c.JSON(http.StatusOK, showsLoaded)
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

func DownloadMedia(c *gin.Context) {
	// Parse JSON
	var requestJson struct {
		MediaId string `form:"mediaId" json:"mediaId" bson:"mediaId"`
	}
	if c.Bind(&requestJson) != nil {
		panic("Input is invalid")
	}

	// Create a bucket
	db := Client.Database("account")
	opts := options.GridFSBucket().SetName("medias")
	bucket, err := gridfs.NewBucket(db, opts)
	if err != nil {
		panic(err)
	}

	// Download media from GridFS
	fileId, err := primitive.ObjectIDFromHex(requestJson.MediaId)
	if err != nil {
		panic(err)
	}
	fileBuffer := bytes.NewBuffer(nil)
	if numberOfBytes, err := bucket.DownloadToStream(fileId, fileBuffer); numberOfBytes == 0 || err != nil {
		panic(err)
	}

	// Find file name to determine file name and type
	filter := bson.D{{"_id", fileId}}
	cursor, err := bucket.Find(filter)
	if err != nil {
		panic(err)
	}
	type gridFSFile struct {
		Name string `bson:"filename"`
	}
	var foundFiles []gridFSFile
	if err = cursor.All(context.TODO(), &foundFiles); err != nil {
		panic(err)
	}

	// Create the downloaded file
	outputFileName := foundFiles[0].Name
	outputFile, err := os.Create(outputFileName)
	if err != nil {
		log.Fatal(err)
	}

	// Write buffer to output file
	_, err = outputFile.Write(fileBuffer.Bytes())
	if err != nil {
		return
	}

	// Response
	c.File(outputFileName)

	// Clean up
	err = os.Remove(outputFileName)
	if err != nil {
		panic(err)
	}
}

// Update

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
	resultChannel, err := InsertUserInChannel(requestJson)
	if err != nil {
		log.Println(err)
	}

	// Response JSON
	c.JSON(http.StatusOK, "User joined channel "+resultChannel.ChannelName)
}

func ExitChannel(c *gin.Context) {
	// parse JSON request to struct
	var request struct {
		Email     string `form:"email" bson:"email" json:"email"`
		ChannelId int    `form:"channelId" bson:"channelId" json:"channelId"`
	}
	if err := c.ShouldBind(&request); err != nil {
		c.JSON(http.StatusBadRequest, "Request information incorrect")
	}

	// User exit the channel
	if err := RemoveUserInChannel(request.Email, request.ChannelId); err != nil {
		c.JSON(http.StatusInternalServerError, "Remove User from channel fails")
	}

	// If the channel has no users, delete it
	users, err := ReadUserInChannel(request.ChannelId)
	if err != nil {
		panic(err)
	}
	if len(users) == 0 {
		if err := HandleDeleteChannel(request.ChannelId); err != nil {
			panic(err)
		}
	}

	// Response
	c.JSON(http.StatusOK, "User exit the channel with ID: "+strconv.Itoa(request.ChannelId))
}

func JoinVideoConference(c *gin.Context) {
	// Parse JSON
	var request struct {
		Email     string `form:"email" bson:"email" json:"email"`
		ChannelId string `form:"channelId" bson:"channelId" json:"channelId"`
	}
	if err := c.ShouldBind(&request); err != nil {
		panic(err)
	}

	// Get Token to join the corresponding video conference
	log.Println(request.Email)
	token, err := getToken(request.ChannelId, request.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
	}

	// Response JSON
	c.JSON(http.StatusOK, token)
}

// Delete

func DeleteChannel(c *gin.Context) {
	// parse JSON request to struct
	var request struct {
		Email     string `form:"email" bson:"email" json:"email"`
		ChannelId int    `form:"channelId" bson:"channelId" json:"channelId"`
	}
	if err := c.ShouldBind(&request); err != nil {
		panic(err)
	}

	// Find users in the channel
	users, err := ReadUserInChannel(request.ChannelId)
	if err != nil {
		panic(err)
	}

	// User exit the channel
	for _, user := range users {
		if err := RemoveUserInChannel(user.Email, request.ChannelId); err != nil {
			panic(err)
		}
	}

	if err := HandleDeleteChannel(request.ChannelId); err != nil {
		panic(err)
	}

	c.JSON(http.StatusOK, "User delete the channel with ID: "+strconv.Itoa(request.ChannelId))
}
