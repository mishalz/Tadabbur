require("dotenv").config({ path: "./.env" });
const express = require("express");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 3000;

//retrieving routes from specific components
const authRoutes = require("./components/auth/auth.routes");
const contentRoutes = require("./components/content/content.routes");
const quranRoutes = require("./components/quran-retrieval/quran.routes");

//starting the express app
const app = express();

//essential to retrieve the json data in all requests' body.
app.use(bodyParser.json());

//forwarding all routes to their specific component
app.use("/auth", authRoutes);
app.use("/content", contentRoutes);
app.use("/quran", quranRoutes);

//starting the server
app.listen(PORT, () => {
  console.log("The server is up and running!");
});
