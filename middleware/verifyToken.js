const jwt = require("jsonwebtoken");

// Protect private routes — user must send a valid JWT
function verifyToken(req, res, next) {
  // 1) httpOnly cookie from browser  2) Bearer token from Postman/tools
  let token = req.cookies?.access_token;

  const authHeader = req.headers.authorization;
  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).send({ message: "Unauthorized: no token provided" });
  }

  if (!process.env.ACCESS_TOKEN_SECRET) {
    return res.status(500).send({ message: "Server misconfigured: missing JWT secret" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ message: "Unauthorized: invalid or expired token" });
    }

    // Routes can read logged-in user data from req.user
    req.user = decoded;
    next();
  });
}
module.exports = verifyToken;
