import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { InventoryItem, Transaction, BOMItem, Order, ConsumptionRecord, MaterialOrder, BranchNote, BetaWeeklyReport, BetaBranch, BetaCategory, BetaProduct } from '../types';
import { BETA_BRANCHES } from '../constants/beta';

const COLLECTIONS = {
  ITEMS: 'items',
  TRANSACTIONS: 'transactions',
  BOM: 'bom',
  ORDERS: 'orders',
  CONSUMPTIONS: 'consumptions',
  MATERIAL_ORDERS: 'materialOrders',
  BRANCH_NOTES: 'branchNotes',
  BETA_WEEKLY_REPORTS: 'betaWeeklyReports',
  BETA_BRANCHES: 'betaBranches',
  BETA_CATEGORIES: 'betaCategories',
  BETA_PRODUCTS: 'betaProducts',
};

let itemsCache: InventoryItem[] = [];
let transactionsCache: Transaction[] = [];
let bomCache: BOMItem[] = [];
let ordersCache: Order[] = [];
let consumptionsCache: ConsumptionRecord[] = [];
let materialOrdersCache: MaterialOrder[] = [];
let branchNotesCache: BranchNote[] = [];
let betaReportsCache: BetaWeeklyReport[] = [];
let betaBranchesCache: BetaBranch[] = [];
let betaCategoriesCache: BetaCategory[] = [];
let betaProductsCache: BetaProduct[] = [];

const getItemsFromFirestore = async (): Promise<InventoryItem[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.ITEMS));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
    } as InventoryItem;
  });
};

const getTransactionsFromFirestore = async (): Promise<Transaction[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate?.().toISOString() || data.timestamp,
    } as Transaction;
  });
};

const getBOMFromFirestore = async (): Promise<BOMItem[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.BOM));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BOMItem));
};

const getOrdersFromFirestore = async (): Promise<Order[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      orderDate: data.orderDate?.toDate?.().toISOString() || data.orderDate,
      processedAt: data.processedAt?.toDate?.().toISOString() || data.processedAt,
      shippedAt: data.shippedAt?.toDate?.().toISOString() || data.shippedAt,
      receivedAt: data.receivedAt?.toDate?.().toISOString() || data.receivedAt,
    } as Order;
  });
};

const getConsumptionsFromFirestore = async (): Promise<ConsumptionRecord[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.CONSUMPTIONS));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      orderDate: data.orderDate?.toDate?.().toISOString() || data.orderDate,
      processedAt: data.processedAt?.toDate?.().toISOString() || data.processedAt,
    } as ConsumptionRecord;
  });
};

const getMaterialOrdersFromFirestore = async (): Promise<MaterialOrder[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.MATERIAL_ORDERS));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      orderDate: data.orderDate?.toDate?.().toISOString() || data.orderDate,
      expectedDate: data.expectedDate?.toDate?.().toISOString() || data.expectedDate,
      nextOrderDate: data.nextOrderDate?.toDate?.().toISOString() || data.nextOrderDate,
      createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
    } as MaterialOrder;
  });
};

const getBranchNotesFromFirestore = async (): Promise<BranchNote[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.BRANCH_NOTES));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
    } as BranchNote;
  });
};

const getBetaReportsFromFirestore = async (): Promise<BetaWeeklyReport[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.BETA_WEEKLY_REPORTS));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      reportedAt: data.reportedAt?.toDate?.().toISOString() || data.reportedAt,
    } as BetaWeeklyReport;
  });
};

const getBetaBranchesFromFirestore = async (): Promise<BetaBranch[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.BETA_BRANCHES));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BetaBranch)).sort((a, b) => a.order - b.order);
};
const getBetaCategoriesFromFirestore = async (): Promise<BetaCategory[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.BETA_CATEGORIES));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BetaCategory)).sort((a, b) => a.order - b.order);
};
const getBetaProductsFromFirestore = async (): Promise<BetaProduct[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.BETA_PRODUCTS));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BetaProduct)).sort((a, b) => a.order - b.order);
};

