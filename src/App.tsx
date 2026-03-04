import { useState, useEffect, useMemo, useRef } from 'react';
import { useInventory } from './hooks/useInventory';
import { InventoryItem, BOMItem, User, BranchShortage, Order, MaterialOrder } from './types';
import { StatsCard } from './components/StatsCard';
import { ItemForm } from './components/ItemForm';
import { TransactionModal } from './components/TransactionModal';
import { InventoryTable } from './components/InventoryTable';
import { BOMForm } from './components/BOMForm';
import { MaterialConsumptionPanel } from './components/MaterialConsumptionPanel';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { BranchShortageDetail } from './components/BranchShortageDetail';
import { OrderDetailModal } from './components/OrderDetailModal';
import { TabNavigation } from './components/TabNavigation';
import { StatsDetailModal } from './components/StatsDetailModal';
import { BOMReceipt } from './components/BOMReceipt';
import { BOMByMaterialEditor } from './components/BOMByMaterialEditor';
import { ConsumptionHistory } from './components/ConsumptionHistory';
import { ItemDetailModal } from './components/ItemDetailModal';
import { MaterialOrderManagement } from './components/MaterialOrderManagement';
import { MaterialOrderSummary } from './components/MaterialOrderSummary';
import { MaterialInventoryByCategory } from './components/MaterialInventoryByCategory';
import { OrderVendorsAndSchedule } from './components/OrderVendorsAndSchedule';
import { WeeklyShipmentPanel } from './components/WeeklyShipmentPanel';
import { VendorMaterialEditor } from './components/VendorMaterialEditor';
import { BRANCH_LIST } from './constants/branches';
import { HOUSING_CATEGORY, HOUSING_COLORS, HOUSING_SWITCHES, HOUSING_SHAPES } from './constants/inventory';
import { PRODUCT_LINE_ALL, PRODUCT_LINES } from './constants/productLines';
import { fetchCatalogItems, mapCatalogToInventoryItem } from './utils/catalog';
import { auth } from './utils/auth';
import { Plus, Search, Package, AlertTriangle, DollarSign, Activity, ShoppingCart, LogOut, Users, FileText, LayoutDashboard, Box, Wrench, MapPin } from 'lucide-react';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedBranchShortage, setSelectedBranchShortage] = useState<BranchShortage | undefined>();

  useEffect(() => {
    const initAuth = async () => {
      await auth.initialize();
      const user = auth.getCurrentUser();
      setCurrentUser(user);
    };
    initAuth();
  }, []);
  const {
    items,
    transactions,
    bomItems,
    orders,
    materialOrders,
    loading,
    addItem,
    updateItem,
    deleteItem,
    processTransaction,
    saveBOMForFinishedItem,
    getBOMByFinishedItem,
    getBOMByMaterial,
    saveBOMByMaterial,
    addMaterialOrder,
    updateMaterialOrder,
    deleteMaterialOrder,
    calculateMaterialConsumption,
    calculateAllMaterialConsumption,
    calculateBranchShortages,
    consumptions,
    getStats,
    seedHousingItems,
    seedBOMForHousing,
    seedOptionalMaterials,
    getItemEditLogsByItem,
    getMaterialIdsBySupplier,
    setVendorMaterialsForSupplier,
  } = useInventory();

  const [selectedProductLine, setSelectedProductLine] = useState<string>(PRODUCT_LINE_ALL);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBOMForm, setShowBOMForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const [transactionItem, setTransactionItem] = useState<InventoryItem | undefined>();
  const [bomItem, setBomItem] = useState<InventoryItem | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>();
  const [primaryTab, setPrimaryTab] = useState<'dashboard' | 'inventory' | 'bom' | 'orders'>('dashboard');
  const [inventoryTab, setInventoryTab] = useState<'finished' | 'material'>('finished');
  const [orderTab, setOrderTab] = useState<'material-summary' | 'material-detail' | 'vendors'>('material-detail');
  const [selectedStatsType, setSelectedStatsType] = useState<'totalItems' | 'lowStock' | 'totalValue' | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | undefined>();
  const [finishedCategoryFilter, setFinishedCategoryFilter] = useState<string>('all');
  const [housingColorFilter, setHousingColorFilter] = useState<string>('all');
  const [housingSwitchFilter, setHousingSwitchFilter] = useState<string>('all');
  const [housingShapeFilter, setHousingShapeFilter] = useState<string>('all');
  const [bomViewMode, setBomViewMode] = useState<'finished' | 'material'>('finished');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin';
  const hasSeededHousingRef = useRef(false);
  const hasSeededBOMRef = useRef(false);

  // URL ?seedHousing=1 로 접속 시 관리자일 때 하우징 60종 자동 생성 (한 번만)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('seedHousing') !== '1' || !currentUser || !isAdmin || hasSeededHousingRef.current) return;
    hasSeededHousingRef.current = true;
    seedHousingItems().then(() => {
      window.history.replaceState({}, '', window.location.pathname + window.location.hash || '');
    });
  }, [currentUser, isAdmin, seedHousingItems]);

  // URL ?seedBOM=1 로 접속 시 관리자일 때 하우징 60종 BOM 자동 설정 (한 번만)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('seedBOM') !== '1' || !currentUser || !isAdmin || hasSeededBOMRef.current) return;
    hasSeededBOMRef.current = true;
    seedBOMForHousing().then(() => {
      window.history.replaceState({}, '', window.location.pathname + window.location.hash || '');
    });
  }, [currentUser, isAdmin, seedBOMForHousing]);

  const getItemProductLine = (item: InventoryItem) => item.productLine || '하우징';
  const lineItemIds = useMemo(() => {
    if (selectedProductLine === PRODUCT_LINE_ALL) return new Set(items.map(i => i.id));
    return new Set(items.filter(i => getItemProductLine(i) === selectedProductLine).map(i => i.id));
  }, [items, selectedProductLine]);
  const itemsForLine = useMemo(() => {
    if (selectedProductLine === PRODUCT_LINE_ALL) return items;
    return items.filter(i => getItemProductLine(i) === selectedProductLine);
  }, [items, selectedProductLine]);
  const ordersForLine = useMemo(() => orders.filter(o => lineItemIds.has(o.finishedItemId)), [orders, lineItemIds]);
  const materialOrdersForLine = useMemo(() => materialOrders.filter(mo => lineItemIds.has(mo.materialItemId)), [materialOrders, lineItemIds]);
  const bomItemsForLine = useMemo(() => bomItems.filter(b => lineItemIds.has(b.finishedItemId)), [bomItems, lineItemIds]);
  const suppliersFromOrders = useMemo(() => {
    const set = new Set(materialOrdersForLine.map(o => o.supplier).filter((s): s is string => Boolean(s)));
    return Array.from(set).sort();
  }, [materialOrdersForLine]);

  const stats = useMemo(() => getStats(), [items, transactions, orders]);
  const finishedItems = useMemo(() => itemsForLine.filter(item => item.type === 'finished'), [itemsForLine]);
  const materialItems = useMemo(() => itemsForLine.filter(item => item.type === 'material'), [itemsForLine]);
  const branchName = currentUser?.branchName;
  const branchItems = useMemo(() => {
    const base = selectedProductLine === PRODUCT_LINE_ALL ? items : itemsForLine;
    if (isAdmin) return base;
    return base.filter(item => item.branchName === branchName);
  }, [items, itemsForLine, selectedProductLine, isAdmin, branchName]);
  const branchFinishedItems = useMemo(() => branchItems.filter(item => item.type === 'finished'), [branchItems]);
  const branchMaterialItems = useMemo(() => branchItems.filter(item => item.type === 'material'), [branchItems]);
  const currentFinishedList = isAdmin ? finishedItems : branchFinishedItems;
  const finishedCategoriesList = useMemo(() => {
    const set = new Set(currentFinishedList.map(i => i.category).filter(Boolean));
    return Array.from(set).sort();
  }, [currentFinishedList]);
  const filteredFinishedItems = useMemo(() => {
    let list = currentFinishedList;
    if (finishedCategoryFilter !== 'all') {
      list = list.filter(i => i.category === finishedCategoryFilter);
      if (finishedCategoryFilter === HOUSING_CATEGORY) {
        if (housingColorFilter !== 'all') list = list.filter(i => i.name.includes(housingColorFilter));
        if (housingSwitchFilter !== 'all') list = list.filter(i => i.name.includes(housingSwitchFilter));
        if (housingShapeFilter !== 'all') {
          const shape = housingShapeFilter;
          list = list.filter(i => {
            if (shape === '정사각4구') return i.name.includes('정사각');
            if (shape === '직사각4구') return i.name.includes('직사각') && (i.name.includes('4') || i.name.includes('4구'));
            if (shape === '직사각2구') return i.name.includes('직사각') && (i.name.includes('2') || i.name.includes('2구'));
            return i.name.includes(shape);
          });
        }
      }
    }
    return list;
  }, [currentFinishedList, finishedCategoryFilter, housingColorFilter, housingSwitchFilter, housingShapeFilter]);
  const branchOrders = useMemo(() => ordersForLine.filter(order => order.branchName === branchName), [ordersForLine, branchName]);
  const branchConsumptions = useMemo(() => consumptions.filter(cons => cons.branchName === branchName), [consumptions, branchName]);
  const allConsumptions = useMemo(() => calculateAllMaterialConsumption(), [orders, items, bomItems]);
  const branchShortages = useMemo(() => calculateBranchShortages(), [orders, items, bomItems]);

  const pendingReceiveCount = useMemo(() => {
    const list = selectedProductLine === PRODUCT_LINE_ALL ? materialOrders : materialOrdersForLine;
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return list.filter(o => {
      if (o.status === 'received' || o.status === 'cancelled') return false;
      const expected = o.expectedDate ? new Date(o.expectedDate).getTime() : null;
      if (!expected) return true;
      return expected <= now + weekMs;
    }).length;
  }, [materialOrders, materialOrdersForLine, selectedProductLine]);

  const branchStats = useMemo(() => {
    const lowStockItems = branchItems.filter(item => item.quantity <= item.minQuantity).length;
    const totalValue = branchItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const recentTransactions = branchConsumptions.filter(
      t => new Date(t.processedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    const finishedCount = branchFinishedItems.length;
    const materialCount = branchMaterialItems.length;
    const pendingOrders = branchOrders.filter(order => order.status === 'pending').length;

    return {
      totalItems: branchItems.length,
      lowStockItems,
      totalValue,
      recentTransactions,
      finishedItems: finishedCount,
      materialItems: materialCount,
      pendingOrders,
    };
  }, [branchItems, branchConsumptions, branchFinishedItems, branchMaterialItems, branchOrders]);

  const lineStats = useMemo(() => ({
    totalItems: itemsForLine.length,
    lowStockItems: itemsForLine.filter(i => i.quantity <= i.minQuantity).length,
    totalValue: itemsForLine.reduce((s, i) => s + i.quantity * i.price, 0),
    recentTransactions: transactions.filter(t => lineItemIds.has(t.itemId) && new Date(t.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
    finishedItems: itemsForLine.filter(i => i.type === 'finished').length,
    materialItems: itemsForLine.filter(i => i.type === 'material').length,
    pendingOrders: ordersForLine.filter(o => o.status === 'pending').length,
  }), [itemsForLine, ordersForLine, transactions, lineItemIds]);
  const displayStats = selectedProductLine === PRODUCT_LINE_ALL ? (isAdmin ? stats : branchStats) : lineStats;
  const recentBranchOrders = useMemo(() => {
    return [...branchOrders]
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 5);
  }, [branchOrders]);
  const recentBranchConsumptions = useMemo(() => {
    return [...branchConsumptions]
      .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())
      .slice(0, 5);
  }, [branchConsumptions]);

  useEffect(() => {
    if (isAdmin) setOrderTab('material-detail');
  }, [isAdmin]);
  
  const branchNames = useMemo(() => {
    const branchSet = new Set<string>([...BRANCH_LIST]);
    items.forEach(item => {
      if (item.branchName) branchSet.add(item.branchName);
    });
    orders.forEach(order => {
      if (order.branchName) branchSet.add(order.branchName);
    });
    if (currentUser?.branchName) {
      branchSet.add(currentUser.branchName);
    }
    return Array.from(branchSet).sort((a, b) => (a === '본사' ? -1 : b === '본사' ? 1 : a.localeCompare(b)));
  }, [items, orders, currentUser?.branchName]);
  
  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    auth.logout();
    setCurrentUser(null);
  };

  const handleAddItem = (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingItem) {
      updateItem(editingItem.id, itemData);
    } else {
      addItem(itemData);
    }
    setShowItemForm(false);
    setEditingItem(undefined);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleTransaction = (item: InventoryItem) => {
    setTransactionItem(item);
    setShowTransactionModal(true);
  };

  const handleProcessTransaction = (type: 'in' | 'out', quantity: number, reason: string) => {
    if (!transactionItem) return;
    
    if (transactionItem.type === 'material' && type === 'out') {
      alert('부자재는 출고할 수 없습니다. 부자재 출고는 완성재고 출고 시 자동으로 계산됩니다.');
      return;
    }
    
    try {
      processTransaction(transactionItem.id, type, quantity, reason);
      setShowTransactionModal(false);
      setTransactionItem(undefined);
    } catch (error) {
      alert(error instanceof Error ? error.message : '거래 처리 중 오류가 발생했습니다.');
    }
  };

  const handleBOMSettings = (item: InventoryItem) => {
    setBomItem(item);
    setShowBOMForm(true);
  };

  const handleSaveBOM = (bomList: Omit<BOMItem, 'id'>[]) => {
    if (!bomItem) return;
    
    saveBOMForFinishedItem(bomItem.id, bomList);
    
    alert(`BOM이 저장되었습니다.`);
    
    setShowBOMForm(false);
    setBomItem(undefined);
  };

  const handleAddMaterialOrder = (order: Omit<MaterialOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    addMaterialOrder({
      ...order,
      updatedBy: currentUser?.username,
    });
  };

  const handleUpdateMaterialOrder = (orderId: string, updates: Partial<MaterialOrder>) => {
    updateMaterialOrder(orderId, {
      ...updates,
      updatedBy: currentUser?.username,
    });
  };

  const handleDeleteMaterialOrder = (orderId: string) => {
    deleteMaterialOrder(orderId);
  };

  const handleSyncCatalog = async () => {
    try {
      const catalogItems = await fetchCatalogItems();
      const existingSku = new Set(items.map(item => item.sku).filter(Boolean));
      const existingNames = new Set(items.map(item => item.name));
      let addedCount = 0;

      for (const catalogItem of catalogItems) {
        const alreadyExists = (catalogItem.sku && existingSku.has(catalogItem.sku)) || existingNames.has(catalogItem.name);
        if (alreadyExists) continue;
        await addItem(mapCatalogToInventoryItem(catalogItem));
        addedCount += 1;
      }

      alert(`카탈로그 동기화 완료: ${addedCount}개 추가`);
    } catch (error) {
      alert(error instanceof Error ? error.message : '카탈로그 동기화 중 오류가 발생했습니다.');
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="loading">
        <Package size={48} />
        <p>로딩 중...</p>
      </div>
    );
  }

  const adminTabs = [
    { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={18} /> },
    { id: 'inventory', label: '재고', icon: <Box size={18} /> },
    { id: 'bom', label: 'BOM 설정', icon: <Wrench size={18} /> },
    { id: 'orders', label: '발주', icon: <FileText size={18} /> },
  ];

  const employeeTabs = [
    { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={18} /> },
    { id: 'inventory', label: '재고', icon: <Box size={18} /> },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <Package size={32} />
            <h1>KEYCAPS - 실시간 재고 관리 시스템</h1>
            {currentUser.role === 'admin' ? (
              <span className="user-branch">(관리자)</span>
            ) : currentUser.branchName ? (
              <span className="user-branch">({currentUser.branchName})</span>
            ) : (
              <span className="user-branch">({currentUser.username})</span>
            )}
          </div>
          <div className="header-actions">
            {isAdmin && (
              <button
                className="btn btn-secondary"
                onClick={() => setShowUserManagement(true)}
                style={{ marginRight: '12px' }}
              >
                <Users size={18} />
                계정 관리
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="product-line-tabs">
          <button type="button" className={`product-line-tab ${selectedProductLine === PRODUCT_LINE_ALL ? 'active' : ''}`} onClick={() => setSelectedProductLine(PRODUCT_LINE_ALL)}>전체</button>
          {PRODUCT_LINES.map(line => (
            <button key={line} type="button" className={`product-line-tab ${selectedProductLine === line ? 'active' : ''}`} onClick={() => setSelectedProductLine(line)}>{line}</button>
          ))}
        </div>

        <div className="stats-grid">
          <div onClick={() => setSelectedStatsType('totalItems')} style={{ cursor: 'pointer' }}><StatsCard title="전체 품목" value={displayStats.totalItems} icon={Package} color="#667eea" bgColor="rgba(102, 126, 234, 0.1)" /></div>
          <div onClick={() => setSelectedStatsType('lowStock')} style={{ cursor: 'pointer' }}><StatsCard title="재고 부족" value={displayStats.lowStockItems} icon={AlertTriangle} color="#f56565" bgColor="rgba(245, 101, 101, 0.1)" /></div>
          <div onClick={() => setSelectedStatsType('totalValue')} style={{ cursor: 'pointer' }}><StatsCard title="총 재고 가치" value={`${displayStats.totalValue.toLocaleString()}원`} icon={DollarSign} color="#48bb78" bgColor="rgba(72, 187, 120, 0.1)" /></div>
          <StatsCard title="24시간 내 거래" value={displayStats.recentTransactions} icon={Activity} color="#ed8936" bgColor="rgba(237, 137, 54, 0.1)" />
          <StatsCard title="완성재고" value={displayStats.finishedItems} icon={Package} color="#9f7aea" bgColor="rgba(159, 122, 234, 0.1)" />
          <StatsCard title="부자재" value={displayStats.materialItems} icon={Package} color="#38b2ac" bgColor="rgba(56, 178, 172, 0.1)" />
          <StatsCard title="대기 주문" value={displayStats.pendingOrders} icon={ShoppingCart} color="#f6ad55" bgColor="rgba(246, 173, 85, 0.1)" />
        </div>

        {selectedProductLine !== PRODUCT_LINE_ALL && (
          <>
            <TabNavigation tabs={isAdmin ? adminTabs : employeeTabs} activeTab={primaryTab} onTabChange={(tabId) => { setPrimaryTab(tabId as typeof primaryTab); setSelectedItemForDetail(undefined); }} />
            <div className="mobile-bottom-nav">
              {(isAdmin ? adminTabs : employeeTabs).map(tab => (
                <button key={tab.id} type="button" className={`mobile-nav-item ${primaryTab === tab.id ? 'active' : ''}`} onClick={() => { setPrimaryTab(tab.id as typeof primaryTab); setSelectedItemForDetail(undefined); }}>
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="tab-content">
          {selectedProductLine === PRODUCT_LINE_ALL && isAdmin && (
            <div className="dashboard-content dashboard-full">
              <h2 className="dashboard-full-title">전체 주요 이슈</h2>
              {pendingReceiveCount > 0 && (
                <div className="dashboard-alert warning" onClick={() => { setSelectedProductLine('하우징'); setPrimaryTab('orders'); }}>
                  <AlertTriangle size={20} />
                  <span>입고 미처리 {pendingReceiveCount}건 — 지연 또는 추가 발주가 필요할 수 있습니다.</span>
                </div>
              )}
              <div className="dashboard-section">
                <h2>주간 출고 · 예상 소모량</h2>
                <WeeklyShipmentPanel transactions={transactions} items={items} bomItems={bomItems} />
              </div>
              <div className="dashboard-section">
                <h2>부자재 발주 요약</h2>
                <MaterialOrderSummary materialOrders={materialOrders} materialItems={items.filter(i => i.type === 'material')} />
              </div>
              <div className="dashboard-section">
                <h2>부자재 소모량 추산</h2>
                <MaterialConsumptionPanel consumptions={allConsumptions} branchShortages={branchShortages} onBranchClick={setSelectedBranchShortage} />
              </div>
            </div>
          )}
          {selectedProductLine === PRODUCT_LINE_ALL && !isAdmin && (
            <div className="dashboard-content dashboard-full">
              <h2 className="dashboard-full-title">전체 요약</h2>
              <div className="dashboard-section">
                <h2>지점 발주 현황</h2>
                {recentBranchOrders.length === 0 ? <p className="empty-state">최근 발주 내역이 없습니다.</p> : <div className="simple-list">{recentBranchOrders.map(order => <div key={order.id} className="simple-list-item"><span>{items.find(item => item.id === order.finishedItemId)?.name || '알 수 없음'}</span><span>{order.quantity.toLocaleString()}개</span><span>{new Date(order.orderDate).toLocaleDateString('ko-KR')}</span></div>)}</div>}
              </div>
              <div className="dashboard-section">
                <h2>지점 소모/출고 내역</h2>
                {recentBranchConsumptions.length === 0 ? <p className="empty-state">최근 소모 내역이 없습니다.</p> : <div className="simple-list">{recentBranchConsumptions.map(cons => <div key={cons.id} className="simple-list-item"><span>{items.find(item => item.id === cons.itemId)?.name || '알 수 없음'}</span><span>-{cons.quantity.toLocaleString()}개</span><span>{new Date(cons.processedAt).toLocaleDateString('ko-KR')}</span></div>)}</div>}
              </div>
            </div>
          )}
          {selectedProductLine !== PRODUCT_LINE_ALL && primaryTab === 'dashboard' && (
            isAdmin ? (
              <div className="dashboard-content">
                {pendingReceiveCount > 0 && (
                  <div className="dashboard-alert warning" onClick={() => setPrimaryTab('orders')}>
                    <AlertTriangle size={20} />
                    <span>입고 미처리 {pendingReceiveCount}건 — 지연 또는 추가 발주가 필요할 수 있습니다.</span>
                  </div>
                )}
                <div className="dashboard-section">
                  <h2>주간 출고 · 예상 소모량</h2>
                  <WeeklyShipmentPanel transactions={transactions} items={items} bomItems={bomItems} />
                </div>
                <div className="dashboard-section">
                  <h2>부자재 발주 요약</h2>
                  <MaterialOrderSummary materialOrders={materialOrders} materialItems={materialItems} />
                </div>
                <div className="dashboard-section">
                  <h2>부자재 소모량 추산</h2>
                  <MaterialConsumptionPanel consumptions={allConsumptions} branchShortages={branchShortages} onBranchClick={setSelectedBranchShortage} />
                </div>
              </div>
            ) : (
              <div className="dashboard-content">
                <div className="dashboard-section">
                  <h2>지점 발주 현황</h2>
                  {recentBranchOrders.length === 0 ? <p className="empty-state">최근 발주 내역이 없습니다.</p> : <div className="simple-list">{recentBranchOrders.map(order => <div key={order.id} className="simple-list-item"><span>{items.find(item => item.id === order.finishedItemId)?.name || '알 수 없음'}</span><span>{order.quantity.toLocaleString()}개</span><span>{new Date(order.orderDate).toLocaleDateString('ko-KR')}</span></div>)}</div>}
                </div>
                <div className="dashboard-section">
                  <h2>지점 소모/출고 내역</h2>
                  {recentBranchConsumptions.length === 0 ? <p className="empty-state">최근 소모 내역이 없습니다.</p> : <div className="simple-list">{recentBranchConsumptions.map(cons => <div key={cons.id} className="simple-list-item"><span>{items.find(item => item.id === cons.itemId)?.name || '알 수 없음'}</span><span>-{cons.quantity.toLocaleString()}개</span><span>{new Date(cons.processedAt).toLocaleDateString('ko-KR')}</span></div>)}</div>}
                </div>
              </div>
            )
          )}

          {selectedProductLine !== PRODUCT_LINE_ALL && primaryTab === 'inventory' && (
            <div className="main-content">
              {isAdmin ? <TabNavigation tabs={[{ id: 'finished', label: '완성재고', icon: <Box size={18} /> },{ id: 'material', label: '부자재 재고', icon: <Wrench size={18} /> }]} activeTab={inventoryTab} onTabChange={(tabId) => { setInventoryTab(tabId as typeof inventoryTab); setSelectedItemForDetail(undefined); }} /> : null}
              <div className="section-header">
                <h2>{inventoryTab === 'material' ? '부자재 재고' : '완성재고'}</h2>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                  {isAdmin && <button className="btn btn-primary" onClick={() => { setEditingItem(undefined); setShowItemForm(true); }}><Plus size={18} />재고 추가</button>}
                  {isAdmin && inventoryTab === 'material' && (
                    <button type="button" className="btn btn-secondary" onClick={async () => { if (confirm('고리-핑크, 하우징 지퍼백(3종), 무지 키캡(5종)을 추가할까요? 없을 때만 추가됩니다.')) await seedOptionalMaterials(); }}>
                      고리·지퍼백·무지키캡 추가
                    </button>
                  )}
                </div>
              </div>
              {inventoryTab === 'finished' && (
                <div className="inventory-filters">
                  <label className="filter-label">카테고리</label>
                  <select className="filter-select" value={finishedCategoryFilter} onChange={(e) => { setFinishedCategoryFilter(e.target.value); setHousingColorFilter('all'); setHousingSwitchFilter('all'); setHousingShapeFilter('all'); }}>
                    <option value="all">전체</option>
                    {finishedCategoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {finishedCategoryFilter === HOUSING_CATEGORY && (
                    <>
                      <label className="filter-label">컬러</label>
                      <select className="filter-select" value={housingColorFilter} onChange={(e) => setHousingColorFilter(e.target.value)}>
                        <option value="all">전체</option>
                        {HOUSING_COLORS.map(v => (<option key={v} value={v}>{v}</option>))}
                      </select>
                      <label className="filter-label">스위치</label>
                      <select className="filter-select" value={housingSwitchFilter} onChange={(e) => setHousingSwitchFilter(e.target.value)}>
                        <option value="all">전체</option>
                        {HOUSING_SWITCHES.map(v => (<option key={v} value={v}>{v}</option>))}
                      </select>
                      <label className="filter-label">형태</label>
                      <select className="filter-select" value={housingShapeFilter} onChange={(e) => setHousingShapeFilter(e.target.value)}>
                        <option value="all">전체</option>
                        {HOUSING_SHAPES.map(v => (<option key={v} value={v}>{v}</option>))}
                      </select>
                      {isAdmin && (
                        <>
                          <button type="button" className="btn btn-secondary" onClick={async () => {
                            if (!confirm('기존 하우징 완성재고를 삭제하고 컬러×스위치×형태 60종을 새로 만들까요?')) return;
                            await seedHousingItems();
                            setFinishedCategoryFilter(HOUSING_CATEGORY);
                            setHousingColorFilter('all');
                            setHousingSwitchFilter('all');
                            setHousingShapeFilter('all');
                          }}>
                            하우징 60종 일괄 생성
                          </button>
                          <button type="button" className="btn btn-secondary" onClick={async () => {
                            if (!confirm('하우징 60종에 BOM을 설정합니다. (케이스 1개 + 스위치 2/4개, 부자재 없으면 자동 생성) 계속할까요?')) return;
                            await seedBOMForHousing();
                          }}>
                            BOM 설정 (하우징 60종)
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
              <div className="search-box"><Search size={20} /><input type="text" placeholder="품목명, 카테고리로 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              {inventoryTab === 'material' ? (
                <MaterialInventoryByCategory
                  items={(isAdmin ? materialItems : branchMaterialItems).filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase()))}
                  onEdit={isAdmin ? handleEditItem : undefined}
                  onDelete={isAdmin ? deleteItem : undefined}
                  onTransaction={handleTransaction}
                  onViewDetail={(item) => setSelectedItemForDetail(item)}
                />
              ) : (
                <InventoryTable items={filteredFinishedItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase()))} onEdit={isAdmin ? handleEditItem : undefined} onDelete={isAdmin ? deleteItem : undefined} onTransaction={handleTransaction} onBOMSettings={undefined} onViewDetail={(item) => setSelectedItemForDetail(item)} searchTerm="" />
              )}
              {selectedItemForDetail && <div className="detail-section"><ConsumptionHistory consumptions={consumptions} items={items} itemId={selectedItemForDetail.id} itemType={selectedItemForDetail.type} /></div>}
            </div>
          )}

          {selectedProductLine !== PRODUCT_LINE_ALL && primaryTab === 'bom' && isAdmin && (
            <div className="main-content">
              <div className="section-header">
                <h2>BOM 설정</h2>
                <p className="section-desc">완성재고 1개당 필요한 부자재를 설정합니다. 출고 시 부자재 소모량이 자동 계산됩니다.</p>
              </div>
              <div className="bom-mode-cards">
                <button type="button" className={`bom-mode-card ${bomViewMode === 'finished' ? 'active' : ''}`} onClick={() => setBomViewMode('finished')}>
                  <Box size={32} />
                  <h3>완성재고 기준</h3>
                  <p>품목별로 들어가는 부자재와 수량을 설정합니다.</p>
                </button>
                <button type="button" className={`bom-mode-card ${bomViewMode === 'material' ? 'active' : ''}`} onClick={() => setBomViewMode('material')}>
                  <Wrench size={32} />
                  <h3>부자재 기준</h3>
                  <p>부자재를 선택한 뒤, 사용하는 완성재고를 체크·수량 입력합니다.</p>
                </button>
              </div>
              {bomViewMode === 'finished' && (
                <div className="bom-status-section">
                  <div className="bom-status-grid">
                    {finishedItems.map(item => {
                      const itemBOM = getBOMByFinishedItem(item.id);
                      return (
                        <div key={item.id} className="bom-status-card">
                          <div className="bom-status-header">
                            <h4 className="bom-status-title">{item.name}{itemBOM.length > 0 && <span className="bom-status-subtitle">({itemBOM.length}개 부자재)</span>}</h4>
                            <button type="button" className="btn btn-secondary btn-small" onClick={() => handleBOMSettings(item)}>BOM 설정</button>
                          </div>
                          {itemBOM.length > 0 ? <BOMReceipt finishedItem={item} bomItems={itemBOM} materialItems={materialItems} /> : <div className="bom-empty-notice"><p>⚠️ BOM이 설정되지 않았습니다. 완성재고 출고 시 부자재 소모량이 계산되지 않습니다.</p></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {bomViewMode === 'material' && (
                <BOMByMaterialEditor
                  materialItems={materialItems}
                  finishedItems={finishedItems}
                  getBOMByMaterial={getBOMByMaterial}
                  onSave={saveBOMByMaterial}
                />
              )}
              <div className="vendor-material-section">
                <VendorMaterialEditor
                  materialItems={materialItems}
                  suppliers={suppliersFromOrders}
                  getMaterialIdsBySupplier={getMaterialIdsBySupplier}
                  setVendorMaterialsForSupplier={setVendorMaterialsForSupplier}
                />
              </div>
            </div>
          )}

          {selectedProductLine !== PRODUCT_LINE_ALL && primaryTab === 'orders' && isAdmin && (
            <div className="main-content">
              <TabNavigation tabs={[{ id: 'material-detail', label: '부자재 발주 내역', icon: <FileText size={18} /> },{ id: 'material-summary', label: '부자재 발주 요약', icon: <FileText size={18} /> },{ id: 'vendors', label: '카테고리별 업체·입고일정', icon: <MapPin size={18} /> }]} activeTab={orderTab} onTabChange={(tabId) => setOrderTab(tabId as typeof orderTab)} />
              {orderTab === 'material-detail' && (
                <>
                  <div className="section-header"><h2>부자재 발주 내역</h2></div>
                  <MaterialOrderManagement materialOrders={materialOrdersForLine} materialItems={materialItems} getMaterialIdsBySupplier={getMaterialIdsBySupplier} onAddOrder={handleAddMaterialOrder} onUpdateOrder={handleUpdateMaterialOrder} onDeleteOrder={handleDeleteMaterialOrder} onSyncCatalog={handleSyncCatalog} />
                </>
              )}
              {orderTab === 'material-summary' && (
                <>
                  <div className="section-header"><h2>부자재 발주 요약</h2></div>
                  <MaterialOrderSummary materialOrders={materialOrdersForLine} materialItems={materialItems} />
                </>
              )}
              {orderTab === 'vendors' && (
                <OrderVendorsAndSchedule materialOrders={materialOrdersForLine} materialItems={materialItems} />
              )}
            </div>
          )}

        </div>
      </main>

      {showItemForm && <ItemForm item={editingItem} defaultType={inventoryTab === 'finished' ? 'finished' : inventoryTab === 'material' ? 'material' : undefined} defaultProductLine={selectedProductLine !== PRODUCT_LINE_ALL ? selectedProductLine : undefined} branches={branchNames} defaultBranchName={isAdmin ? '본사' : currentUser?.branchName} isAdmin={isAdmin} onSubmit={handleAddItem} onCancel={() => { setShowItemForm(false); setEditingItem(undefined); }} />}
      {showTransactionModal && transactionItem && <TransactionModal item={transactionItem} onProcess={handleProcessTransaction} onCancel={() => { setShowTransactionModal(false); setTransactionItem(undefined); }} />}
      {showBOMForm && bomItem && <BOMForm finishedItem={bomItem} bomItems={getBOMByFinishedItem(bomItem.id)} materialItems={materialItems} onSave={handleSaveBOM} onCancel={() => { setShowBOMForm(false); setBomItem(undefined); }} />}
      {showUserManagement && <UserManagement onClose={() => setShowUserManagement(false)} onUpdate={() => { const user = auth.getCurrentUser(); setCurrentUser(user); }} />}
      {selectedBranchShortage && <BranchShortageDetail branchShortage={selectedBranchShortage} items={items} onClose={() => setSelectedBranchShortage(undefined)} />}
      {selectedOrder && <OrderDetailModal order={selectedOrder} items={items} consumptions={calculateMaterialConsumption(selectedOrder.finishedItemId, selectedOrder.quantity)} onClose={() => setSelectedOrder(undefined)} />}
      {selectedStatsType && <StatsDetailModal type={selectedStatsType} stats={stats} items={items} onClose={() => setSelectedStatsType(null)} />}
      {selectedItemForDetail && <ItemDetailModal item={selectedItemForDetail} bomItems={bomItems} materialItems={materialItems} consumptions={consumptions} orders={orders} editLogs={getItemEditLogsByItem(selectedItemForDetail.id)} onClose={() => setSelectedItemForDetail(undefined)} />}
    </div>
  );
}

export default App;
