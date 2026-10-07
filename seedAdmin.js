// Run once: node seedAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const name = process.env.ADMIN_NAME || "Store Owner";
  const username = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
  const pin = process.env.ADMIN_PIN || "0000";

  const existing = await Admin.findOne({ username });
  if (existing) {
    console.log("Admin already exists:", username);
  } else {
    await Admin.create({ name, username, pin, role: "owner" });
    console.log(`Admin created: ${username} (PIN: ${pin}) — change this PIN after first login`);
  }

  await mongoose.disconnect();
})();
