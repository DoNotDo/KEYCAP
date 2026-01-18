// Firebase Storage로 전환 - 데이터 영구 보존
import { 
  collection, 
  doc, 
  getDoc, 
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
import { InventoryItem, Transaction, BOMItem, Order, ConsumptionRecord, MaterialOrder } from '../types';

// Firestore 컬렉션 이름
const COLLECTIONS = {
  ITEMS: 'items',
  TRANSACTIONS: 'transactions',
  BOM: 'bom',
  ORDERS: 'orders',
  CONSUMPTIONS: 'consumptions',
  MATERIAL_ORDERS: 'materialOrders',
};

// 실시간 리스너 관리
const listeners: { [key: string]: () => void } = {};

// 로컬 스토리지에서 데이터 마이그레이션 (한 번만 실행)
const migrateFromLocalStorage = async () => {
  try {
    // 이미 마이그레이션되었는지 확인
    const migrationKey = 'firebase_migration_completed';
    if (localStorage.getItem(migrationKey)) {
      return; // 이미 마이그레이션 완료
    }

    // Firestore에 데이터가 있는지 확인
    const itemsSnapshot = await getDocs(collection(db, COLLECTIONS.ITEMS));
    if (!itemsSnapshot.empty) {
      localStorage.setItem(migrationKey, 'true');
      return; // 이미 Firebase에 데이터가 있음
    }

    // 로컬 스토리지에서 데이터 가져오기
    const localItems = localStorage.getItem('inventory_items');
    const localBOM = localStorage.getItem('inventory_bom');
    const localOrders = localStorage.getItem('inventory_orders');
    const localTransactions = localStorage.getItem('inventory_transactions');
    const localConsumptions = localStorage.getItem('inventory_consumptions');
    const localMaterialOrders = localStorage.getItem('inventory_material_orders');

    const batch = writeBatch(db);

    // Items 마이그레이션
    if (localItems) {
      try {
        const items: InventoryItem[] = JSON.parse(localItems);
        items.forEach(item => {
          const itemRef = doc(db, COLLECTIONS.ITEMS, item.id);
          batch.set(itemRef, {
            ...item,
            createdAt: Timestamp.fromDate(new Date(item.createdAt)),
            updatedAt: Timestamp.fromDate(new Date(item.updatedAt)),
          });
        });
      } catch (e) {
        console.error('Error migrating items:', e);
      }
    }

    // BOM 마이그레이션
    if (localBOM) {
      try {
        const bom: BOMItem[] = JSON.parse(localBOM);
        bom.forEach(bomItem => {
          const bomRef = doc(db, COLLECTIONS.BOM, bomItem.id);
          batch.set(bomRef, bomItem);
        });
      } catch (e) {
        console.error('Error migrating BOM:', e);
      }
    }

    // Orders 마이그레이션
    if (localOrders) {
      try {
        const orders: Order[] = JSON.parse(localOrders);
        orders.forEach(order => {
          const orderRef = doc(db, COLLECTIONS.ORDERS, order.id);
          batch.set(orderRef, {
            ...order,
            orderDate: Timestamp.fromDate(new Date(order.orderDate)),
            processedAt: order.processedAt ? Timestamp.fromDate(new Date(order.processedAt)) : null,
          });
        });
      } catch (e) {
        console.error('Error migrating orders:', e);
      }
    }

    // Transactions 마이그레이션
    if (localTransactions) {
      try {
        const transactions: Transaction[] = JSON.parse(localTransactions);
        transactions.forEach(transaction => {
          const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transaction.id);
          batch.set(transactionRef, {
            ...transaction,
            timestamp: Timestamp.fromDate(new Date(transaction.timestamp)),
          });
        });
      } catch (e) {
        console.error('Error migrating transactions:', e);
      }
    }

    // Consumptions 마이그레이션
    if (localConsumptions) {
      try {
        const consumptions: ConsumptionRecord[] = JSON.parse(localConsumptions);
        consumptions.forEach(consumption => {
          const consumptionRef = doc(db, COLLECTIONS.CONSUMPTIONS, consumption.id);
          batch.set(consumptionRef, {
            ...consumption,
            orderDate: Timestamp.fromDate(new Date(consumption.orderDate)),
            processedAt: Timestamp.fromDate(new Date(consumption.processedAt)),
          });
        });
      } catch (e) {
        console.error('Error migrating consumptions:', e);
      }
    }

    // Material Orders 마이그레이션
    if (localMaterialOrders) {
      try {
        const materialOrders: MaterialOrder[] = JSON.parse(localMaterialOrders);
        materialOrders.forEach(order => {
          const orderRef = doc(db, COLLECTIONS.MATERIAL_ORDERS, order.id);
          batch.set(orderRef, {
            ...order,
            orderDate: Timestamp.fromDate(new Date(order.orderDate)),
            expectedDate: order.expectedDate ? Timestamp.fromDate(new Date(order.expectedDate)) : null,
            nextOrderDate: order.nextOrderDate ? Timestamp.fromDate(new Date(order.nextOrderDate)) : null,
            createdAt: Timestamp.fromDate(new Date(order.createdAt)),
            updatedAt: Timestamp.fromDate(new Date(order.updatedAt)),
          });
        });
      } catch (e) {
        console.error('Error migrating material orders:', e);
      }
    }

    await batch.commit();
    localStorage.setItem(migrationKey, 'true');
    console.log('데이터 마이그레이션 완료');
  } catch (error) {
    console.error('마이그레이션 오류:', error);
  }
};

