import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// TEMP: skip login — go straight to admin
const AdminLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("adminToken", "dev-no-auth");
    localStorage.setItem("adminName", "Dev Admin");
    navigate("/admin", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-500 text-sm">Entering admin…</p>
    </div>
  );
};

export default AdminLogin;
