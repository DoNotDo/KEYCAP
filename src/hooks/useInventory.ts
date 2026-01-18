import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, Transaction, InventoryStats, BOMItem, Order, MaterialConsumption, ItemType, BranchShortage, ConsumptionRecord, MaterialOrder, BranchNote } from '../types';
import { storage } from '../utils/storage';

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [consumptions, setConsumptions] = useState<ConsumptionRecord[]>([]);
  const [materialOrders, setMaterialOrders] = useState<MaterialOrder[]>([]);
  const [branchNotes, setBranchNotes] = useState<BranchNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Firebase에서 데이터 로드 (비동기)
      const loadedItems = await storage.getItemsAsync();
      const loadedTransactions = await storage.getTransactionsAsync();
      const loadedBOM = await storage.getBOMAsync();
      const loadedOrders = await storage.getOrdersAsync();
      const loadedConsumptions = await storage.getConsumptionsAsync();
      const loadedMaterialOrders = await storage.getMaterialOrdersAsync();
      const loadedBranchNotes = await storage.getBranchNotesAsync();
      setItems(loadedItems);
      setTransactions(loadedTransactions);
      setBomItems(loadedBOM);
      setOrders(loadedOrders);
      setConsumptions(loadedConsumptions);
      setMaterialOrders(loadedMaterialOrders);
      setBranchNotes(loadedBranchNotes);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      // 오류 발생 시 캐시된 데이터 사용
      const loadedItems = storage.getItems();
      const loadedTransactions = storage.getTransactions();
      const loadedBOM = storage.getBOM();
      const loadedOrders = storage.getOrders();
      const loadedConsumptions = storage.getConsumptions();
      const loadedMaterialOrders = storage.getMaterialOrders();
      const loadedBranchNotes = storage.getBranchNotes();
      setItems(loadedItems);
      setTransactions(loadedTransactions);
      setBomItems(loadedBOM);
      setOrders(loadedOrders);
      setConsumptions(loadedConsumptions);
      setMaterialOrders(loadedMaterialOrders);
      setBranchNotes(loadedBranchNotes);
    } finally {
      setLoading(false);
    }
  };

  const addItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      type: item.type || 'material', // 기본값 설정
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    await storage.saveItems(updatedItems);
    return newItem;
  }, [items]);

  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>) => {
    const updatedItems = items.map(item =>
      item.id === id
        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
        : item
    );
    setItems(updatedItems);
    await storage.saveItems(updatedItems);
  }, [items]);

  const deleteItem = useCallback(async (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    await storage.saveItems(updatedItems);
  }, [items]);

  const processTransaction = useCallback(async (
    itemId: string,
    type: 'in' | 'out',
    quantity: number,
    reason: string
  ) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // 부자재는 출고 불가
    if (item.type === 'material' && type === 'out') {
      throw new Error('부자재는 출고할 수 없습니다. 부자재 출고는 완성재고 출고 시 자동으로 계산됩니다.');
    }

    const newQuantity = type === 'in'
      ? item.quantity + quantity
      : item.quantity - quantity;

    if (newQuantity < 0) {
      throw new Error('재고가 부족합니다.');
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      itemId,
      type,
      quantity,
      reason,
      timestamp: new Date().toISOString(),
    };

    await updateItem(itemId, { quantity: newQuantity });
    const updatedTransactions = [...transactions, transaction];
    setTransactions(updatedTransactions);
    await storage.saveTransaction(transaction);
  }, [items, transactions, updateItem]);

  // BOM 관리
  const addBOMItem = useCallback(async (bomItem: Omit<BOMItem, 'id'>) => {
    const newBOMItem: BOMItem = {
      ...bomItem,
      id: crypto.randomUUID(),
    };
    const updatedBOM = [...bomItems, newBOMItem];
    setBomItems(updatedBOM);
    await storage.saveBOM(updatedBOM);
    return newBOMItem;
  }, [bomItems]);

  const saveBOMForFinishedItem = useCallback(async (finishedItemId: string, bomList: Omit<BOMItem, 'id'>[]) => {
    console.log('saveBOMForFinishedItem 호출:', { finishedItemId, bomList });
    
    // 기존 BOM 삭제
    const filteredBOM = bomItems.filter(bom => bom.finishedItemId !== finishedItemId);
    
    // 새 BOM 추가 (finishedItemId가 없으면 추가)
    const newBOMItems: BOMItem[] = bomList.map(bom => ({
      ...bom,
      finishedItemId: bom.finishedItemId || finishedItemId, // finishedItemId가 없으면 파라미터로 받은 값 사용
      id: crypto.randomUUID(),
    }));
    
    const updatedBOM = [...filteredBOM, ...newBOMItems];
    console.log('BOM 업데이트:', { 
      기존개수: bomItems.length, 
      삭제후개수: filteredBOM.length, 
      새로추가: newBOMItems.length,
      최종개수: updatedBOM.length 
    });
    
    setBomItems(updatedBOM);
    await storage.saveBOM(updatedBOM);
    
    // 저장 확인
    const savedBOM = storage.getBOM();
    console.log('저장된 BOM 확인:', savedBOM.filter(b => b.finishedItemId === finishedItemId));
  }, [bomItems]);

  const updateBOMItem = useCallback(async (id: string, updates: Partial<BOMItem>) => {
    const updatedBOM = bomItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    setBomItems(updatedBOM);
    await storage.saveBOM(updatedBOM);
  }, [bomItems]);

  const deleteBOMItem = useCallback(async (id: string) => {
    const updatedBOM = bomItems.filter(item => item.id !== id);
    setBomItems(updatedBOM);
    await storage.saveBOM(updatedBOM);
  }, [bomItems]);

  const getBOMByFinishedItem = useCallback((finishedItemId: string): BOMItem[] => {
    const result = bomItems.filter(bom => bom.finishedItemId === finishedItemId);
    console.log(`getBOMByFinishedItem 호출: ${finishedItemId}`, { 
      전체BOM개수: bomItems.length, 
      해당완성재고BOM개수: result.length,
      BOM목록: result 
    });
    return result;
  }, [bomItems]);

  // 주문 관리
  const addOrder = useCallback(async (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    const newOrder: Order = {
      ...order,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    await storage.saveOrder(newOrder);
    return newOrder;
  }, [orders]);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>, processedBy?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedOrders = orders.map(o =>
      o.id === orderId ? { ...o, ...updates } : o
    );
    setOrders(updatedOrders);
    await storage.updateOrder(orderId, updates);
  }, [orders]);

  // 부자재 발주 관리
  const addMaterialOrder = useCallback(async (order: Omit<MaterialOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newOrder: MaterialOrder = {
      ...order,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    const updatedOrders = [...materialOrders, newOrder];
    setMaterialOrders(updatedOrders);
    await storage.saveMaterialOrder(newOrder);
    return newOrder;
  }, [materialOrders]);

  const updateMaterialOrder = useCallback(async (orderId: string, updates: Partial<MaterialOrder>) => {
    const updatedOrders = materialOrders.map(order =>
      order.id === orderId ? { ...order, ...updates } : order
    );
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

  // 출고 처리
  const shipOrder = useCallback(async (orderId: string, shippedQuantity: number, shippedBy: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const getItemName = (itemId: string) => {
      return items.find(i => i.id === itemId)?.name || '알 수 없음';
    };

    const shippedAt = new Date().toISOString();
    
    // 완성재고 재고 확인
    const finishedItem = items.find(i => i.id === order.finishedItemId);
    if (!finishedItem) {
      throw new Error('완성재고를 찾을 수 없습니다.');
    }

    if (finishedItem.quantity < shippedQuantity) {
      throw new Error(`완성재고가 부족합니다. (필요: ${shippedQuantity}, 현재: ${finishedItem.quantity})`);
    }

    // 부자재 재고 확인
    const bomForItem = getBOMByFinishedItem(order.finishedItemId);
    const materialShortages: string[] = [];
    
    bomForItem.forEach(bom => {
      const material = items.find(item => item.id === bom.materialItemId);
      if (!material) return;
      
      const consumedQuantity = bom.quantity * shippedQuantity;
      if (material.quantity < consumedQuantity) {
        materialShortages.push(`${material.name} (필요: ${consumedQuantity}, 현재: ${material.quantity})`);
      }
    });

    if (materialShortages.length > 0) {
      throw new Error(`부자재가 부족합니다:\n${materialShortages.join('\n')}`);
    }

    // 모든 재고가 충분하면 출고 처리
    await updateOrder(orderId, {
      status: 'shipping',
      shippedAt,
      shippedBy,
      shippedQuantity,
      processedAt: shippedAt,
      processedBy: shippedBy,
    });

    // 완성재고 재고 차감
    const newFinishedQuantity = finishedItem.quantity - shippedQuantity;
    await updateItem(order.finishedItemId, { quantity: newFinishedQuantity });
    
    // 완성재고 출고 거래 내역 기록
    const finishedTransaction: Transaction = {
      id: crypto.randomUUID(),
      itemId: order.finishedItemId,
      type: 'out',
      quantity: shippedQuantity,
      reason: `지점 출고 (${order.branchName})`,
      timestamp: shippedAt,
      userId: shippedBy,
    };
    const updatedTransactions = [...transactions, finishedTransaction];
    setTransactions(updatedTransactions);
    await storage.saveTransaction(finishedTransaction);
    
    // 완성재고 소모 내역 기록
    const finishedConsumption: ConsumptionRecord = {
      id: crypto.randomUUID(),
      orderId: order.id,
      itemId: order.finishedItemId,
      itemType: 'finished',
      quantity: shippedQuantity,
      branchName: order.branchName,
      orderDate: order.orderDate,
      processedAt: shippedAt,
      processedBy: shippedBy,
    };
    setConsumptions(prev => [...prev, finishedConsumption]);
    await storage.saveConsumption(finishedConsumption);

    // 부자재 자동 차감 및 기록
    for (const bom of bomForItem) {
      const material = items.find(item => item.id === bom.materialItemId);
      if (!material) continue;

      const consumedQuantity = bom.quantity * shippedQuantity;
      const newMaterialQuantity = material.quantity - consumedQuantity;
      
      // 부자재 재고 자동 차감
      await updateItem(bom.materialItemId, { quantity: newMaterialQuantity });
      
      // 부자재 출고 거래 내역 기록 (자동 차감)
      const materialTransaction: Transaction = {
        id: crypto.randomUUID(),
        itemId: bom.materialItemId,
        type: 'out',
        quantity: consumedQuantity,
        reason: `완성재고 출고 자동 차감 (${getItemName(order.finishedItemId)} ${shippedQuantity}개)`,
        timestamp: shippedAt,
        userId: shippedBy,
      };
      setTransactions(prev => {
        const newTransactions = [...prev, materialTransaction];
        return newTransactions;
      });
      await storage.saveTransaction(materialTransaction);
      
      // 부자재 소모 내역 기록
      const materialConsumption: ConsumptionRecord = {
        id: crypto.randomUUID(),
        orderId: order.id,
        itemId: bom.materialItemId,
        itemType: 'material',
        quantity: consumedQuantity,
        branchName: order.branchName,
        orderDate: order.orderDate,
        processedAt: shippedAt,
        processedBy: shippedBy,
        finishedItemId: order.finishedItemId, // 어떤 완성재고에 쓰였는지
      };
      setConsumptions(prev => [...prev, materialConsumption]);
      await storage.saveConsumption(materialConsumption);
    }
  }, [orders, items, transactions, updateOrder, updateItem, getBOMByFinishedItem]);

  // 입고 처리
  const receiveOrder = useCallback(async (orderId: string, receivedBy: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const receivedAt = new Date().toISOString();
    await updateOrder(orderId, {
      status: 'received',
      receivedAt,
      receivedBy,
    });
  }, [orders, updateOrder]);

  // 완료 처리
  const completeOrder = useCallback(async (orderId: string, completedBy: string) => {
    await updateOrder(orderId, {
      status: 'completed',
      processedAt: new Date().toISOString(),
      processedBy: completedBy,
    });
  }, [updateOrder]);

  // 부자재 소모량 계산
  const calculateMaterialConsumption = useCallback((
    finishedItemId: string,
    quantity: number
  ): MaterialConsumption[] => {
    const bomForItem = getBOMByFinishedItem(finishedItemId);
    console.log('calculateMaterialConsumption 호출:', { finishedItemId, quantity, bomCount: bomForItem.length, bomItems: bomForItem });
    
    const results: MaterialConsumption[] = [];

    if (bomForItem.length === 0) {
      console.warn(`BOM이 설정되지 않은 완성재고입니다: ${finishedItemId}`);
      return results;
    }

    bomForItem.forEach(bom => {
      const material = items.find(item => item.id === bom.materialItemId);
      if (!material) {
        console.warn(`부자재를 찾을 수 없습니다: ${bom.materialItemId}`);
        return;
      }

      const requiredQuantity = bom.quantity * quantity;
      const availableQuantity = material.quantity;
      const shortage = availableQuantity - requiredQuantity;
      const isShortage = shortage < 0;

      results.push({
        materialItemId: material.id,
        materialName: material.name,
        requiredQuantity,
        availableQuantity,
        shortage: isShortage ? Math.abs(shortage) : 0,
        isShortage,
      });
    });

    console.log('계산 결과:', results);
    return results;
  }, [items, getBOMByFinishedItem]);

  // 모든 주문에 대한 부자재 소모량 계산
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

  // 지점별 재고 부족 계산
  const calculateBranchShortages = useCallback((): BranchShortage[] => {
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const branchMap = new Map<string, BranchShortage>();

    pendingOrders.forEach(order => {
      if (!branchMap.has(order.branchName)) {
        branchMap.set(order.branchName, {
          branchName: order.branchName,
          shortages: [],
          orders: [],
          totalShortageCount: 0,
        });
      }

      const branchShortage = branchMap.get(order.branchName)!;
      branchShortage.orders.push(order);

      const consumptions = calculateMaterialConsumption(order.finishedItemId, order.quantity);
      
      consumptions.forEach(consumption => {
        if (consumption.isShortage) {
          const existing = branchShortage.shortages.find(
            s => s.materialItemId === consumption.materialItemId
          );
          
          if (existing) {
            existing.requiredQuantity += consumption.requiredQuantity;
            existing.shortage = Math.max(0, existing.requiredQuantity - existing.availableQuantity);
          } else {
            branchShortage.shortages.push({
              materialItemId: consumption.materialItemId,
              materialName: consumption.materialName,
              requiredQuantity: consumption.requiredQuantity,
              availableQuantity: consumption.availableQuantity,
              shortage: consumption.shortage,
            });
          }
        }
      });
    });

    // 총 부족 개수 계산
    branchMap.forEach(branch => {
      branch.totalShortageCount = branch.shortages.length;
    });

    return Array.from(branchMap.values()).filter(branch => branch.totalShortageCount > 0);
  }, [orders, calculateMaterialConsumption]);

  const getStats = useCallback((): InventoryStats => {
    const lowStockItems = items.filter(item => item.quantity <= item.minQuantity).length;
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const recentTransactions = transactions.filter(
      t => new Date(t.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    const finishedItems = items.filter(item => item.type === 'finished').length;
    const materialItems = items.filter(item => item.type === 'material').length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;

    return {
      totalItems: items.length,
      lowStockItems,
      totalValue,
      recentTransactions,
      finishedItems,
      materialItems,
      pendingOrders,
    };
  }, [items, transactions, orders]);

  return {
    items,
    transactions,
    bomItems,
    orders,
    materialOrders,
    branchNotes,
    loading,
    addItem,
    updateItem,
    deleteItem,
    processTransaction,
    addBOMItem,
    updateBOMItem,
    deleteBOMItem,
    saveBOMForFinishedItem,
    getBOMByFinishedItem,
    addOrder,
    updateOrder,
    addMaterialOrder,
    updateMaterialOrder,
    deleteMaterialOrder,
    saveBranchNote,
    calculateMaterialConsumption,
    calculateAllMaterialConsumption,
    calculateBranchShortages,
    consumptions,
    shipOrder,
    receiveOrder,
    completeOrder,
    getStats,
    refresh: loadData,
  };
};