// 초기화 시 마이그레이션 실행
migrateFromLocalStorage();

// 동기/비동기 호환을 위한 캐시
let itemsCache: InventoryItem[] = [];
let transactionsCache: Transaction[] = [];
let bomCache: BOMItem[] = [];
let ordersCache: Order[] = [];
let consumptionsCache: ConsumptionRecord[] = [];
let materialOrdersCache: MaterialOrder[] = [];
let isInitialized = false;

// 초기 데이터 로드
const initializeData = async () => {
  if (isInitialized) return;
  try {
    await migrateFromLocalStorage();
    itemsCache = await getItemsFromFirestore();
    transactionsCache = await getTransactionsFromFirestore();
    bomCache = await getBOMFromFirestore();
    ordersCache = await getOrdersFromFirestore();
    consumptionsCache = await getConsumptionsFromFirestore();
    materialOrdersCache = await getMaterialOrdersFromFirestore();
    isInitialized = true;
  } catch (error) {
    console.error('초기화 오류:', error);
  }
};

// Firestore에서 데이터 가져오기 (내부 함수)
const getItemsFromFirestore = async (): Promise<InventoryItem[]> => {
  try {
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
  } catch (error) {
    console.error('Error getting items:', error);
    return [];
  }
};

const getTransactionsFromFirestore = async (): Promise<Transaction[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.().toISOString() || data.timestamp,
      } as Transaction;
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

const getBOMFromFirestore = async (): Promise<BOMItem[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.BOM));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as BOMItem));
  } catch (error) {
    console.error('Error getting BOM:', error);
    return [];
  }
};

const getOrdersFromFirestore = async (): Promise<Order[]> => {
  try {
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
  } catch (error) {
    console.error('Error getting orders:', error);
    return [];
  }
};

const getConsumptionsFromFirestore = async (): Promise<ConsumptionRecord[]> => {
  try {
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
  } catch (error) {
    console.error('Error getting consumptions:', error);
    return [];
  }
};

const getMaterialOrdersFromFirestore = async (): Promise<MaterialOrder[]> => {
  try {
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
  } catch (error) {
    console.error('Error getting material orders:', error);
    return [];
  }
};

// 초기화 실행
initializeData();

