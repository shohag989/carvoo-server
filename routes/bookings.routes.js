const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

function toObjectId(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return new ObjectId(id);
}

// All booking routes require a logged-in user
router.use(verifyToken);
// GET /bookings — list bookings for the logged-in user (admins see all)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const filter =
      req.user.role === "admin" ? {} : { email: req.user.email };

    const bookings = await db.collection("bookings").find(filter).toArray();
    res.send(bookings);
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).send({ message: "Failed to fetch bookings" });
  }
});

// GET /bookings/:id — get one booking (must belong to user unless admin)
router.get("/:id", async (req, res) => {
  const bookingId = toObjectId(req.params.id);
  if (!bookingId) {
    return res.status(400).send({ message: "Invalid booking id" });
  }

  try {
    const db = getDB();
    const booking = await db
      .collection("bookings")
      .findOne({ _id: bookingId });
    if (!booking) {
      return res.status(404).send({ message: "Booking not found" });
    }

    const isOwner = booking.email === req.user.email;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).send({ message: "Access denied" });
    }

    res.send(booking);
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).send({ message: "Failed to fetch booking" });
  }
});

// POST /bookings — create a new rental booking
router.post("/", async (req, res) => {
  const { carId, pickupDate, returnDate, totalPrice } = req.body;

  if (!carId || !pickupDate || !returnDate) {
    return res.status(400).send({
      message: "carId, pickupDate, and returnDate are required",
    });
  }

  const carObjectId = toObjectId(carId);
  if (!carObjectId) {
    return res.status(400).send({ message: "Invalid car id" });
  }

  try {
    const db = getDB();

    // Make sure the car exists before booking
    const car = await db.collection("cars").findOne({ _id: carObjectId });
    if (!car) {
      return res.status(404).send({ message: "Car not found" });
    }

    const booking = {
      carId: carObjectId,      carName: car.name,
      email: req.user.email,
      pickupDate: new Date(pickupDate),
      returnDate: new Date(returnDate),
      totalPrice: totalPrice || car.dailyRent,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await db.collection("bookings").insertOne(booking);
    res.status(201).send({ insertedId: result.insertedId, ...booking });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).send({ message: "Failed to create booking" });
  }
});

// PATCH /bookings/:id — update booking status (user or admin)
router.patch("/:id", async (req, res) => {
  const bookingId = toObjectId(req.params.id);
  if (!bookingId) {
    return res.status(400).send({ message: "Invalid booking id" });
  }

  try {
    const db = getDB();
    const booking = await db
      .collection("bookings")
      .findOne({ _id: bookingId });
    if (!booking) {
      return res.status(404).send({ message: "Booking not found" });
    }

    const isOwner = booking.email === req.user.email;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).send({ message: "Access denied" });
    }

    // Only allow safe fields to be updated (not email or carId)
    const { status, pickupDate, returnDate, totalPrice } = req.body;
    const updateData = {};

    if (status !== undefined) updateData.status = status;
    if (totalPrice !== undefined) updateData.totalPrice = totalPrice;
    if (pickupDate !== undefined) updateData.pickupDate = new Date(pickupDate);
    if (returnDate !== undefined) updateData.returnDate = new Date(returnDate);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).send({ message: "No valid fields to update" });
    }

    const result = await db.collection("bookings").updateOne(
      { _id: bookingId },
      { $set: updateData }
    );
    res.send({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).send({ message: "Failed to update booking" });
  }
});

// DELETE /bookings/:id — cancel a booking
router.delete("/:id", async (req, res) => {
  const bookingId = toObjectId(req.params.id);
  if (!bookingId) {
    return res.status(400).send({ message: "Invalid booking id" });
  }

  try {
    const db = getDB();
    const booking = await db
      .collection("bookings")
      .findOne({ _id: bookingId });
    if (!booking) {
      return res.status(404).send({ message: "Booking not found" });
    }

    const isOwner = booking.email === req.user.email;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).send({ message: "Access denied" });
    }

    await db.collection("bookings").deleteOne({ _id: bookingId });
    res.send({ success: true, message: "Booking cancelled" });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).send({ message: "Failed to delete booking" });
  }
});

module.exports = router;
