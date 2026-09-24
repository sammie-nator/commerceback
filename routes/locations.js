const express = require("express");
const router = express.Router();
const Location = require("../models/Location");

// GET /api/locations - public, active only
router.get("/", async (req, res) => {
  const locations = await Location.find({ isActive: true }).sort({ name: 1 });
  res.json(locations);
});

// POST /api/locations
router.post("/", async (req, res) => {
  try {
    const location = await Location.create({ name: req.body.name });
    res.status(201).json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/locations/:id
router.put("/:id", async (req, res) => {
  const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!location) return res.status(404).json({ message: "Not found" });
  res.json(location);
});

// DELETE /api/locations/:id
router.delete("/:id", async (req, res) => {
  await Location.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
