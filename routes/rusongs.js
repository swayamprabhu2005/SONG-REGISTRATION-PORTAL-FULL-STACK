import express from "express";
import db from "../databases/db.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const {
    type,
    owner,
    song_name,
    genre,
    duration,
    artist_name,
    lyricist_name,
    producer_name,
    regemail,
  } = req.body;

  try {
    const durationValue = JSON.stringify(Array.isArray(duration) ? duration : [0, 0, 0]);

    // song
    const [songResult] = await db.query(
      "INSERT INTO songs (song_name, genre, duration, album_id) VALUES (?, ?, ?, ?)",
      [song_name, genre, durationValue, null]
    );
    const songId = songResult.insertId;

    // source
    if (Array.isArray(owner)) {
      for (const o of owner) {
        if (o?.trim()) {
          await db.query(
            "INSERT INTO source (type, owner, song_id, regemail) VALUES (?, ?, ?, ?)",
            [type, o.trim(), songId, regemail]
          );
        }
      }
    }

    // artists
    let mainArtistName = null;
    if (Array.isArray(artist_name) && artist_name.length > 0) {
      mainArtistName = artist_name[0]?.trim() || null;
      for (const name of artist_name) {
        if (name?.trim()) {
          await db.query(
            "INSERT INTO artists (artist_name, song_id) VALUES (?, ?)",
            [name.trim(), songId]
          );
        }
      }
    }

    // lyricists
    if (Array.isArray(lyricist_name)) {
      for (const name of lyricist_name) {
        if (name?.trim()) {
          await db.query(
            "INSERT INTO lyricists (lyricist_name, song_id) VALUES (?, ?)",
            [name.trim(), songId]
          );
        }
      }
    }

    // producers
    if (Array.isArray(producer_name)) {
      for (const name of producer_name) {
        if (name?.trim()) {
          await db.query(
            "INSERT INTO producers (producer_name, song_id) VALUES (?, ?)",
            [name.trim(), songId]
          );
        }
      }
    }

    // main artist
    let createAlbumAvailable = false;
    if (mainArtistName) {
      const [existingArtist] = await db.query(
        "SELECT * FROM main_artists WHERE main_artist_name = ?",
        [mainArtistName]
      );

      if (existingArtist.length === 0) {
        await db.query(
          "INSERT INTO main_artists (main_artist_name, no_of_songs) VALUES (?, 1)",
          [mainArtistName]
        );
      } else {
        const newCount = existingArtist[0].no_of_songs + 1;
        await db.query(
          "UPDATE main_artists SET no_of_songs = ? WHERE main_artist_name = ?",
          [newCount, mainArtistName]
        );
        if (newCount % 10 === 0) createAlbumAvailable = true;
      }
    }

    res.json({
      message: "Song registered successfully!",
      createAlbumAvailable,
      mainArtistName,
    });
  } catch (err) {
    console.error("Error registering song:", err);
    res.status(500).json({
      message: "Error registering song",
      error: err.message,
    });
  }
});

export default router;
