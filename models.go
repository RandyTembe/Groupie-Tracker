package main

import "gorm.io/gorm"

type Favoris struct {
	gorm.Model
	ArtistID int `json:"artist_id"`
	ArtistName string `json:"artist_name"`
}