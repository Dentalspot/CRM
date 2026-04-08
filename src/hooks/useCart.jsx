import React, { createContext, useContext, useState, useEffect } from 'react';
import logger from '@/lib/utils/logger';

const CartContext = createContext({});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        logger.error('Failed to parse cart items', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, variant, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id && item.variantId === variant?.id);
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.variantId === variant?.id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, variantId: variant?.id, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId, variantId) => {
    setCartItems(prev => prev.filter(item => !(item.id === productId && item.variantId === variantId)));
  };

  const updateQuantity = (productId, variantId, quantity) => {
    setCartItems(prev => prev.map(item => 
      (item.id === productId && item.variantId === variantId)
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => setCartItems([]);

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};