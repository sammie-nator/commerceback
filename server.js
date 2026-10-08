require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
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

    // Find existing owner/admin by username, or create a new one
    let admin = await Admin.findOne({ username });

    if (admin) {
      // Force update the PIN + name + clear any lock
      admin.name = name;
      admin.pin = pin;               // pre-save hook will hash it
      admin.role = "owner";
      admin.failedAttempts = 0;
      admin.lockUntil = null;
      await admin.save();
      console.log(`✅ Owner admin updated from env → username: "${username}"`);
    } else {
      await Admin.create({ name, username, pin, role: "owner" });
      console.log(`✅ Owner admin created from env → username: "${username}"`);
    }
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
