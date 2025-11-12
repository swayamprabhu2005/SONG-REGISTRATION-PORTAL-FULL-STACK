CREATE DATABASE tunevault;
USE tunevault;

CREATE TABLE main_artists (
  main_artist_id INT AUTO_INCREMENT PRIMARY KEY,
  main_artist_name VARCHAR(255) NOT NULL UNIQUE,
  no_of_songs INT DEFAULT 0
);

CREATE TABLE albums (
  album_id INT AUTO_INCREMENT PRIMARY KEY,
  album_name VARCHAR(255) NOT NULL,
  main_artist_id INT,
  no_of_songs INT DEFAULT 0,
  FOREIGN KEY (main_artist_id) REFERENCES main_artists(main_artist_id)
    ON DELETE SET NULL
);

CREATE TABLE songs (
  song_id INT AUTO_INCREMENT PRIMARY KEY,
  song_name VARCHAR(255) NOT NULL,
  genre VARCHAR(100),
  duration JSON,
  album_id INT NULL DEFAULT NULL,   
  FOREIGN KEY (album_id) REFERENCES albums(album_id)
    ON DELETE SET NULL              
);

CREATE TABLE artists (
  artist_id INT AUTO_INCREMENT PRIMARY KEY,
  artist_name VARCHAR(255) NOT NULL,
  song_id INT,
  FOREIGN KEY (song_id) REFERENCES songs(song_id)
    ON DELETE CASCADE
);

CREATE TABLE lyricists (
  lyricist_id INT AUTO_INCREMENT PRIMARY KEY,
  lyricist_name VARCHAR(255) NOT NULL,
  song_id INT,
  FOREIGN KEY (song_id) REFERENCES songs(song_id)
    ON DELETE CASCADE
);

CREATE TABLE producers (
  producer_id INT AUTO_INCREMENT PRIMARY KEY,
  producer_name VARCHAR(255) NOT NULL,
  song_id INT,
  FOREIGN KEY (song_id) REFERENCES songs(song_id)
    ON DELETE CASCADE
);

CREATE TABLE source (
  source_id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(255),
  owner VARCHAR(255),
  song_id INT,
  regemail VARCHAR(255) NOT NULL,
  FOREIGN KEY (song_id) REFERENCES songs(song_id)
    ON DELETE CASCADE
);
