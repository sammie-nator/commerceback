import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { adminLogout } from "./AdminAuth";

const linkClass = ({ isActive }) =>
  `block px-4 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100"
  }`;

const AdminLayout = () => (
  <div className="min-h-screen flex bg-gray-50">
    <aside className="w-56 bg-white border-r border-gray-200 p-4 flex flex-col">
      <h2 className="text-lg font-bold mb-6 px-2">Admin</h2>
      <nav className="space-y-1 flex-1">
        <NavLink to="/admin" end className={linkClass}>
          Analytics
        </NavLink>
        <NavLink to="/admin/orders" className={linkClass}>
          Orders
        </NavLink>
        <NavLink to="/admin/products" className={linkClass}>
          Products
        </NavLink>
        <NavLink to="/admin/locations" className={linkClass}>
          Pickup Locations
        </NavLink>
        <NavLink to="/admin/staff" className={linkClass}>
          Staff & PINs
        </NavLink>
      </nav>
      <p className="text-xs text-gray-400 px-2 mb-2">
        Signed in as {localStorage.getItem("adminName") || "admin"}
      </p>
      <button
        onClick={() => adminLogout()}
        className="text-sm text-red-500 hover:underline px-2 text-left"
      >
        Log out
      </button>
    </aside>
    <main className="flex-1 p-6 overflow-x-auto">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;