export const storage = {
  getItems: (): InventoryItem[] => itemsCache,
  getItemsAsync: async (): Promise<InventoryItem[]> => {
    itemsCache = await getItemsFromFirestore();
    return itemsCache;
  },
  saveItems: async (items: InventoryItem[]): Promise<void> => {
    const batch = writeBatch(db);
    items.forEach(item => {
      const itemRef = doc(db, COLLECTIONS.ITEMS, item.id);
      batch.set(itemRef, { ...item });
    });
    await batch.commit();
    itemsCache = items;
  },

  getTransactions: (): Transaction[] => transactionsCache,
  getTransactionsAsync: async (): Promise<Transaction[]> => {
    transactionsCache = await getTransactionsFromFirestore();
    return transactionsCache;
  },
  saveTransaction: async (transaction: Transaction): Promise<void> => {
    const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transaction.id);
    await setDoc(transactionRef, { ...transaction });
    transactionsCache.push(transaction);
  },

  getBOM: (): BOMItem[] => bomCache,
  getBOMAsync: async (): Promise<BOMItem[]> => {
    bomCache = await getBOMFromFirestore();
    return bomCache;
  },
  saveBOM: async (bom: BOMItem[]): Promise<void> => {
    const batch = writeBatch(db);
    const collectionRef = collection(db, COLLECTIONS.BOM);
    const snapshot = await getDocs(collectionRef);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    bom.forEach(bomItem => {
      const bomRef = doc(db, COLLECTIONS.BOM, bomItem.id);
      batch.set(bomRef, bomItem);
    });
    await batch.commit();
    bomCache = bom;
  },

  getOrders: (): Order[] => ordersCache,
  getOrdersAsync: async (): Promise<Order[]> => {
    ordersCache = await getOrdersFromFirestore();
    return ordersCache;
  },
  subscribeOrders: (callback: (orders: Order[]) => void): (() => void) => {
    const q = query(collection(db, COLLECTIONS.ORDERS));
    return onSnapshot(q, (snapshot) => {
      ordersCache = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data } as Order;
      });
      callback(ordersCache);
    });
  },
  saveOrder: async (order: Order): Promise<void> => {
    const orderRef = doc(db, COLLECTIONS.ORDERS, order.id);
    await setDoc(orderRef, { ...order });
    ordersCache.push(order);
  },
  updateOrder: async (orderId: string, updates: Partial<Order>): Promise<void> => {
    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await updateDoc(orderRef, updates);
    ordersCache = ordersCache.map(o => o.id === orderId ? { ...o, ...updates } : o);
  },

  getMaterialOrders: (): MaterialOrder[] => materialOrdersCache,
  getMaterialOrdersAsync: async (): Promise<MaterialOrder[]> => {
    materialOrdersCache = await getMaterialOrdersFromFirestore();
    return materialOrdersCache;
  },
  saveMaterialOrder: async (order: MaterialOrder): Promise<void> => {
    const orderRef = doc(db, COLLECTIONS.MATERIAL_ORDERS, order.id);
    await setDoc(orderRef, { ...order });
    materialOrdersCache.push(order);
  },
  updateMaterialOrder: async (orderId: string, updates: Partial<MaterialOrder>): Promise<void> => {
    const orderRef = doc(db, COLLECTIONS.MATERIAL_ORDERS, orderId);
    await updateDoc(orderRef, updates);
    materialOrdersCache = materialOrdersCache.map(o => o.id === orderId ? { ...o, ...updates } : o);
  },
  deleteMaterialOrder: async (orderId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.MATERIAL_ORDERS, orderId));
    materialOrdersCache = materialOrdersCache.filter(o => o.id !== orderId);
  },

  getBranchNotes: (): BranchNote[] => branchNotesCache,
  getBranchNotesAsync: async (): Promise<BranchNote[]> => {
    branchNotesCache = await getBranchNotesFromFirestore();
    return branchNotesCache;
  },
  saveBranchNote: async (note: BranchNote): Promise<void> => {
    const noteRef = doc(db, COLLECTIONS.BRANCH_NOTES, note.id || note.branchName);
    await setDoc(noteRef, { ...note });
    const index = branchNotesCache.findIndex(n => n.id === (note.id || note.branchName));
    if (index > -1) branchNotesCache[index] = note; else branchNotesCache.push(note);
  },

  getConsumptions: (): ConsumptionRecord[] => consumptionsCache,
  getConsumptionsAsync: async (): Promise<ConsumptionRecord[]> => {
    consumptionsCache = await getConsumptionsFromFirestore();
    return consumptionsCache;
  },
  saveConsumption: async (consumption: ConsumptionRecord): Promise<void> => {
    const consumptionRef = doc(db, COLLECTIONS.CONSUMPTIONS, consumption.id);
    await setDoc(consumptionRef, { ...consumption });
    consumptionsCache.push(consumption);
  },

  getBetaReports: (): BetaWeeklyReport[] => betaReportsCache,
  getBetaReportsAsync: async (): Promise<BetaWeeklyReport[]> => {
    betaReportsCache = await getBetaReportsFromFirestore();
    return betaReportsCache;
  },
  subscribeBetaReports: (callback: (reports: BetaWeeklyReport[]) => void): (() => void) => {
    const q = query(collection(db, COLLECTIONS.BETA_WEEKLY_REPORTS));
    return onSnapshot(q, (snapshot) => {
      betaReportsCache = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          reportedAt: data.reportedAt?.toDate?.().toISOString() || data.reportedAt,
        } as BetaWeeklyReport;
      });
      callback(betaReportsCache);
    });
  },
  saveBetaReport: async (report: BetaWeeklyReport): Promise<void> => {
    const reportRef = doc(db, COLLECTIONS.BETA_WEEKLY_REPORTS, report.id);
    await setDoc(reportRef, { ...report });
    const idx = betaReportsCache.findIndex(r => r.id === report.id);
    if (idx >= 0) betaReportsCache[idx] = report; else betaReportsCache.push(report);
  },

  getBetaBranches: (): BetaBranch[] => betaBranchesCache,
  getBetaBranchesAsync: async (): Promise<BetaBranch[]> => {
    betaBranchesCache = await getBetaBranchesFromFirestore();
    return betaBranchesCache;
  },
  subscribeBetaBranches: (callback: (list: BetaBranch[]) => void): (() => void) => {
    return onSnapshot(query(collection(db, COLLECTIONS.BETA_BRANCHES)), async () => {
      betaBranchesCache = await getBetaBranchesFromFirestore();
      callback(betaBranchesCache);
    });
  },
  addBetaBranch: async (branch: Omit<BetaBranch, 'id'>): Promise<BetaBranch> => {
    const id = crypto.randomUUID();
    const b: BetaBranch = { ...branch, id };
    await setDoc(doc(db, COLLECTIONS.BETA_BRANCHES, id), b);
    betaBranchesCache = [...betaBranchesCache, b].sort((a, b) => a.order - b.order);
    return b;
  },
  updateBetaBranch: async (id: string, updates: Partial<BetaBranch>): Promise<void> => {
    const ref = doc(db, COLLECTIONS.BETA_BRANCHES, id);
    await updateDoc(ref, updates as Record<string, unknown>);
    betaBranchesCache = betaBranchesCache.map(b => b.id === id ? { ...b, ...updates } : b).sort((a, b) => a.order - b.order);
  },
  deleteBetaBranch: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.BETA_BRANCHES, id));
    betaBranchesCache = betaBranchesCache.filter(b => b.id !== id);
  },

  getBetaCategories: (): BetaCategory[] => betaCategoriesCache,
  getBetaCategoriesAsync: async (): Promise<BetaCategory[]> => {
    betaCategoriesCache = await getBetaCategoriesFromFirestore();
    return betaCategoriesCache;
  },
  subscribeBetaCategories: (callback: (list: BetaCategory[]) => void): (() => void) => {
    return onSnapshot(query(collection(db, COLLECTIONS.BETA_CATEGORIES)), async () => {
      betaCategoriesCache = await getBetaCategoriesFromFirestore();
      callback(betaCategoriesCache);
    });
  },
  addBetaCategory: async (cat: Omit<BetaCategory, 'id'>): Promise<BetaCategory> => {
    const id = crypto.randomUUID();
    const c: BetaCategory = { ...cat, id };
    await setDoc(doc(db, COLLECTIONS.BETA_CATEGORIES, id), c);
    betaCategoriesCache = [...betaCategoriesCache, c].sort((a, b) => a.order - b.order);
    return c;
  },
  updateBetaCategory: async (id: string, updates: Partial<BetaCategory>): Promise<void> => {
    const ref = doc(db, COLLECTIONS.BETA_CATEGORIES, id);
    await updateDoc(ref, updates as Record<string, unknown>);
    betaCategoriesCache = betaCategoriesCache.map(c => c.id === id ? { ...c, ...updates } : c).sort((a, b) => a.order - b.order);
  },
  deleteBetaCategory: async (id: string): Promise<void> => {
    const toDelete = betaProductsCache.filter(p => p.categoryId === id);
    for (const p of toDelete) await deleteDoc(doc(db, COLLECTIONS.BETA_PRODUCTS, p.id));
    await deleteDoc(doc(db, COLLECTIONS.BETA_CATEGORIES, id));
    betaCategoriesCache = betaCategoriesCache.filter(c => c.id !== id);
    betaProductsCache = betaProductsCache.filter(p => p.categoryId !== id);
  },

  getBetaProducts: (): BetaProduct[] => betaProductsCache,
  getBetaProductsAsync: async (): Promise<BetaProduct[]> => {
    betaProductsCache = await getBetaProductsFromFirestore();
    return betaProductsCache;
  },
  subscribeBetaProducts: (callback: (list: BetaProduct[]) => void): (() => void) => {
    return onSnapshot(query(collection(db, COLLECTIONS.BETA_PRODUCTS)), async () => {
      betaProductsCache = await getBetaProductsFromFirestore();
      callback(betaProductsCache);
    });
  },
  addBetaProduct: async (product: Omit<BetaProduct, 'id'>): Promise<BetaProduct> => {
    const id = crypto.randomUUID();
    const p: BetaProduct = { ...product, id };
    await setDoc(doc(db, COLLECTIONS.BETA_PRODUCTS, id), p);
    betaProductsCache = [...betaProductsCache, p].sort((a, b) => a.order - b.order);
    return p;
  },
  updateBetaProduct: async (id: string, updates: Partial<BetaProduct>): Promise<void> => {
    const ref = doc(db, COLLECTIONS.BETA_PRODUCTS, id);
    await updateDoc(ref, updates as Record<string, unknown>);
    betaProductsCache = betaProductsCache.map(p => p.id === id ? { ...p, ...updates } : p).sort((a, b) => a.order - b.order);
  },
  deleteBetaProduct: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.BETA_PRODUCTS, id));
    betaProductsCache = betaProductsCache.filter(p => p.id !== id);
  },

  seedBetaBranchesIfEmpty: async (): Promise<void> => {
    if (betaBranchesCache.length > 0) return;
    betaBranchesCache = await getBetaBranchesFromFirestore();
    if (betaBranchesCache.length > 0) return;
    for (let i = 0; i < BETA_BRANCHES.length; i++) {
      await storage.addBetaBranch({ name: BETA_BRANCHES[i], order: i, active: true });
    }
  },
  seedBetaCategoriesAndProductsIfEmpty: async (): Promise<void> => {
    betaCategoriesCache = await getBetaCategoriesFromFirestore();
    betaProductsCache = await getBetaProductsFromFirestore();
    if (betaCategoriesCache.length > 0 && betaProductsCache.length > 0) return;
    if (betaCategoriesCache.length === 0) {
      for (let i = 0; i < 10; i++) {
        await storage.addBetaCategory({ name: `카테고리 ${i + 1}`, order: i });
      }
      betaCategoriesCache = await getBetaCategoriesFromFirestore();
    }
    if (betaProductsCache.length === 0 && betaCategoriesCache.length >= 10) {
      for (let c = 0; c < 10; c++) {
        const cat = betaCategoriesCache[c];
        for (let p = 0; p < 10; p++) {
          await storage.addBetaProduct({ categoryId: cat.id, name: `제품 ${c + 1}-${p + 1}`, order: p });
        }
      }
    }
  },

  /** 해당 주차 지점×품목 샘플 보고 생성 (임의 수량, Firestore 지점/품목 사용) */
  seedBetaReportsForWeek: async (weekKey: string): Promise<void> => {
    await storage.getBetaBranchesAsync();
    await storage.getBetaProductsAsync();
    const branches = betaBranchesCache.filter(b => b.active).map(b => b.name);
    const productIds = betaProductsCache.map(p => p.id);
    if (branches.length === 0 || productIds.length === 0) return;
    const levels = (): Record<string, number> => {
      const o: Record<string, number> = {};
      productIds.forEach(id => { o[id] = Math.floor(Math.random() * 11); });
      return o;
    };
    const sales = (): Record<string, number> => {
      const o: Record<string, number> = {};
      productIds.forEach(id => { o[id] = Math.floor(Math.random() * 16); });
      return o;
    };
    const now = new Date().toISOString();
    for (const branchName of branches) {
      const report: BetaWeeklyReport = {
        id: `${branchName}_${weekKey}`,
        branchName,
        weekKey,
        levels: levels(),
        sales: sales(),
        reportedAt: now,
        reportedBy: '시드',
      };
      await storage.saveBetaReport(report);
    }
  },

  refresh: async (): Promise<void> => {
    itemsCache = await getItemsFromFirestore();
    transactionsCache = await getTransactionsFromFirestore();
    bomCache = await getBOMFromFirestore();
    ordersCache = await getOrdersFromFirestore();
    consumptionsCache = await getConsumptionsFromFirestore();
    materialOrdersCache = await getMaterialOrdersFromFirestore();
    branchNotesCache = await getBranchNotesFromFirestore();
    betaReportsCache = await getBetaReportsFromFirestore();
  },
};