import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { processColor } from 'react-native';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem('@GoMarket:products');

      if (storagedProducts) {
        setProducts(JSON.parse(storagedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = [...products];

      const productExistsInCart = products.find(product => product.id === id);

      if (productExistsInCart) {
        const index = products.indexOf(productExistsInCart);

        newProducts[index].quantity += 1;
      }

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = [...products];

      const productExistsInCart = products.find(product => product.id === id);

      if (productExistsInCart) {
        const index = products.indexOf(productExistsInCart);

        if (productExistsInCart.quantity > 1) {
          newProducts[index].quantity -= 1;
        } else {
          newProducts.splice(index, 1);
        }
      }

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExistsInCart = products.find(item => item.id === product.id);

      if (!productExistsInCart) {
        const newProduct = product;

        newProduct.quantity = 1;

        setProducts([...products, newProduct]);

        await AsyncStorage.setItem(
          '@GoMarket:products',
          JSON.stringify(products),
        );
      }

      if (productExistsInCart) {
        increment(productExistsInCart.id);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
