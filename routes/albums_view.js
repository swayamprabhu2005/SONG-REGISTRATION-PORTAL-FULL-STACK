import express from "express";
import db from "../databases/db.js";

const router = express.Router();
// Fetches all albums
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
      ORDER BY a.album_id DESC
    `);

    res.json(albums);
  } catch (err) {
    console.error("Error fetching albums:", err);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

router.get("/:album_id", async (req, res) => {
  const { album_id } = req.params;

  try {
    const [[album]] = await db.query(
      `
      SELECT 
        a.album_id,
        a.album_name, 
        ma.main_artist_name
      FROM albums a
      LEFT JOIN main_artists ma 
        ON a.main_artist_id = ma.main_artist_id
      WHERE a.album_id = ?
      `,
      [album_id]
    );

    // No such album found
    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    // Get all songs under this album
    const [songs] = await db.query(
      `
      SELECT 
        song_id, 
        song_name, 
        genre 
      FROM songs
      WHERE album_id = ?
      ORDER BY song_id ASC
      `,
      [album_id]
    );

    // Send data to client
    res.json({
      album,
      songs,
    });
  } catch (err) {
    console.error("Error fetching album details:", err);
    res.status(500).json({ error: "Failed to fetch album details" });
  }
});

export default router;
