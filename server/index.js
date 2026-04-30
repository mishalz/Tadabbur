import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
const PORT = process.env.PORT || 8000;

//retrieving routes from specific components
import authRoutes from "./components/auth/auth.routes.js";
import contentRoutes from "./components/content/content.routes.js";
import quranRoutes from "./components/quran-retrieval/quran.routes.js";

//starting the express app
const app = express();

//essential to retrieve the json data in all requests' body.
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
  }),
);

//forwarding all routes to their specific component
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/quran", quranRoutes);

// Fallback route (Handles 404 errors)
app.use((_, res) => {
  res.status(404).send({
    success: false,
    message: "Sorry, this page does not exist",
  });
});

//a general error handler for other cases such as incorrect JSON in the req body
app.use((err, _, res) => {
  res.status(500).send({ success: false, message: err.message });
});

//starting the server
app.listen(PORT, () => {
  console.log(`Server is starting on port ${PORT}`);
  try {
    console.log("The server is up and running!");
  } catch (err) {
    console.log("Error in server startup:", err);
  }
});

export default app;
