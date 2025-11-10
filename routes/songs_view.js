import express from "express";
import db from "../databases/db.js";

const router = express.Router();

// get all songs
router.get("/all", async (req, res) => {
  try {
    const [songs] = await db.query(`
      SELECT s.song_id, s.song_name, s.genre, s.duration, a.album_name
      FROM songs s
      LEFT JOIN albums a ON s.album_id = a.album_id
      ORDER BY s.song_id DESC
    `);
    res.json(songs);
  } catch (err) {
    console.error("Error fetching songs:", err);
    res.status(500).json({ message: "Error fetching songs" });
  }
});

// get song details using id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // main song info
    const [[song]] = await db.query(`
      SELECT s.*, a.album_name
      FROM songs s
      LEFT JOIN albums a ON s.album_id = a.album_id
      WHERE s.song_id = ?
    `, [id]);

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    // Fetch related details
    const [artists] = await db.query(`SELECT artist_name FROM artists WHERE song_id = ?`, [id]);
    const [lyricists] = await db.query(`SELECT lyricist_name FROM lyricists WHERE song_id = ?`, [id]);
    const [producers] = await db.query(`SELECT producer_name FROM producers WHERE song_id = ?`, [id]);
    const [sources] = await db.query(`SELECT type, owner, regemail FROM source WHERE song_id = ?`, [id]);

    // Fetch songs from same album
    let moreSongs = [];
    if (song.album_id) {
      [moreSongs] = await db.query(`
        SELECT song_id, song_name
        FROM songs
        WHERE album_id = ? AND song_id != ?
      `, [song.album_id, id]);
    }

    res.json({
      song,
      artists,
      lyricists,
      producers,
      sources,
      moreSongs
    });
  } catch (err) {
    console.error("Error fetching song details:", err);
    res.status(500).json({ message: "Error fetching song details" });
  }
});

export default router;