export const storage = {
  // Items - 동기 버전 (캐시 사용)
  getItems: (): InventoryItem[] => {
    return itemsCache;
  },

  // Items - 비동기 버전 (Firestore에서 직접)
  getItemsAsync: async (): Promise<InventoryItem[]> => {
    const items = await getItemsFromFirestore();
    itemsCache = items;
    return items;
  },

  // 실시간 Items 리스너
  subscribeItems: (callback: (items: InventoryItem[]) => void): (() => void) => {
    const q = query(collection(db, COLLECTIONS.ITEMS));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
        } as InventoryItem;
      });
      itemsCache = items;
      callback(items);
    }, (error) => {
      console.error('Error subscribing to items:', error);
    });
    listeners['items'] = unsubscribe;
    return unsubscribe;
  },

  saveItems: async (items: InventoryItem[]): Promise<void> => {
    try {
      const batch = writeBatch(db);
      // 기존 항목 삭제 후 새로 저장
      const existingSnapshot = await getDocs(collection(db, COLLECTIONS.ITEMS));
      existingSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      // 새 항목 추가
      items.forEach(item => {
        const itemRef = doc(db, COLLECTIONS.ITEMS, item.id);
        batch.set(itemRef, {
          ...item,
          createdAt: Timestamp.fromDate(new Date(item.createdAt)),
          updatedAt: Timestamp.fromDate(new Date(item.updatedAt)),
        });
      });
      await batch.commit();
      itemsCache = items; // 캐시 업데이트
    } catch (error) {
      console.error('Error saving items:', error);
      throw error;
    }
  },

  // Transactions
  getTransactions: (): Transaction[] => {
    return transactionsCache;
  },

  getTransactionsAsync: async (): Promise<Transaction[]> => {
    const transactions = await getTransactionsFromFirestore();
    transactionsCache = transactions;
    return transactions;
  },

  saveTransaction: async (transaction: Transaction): Promise<void> => {
    try {
      const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transaction.id);
      await setDoc(transactionRef, {
        ...transaction,
        timestamp: Timestamp.fromDate(new Date(transaction.timestamp)),
      });
      transactionsCache = [...transactionsCache, transaction];
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  },

  // BOM
  getBOM: (): BOMItem[] => {
    return bomCache;
  },

  getBOMAsync: async (): Promise<BOMItem[]> => {
    const bom = await getBOMFromFirestore();
    bomCache = bom;
    return bom;
  },

  saveBOM: async (bom: BOMItem[]): Promise<void> => {
    try {
      const batch = writeBatch(db);
      // 기존 BOM 삭제 후 새로 저장
      const existingSnapshot = await getDocs(collection(db, COLLECTIONS.BOM));
      existingSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      // 새 BOM 추가
      bom.forEach(bomItem => {
        const bomRef = doc(db, COLLECTIONS.BOM, bomItem.id);
        batch.set(bomRef, bomItem);
      });
      await batch.commit();
      bomCache = bom; // 캐시 업데이트
    } catch (error) {
      console.error('Error saving BOM:', error);
      throw error;
    }
  },

  // Orders
  getOrders: (): Order[] => {
    return ordersCache;
  },

  getOrdersAsync: async (): Promise<Order[]> => {
    const orders = await getOrdersFromFirestore();
    ordersCache = orders;
    return orders;
  },

  // 실시간 Orders 리스너
  subscribeOrders: (callback: (orders: Order[]) => void): (() => void) => {
    const q = query(collection(db, COLLECTIONS.ORDERS));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => {
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
      ordersCache = orders;
      callback(orders);
    }, (error) => {
      console.error('Error subscribing to orders:', error);
    });
    listeners['orders'] = unsubscribe;
    return unsubscribe;
  },

  saveOrder: async (order: Order): Promise<void> => {
    try {
      const orderRef = doc(db, COLLECTIONS.ORDERS, order.id);
      await setDoc(orderRef, {
        ...order,
        orderDate: Timestamp.fromDate(new Date(order.orderDate)),
        processedAt: order.processedAt ? Timestamp.fromDate(new Date(order.processedAt)) : null,
        shippedAt: order.shippedAt ? Timestamp.fromDate(new Date(order.shippedAt)) : null,
        receivedAt: order.receivedAt ? Timestamp.fromDate(new Date(order.receivedAt)) : null,
      });
      ordersCache = [...ordersCache, order];
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  },

  updateOrder: async (orderId: string, updates: Partial<Order>): Promise<void> => {
    try {
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      const updateData: any = { ...updates };
      if (updates.orderDate) {
        updateData.orderDate = Timestamp.fromDate(new Date(updates.orderDate));
      }
      if (updates.processedAt) {
        updateData.processedAt = Timestamp.fromDate(new Date(updates.processedAt));
      }
      if (updates.shippedAt) {
        updateData.shippedAt = Timestamp.fromDate(new Date(updates.shippedAt));
      }
      if (updates.receivedAt) {
        updateData.receivedAt = Timestamp.fromDate(new Date(updates.receivedAt));
      }
      await updateDoc(orderRef, updateData);
      // 캐시 업데이트
      const index = ordersCache.findIndex(o => o.id === orderId);
      if (index !== -1) {
        ordersCache[index] = { ...ordersCache[index], ...updates };
      }
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  // Material Orders
  getMaterialOrders: (): MaterialOrder[] => {
    return materialOrdersCache;
  },

  getMaterialOrdersAsync: async (): Promise<MaterialOrder[]> => {
    const materialOrders = await getMaterialOrdersFromFirestore();
    materialOrdersCache = materialOrders;
    return materialOrders;
  },

  subscribeMaterialOrders: (callback: (orders: MaterialOrder[]) => void): (() => void) => {
    const q = query(collection(db, COLLECTIONS.MATERIAL_ORDERS));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => {
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
      materialOrdersCache = orders;
      callback(orders);
    }, (error) => {
      console.error('Error subscribing to material orders:', error);
    });
    listeners['materialOrders'] = unsubscribe;
    return unsubscribe;
  },

  saveMaterialOrder: async (order: MaterialOrder): Promise<void> => {
    try {
      const orderRef = doc(db, COLLECTIONS.MATERIAL_ORDERS, order.id);
      await setDoc(orderRef, {
        ...order,
        orderDate: Timestamp.fromDate(new Date(order.orderDate)),
        expectedDate: order.expectedDate ? Timestamp.fromDate(new Date(order.expectedDate)) : null,
        nextOrderDate: order.nextOrderDate ? Timestamp.fromDate(new Date(order.nextOrderDate)) : null,
        createdAt: Timestamp.fromDate(new Date(order.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(order.updatedAt)),
      });
      materialOrdersCache = [...materialOrdersCache, order];
    } catch (error) {
      console.error('Error saving material order:', error);
      throw error;
    }
  },

  updateMaterialOrder: async (orderId: string, updates: Partial<MaterialOrder>): Promise<void> => {
    try {
      const orderRef = doc(db, COLLECTIONS.MATERIAL_ORDERS, orderId);
      const updateData: any = { ...updates };
      if (updates.orderDate) {
        updateData.orderDate = Timestamp.fromDate(new Date(updates.orderDate));
      }
      if (updates.expectedDate === '') {
        updateData.expectedDate = null;
      } else if (updates.expectedDate) {
        updateData.expectedDate = Timestamp.fromDate(new Date(updates.expectedDate));
      }
      if (updates.nextOrderDate === '') {
        updateData.nextOrderDate = null;
      } else if (updates.nextOrderDate) {
        updateData.nextOrderDate = Timestamp.fromDate(new Date(updates.nextOrderDate));
      }
      if (updates.createdAt) {
        updateData.createdAt = Timestamp.fromDate(new Date(updates.createdAt));
      }
      if (updates.updatedAt) {
        updateData.updatedAt = Timestamp.fromDate(new Date(updates.updatedAt));
      }
      await updateDoc(orderRef, updateData);
      const index = materialOrdersCache.findIndex(o => o.id === orderId);
      if (index !== -1) {
        materialOrdersCache[index] = { ...materialOrdersCache[index], ...updates };
      }
    } catch (error) {
      console.error('Error updating material order:', error);
      throw error;
    }
  },

  deleteMaterialOrder: async (orderId: string): Promise<void> => {
    try {
      const orderRef = doc(db, COLLECTIONS.MATERIAL_ORDERS, orderId);
      await deleteDoc(orderRef);
      materialOrdersCache = materialOrdersCache.filter(order => order.id !== orderId);
    } catch (error) {
      console.error('Error deleting material order:', error);
      throw error;
    }
  },

  // Consumption Records
  getConsumptions: (): ConsumptionRecord[] => {
    return consumptionsCache;
  },

  getConsumptionsAsync: async (): Promise<ConsumptionRecord[]> => {
    const consumptions = await getConsumptionsFromFirestore();
    consumptionsCache = consumptions;
    return consumptions;
  },

  saveConsumption: async (consumption: ConsumptionRecord): Promise<void> => {
    try {
      const consumptionRef = doc(db, COLLECTIONS.CONSUMPTIONS, consumption.id);
      await setDoc(consumptionRef, {
        ...consumption,
        orderDate: Timestamp.fromDate(new Date(consumption.orderDate)),
        processedAt: Timestamp.fromDate(new Date(consumption.processedAt)),
      });
      consumptionsCache = [...consumptionsCache, consumption];
    } catch (error) {
      console.error('Error saving consumption:', error);
      throw error;
    }
  },

  // Clear all data
  clearAll: async (): Promise<void> => {
    try {
      const collections = [
        COLLECTIONS.ITEMS,
        COLLECTIONS.TRANSACTIONS,
        COLLECTIONS.BOM,
        COLLECTIONS.ORDERS,
        COLLECTIONS.CONSUMPTIONS,
        COLLECTIONS.MATERIAL_ORDERS,
      ];
      for (const coll of collections) {
        const snapshot = await getDocs(collection(db, coll));
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
      // 캐시 초기화
      itemsCache = [];
      transactionsCache = [];
      bomCache = [];
      ordersCache = [];
      consumptionsCache = [];
      materialOrdersCache = [];
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },

  // 리스너 정리
  unsubscribeAll: (): void => {
    Object.values(listeners).forEach(unsubscribe => unsubscribe());
    Object.keys(listeners).forEach(key => delete listeners[key]);
  },

  // 데이터 새로고침
  refresh: async (): Promise<void> => {
    itemsCache = await getItemsFromFirestore();
    transactionsCache = await getTransactionsFromFirestore();
    bomCache = await getBOMFromFirestore();
    ordersCache = await getOrdersFromFirestore();
    consumptionsCache = await getConsumptionsFromFirestore();
    materialOrdersCache = await getMaterialOrdersFromFirestore();
  },
};
