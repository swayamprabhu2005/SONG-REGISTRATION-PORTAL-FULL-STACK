import express from "express";
import db from "../databases/db.js";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "artists.html"));
});

// API: Fetch All Unique Artists
router.get("/api/list", async (req, res) => {
  try {
    const [artists] = await db.query(`
      SELECT DISTINCT artist_name 
      FROM artists 
      WHERE artist_name IS NOT NULL 
      ORDER BY artist_name ASC;
    `);
    res.json(artists);
  } catch (error) {
    console.error("Error fetching artists:", error);
    res.status(500).json({ message: "Error fetching artists." });
  }
});

// API: Fetch All Songs with Main Artist Tag
router.get("/api/:artistName/songs", async (req, res) => {
  const { artistName } = req.params;
  try {
    const [songs] = await db.query(`
      SELECT 
        s.song_id,
        s.song_name,
        CASE 
          WHEN a.artist_id = (
            SELECT MIN(a2.artist_id)
            FROM artists a2
            WHERE a2.song_id = a.song_id
          ) THEN 'Main Artist'
          ELSE 'Artist'
        END AS role
      FROM songs s
      JOIN artists a ON s.song_id = a.song_id
      WHERE a.artist_name = ?
      ORDER BY s.song_name ASC;
    `, [artistName]);

    res.json({ artistName, songs });
  } catch (error) {
    console.error("Error fetching songs for artist:", error);
    res.status(500).json({ message: "Error fetching songs for artist." });
  }
});

export default router;
