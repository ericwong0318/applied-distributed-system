package controllers

import (
	"backend/models"
	"context"
	"errors"
	"fmt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
)

// Read

func ReadChannel(channelId int) (models.Channel, error) {
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

func ReadUserInChannel(chanelId int) ([]models.User, error) {
	coll := Client.Database("account").Collection("users")
	// Find all documents in which the "name" field is "Bob".
	cursor, err := coll.Find(context.TODO(), bson.D{{"channelId", chanelId}})
	if err != nil {
		log.Fatal(err)
	}

	// Get a list of all returned documents and print them out.
	// See the mongo.Cursor documentation for more examples of using cursors.
	var users []models.User
	if err = cursor.All(context.TODO(), &users); err != nil {
		log.Fatal(err)
	}
	for _, result := range users {
		fmt.Println(result)
	}
	return users, nil
}

// Update

func InsertUserInChannel(inputStruct struct {
	Email     string `form:"email" bson:"email" json:"email"`
	ChannelId int    `form:"channelId" bson:"channelId" json:"channelId"`
}) (models.Channel, error) {
	// Check the existence of the channel with the channelId
	resultChannel, err := ReadChannel(inputStruct.ChannelId)
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

func RemoveUserInChannel(email string, channelId int) error {
	coll := Client.Database("account").Collection("users")
	filter := bson.D{{"email", email}}
	update := bson.D{{"$pull", bson.D{{"channelId", channelId}}}}
	_, err := coll.UpdateOne(context.TODO(), filter, update)
	return err
}
