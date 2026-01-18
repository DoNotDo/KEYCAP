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

export const storage = {
  // Items
  getItems: async (): Promise<InventoryItem[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.ITEMS));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as InventoryItem));
    } catch (error) {
      console.error('Error getting items:', error);
      return [];
    }
  },

  // 실시간 Items 리스너
  subscribeItems: (callback: (items: InventoryItem[]) => void): (() => void) => {
    const q = query(collection(db, COLLECTIONS.ITEMS));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as InventoryItem));
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
    } catch (error) {
      console.error('Error saving items:', error);
      throw error;
    }
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.().toISOString() || doc.data().date,
      } as Transaction));
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },

  saveTransaction: async (transaction: Transaction): Promise<void> => {
    try {
      const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transaction.id);
      await setDoc(transactionRef, {
        ...transaction,
        date: Timestamp.fromDate(new Date(transaction.date)),
      });
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  },

  // BOM
  getBOM: async (): Promise<BOMItem[]> => {
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
    } catch (error) {
      console.error('Error saving BOM:', error);
      throw error;
    }
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        orderDate: doc.data().orderDate?.toDate?.().toISOString() || doc.data().orderDate,
        processedAt: doc.data().processedAt?.toDate?.().toISOString() || doc.data().processedAt,
      } as Order));
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  },

  // 실시간 Orders 리스너
  subscribeOrders: (callback: (orders: Order[]) => void): (() => void) => {
    const q = query(collection(db, COLLECTIONS.ORDERS));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        orderDate: doc.data().orderDate?.toDate?.().toISOString() || doc.data().orderDate,
        processedAt: doc.data().processedAt?.toDate?.().toISOString() || doc.data().processedAt,
      } as Order));
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
      });
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
      await updateDoc(orderRef, updateData);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  // Material Orders
  getMaterialOrders: async (): Promise<MaterialOrder[]> => {
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
    } catch (error) {
      console.error('Error updating material order:', error);
      throw error;
    }
  },

  deleteMaterialOrder: async (orderId: string): Promise<void> => {
    try {
      const orderRef = doc(db, COLLECTIONS.MATERIAL_ORDERS, orderId);
      await deleteDoc(orderRef);
    } catch (error) {
      console.error('Error deleting material order:', error);
      throw error;
    }
  },

  // Consumption Records
  getConsumptions: async (): Promise<ConsumptionRecord[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.CONSUMPTIONS));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        orderDate: doc.data().orderDate?.toDate?.().toISOString() || doc.data().orderDate,
        processedAt: doc.data().processedAt?.toDate?.().toISOString() || doc.data().processedAt,
      } as ConsumptionRecord));
    } catch (error) {
      console.error('Error getting consumptions:', error);
      return [];
    }
  },

  saveConsumption: async (consumption: ConsumptionRecord): Promise<void> => {
    try {
      const consumptionRef = doc(db, COLLECTIONS.CONSUMPTIONS, consumption.id);
      await setDoc(consumptionRef, {
        ...consumption,
        orderDate: Timestamp.fromDate(new Date(consumption.orderDate)),
        processedAt: Timestamp.fromDate(new Date(consumption.processedAt)),
      });
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
      ];
      for (const coll of collections) {
        const snapshot = await getDocs(collection(db, coll));
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
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
};
