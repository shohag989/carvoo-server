require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const carsRoutes = require("./routes/cars.routes");
const bookingsRoutes = require("./routes/bookings.routes");

// Stop early if required .env values are missing
function validateEnv() {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    console.error("Missing ACCESS_TOKEN_SECRET in .env file");
    process.exit(1);
  }

  const hasUri = Boolean(process.env.MONGODB_URI);
  const hasDbUserPass =
    Boolean(process.env.DB_USER) && Boolean(process.env.DB_PASS);

  if (!hasUri && !hasDbUserPass) {
    console.error(
      "Missing database config: set MONGODB_URI or DB_USER and DB_PASS in .env"
    );
    process.exit(1);
  }
}

validateEnv();

const app = express();
const port = process.env.PORT || 5000;
// CORS with credentials — required when frontend sends cookies
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check — useful to confirm the server is running
app.get("/", (req, res) => {
  res.send("Carvoo API is running 🚗");
});

// Route groups
app.use("/", authRoutes);
app.use("/cars", carsRoutes);
app.use("/bookings", bookingsRoutes);

// Start server after database connection
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Carvoo server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  });
