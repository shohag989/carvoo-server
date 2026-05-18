const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Return null for invalid MongoDB ids (avoids server crash on bad :id)
function toObjectId(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return new ObjectId(id);
}

// GET /cars — public: list all available cars
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const cars = await db.collection("cars").find().toArray();
    res.send(cars);
  } catch (error) {
    console.error("Get cars error:", error);
    res.status(500).send({ message: "Failed to fetch cars" });
  }
});

// GET /cars/:id — public: get one car by id
router.get("/:id", async (req, res) => {
  const carId = toObjectId(req.params.id);
  if (!carId) {
    return res.status(400).send({ message: "Invalid car id" });
  }

  try {
    const db = getDB();
    const car = await db.collection("cars").findOne({ _id: carId });
    if (!car) {
      return res.status(404).send({ message: "Car not found" });
    }

    res.send(car);
  } catch (error) {
    console.error("Get car error:", error);
    res.status(500).send({ message: "Failed to fetch car" });
  }
});

// POST /cars — private: add a new car (admin)
router.post("/", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).send({ message: "Only admins can add cars" });
  }

  const { name, brand, dailyRent, image, category, location } = req.body;

  if (!name || !brand || !dailyRent) {
    return res
      .status(400)
      .send({ message: "name, brand, and dailyRent are required" });
  }

  try {
    const db = getDB();
    const newCar = {
      name,
      brand,
      dailyRent: Number(dailyRent),
      image: image || "",
      category: category || "general",
      location: location || "",
      availability: true,
      createdAt: new Date(),
    };

    const result = await db.collection("cars").insertOne(newCar);
    res.status(201).send({ insertedId: result.insertedId, ...newCar });
  } catch (error) {
    console.error("Add car error:", error);
    res.status(500).send({ message: "Failed to add car" });
  }
});

// PATCH /cars/:id — private: update a car (admin)
router.patch("/:id", verifyToken, async (req, res) => {
  const carId = toObjectId(req.params.id);
  if (!carId) {
    return res.status(400).send({ message: "Invalid car id" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).send({ message: "Only admins can update cars" });
  }

  try {
    const db = getDB();
    const result = await db.collection("cars").updateOne(
      { _id: carId },
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Car not found" });
    }

    res.send({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Update car error:", error);
    res.status(500).send({ message: "Failed to update car" });
  }
});

// DELETE /cars/:id — private: remove a car (admin)
router.delete("/:id", verifyToken, async (req, res) => {
  const carId = toObjectId(req.params.id);
  if (!carId) {
    return res.status(400).send({ message: "Invalid car id" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).send({ message: "Only admins can delete cars" });
  }

  try {
    const db = getDB();
    const result = await db.collection("cars").deleteOne({ _id: carId });
    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Car not found" });
    }

    res.send({ success: true, message: "Car deleted" });
  } catch (error) {
    console.error("Delete car error:", error);
    res.status(500).send({ message: "Failed to delete car" });
  }
});

module.exports = router;
