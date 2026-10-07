const express = require("express");
const router = express.Router();
const Location = require("../models/Location");

router.get("/", async (req, res) => {
  const locations = await Location.find({ isActive: true }).sort({ name: 1 });
  res.json(locations);
});

router.post("/", async (req, res) => {
  try {
    const location = await Location.create({ name: req.body.name });
    res.status(201).json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!location) return res.status(404).json({ message: "Not found" });
  res.json(location);
});

router.delete("/:id", async (req, res) => {
  await Location.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
