import express from "express";
import db from "../databases/db.js";

const router = express.Router();

// Fetch all albums
router.get("/", async (req, res) => {
  try {
    const [albums] = await db.query(`
      SELECT 
        a.album_id, 
        a.album_name, 
        ma.main_artist_name, 
        a.no_of_songs
      FROM albums a
      LEFT JOIN main_artists ma 
      ON a.main_artist_id = ma.main_artist_id
    `);

    res.json(albums);
  } catch (err) {
    console.error("Error fetching albums:", err);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

// Create a new album
router.post("/create", async (req, res) => {
  try {
    const { album_name, main_artist_name } = req.body;
    const NO_OF_SONGS = 10;

    if (!album_name || !main_artist_name) {
      return res
        .status(400)
        .json({ error: "Album name and artist are required" });
    }

    // Get artist ID
    const [artistResults] = await db.query(
      "SELECT main_artist_id FROM main_artists WHERE main_artist_name = ?",
      [main_artist_name]
    );

    if (artistResults.length === 0) {
      return res.status(404).json({ error: "Main artist not found" });
    }

    const main_artist_id = artistResults[0].main_artist_id;

    // Get available songs
    const [songs] = await db.query(
      `
      SELECT s.song_id
      FROM songs s
      JOIN artists a ON s.song_id = a.song_id
      WHERE a.artist_name = ? AND s.album_id IS NULL
      ORDER BY s.song_id ASC
      LIMIT 10
    `,
      [main_artist_name]
    );

    if (songs.length < 10) {
      return res.status(400).json({
        error: `Not enough songs to create album. ${
          10 - songs.length
        } more needed.`,
      });
    }

    // Create the album
    const [albumResult] = await db.query(
      `
      INSERT INTO albums (album_name, main_artist_id, no_of_songs)
      VALUES (?, ?, ?)
    `,
      [album_name, main_artist_id, NO_OF_SONGS]
    );

    const album_id = albumResult.insertId;
    const songIds = songs.map((s) => s.song_id);

    // Assign songs to the album
    await db.query(`UPDATE songs SET album_id = ? WHERE song_id IN (?)`, [
      album_id,
      songIds,
    ]);

    res.json({
      message: `Album '${album_name}' created successfully for ${main_artist_name} with 10 songs.`,
    });
  } catch (err) {
    console.error("Error creating album:", err);
    res.status(500).json({ error: "Failed to create album" });
  }
});

export default router;
