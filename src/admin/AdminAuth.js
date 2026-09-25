import api from "../api/axios";

// TEMP: always treat as logged in
export const isAdminAuthed = () => true;

export const adminLogout = async () => {
  try {
    await api.post("/admin/logout");
  } catch {
    // ignore
  }
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminName");
  // Stay in admin (no login required) — or send to storefront:
  window.location.href = "/admin";
};
