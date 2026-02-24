import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, Transaction, InventoryStats, BOMItem, Order, MaterialConsumption, BranchShortage, ConsumptionRecord, MaterialOrder, BranchNote } from '../types';
import { storage } from '../utils/storage';
import {
  HOUSING_CATEGORY,
  HOUSING_COLORS,
  HOUSING_SWITCHES,
  HOUSING_MATERIAL_CATEGORY,
  HOUSING_SHAPE_SWITCH_QUANTITY,
  getHousingProductList,
  getHousingCaseMaterialName,
  getHousingSwitchMaterialName,
  getHousingCaseMaterialId,
  getHousingSwitchMaterialId,
} from '../constants/inventory';

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [consumptions, setConsumptions] = useState<ConsumptionRecord[]>([]);
  const [materialOrders, setMaterialOrders] = useState<MaterialOrder[]>([]);
  const [branchNotes, setBranchNotes] = useState<BranchNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedItems, loadedTransactions, loadedBOM, loadedOrders, loadedConsumptions, loadedMaterialOrders, loadedBranchNotes] = await Promise.all([
        storage.getItemsAsync(),
        storage.getTransactionsAsync(),
        storage.getBOMAsync(),
        storage.getOrdersAsync(),
        storage.getConsumptionsAsync(),
        storage.getMaterialOrdersAsync(),
        storage.getBranchNotesAsync(),
      ]);
      setItems(loadedItems);
      setTransactions(loadedTransactions);
      setBomItems(loadedBOM);
      setOrders(loadedOrders);
      setConsumptions(loadedConsumptions);
      setMaterialOrders(loadedMaterialOrders);
      setBranchNotes(loadedBranchNotes);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: InventoryItem = { ...item, type: item.type || 'material', id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    await storage.saveItems(updatedItems);
    return newItem;
  }, [items]);

  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>) => {
    const updatedItems = items.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item);
    setItems(updatedItems);
    await storage.saveItems(updatedItems);
  }, [items]);

  const deleteItem = useCallback(async (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    await storage.saveItems(updatedItems);
  }, [items]);

  const processTransaction = useCallback(async (itemId: string, type: 'in' | 'out', quantity: number, reason: string, userId?: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) throw new Error('상품을 찾을 수 없습니다.');
    if (item.type === 'material' && type === 'out' && !reason.includes('자동 차감')) throw new Error('부자재는 직접 출고할 수 없습니다.');
    const newQuantity = type === 'in' ? item.quantity + quantity : item.quantity - quantity;
    if (newQuantity < 0) throw new Error('재고가 부족합니다.');
    const transaction: Transaction = { id: crypto.randomUUID(), itemId, type, quantity, reason, timestamp: new Date().toISOString(), userId };
    const updatedItems = items.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i);
    setItems(updatedItems);
    await storage.saveItems(updatedItems);
    const updatedTransactions = [...transactions, transaction];
    setTransactions(updatedTransactions);
    await storage.saveTransaction(transaction);
  }, [items, transactions]);
  
  const processStockCount = useCallback(async (counts: Map<string, number>, userId: string) => {
    const updatedItems = [...items];
    const newTransactions: Transaction[] = [];
    for (const [itemId, actualQuantity] of counts.entries()) {
      const itemIndex = updatedItems.findIndex(i => i.id === itemId);
      if (itemIndex === -1) continue;
      const item = updatedItems[itemIndex];
      const difference = actualQuantity - item.quantity;
      if (difference !== 0) {
        updatedItems[itemIndex] = { ...item, quantity: actualQuantity, updatedAt: new Date().toISOString() };
        newTransactions.push({ id: crypto.randomUUID(), itemId, type: difference > 0 ? 'in' : 'out', quantity: Math.abs(difference), reason: '재고 실사', timestamp: new Date().toISOString(), userId });
      }
    }
    setItems(updatedItems);
    setTransactions(prev => [...prev, ...newTransactions]);
    await storage.saveItems(updatedItems);
    await Promise.all(newTransactions.map(t => storage.saveTransaction(t)));
  }, [items]);

  const saveBOMForFinishedItem = useCallback(async (finishedItemId: string, bomList: Omit<BOMItem, 'id'>[]) => {
    const filteredBOM = bomItems.filter(bom => bom.finishedItemId !== finishedItemId);
    const newBOMItems: BOMItem[] = bomList.map(bom => ({ ...bom, finishedItemId, id: crypto.randomUUID() }));
    const updatedBOM = [...filteredBOM, ...newBOMItems];
    setBomItems(updatedBOM);
    await storage.saveBOM(updatedBOM);
  }, [bomItems]);

  const getBOMByFinishedItem = useCallback((finishedItemId: string): BOMItem[] => {
    return bomItems.filter(bom => bom.finishedItemId === finishedItemId);
  }, [bomItems]);

  const addOrder = useCallback(async (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    const newOrder: Order = { ...order, id: crypto.randomUUID(), status: 'pending', createdAt: new Date().toISOString() };
    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    await storage.saveOrder(newOrder);
    return newOrder;
  }, [orders]);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, ...updates } : o);
    setOrders(updatedOrders);
    await storage.updateOrder(orderId, updates);
  }, [orders]);

  const addMaterialOrder = useCallback(async (order: Omit<MaterialOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newOrder: MaterialOrder = { ...order, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    const updatedOrders = [...materialOrders, newOrder];
    setMaterialOrders(updatedOrders);
    await storage.saveMaterialOrder(newOrder);
    return newOrder;
  }, [materialOrders]);

  const updateMaterialOrder = useCallback(async (orderId: string, updates: Partial<MaterialOrder>) => {
    const updatedOrders = materialOrders.map(order => order.id === orderId ? { ...order, ...updates } : order);
    setMaterialOrders(updatedOrders);
    await storage.updateMaterialOrder(orderId, updates);
  }, [materialOrders]);

  const deleteMaterialOrder = useCallback(async (orderId: string) => {
    setMaterialOrders(prev => prev.filter(order => order.id !== orderId));
    await storage.deleteMaterialOrder(orderId);
  }, []);

  const saveBranchNote = useCallback(async (note: BranchNote) => {
    setBranchNotes(prev => {
      const index = prev.findIndex(n => n.id === note.id || n.branchName === note.branchName);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = note;
        return updated;
      }
      return [...prev, note];
    });
    await storage.saveBranchNote(note);
  }, []);

  const shipOrder = useCallback(async (orderId: string, shippedQuantity: number, shippedBy: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const getItemName = (itemId: string) => items.find(i => i.id === itemId)?.name || '알 수 없음';
    const shippedAt = new Date().toISOString();
    const finishedItem = items.find(i => i.id === order.finishedItemId);
    if (!finishedItem) throw new Error('완성재고를 찾을 수 없습니다.');
    if (finishedItem.quantity < shippedQuantity) throw new Error(`완성재고가 부족합니다. (필요: ${shippedQuantity}, 현재: ${finishedItem.quantity})`);
    const bomForItem = getBOMByFinishedItem(order.finishedItemId);
    const materialShortages: string[] = [];
    bomForItem.forEach(bom => {
      const material = items.find(item => item.id === bom.materialItemId);
      if (!material) return;
      const consumedQuantity = bom.quantity * shippedQuantity;
      if (material.quantity < consumedQuantity) materialShortages.push(`${material.name} (필요: ${consumedQuantity}, 현재: ${material.quantity})`);
    });
    if (materialShortages.length > 0) throw new Error(`부자재가 부족합니다:\n${materialShortages.join('\n')}`);
    await updateOrder(orderId, { status: 'shipping', shippedAt, shippedBy, shippedQuantity, processedAt: shippedAt, processedBy: shippedBy });
    const newFinishedQuantity = finishedItem.quantity - shippedQuantity;
    await updateItem(order.finishedItemId, { quantity: newFinishedQuantity });
    const finishedTransaction: Transaction = { id: crypto.randomUUID(), itemId: order.finishedItemId, type: 'out', quantity: shippedQuantity, reason: `지점 출고 (${order.branchName})`, timestamp: shippedAt, userId: shippedBy };
    setTransactions(prev => [...prev, finishedTransaction]);
    await storage.saveTransaction(finishedTransaction);
    const finishedConsumption: ConsumptionRecord = { id: crypto.randomUUID(), orderId: order.id, itemId: order.finishedItemId, itemType: 'finished', quantity: shippedQuantity, branchName: order.branchName, orderDate: order.orderDate, processedAt: shippedAt, processedBy: shippedBy };
    setConsumptions(prev => [...prev, finishedConsumption]);
    await storage.saveConsumption(finishedConsumption);
    for (const bom of bomForItem) {
      const material = items.find(item => item.id === bom.materialItemId);
      if (!material) continue;
      const consumedQuantity = bom.quantity * shippedQuantity;
      const newMaterialQuantity = material.quantity - consumedQuantity;
      await updateItem(bom.materialItemId, { quantity: newMaterialQuantity });
      const materialTransaction: Transaction = { id: crypto.randomUUID(), itemId: bom.materialItemId, type: 'out', quantity: consumedQuantity, reason: `완성재고 출고 자동 차감 (${getItemName(order.finishedItemId)} ${shippedQuantity}개)`, timestamp: shippedAt, userId: shippedBy };
      setTransactions(prev => [...prev, materialTransaction]);
      await storage.saveTransaction(materialTransaction);
      const materialConsumption: ConsumptionRecord = { id: crypto.randomUUID(), orderId: order.id, itemId: bom.materialItemId, itemType: 'material', quantity: consumedQuantity, branchName: order.branchName, orderDate: order.orderDate, processedAt: shippedAt, processedBy: shippedBy, finishedItemId: order.finishedItemId };
      setConsumptions(prev => [...prev, materialConsumption]);
      await storage.saveConsumption(materialConsumption);
    }
  }, [orders, items, getBOMByFinishedItem, updateOrder, updateItem]);

  const receiveOrder = useCallback(async (orderId: string, receivedBy: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const receivedAt = new Date().toISOString();
    await updateOrder(orderId, { status: 'received', receivedAt, receivedBy });
  }, [orders, updateOrder]);

  const completeOrder = useCallback(async (orderId: string, completedBy: string) => {
    await updateOrder(orderId, { status: 'completed', processedAt: new Date().toISOString(), processedBy: completedBy });
  }, [updateOrder]);

  const calculateMaterialConsumption = useCallback((finishedItemId: string, quantity: number): MaterialConsumption[] => {
    const bomForItem = getBOMByFinishedItem(finishedItemId);
    if (bomForItem.length === 0) return [];
    const results: MaterialConsumption[] = [];
    bomForItem.forEach(bom => {
      const material = items.find(item => item.id === bom.materialItemId);
      if (!material) return;
      const requiredQuantity = bom.quantity * quantity;
      const shortage = material.quantity - requiredQuantity;
      results.push({ materialItemId: material.id, materialName: material.name, requiredQuantity, availableQuantity: material.quantity, shortage: shortage < 0 ? Math.abs(shortage) : 0, isShortage: shortage < 0 });
    });
    return results;
  }, [items, getBOMByFinishedItem]);

  const calculateAllMaterialConsumption = useCallback((): MaterialConsumption[] => {
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const materialMap = new Map<string, MaterialConsumption>();
    pendingOrders.forEach(order => {
      const consumptions = calculateMaterialConsumption(order.finishedItemId, order.quantity);
      consumptions.forEach(consumption => {
        const existing = materialMap.get(consumption.materialItemId);
        if (existing) {
          existing.requiredQuantity += consumption.requiredQuantity;
          existing.shortage = Math.max(0, existing.requiredQuantity - existing.availableQuantity);
          existing.isShortage = existing.shortage > 0;
        } else {
          materialMap.set(consumption.materialItemId, { ...consumption });
        }
      });
    });
    return Array.from(materialMap.values());
  }, [orders, calculateMaterialConsumption]);

  const calculateBranchShortages = useCallback((): BranchShortage[] => {
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const branchMap = new Map<string, BranchShortage>();
    pendingOrders.forEach(order => {
      if (!branchMap.has(order.branchName)) branchMap.set(order.branchName, { branchName: order.branchName, shortages: [], orders: [], totalShortageCount: 0 });
      const branchShortage = branchMap.get(order.branchName)!;
      branchShortage.orders.push(order);
      const consumptions = calculateMaterialConsumption(order.finishedItemId, order.quantity);
      consumptions.forEach(consumption => {
        if (consumption.isShortage) {
          const existing = branchShortage.shortages.find(s => s.materialItemId === consumption.materialItemId);
          if (existing) {
            existing.requiredQuantity += consumption.requiredQuantity;
            existing.shortage = Math.max(0, existing.requiredQuantity - existing.availableQuantity);
          } else {
            branchShortage.shortages.push({ materialItemId: consumption.materialItemId, materialName: consumption.materialName, requiredQuantity: consumption.requiredQuantity, availableQuantity: consumption.availableQuantity, shortage: consumption.shortage });
          }
        }
      });
    });
    branchMap.forEach(branch => { branch.totalShortageCount = branch.shortages.length; });
    return Array.from(branchMap.values()).filter(branch => branch.totalShortageCount > 0);
  }, [orders, calculateMaterialConsumption]);

  const getStats = useCallback((): InventoryStats => ({
    totalItems: items.length,
    lowStockItems: items.filter(item => item.quantity <= item.minQuantity).length,
    totalValue: items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
    recentTransactions: transactions.filter(t => new Date(t.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
    finishedItems: items.filter(item => item.type === 'finished').length,
    materialItems: items.filter(item => item.type === 'material').length,
    pendingOrders: orders.filter(order => order.status === 'pending').length,
  }), [items, transactions, orders]);

  /** 기존 하우징 완성재고 삭제 후 컬러×스위치×형태 60종 일괄 생성 */
  const seedHousingItems = useCallback(async () => {
    const nonHousing = items.filter(i => !(i.category === HOUSING_CATEGORY && i.type === 'finished'));
    const now = new Date().toISOString();
    const productList = getHousingProductList();
    const newItems: InventoryItem[] = productList.map((p, idx) => ({
      id: `housing-${idx}`,
      name: p.name,
      category: HOUSING_CATEGORY,
      type: 'finished',
      quantity: 0,
      minQuantity: 0,
      maxQuantity: 9999,
      unit: '개',
      price: 0,
      location: '',
      description: '',
      createdAt: now,
      updatedAt: now,
    }));
    const updatedItems = [...nonHousing, ...newItems];
    setItems(updatedItems);
    await storage.saveItems(updatedItems);
  }, [items]);

  /** 하우징 BOM용 부자재 9종(케이스 5 + 스위치 4) 생성. 이미 있으면 건너뜀 */
  const seedHousingMaterials = useCallback(async () => {
    const now = new Date().toISOString();
    const base: Omit<InventoryItem, 'id' | 'name' | 'category'> = {
      type: 'material',
      quantity: 0,
      minQuantity: 0,
      maxQuantity: 9999,
      unit: '개',
      price: 0,
      location: '',
      description: '',
      createdAt: now,
      updatedAt: now,
    };
    const toAdd: InventoryItem[] = [];
    for (const color of HOUSING_COLORS) {
      const id = getHousingCaseMaterialId(color);
      if (!items.some(i => i.id === id)) {
        toAdd.push({ ...base, id, name: getHousingCaseMaterialName(color), category: HOUSING_MATERIAL_CATEGORY });
      }
    }
    for (const sw of HOUSING_SWITCHES) {
      const id = getHousingSwitchMaterialId(sw);
      if (!items.some(i => i.id === id)) {
        toAdd.push({ ...base, id, name: getHousingSwitchMaterialName(sw), category: HOUSING_MATERIAL_CATEGORY });
      }
    }
    if (toAdd.length === 0) return;
    const updatedItems = [...items, ...toAdd];
    setItems(updatedItems);
    await storage.saveItems(updatedItems);
  }, [items]);

  /** 하우징 60종에 BOM 설정: 케이스 1개 + 스위치(형태별 2/4개). 부자재 없으면 먼저 시드 */
  const seedBOMForHousing = useCallback(async () => {
    await seedHousingMaterials();
    const housingItems = items
      .filter(i => i.type === 'finished' && i.category === HOUSING_CATEGORY)
      .sort((a, b) => {
        const idxA = parseInt(a.id.replace('housing-', ''), 10) || 0;
        const idxB = parseInt(b.id.replace('housing-', ''), 10) || 0;
        return idxA - idxB;
      });
    const productList = getHousingProductList();
    const otherBOM = bomItems.filter(bom => !housingItems.some(h => h.id === bom.finishedItemId));
    const newBOM: BOMItem[] = [];
    for (let idx = 0; idx < housingItems.length && idx < productList.length; idx++) {
      const finishedItemId = housingItems[idx].id;
      const product = productList[idx];
      const switchQty = HOUSING_SHAPE_SWITCH_QUANTITY[product.shape];
      const caseId = getHousingCaseMaterialId(product.color);
      const switchId = getHousingSwitchMaterialId(product.switch);
      newBOM.push(
        { id: crypto.randomUUID(), finishedItemId, materialItemId: caseId, quantity: 1 },
        { id: crypto.randomUUID(), finishedItemId, materialItemId: switchId, quantity: switchQty },
      );
    }
    const updatedBOM = [...otherBOM, ...newBOM];
    setBomItems(updatedBOM);
    await storage.saveBOM(updatedBOM);
  }, [items, bomItems, seedHousingMaterials]);

  return {
    items, transactions, bomItems, orders, materialOrders, branchNotes, loading, addItem, updateItem, deleteItem, processTransaction, processStockCount, saveBOMForFinishedItem, getBOMByFinishedItem, addOrder, updateOrder, addMaterialOrder, updateMaterialOrder, deleteMaterialOrder, saveBranchNote, calculateMaterialConsumption, calculateAllMaterialConsumption, calculateBranchShortages, consumptions, shipOrder, receiveOrder, completeOrder, getStats, seedHousingItems, seedHousingMaterials, seedBOMForHousing, refresh: loadData,
  };
};