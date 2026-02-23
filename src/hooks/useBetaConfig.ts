import { useState, useEffect, useMemo } from 'react';
import { BetaBranch, BetaCategory, BetaProduct } from '../types';
import { storage } from '../utils/storage';

export function useBetaConfig() {
  const [branches, setBranches] = useState<BetaBranch[]>([]);
  const [categories, setCategories] = useState<BetaCategory[]>([]);
  const [products, setProducts] = useState<BetaProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await storage.getBetaBranchesAsync();
      await storage.getBetaCategoriesAsync();
      await storage.getBetaProductsAsync();
      await storage.seedBetaBranchesIfEmpty();
      await storage.seedBetaCategoriesAndProductsIfEmpty();
      setBranches(storage.getBetaBranches());
      setCategories(storage.getBetaCategories());
      setProducts(storage.getBetaProducts());
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const unsubB = storage.subscribeBetaBranches(setBranches);
    const unsubC = storage.subscribeBetaCategories(setCategories);
    const unsubP = storage.subscribeBetaProducts(setProducts);
    return () => {
      unsubB();
      unsubC();
      unsubP();
    };
  }, []);

  const productsByCategory = useMemo(() => {
    const map = new Map<string, BetaProduct[]>();
    categories.forEach(c => map.set(c.id, []));
    products.forEach(p => {
      const list = map.get(p.categoryId);
      if (list) list.push(p);
    });
    map.forEach(list => list.sort((a, b) => a.order - b.order));
    return map;
  }, [categories, products]);

  const activeBranches = useMemo(() => branches.filter(b => b.active), [branches]);
  const branchNames = useMemo(() => activeBranches.map(b => b.name), [activeBranches]);

  return {
    branches,
    categories,
    products,
    productsByCategory,
    activeBranches,
    branchNames,
    loading,
  };
}
