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

// List of allowed origins - add your Vercel deployment URLs here
const allowedOrigins = [
  "http://localhost:5173",
  "https://carvoo-byshohag.vercel.app",
  "https://carvoo-byshohag.vercel.app/",
];

// CORS configuration - deployment ready
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(cookieParser());

// Add a middleware to ensure DB is connected before handling requests (for Serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("DB connection error in middleware:", error);
    res.status(500).send("Internal Server Error: Database connection failed");
  }
});

// Health check — useful to confirm the server is running
app.get("/", (req, res) => {
  res.send("Carvoo API is running 🚗");
});

// Route groups
app.use("/", authRoutes);
app.use("/cars", carsRoutes);
app.use("/bookings", bookingsRoutes);

// Export for Vercel
module.exports = app;

// Only start the server locally if NOT in production
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Carvoo server listening locally on port ${port}`);
  });
}
