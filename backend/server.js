const express = require("express");
const path = require("path");

const app = express();

// serve static files
app.use(express.static(path.join(__dirname, "public", "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "frontend", "index.html"));
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});