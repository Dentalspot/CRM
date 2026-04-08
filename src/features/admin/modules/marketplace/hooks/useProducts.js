import { useState, useEffect } from 'react';
import { marketplaceApi } from '../api/marketplaceApi';

export const useProducts = (filters) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceApi.fetchProducts(filters).then(res => {
      setProducts(res.data);
      setLoading(false);
    });
  }, [JSON.stringify(filters)]);

  return { products, loading };
};