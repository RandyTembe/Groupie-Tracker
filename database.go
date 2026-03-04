package main
import (
	"fmt";"os"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)
var DB *gorm.DB

func InitDataBase() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {return}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn),
	&gorm.Config{})	
if err != nil {
		fmt.Println("Erreur :", err)
		return
	}
	fmt.Println("Connexion à la base!")
	DB.AutoMigrate(&Favoris{})
}