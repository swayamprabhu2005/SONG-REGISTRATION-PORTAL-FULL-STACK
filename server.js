import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import bodyParser from "body-parser";
import db from "./databases/db.js";

// ---------- Import Routes ----------
import artistsRouter from "./routes/artists.js";
import rusongsRouter from "./routes/rusongs.js";
import upsongsRouter from "./routes/upsongs.js";
import songsViewRouter from "./routes/songs_view.js";
import albumsRouter from "./routes/albums.js";
import albumsViewRouter from "./routes/albums_view.js";
import delsongsRouter from "./routes/delsongs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ---------- API Routes ----------
app.get("/api/songs/count", async (req, res) => {
  try {
    const [results] = await db.query("SELECT COUNT(*) AS total FROM songs");
    res.json({ count: results[0].total });
  } catch (err) {
    console.error("Database query failed:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.use("/artists", artistsRouter);
app.use("/rusongs", rusongsRouter);
app.use("/upsongs", upsongsRouter);
app.use("/songs", songsViewRouter);
app.use("/api/albums", albumsRouter);
app.use("/api/albums", albumsViewRouter);
app.use("/delsongs", delsongsRouter);

// ---------- Static Page Routes ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/artists", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "artists.html"));
});

app.get("/songs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "songs.html"));
});

app.get("/songs/view/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "song_view.html"));
});

app.get("/rusongs/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register_song.html"));
});

app.get("/upsongs/update", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "update_song.html"));
});

app.get("/delsongs/delete", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "delete_songs.html"));
});

app.get("/albums", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "albums.html"));
});

app.get("/albums/create", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "albums_create.html"));
});

app.get("/albums/view/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "album_view.html"));
});

app.use((req, res) => {
  res.status(404).send("ALT F4");
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
