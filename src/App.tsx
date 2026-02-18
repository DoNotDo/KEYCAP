import { useState, useEffect, useMemo } from 'react';
import { useInventory } from './hooks/useInventory';
import { InventoryItem, BOMItem, User, BranchShortage, Order } from './types';
import { StatsCard } from './components/StatsCard';
import { ItemForm } from './components/ItemForm';
import { TransactionModal } from './components/TransactionModal';
import { InventoryTable } from './components/InventoryTable';
import { TransactionHistory } from './components/TransactionHistory';
import { BOMForm } from './components/BOMForm';
import { OrderForm } from './components/OrderForm';
import { MaterialConsumptionPanel } from './components/MaterialConsumptionPanel';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { BranchShortageDetail } from './components/BranchShortageDetail';
import { OrderListWithTabs } from './components/OrderListWithTabs';
import { OrderDetailModal } from './components/OrderDetailModal';
import { TabNavigation } from './components/TabNavigation';
import { StatsDetailModal } from './components/StatsDetailModal';
import { BranchManagement } from './components/BranchManagement';
import { BranchDetailModal } from './components/BranchDetailModal';
import { BOMReceipt } from './components/BOMReceipt';
import { ConsumptionHistory } from './components/ConsumptionHistory';
import { ReportGenerator } from './components/ReportGenerator';
import { ItemDetailModal } from './components/ItemDetailModal';
import { OrderProcessingModal } from './components/OrderProcessingModal';
import { MaterialOrderManagement } from './components/MaterialOrderManagement';
import { MaterialOrderSummary } from './components/MaterialOrderSummary';
import { BranchNotes } from './components/BranchNotes';
import { BranchStockReport } from './components/BranchStockReport';
import { BRANCH_LIST } from './constants/branches';
import { fetchCatalogItems, mapCatalogToInventoryItem } from './utils/catalog';
import { auth } from './utils/auth';
import { Plus, Search, Package, AlertTriangle, DollarSign, Activity, ShoppingCart, LogOut, Users, FileText, LayoutDashboard, Box, Wrench, MapPin, Receipt, Copy } from 'lucide-react';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedBranchShortage, setSelectedBranchShortage] = useState<BranchShortage | undefined>();

  useEffect(() => {
    const initAuth = async () => {
      await auth.initialize();
      const user = await auth.getCurrentUser();
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
  } = useInventory();

  const [showItemForm, setShowItemForm] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBOMForm, setShowBOMForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const [transactionItem, setTransactionItem] = useState<InventoryItem | undefined>();
  const [bomItem, setBomItem] = useState<InventoryItem | undefined>();
  const [orderQuantity, setOrderQuantity] = useState(0);
  const [orderFinishedItemId, setOrderFinishedItemId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>();
  const [primaryTab, setPrimaryTab] = useState<'dashboard' | 'inventory' | 'orders' | 'branches' | 'reports'>('dashboard');
  const [inventoryTab, setInventoryTab] = useState<'finished' | 'material'>('finished');
  const [orderTab, setOrderTab] = useState<'material-summary' | 'material-detail' | 'branch-orders'>('branch-orders');
  const [branchTab, setBranchTab] = useState<'notes' | 'management' | 'branch-report'>('notes');
  const [selectedStatsType, setSelectedStatsType] = useState<'totalItems' | 'lowStock' | 'totalValue' | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | undefined>();
  const [selectedBranchForDetail, setSelectedBranchForDetail] = useState<string | undefined>();
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const stats = getStats();
  const finishedItems = useMemo(() => items.filter(item => item.type === 'finished'), [items]);
  const materialItems = useMemo(() => items.filter(item => item.type === 'material'), [items]);
  const branchName = currentUser?.branchName;
  const branchItems = useMemo(() => {
    if (isAdmin) return items;
    return items.filter(item => item.branchName === branchName);
  }, [items, isAdmin, branchName]);
  const branchFinishedItems = useMemo(() => branchItems.filter(item => item.type === 'finished'), [branchItems]);
  const branchMaterialItems = useMemo(() => branchItems.filter(item => item.type === 'material'), [branchItems]);
  const branchOrders = useMemo(() => orders.filter(order => order.branchName === branchName), [orders, branchName]);
  const branchConsumptions = useMemo(() => consumptions.filter(cons => cons.branchName === branchName), [consumptions, branchName]);
  const allConsumptions = useMemo(() => calculateAllMaterialConsumption(), [orders, items, bomItems]);
  const branchShortages = useMemo(() => calculateBranchShortages(), [orders, items, bomItems]);

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

  const displayStats = isAdmin ? stats : branchStats;
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
    if (isAdmin) {
      setOrderTab('material-summary');
    } else {
      setOrderTab('branch-orders');
      setInventoryTab('finished');
      setBranchTab('notes');
    }
  }, [isAdmin]);
  
  // 지점 목록 추출 (orders에서 + 와펜/키캡 보고용 기본 목록)
  const branchNames = useMemo(() => {
    const branchSet = new Set<string>([...BRANCH_LIST]);
    orders.forEach(order => branchSet.add(order.branchName));
    if (currentUser?.branchName) {
      branchSet.add(currentUser.branchName);
    }
    return Array.from(branchSet).sort((a, b) => (a === '본사' ? -1 : b === '본사' ? 1 : a.localeCompare(b)));
  }, [orders, currentUser?.branchName]);
  
  // 주문 입력 시 실시간 계산
  // 주문 폼에서 선택한 완성재고와 수량에 따른 부자재 소모량 계산
  const orderConsumptions = useMemo(() => {
    if (orderFinishedItemId && orderQuantity > 0) {
      return calculateMaterialConsumption(orderFinishedItemId, orderQuantity);
    }
    return [];
  }, [orderFinishedItemId, orderQuantity, calculateMaterialConsumption]);

  // 사용자별 필터링된 주문
  const filteredOrders = useMemo(() => {
    if (!currentUser) return orders;
    if (currentUser.role === 'admin') return orders;
    return orders.filter(order => order.branchName === currentUser.branchName);
  }, [orders, currentUser]);

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
    
    // 부자재는 출고 불가
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
    
    console.log('BOM 저장 시작:', { finishedItemId: bomItem.id, bomList });
    
    // finishedItemId를 포함한 BOM 리스트 생성
    const bomListWithFinishedId = bomList.map(bom => ({
      ...bom,
      finishedItemId: bomItem.id,
    }));
    
    saveBOMForFinishedItem(bomItem.id, bomListWithFinishedId);
    
    // 저장 후 알림 및 확인
    const savedBOM = getBOMByFinishedItem(bomItem.id);
    console.log('저장 후 BOM 확인:', savedBOM);
    
    alert(`BOM이 저장되었습니다.\n완성재고: ${bomItem.name}\n부자재 수: ${bomList.length}개\n\n저장된 BOM이 화면에 반영됩니다.`);
    
    setShowBOMForm(false);
    setBomItem(undefined);
    
    // 강제 리렌더링을 위해 탭을 잠시 변경했다가 다시 돌아오기
    const currentPrimary = primaryTab;
    const currentInventory = inventoryTab;
    if (currentPrimary === 'inventory' && currentInventory === 'finished') {
      setPrimaryTab('dashboard');
      setTimeout(() => {
        setPrimaryTab('inventory');
        setInventoryTab('finished');
      }, 100);
    }
  };

  const handleAddOrder = (branchName: string, finishedItemId: string, quantity: number) => {
    // 직원의 경우 자신의 지점으로 고정
    const finalBranchName = currentUser?.role === 'employee' 
      ? (currentUser.branchName || branchName)
      : branchName;
    
    addOrder({
      branchName: finalBranchName,
      finishedItemId,
      quantity,
      orderDate: new Date().toISOString(),
    });
    setShowOrderForm(false);
    setOrderFinishedItemId('');
    setOrderQuantity(0);
  };

  const handleAddMaterialOrder = (order: Parameters<typeof addMaterialOrder>[0]) => {
    addMaterialOrder({
      ...order,
      updatedBy: currentUser?.username,
    });
  };

  const handleUpdateMaterialOrder = (orderId: string, updates: Parameters<typeof updateMaterialOrder>[1]) => {
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

  const handleOrderStatusUpdate = (orderId: string, status: Order['status'], notes?: string) => {
    if (status === 'completed') {
      completeOrder(orderId, currentUser?.username || 'system');
    } else {
      updateOrder(orderId, {
        status,
        processedAt: status !== 'pending' ? new Date().toISOString() : undefined,
        processedBy: currentUser?.username,
        notes,
      }, currentUser?.username);
    }
  };

  const handleStartProcessing = (orderIds: string[]) => {
    orderIds.forEach(orderId => {
      updateOrder(orderId, {
        status: 'processing',
        processedAt: new Date().toISOString(),
        processedBy: currentUser?.username,
      }, currentUser?.username);
    });
  };

  const handleProcessOrder = (order: Order) => {
    setShowProcessingModal(true);
  };

  const handleShipOrder = (orderId: string, shippedQuantity: number) => {
    try {
      shipOrder(orderId, shippedQuantity, currentUser?.username || 'system');
    } catch (error) {
      alert(error instanceof Error ? error.message : '출고 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReceiveOrder = (orderId: string) => {
    receiveOrder(orderId, currentUser?.username || 'system');
  };

  const handleViewOrderDetail = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleOrderFormChange = (finishedItemId: string, quantity: number) => {
    setOrderFinishedItemId(finishedItemId);
    setOrderQuantity(quantity);
  };

  // 실시간 업데이트를 위한 주기적 새로고침 (선택사항)
  useEffect(() => {
    const interval = setInterval(() => {
      // 필요시 데이터 새로고침 로직 추가
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 로그인 화면
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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <Package size={32} />
            <h1>KEYCAPS - 실시간 재고 관리 시스템</h1>
            {currentUser.branchName && (
              <span className="user-branch">({currentUser.branchName})</span>
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
        <div className="stats-grid">
          <div onClick={() => setSelectedStatsType('totalItems')} style={{ cursor: 'pointer' }}>
            <StatsCard
              title="전체 품목"
              value={displayStats.totalItems}
              icon={Package}
              color="#667eea"
              bgColor="rgba(102, 126, 234, 0.1)"
            />
          </div>
          <div onClick={() => setSelectedStatsType('lowStock')} style={{ cursor: 'pointer' }}>
            <StatsCard
              title="재고 부족"
              value={displayStats.lowStockItems}
              icon={AlertTriangle}
              color="#f56565"
              bgColor="rgba(245, 101, 101, 0.1)"
            />
          </div>
          <div onClick={() => setSelectedStatsType('totalValue')} style={{ cursor: 'pointer' }}>
            <StatsCard
              title="총 재고 가치"
              value={`${displayStats.totalValue.toLocaleString()}원`}
              icon={DollarSign}
              color="#48bb78"
              bgColor="rgba(72, 187, 120, 0.1)"
            />
          </div>
          <StatsCard
            title="24시간 내 거래"
            value={displayStats.recentTransactions}
            icon={Activity}
            color="#ed8936"
            bgColor="rgba(237, 137, 54, 0.1)"
          />
          <StatsCard
            title="완성재고"
            value={displayStats.finishedItems}
            icon={Package}
            color="#9f7aea"
            bgColor="rgba(159, 122, 234, 0.1)"
          />
          <StatsCard
            title="부자재"
            value={displayStats.materialItems}
            icon={Package}
            color="#38b2ac"
            bgColor="rgba(56, 178, 172, 0.1)"
          />
          <StatsCard
            title="대기 주문"
            value={displayStats.pendingOrders}
            icon={ShoppingCart}
            color="#f6ad55"
            bgColor="rgba(246, 173, 85, 0.1)"
          />
        </div>

        {/* 데스크톱 탭 네비게이션 (상위 카테고리) */}
        <TabNavigation
          tabs={isAdmin ? [
            { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={18} /> },
            { id: 'inventory', label: '재고', icon: <Box size={18} /> },
            { id: 'orders', label: '발주', icon: <FileText size={18} /> },
            { id: 'branches', label: '지점', icon: <MapPin size={18} /> },
            { id: 'reports', label: '리포트', icon: <Receipt size={18} /> },
          ] : [
            { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={18} /> },
            { id: 'inventory', label: '재고', icon: <Box size={18} /> },
            { id: 'orders', label: '발주', icon: <FileText size={18} /> },
            { id: 'branches', label: '특이사항', icon: <MapPin size={18} /> },
          ]}
          activeTab={primaryTab}
          onTabChange={(tabId) => {
            setPrimaryTab(tabId as typeof primaryTab);
            setSelectedItemForDetail(undefined);
          }}
        />

        {/* 모바일 하단 네비게이션 (상위 카테고리) */}
        <div className="mobile-bottom-nav">
          {(isAdmin ? [
            { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={20} /> },
            { id: 'inventory', label: '재고', icon: <Box size={20} /> },
            { id: 'orders', label: '발주', icon: <FileText size={20} /> },
            { id: 'branches', label: '지점', icon: <MapPin size={20} /> },
            { id: 'reports', label: '리포트', icon: <Receipt size={20} /> },
          ] : [
            { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={20} /> },
            { id: 'inventory', label: '재고', icon: <Box size={20} /> },
            { id: 'orders', label: '발주', icon: <FileText size={20} /> },
            { id: 'branches', label: '특이사항', icon: <MapPin size={20} /> },
          ]).map(tab => (
            <button
              key={tab.id}
              className={`mobile-nav-item ${primaryTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setPrimaryTab(tab.id as typeof primaryTab);
                setSelectedItemForDetail(undefined);
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          {primaryTab === 'dashboard' && (
            isAdmin ? (
              <div className="dashboard-content">
                <div className="dashboard-section">
                  <h2>최근 거래 내역</h2>
                  <TransactionHistory transactions={transactions} items={items} />
                </div>
                <div className="dashboard-section">
                  <h2>부자재 소모량 추산</h2>
                  <MaterialConsumptionPanel 
                    consumptions={allConsumptions}
                    branchShortages={branchShortages}
                    onBranchClick={setSelectedBranchShortage}
                  />
                </div>
              </div>
            ) : (
              <div className="dashboard-content">
                <div className="dashboard-section">
                  <h2>지점 발주 현황</h2>
                  {recentBranchOrders.length === 0 ? (
                    <p className="empty-state">최근 발주 내역이 없습니다.</p>
                  ) : (
                    <div className="simple-list">
                      {recentBranchOrders.map(order => (
                        <div key={order.id} className="simple-list-item">
                          <span>{items.find(item => item.id === order.finishedItemId)?.name || '알 수 없음'}</span>
                          <span>{order.quantity.toLocaleString()}개</span>
                          <span>{new Date(order.orderDate).toLocaleDateString('ko-KR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="dashboard-section">
                  <h2>지점 소모/출고 내역</h2>
                  {recentBranchConsumptions.length === 0 ? (
                    <p className="empty-state">최근 소모 내역이 없습니다.</p>
                  ) : (
                    <div className="simple-list">
                      {recentBranchConsumptions.map(cons => (
                        <div key={cons.id} className="simple-list-item">
                          <span>{items.find(item => item.id === cons.itemId)?.name || '알 수 없음'}</span>
                          <span>-{cons.quantity.toLocaleString()}개</span>
                          <span>{new Date(cons.processedAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {primaryTab === 'inventory' && (
            <div className="main-content">
              {isAdmin ? (
                <TabNavigation
                  tabs={[
                    { id: 'finished', label: '완성재고', icon: <Box size={18} /> },
                    { id: 'material', label: '부자재 재고', icon: <Wrench size={18} /> },
                  ]}
                  activeTab={inventoryTab}
                  onTabChange={(tabId) => {
                    setInventoryTab(tabId as typeof inventoryTab);
                    setSelectedItemForDetail(undefined);
                  }}
                />
              ) : null}
              <div className="section-header">
                <h2>{inventoryTab === 'material' ? '부자재 재고' : '완성재고'}</h2>
                {isAdmin && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingItem(undefined);
                      setShowItemForm(true);
                    }}
                  >
                    <Plus size={18} />
                    재고 추가
                  </button>
                )}
              </div>
              <div className="search-box">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="품목명, 카테고리로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <InventoryTable
                items={(inventoryTab === 'material' ? (isAdmin ? materialItems : branchMaterialItems) : (isAdmin ? finishedItems : branchFinishedItems)).filter(item =>
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.category.toLowerCase().includes(searchTerm.toLowerCase())
                )}
                onEdit={isAdmin ? handleEditItem : undefined}
                onDelete={isAdmin ? deleteItem : undefined}
                onTransaction={handleTransaction}
                onBOMSettings={isAdmin && inventoryTab === 'finished' ? handleBOMSettings : undefined}
                onViewDetail={(item) => setSelectedItemForDetail(item)}
                searchTerm=""
              />
              {inventoryTab === 'finished' && isAdmin && (
                <div className="bom-status-section">
                  <h3>BOM 설정 현황</h3>
                  <div className="bom-status-grid">
                    {finishedItems.map(item => {
                      const itemBOM = getBOMByFinishedItem(item.id);
                      return (
                        <div key={item.id} className="bom-status-card">
                          <div className="bom-status-header">
                            <h4 className="bom-status-title">
                              {item.name}
                              {itemBOM.length > 0 && (
                                <span className="bom-status-subtitle">
                                  ({itemBOM.length}개 부자재)
                                </span>
                              )}
                            </h4>
                            {isAdmin && (
                              <button
                                className="btn btn-secondary btn-small"
                                onClick={() => handleBOMSettings(item)}
                              >
                                BOM 설정
                              </button>
                            )}
                          </div>
                          {itemBOM.length > 0 ? (
                            <BOMReceipt
                              finishedItem={item}
                              bomItems={itemBOM}
                              materialItems={materialItems}
                            />
                          ) : (
                            <div className="bom-empty-notice">
                              <p>
                                ⚠️ BOM이 설정되지 않았습니다. 완성재고 출고 시 부자재 소모량이 계산되지 않습니다.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {selectedItemForDetail && (
                <div className="detail-section">
                  <ConsumptionHistory
                    consumptions={consumptions}
                    items={items}
                    itemId={selectedItemForDetail.id}
                    itemType={selectedItemForDetail.type}
                  />
                </div>
              )}
            </div>
          )}

          {primaryTab === 'orders' && (
            <div className="main-content">
              {isAdmin && (
                <TabNavigation
                  tabs={[
                    { id: 'material-summary', label: '부자재 발주 요약', icon: <FileText size={18} /> },
                    { id: 'material-detail', label: '부자재 발주 내역', icon: <FileText size={18} /> },
                    { id: 'branch-orders', label: '지점 발주 내역', icon: <FileText size={18} /> },
                  ]}
                  activeTab={orderTab}
                  onTabChange={(tabId) => setOrderTab(tabId as typeof orderTab)}
                />
              )}
              {(!isAdmin || orderTab === 'branch-orders') && (
                <>
                  <div className="section-header">
                    <h2>지점 발주 내역</h2>
                    <div className="section-header-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowOrderForm(true)}
                      >
                        <ShoppingCart size={18} />
                        지점 주문 입력
                      </button>
                      {isAdmin && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowReportGenerator(true)}
                        >
                          <FileText size={18} />
                          보고서 생성
                        </button>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="section-action-group">
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowProcessingModal(true)}
                      >
                        <Package size={18} />
                        발주 처리
                      </button>
                    </div>
                  )}
                  <OrderListWithTabs
                    orders={orders}
                    items={items}
                    currentUser={currentUser}
                    onStatusUpdate={handleOrderStatusUpdate}
                    onViewDetail={handleViewOrderDetail}
                    onProcess={handleProcessOrder}
                    onShip={handleShipOrder}
                    onReceive={handleReceiveOrder}
                    calculateConsumption={(finishedItemId, quantity) => {
                      const consumptions = calculateMaterialConsumption(finishedItemId, quantity);
                      return consumptions.map(c => ({
                        materialName: c.materialName,
                        quantity: c.requiredQuantity,
                      }));
                    }}
                  />
                </>
              )}
              {isAdmin && orderTab === 'material-detail' && (
                <>
                  <div className="section-header">
                    <h2>부자재 발주 내역</h2>
                  </div>
                  <MaterialOrderManagement
                    materialOrders={materialOrders}
                    materialItems={materialItems}
                    onAddOrder={handleAddMaterialOrder}
                    onUpdateOrder={handleUpdateMaterialOrder}
                    onDeleteOrder={handleDeleteMaterialOrder}
                    onSyncCatalog={handleSyncCatalog}
                  />
                </>
              )}
              {isAdmin && orderTab === 'material-summary' && (
                <>
                  <div className="section-header">
                    <h2>부자재 발주 요약</h2>
                  </div>
                  <MaterialOrderSummary
                    materialOrders={materialOrders}
                    materialItems={materialItems}
                  />
                </>
              )}
            </div>
          )}

          {primaryTab === 'branches' && (
            <div className="main-content">
              {(isAdmin || true) && (
                <TabNavigation
                  tabs={[
                    { id: 'notes', label: '지점 특이사항', icon: <FileText size={18} /> },
                    { id: 'branch-report', label: '지점별 재고 보고', icon: <Copy size={18} /> },
                    ...(isAdmin ? [{ id: 'management', label: '지점 관리', icon: <MapPin size={18} /> }] : []),
                  ]}
                  activeTab={branchTab}
                  onTabChange={(tabId) => setBranchTab(tabId as typeof branchTab)}
                />
              )}
              {(!isAdmin || branchTab === 'notes') && (
                <BranchNotes
                  currentUser={currentUser}
                  branches={branchNames}
                  notes={branchNotes}
                  onSave={saveBranchNote}
                />
              )}
              {branchTab === 'branch-report' && (
                <BranchStockReport
                  items={items}
                  extraBranchNames={branchNames}
                  currentUserBranch={currentUser?.branchName}
                />
              )}
              {isAdmin && branchTab === 'management' && (
                <BranchManagement
                  branchShortages={branchShortages}
                  orders={orders}
                  items={items}
                  onBranchClick={setSelectedBranchShortage}
                  onBranchDetail={setSelectedBranchForDetail}
                />
              )}
            </div>
          )}

          {primaryTab === 'reports' && isAdmin && (
            <div className="main-content">
              <div className="section-header">
                <h2>보고서</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowReportGenerator(true)}
                >
                  <Receipt size={18} />
                  보고서 생성
                </button>
              </div>
              <p className="empty-state">기간을 선택해 엑셀로 다운로드하세요.</p>
            </div>
          )}
        </div>
      </main>

      {showItemForm && (
        <ItemForm
          item={editingItem}
          defaultType={inventoryTab === 'finished' ? 'finished' : inventoryTab === 'material' ? 'material' : undefined}
          branches={branchNames}
          defaultBranchName={isAdmin ? '본사' : currentUser?.branchName}
          isAdmin={isAdmin}
          onSubmit={handleAddItem}
          onCancel={() => {
            setShowItemForm(false);
            setEditingItem(undefined);
          }}
        />
      )}

      {showTransactionModal && transactionItem && (
        <TransactionModal
          item={transactionItem}
          onProcess={handleProcessTransaction}
          onCancel={() => {
            setShowTransactionModal(false);
            setTransactionItem(undefined);
          }}
        />
      )}

      {showBOMForm && bomItem && (
        <BOMForm
          finishedItem={bomItem}
          bomItems={getBOMByFinishedItem(bomItem.id)}
          materialItems={materialItems}
          onSave={handleSaveBOM}
          onCancel={() => {
            setShowBOMForm(false);
            setBomItem(undefined);
          }}
        />
      )}

      {showOrderForm && (
        <OrderForm
          finishedItems={isAdmin ? finishedItems : branchFinishedItems}
          branches={branchNames}
          onProcess={handleAddOrder}
          consumptionResults={orderConsumptions}
          onChange={handleOrderFormChange}
          defaultBranchName={currentUser.branchName}
          isAdmin={isAdmin}
          onCancel={() => {
            setShowOrderForm(false);
            setOrderFinishedItemId('');
            setOrderQuantity(0);
          }}
        />
      )}

      {showUserManagement && (
        <UserManagement
          onClose={() => setShowUserManagement(false)}
          onUpdate={() => {
            const user = auth.getCurrentUser();
            setCurrentUser(user);
          }}
        />
      )}

      {selectedBranchShortage && (
        <BranchShortageDetail
          branchShortage={selectedBranchShortage}
          items={items}
          onClose={() => setSelectedBranchShortage(undefined)}
        />
      )}

      {selectedBranchForDetail && (
        <BranchDetailModal
          branchName={selectedBranchForDetail}
          orders={orders}
          items={items}
          branchShortage={branchShortages.find(bs => bs.branchName === selectedBranchForDetail)}
          onClose={() => setSelectedBranchForDetail(undefined)}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          items={items}
          consumptions={calculateMaterialConsumption(selectedOrder.finishedItemId, selectedOrder.quantity)}
          onClose={() => setSelectedOrder(undefined)}
        />
      )}

      {selectedStatsType && (
        <StatsDetailModal
          type={selectedStatsType}
          stats={stats}
          items={items}
          onClose={() => setSelectedStatsType(null)}
        />
      )}

      {selectedItemForDetail && (
        <ItemDetailModal
          item={selectedItemForDetail}
          bomItems={bomItems}
          materialItems={materialItems}
          consumptions={consumptions}
          orders={orders}
          onClose={() => setSelectedItemForDetail(undefined)}
        />
      )}

      {showReportGenerator && (
        <ReportGenerator
          orders={orders}
          consumptions={consumptions}
          items={items}
          onClose={() => setShowReportGenerator(false)}
        />
      )}

      {showProcessingModal && (
        <OrderProcessingModal
          orders={orders}
          items={items}
          bomItems={bomItems}
          onStartProcessing={handleStartProcessing}
          onShip={handleShipOrder}
          onReceive={handleReceiveOrder}
          onClose={() => setShowProcessingModal(false)}
          currentUserBranch={currentUser?.branchName}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

export default App;
