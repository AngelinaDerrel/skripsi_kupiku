import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addToCart = useCallback((menuItem, customization) => {
    setItems(prev => [...prev, {
      cartId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      id: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price) || 0,
      customization,
    }]);
  }, []);

  const removeFromCart = useCallback((cartId) => {
    setItems(prev => prev.filter(i => i.cartId !== cartId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
