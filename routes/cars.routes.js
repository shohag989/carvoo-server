const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Helper to convert to ObjectId safely
function toObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

/**
 * @route   POST /cars
 * @desc    Add a new car
 * @access  Protected
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const newCar = {
      ...req.body,
      ownerEmail: req.user.email, // Associate with logged-in user
      createdAt: new Date(),
    };
    const result = await db.collection("cars").insertOne(newCar);
    res.status(201).send({ ...newCar, _id: result.insertedId });
  } catch (error) {
    res.status(500).send({ message: "Failed to add car" });
  }
});

/**
 * @route   GET /cars/available
 * @desc    Get top 6 available cars
 * @access  Public
 */
router.get("/available", async (req, res) => {
  try {
    const db = getDB();
    // Standardizing to boolean true for available cars
    const cars = await db.collection("cars").find({ availability: true }).limit(6).toArray();
    res.send(cars);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch available cars" });
  }
});

/**
 * @route   GET /cars/my-cars
 * @desc    Get cars added by the logged-in user
 * @access  Protected
 */
router.get("/my-cars", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const email = req.user.email; // Use email from verified token
    
    // Querying the cars collection matching the owner's email from token
    const userCars = await db.collection("cars").find({ ownerEmail: email }).toArray();
    res.json(userCars);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your cars" });
  }
});

/**
 * @route   GET /cars
 * @desc    Get all cars with search and filter
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const { carName, carType } = req.query;
    const db = getDB();
    let query = {};

    if (carName) {
      query.carName = { $regex: carName, $options: "i" };
    }
    if (carType) {
      query.carType = carType;
    }

    const cars = await db.collection("cars").find(query).toArray();
    res.send(cars);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch cars" });
  }
});

/**
 * @route   GET /cars/:id
 * @desc    Get single car details
 * @access  Public
 */
router.get("/:id", async (req, res) => {
  try {
    const carId = toObjectId(req.params.id);
    if (!carId) return res.status(400).send({ message: "Invalid ID" });

    const db = getDB();
    const car = await db.collection("cars").findOne({ _id: carId });
    if (!car) return res.status(404).send({ message: "Car not found" });

    res.send(car);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch car details" });
  }
});

/**
 * @route   PATCH /cars/:id
 * @desc    Update a car
 * @access  Protected
 */
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const carId = toObjectId(req.params.id);
    if (!carId) return res.status(400).send({ message: "Invalid ID" });

    const db = getDB();
    const updateData = { ...req.body };
    delete updateData._id; // Ensure _id is not updated

    const result = await db.collection("cars").updateOne(
      { _id: carId, ownerEmail: req.user.email },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Car not found or unauthorized" });
    }

    res.send({ message: "Car updated successfully", modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).send({ message: "Failed to update car" });
  }
});

/**
 * @route   DELETE /cars/:id
 * @desc    Delete a car
 * @access  Protected
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const carId = toObjectId(req.params.id);
    if (!carId) return res.status(400).send({ message: "Invalid ID" });

    const db = getDB();
    const result = await db.collection("cars").deleteOne({ 
      _id: carId, 
      ownerEmail: req.user.email 
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Car not found or unauthorized" });
    }

    res.send({ message: "Car deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Failed to delete car" });
  }
});

module.exports = router;
