import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import About from "./pages/About";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";

import AdminLogin from "./admin/AdminLogin";
import AdminLayout from "./admin/AdminLayout";
import AdminAnalytics from "./admin/AdminAnalytics";
import AdminOrders from "./admin/AdminOrders";
import AdminProducts from "./admin/AdminProducts";
import AdminLocations from "./admin/AdminLocations";
import AdminUsers from "./admin/AdminUsers";
import RequireAdmin from "./admin/RequireAdmin";

const StorefrontLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <CartProvider>
        <Routes>
          {/* Storefront */}
          <Route
            path="/"
            element={
              <StorefrontLayout>
                <Home />
              </StorefrontLayout>
            }
          />
          <Route
            path="/about"
            element={
              <StorefrontLayout>
                <About />
              </StorefrontLayout>
            }
          />
          <Route
            path="/product/:id"
            element={
              <StorefrontLayout>
                <ProductDetail />
              </StorefrontLayout>
            }
          />
          <Route
            path="/cart"
            element={
              <StorefrontLayout>
                <Cart />
              </StorefrontLayout>
            }
          />
          <Route
            path="/checkout"
            element={
              <StorefrontLayout>
                <Checkout />
              </StorefrontLayout>
            }
          />
          <Route
            path="/track"
            element={
              <StorefrontLayout>
                <OrderTracking />
              </StorefrontLayout>
            }
          />

          {/* Admin — open, no real login */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminAnalytics />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="locations" element={<AdminLocations />} />
            <Route path="staff" element={<AdminUsers />} />
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
