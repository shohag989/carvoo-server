require("dotenv").config();
const dns = require("dns");

// Override DNS servers to use Google DNS to fix SRV resolution issues in some environments
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

const { MongoClient, ServerApiVersion } = require("mongodb");

let client;
let db;

// Build connection string from .env (called when connecting, not at import time)
function getMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  if (!process.env.DB_USER || !process.env.DB_PASS) {
    throw new Error(
      "Set MONGODB_URI or both DB_USER and DB_PASS in your .env file"
    );
  }

  // Replace cluster host with your Atlas cluster URL
  const clusterHost =
    process.env.DB_CLUSTER_HOST || "cluster0.ctcyekk.mongodb.net";

  return `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${clusterHost}/?retryWrites=true&w=majority&appName=Cluster0`;
}

// Connect once and reuse the same database instance
async function connectDB() {
  if (db) {
    return db;
  }

  const uri = getMongoUri();

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();

  // Ping confirms Atlas connection is working
  await client.db("admin").command({ ping: 1 });
  console.log("Connected to MongoDB (Carvoo)");

  const dbName = process.env.DB_NAME || "carvoo";
  db = client.db(dbName);
  return db;
}
function getDB() {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
}

module.exports = { connectDB, getDB, client };
