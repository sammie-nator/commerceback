const express = require("express");
const router = express.Router();
const Location = require("../models/Location");
const { protectAdmin } = require("../middleware/auth");

// GET /api/locations - public, active only
router.get("/", async (req, res) => {
  const locations = await Location.find({ isActive: true }).sort({ name: 1 });
  res.json(locations);
});

// POST /api/locations - admin
router.post("/", protectAdmin, async (req, res) => {
  try {
    const location = await Location.create({ name: req.body.name });
    res.status(201).json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/locations/:id - admin (toggle active / rename)
router.put("/:id", protectAdmin, async (req, res) => {
  const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!location) return res.status(404).json({ message: "Not found" });
  res.json(location);
});

// DELETE /api/locations/:id - admin
router.delete("/:id", protectAdmin, async (req, res) => {
  await Location.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
