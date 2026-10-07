const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  createdAt: { type: Date, default: Date.now },
  // TTL index: Mongo auto-deletes the doc once this date is reached
  expiresAt: { type: Date, required: true, expires: 0 },
});

module.exports = mongoose.model("Session", sessionSchema);
