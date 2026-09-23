const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    pin: { type: String, required: true }, // hashed 4-digit PIN
    role: { type: String, enum: ["owner", "staff"], default: "staff" },
  },
  { timestamps: true }
);

adminSchema.methods.comparePin = function (candidate) {
  return bcrypt.compare(candidate, this.pin);
};

adminSchema.pre("save", async function (next) {
  if (!this.isModified("pin")) return next();
  if (!/^\d{4}$/.test(this.pin)) {
    return next(new Error("PIN must be exactly 4 digits"));
  }
  this.pin = await bcrypt.hash(this.pin, 10);
  next();
});

module.exports = mongoose.model("Admin", adminSchema);
