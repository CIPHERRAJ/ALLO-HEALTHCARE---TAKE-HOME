import { useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  price: number;
  units: number;
}

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('allo-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem('allo-cart', JSON.stringify(newItems));
    // Dispatch event for other components to listen to
    window.dispatchEvent(new Event('cart-updated'));
  };

  const addToCart = (item: CartItem) => {
    const existingIndex = items.findIndex(
      (i) => i.productId === item.productId && i.warehouseId === item.warehouseId
    );

    if (existingIndex > -1) {
      const newItems = [...items];
      newItems[existingIndex].units += item.units;
      saveCart(newItems);
    } else {
      saveCart([...items, item]);
    }
  };

  const removeFromCart = (productId: string, warehouseId: string) => {
    saveCart(items.filter((i) => !(i.productId === productId && i.warehouseId === warehouseId)));
  };

  const clearCart = () => {
    saveCart([]);
  };

  const total = items.reduce((acc, item) => acc + item.price * item.units, 0);

  return {
    items,
    addToCart,
    removeFromCart,
    clearCart,
    total,
  };
};
