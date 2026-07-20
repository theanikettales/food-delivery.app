import React, { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // { restaurantId, restaurantName, items: [{ menuItemId, name, price, quantity }] }
  const [cart, setCart] = useState(null);

  const addItem = (restaurant, item) => {
    setCart((prev) => {
      // starting a cart from a different restaurant clears the old one
      if (prev && prev.restaurantId !== restaurant._id) {
        const confirmed = window.confirm(
          "Your cart has items from another restaurant. Start a new cart?"
        );
        if (!confirmed) return prev;
        return {
          restaurantId: restaurant._id,
          restaurantName: restaurant.name,
          items: [{ menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }],
        };
      }
      const base = prev || {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        items: [],
      };
      const existing = base.items.find((i) => i.menuItemId === item._id);
      let items;
      if (existing) {
        items = base.items.map((i) =>
          i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        items = [
          ...base.items,
          { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 },
        ];
      }
      return { ...base, items };
    });
  };

  const updateQuantity = (menuItemId, quantity) => {
    setCart((prev) => {
      if (!prev) return prev;
      if (quantity <= 0) {
        const items = prev.items.filter((i) => i.menuItemId !== menuItemId);
        return items.length ? { ...prev, items } : null;
      }
      const items = prev.items.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      );
      return { ...prev, items };
    });
  };

  const clearCart = () => setCart(null);

  const itemsTotal = cart ? cart.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0;

  return (
    <CartContext.Provider value={{ cart, addItem, updateQuantity, clearCart, itemsTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
