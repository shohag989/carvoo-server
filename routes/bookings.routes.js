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
 * @route   POST /bookings
 * @desc    Create a new booking and increment car booking count
 * @access  Protected
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { carId, ...bookingData } = req.body;
    
    const carObjectId = toObjectId(carId);
    if (!carObjectId) return res.status(400).send({ message: "Invalid Car ID" });

    // 1. Create the booking
    const newBooking = {
      ...bookingData,
      carId: carObjectId,
      userEmail: req.user.email,
      bookingDate: new Date(),
    };

    const bookingResult = await db.collection("bookings").insertOne(newBooking);

    // 2. Increment car booking_count
    await db.collection("cars").updateOne(
      { _id: carObjectId },
      { $inc: { booking_count: 1 } }
    );

    res.status(201).send({ ...newBooking, _id: bookingResult.insertedId });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).send({ message: "Failed to create booking" });
  }
});

/**
 * @route   GET /bookings
 * @desc    Get bookings by user email with validation
 * @access  Protected
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const { email } = req.query;
    
    // Validate that the requested email matches the logged-in user's email
    if (email !== req.user.email) {
      return res.status(401).send({ message: "Unauthorized access" });
    }

    const db = getDB();
    const bookings = await db.collection("bookings").find({ userEmail: email }).toArray();
    res.send(bookings);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch bookings" });
  }
});

/**
 * @route   DELETE /bookings/:id
 * @desc    Cancel/Delete a booking
 * @access  Protected
 */
router.delete("/:id", verifyToken, async (req, res) => {
    try {
      const bookingId = toObjectId(req.params.id);
      if (!bookingId) return res.status(400).send({ message: "Invalid ID" });
  
      const db = getDB();
      const result = await db.collection("bookings").deleteOne({ 
        _id: bookingId, 
        userEmail: req.user.email 
      });
  
      if (result.deletedCount === 0) {
        return res.status(404).send({ message: "Booking not found or unauthorized" });
      }
  
      res.send({ message: "Booking cancelled successfully" });
    } catch (error) {
      res.status(500).send({ message: "Failed to cancel booking" });
    }
  });

module.exports = router;
