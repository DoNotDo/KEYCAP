import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  onSnapshot,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { InventoryItem, Transaction, BOMItem, Order, ConsumptionRecord, MaterialOrder, BranchNote } from '../types';

const COLLECTIONS = {
  ITEMS: 'items',
  TRANSACTIONS: 'transactions',
  BOM: 'bom',
  ORDERS: 'orders',
  CONSUMPTIONS: 'consumptions',
  MATERIAL_ORDERS: 'materialOrders',
  BRANCH_NOTES: 'branchNotes',
};

let itemsCache: InventoryItem[] = [];
let transactionsCache: Transaction[] = [];
let bomCache: BOMItem[] = [];
let ordersCache: Order[] = [];
let consumptionsCache: ConsumptionRecord[] = [];
let materialOrdersCache: MaterialOrder[] = [];
let branchNotesCache: BranchNote[] = [];

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

  refresh: async (): Promise<void> => {
    itemsCache = await getItemsFromFirestore();
    transactionsCache = await getTransactionsFromFirestore();
    bomCache = await getBOMFromFirestore();
    ordersCache = await getOrdersFromFirestore();
    consumptionsCache = await getConsumptionsFromFirestore();
    materialOrdersCache = await getMaterialOrdersFromFirestore();
    branchNotesCache = await getBranchNotesFromFirestore();
  },
};