require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const Admin = require("./models/Admin");

const ensureOwnerFromEnv = async () => {
  try {
    const pin = process.env.ADMIN_PIN;
    if (!pin || !/^\d{4}$/.test(pin)) {
      console.warn(
        "⚠️  ADMIN_PIN is missing or not exactly 4 digits. Skipping admin sync."
      );
      return;
    }

    const name = process.env.ADMIN_NAME || "Store Owner";
    const username = (process.env.ADMIN_USERNAME || "admin").toLowerCase().trim();

    // Hash the PIN ourselves so we don't rely on the pre-save hook
    const hashedPin = await bcrypt.hash(pin, 10);

    // Upsert the owner
    const admin = await Admin.findOneAndUpdate(
      { username },
      {
        name,
        username,
        pin: hashedPin,
        role: "owner",
        failedAttempts: 0,
        lockUntil: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ Owner admin synced from env → username: "${admin.username}"`);
  } catch (err) {
    console.error("Failed to sync owner admin:", err.message);
  }
};

(async () => {
  await connectDB();
  await ensureOwnerFromEnv();
})();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(morgan("dev"));

// static image uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/mpesa", require("./routes/mpesa"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/locations", require("./routes/locations"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// generic error handler (e.g. multer errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
