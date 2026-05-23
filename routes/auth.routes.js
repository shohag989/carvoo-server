const express = require("express");
const jwt = require("jsonwebtoken");
const { getDB } = require("../config/db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Same options for set and clear cookie (logout must match login)
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: true, // Secure must be true for sameSite: "none"
    sameSite: "none",
    path: "/",
  };
}

// POST /jwt — Create JWT token and store in cookie
router.post("/jwt", async (req, res) => {
  try {
    const user = req.body;
    if (!user || !user.email) {
      return res.status(400).send({ message: "Invalid user data" });
    }
    
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "365d", // Keeping the long-lived requirement
    });

    res
      .cookie("access_token", token, {
        ...getCookieOptions(),
        maxAge: 365 * 24 * 60 * 60 * 1000,
      })
      .send({ success: true });
  } catch (error) {
    console.error("JWT creation error:", error);
    res.status(500).send({ message: "Failed to create token" });
  }
});

// POST /jwt-login — check email/password and return JWT in httpOnly cookie
router.post("/jwt-login", async (req, res) => {  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: "Email and password are required" });
  }

  try {
    const db = getDB();
    const users = db.collection("users");

    // Find user by email (store passwords hashed in production; plain text is only for learning)
    const user = await users.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    // Create a signed token that expires in 1 hour
    const token = jwt.sign(
      { email: user.email, role: user.role || "user" },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // Send token as httpOnly cookie so JavaScript on the client cannot read it
    res
      .cookie("access_token", token, {
        ...getCookieOptions(),
        maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
      })      .send({
        success: true,
        user: { email: user.email, role: user.role || "user" },
      });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send({ message: "Login failed" });
  }
});

// POST /logout — clear the auth cookie (options must match login cookie)
router.post("/logout", (req, res) => {
  res.clearCookie("access_token", getCookieOptions());
  res.send({ success: true, message: "Logged out successfully" });
});

// GET /profile — example private route (token required)
router.get("/profile", verifyToken, (req, res) => {
  res.send({ user: req.user });
});

module.exports = router;
