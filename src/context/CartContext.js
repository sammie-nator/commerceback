import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

const getOrCreateGuestId = () => {
  let id = localStorage.getItem("guestId");
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("guestId", id);
  }
  return id;
};

export const CartProvider = ({ children }) => {
  const [guestId] = useState(getOrCreateGuestId);
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0],
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) return removeItem(productId);
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        guestId,
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalAmount,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
