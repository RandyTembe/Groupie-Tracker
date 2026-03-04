package main

func FavoritesPages() {
	var favoris []Favoris
	DB.Find(&favoris)
}

func AddFavoris(artistID int, artistName string) {
	favoris := Favoris{
		ArtistID:   artistID,
		ArtistName: artistName,
	}
	DB.Create(&favoris)
}

func removeFavoris(artistID int) {
	DB.Where("artist_id = ?", artistID).Delete(&Favoris{})
}
