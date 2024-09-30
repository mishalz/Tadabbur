require("dotenv").config({ path: "./.env" });
const express = require("express");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 3000;

//retrieving routes from specific components
const authRoutes = require("./components/auth/auth.routes");
const contentRoutes = require("./components/content/content.routes");
const quranRoutes = require("./components/quran-retrieval/quran.routes");
const authService = require("./components/auth/auth.service");

//starting the express app
const app = express();

//essential to retrieve the json data in all requests' body.
app.use(bodyParser.json());

//forwarding all routes to their specific component
app.use("/auth", authRoutes);
app.use("/content", authService.validateToken, contentRoutes);
app.use("/quran", quranRoutes);

// Fallback route (Handles 404 errors)
app.use((_, res, next) => {
  res.status(404).send({
    success: false,
    status: 500,
    message: "Sorry, this page does not exist",
  });
});

//a general error handler for other cases such as incorrect JSON in the req body
app.use((err, _, res, next) => {
  res.status(500).send({ success: false, status: 500, message: err.message });
});

//starting the server
app.listen(PORT, () => {
  console.log("The server is up and running!");
});
