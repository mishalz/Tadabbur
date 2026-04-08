import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";

const PORT = process.env.PORT || 8000;

//retrieving routes from specific components
import authRoutes from "./components/auth/auth.routes.js";
import contentRoutes from "./components/content/content.routes.js";
import quranRoutes from "./components/quran-retrieval/quran.routes.js";
import { validateToken } from "./components/auth/auth.service.js";

//starting the express app
const app = express();

//essential to retrieve the json data in all requests' body.
app.use(bodyParser.json());

//forwarding all routes to their specific component
app.use("/api/auth", authRoutes);
app.use("/api/content", validateToken, contentRoutes);
app.use("/api/quran", quranRoutes);

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
  console.log(`Server is starting on port ${PORT}`);
  try {
    console.log("The server is up and running!");
  } catch (err) {
    console.log("Error in server startup:", err);
  }
});

export default app;
