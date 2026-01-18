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
import { OrderList } from './components/OrderList';
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
import { auth } from './utils/auth';
import { Plus, Search, Package, AlertTriangle, DollarSign, Activity, ShoppingCart, LogOut, Users, FileText, LayoutDashboard, Box, Wrench, MapPin, Receipt } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStatsType, setSelectedStatsType] = useState<'totalItems' | 'lowStock' | 'totalValue' | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | undefined>();
  const [selectedBranchForDetail, setSelectedBranchForDetail] = useState<string | undefined>();
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);

  const stats = getStats();
  const finishedItems = useMemo(() => items.filter(item => item.type === 'finished'), [items]);
  const materialItems = useMemo(() => items.filter(item => item.type === 'material'), [items]);
  const allConsumptions = useMemo(() => calculateAllMaterialConsumption(), [orders, items, bomItems]);
  const branchShortages = useMemo(() => calculateBranchShortages(), [orders, items, bomItems]);
  
  // 지점 목록 추출 (orders에서)
  const branchNames = useMemo(() => {
    const branchSet = new Set<string>();
    orders.forEach(order => branchSet.add(order.branchName));
    return Array.from(branchSet).sort();
  }, [orders]);
  
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
    const currentTab = activeTab;
    if (currentTab === 'finished') {
      setActiveTab('dashboard');
      setTimeout(() => {
        setActiveTab('finished');
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

  const isAdmin = currentUser.role === 'admin';

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
              value={stats.totalItems}
              icon={Package}
              color="#667eea"
              bgColor="rgba(102, 126, 234, 0.1)"
            />
          </div>
          <div onClick={() => setSelectedStatsType('lowStock')} style={{ cursor: 'pointer' }}>
            <StatsCard
              title="재고 부족"
              value={stats.lowStockItems}
              icon={AlertTriangle}
              color="#f56565"
              bgColor="rgba(245, 101, 101, 0.1)"
            />
          </div>
          <div onClick={() => setSelectedStatsType('totalValue')} style={{ cursor: 'pointer' }}>
            <StatsCard
              title="총 재고 가치"
              value={`${stats.totalValue.toLocaleString()}원`}
              icon={DollarSign}
              color="#48bb78"
              bgColor="rgba(72, 187, 120, 0.1)"
            />
          </div>
          <StatsCard
            title="24시간 내 거래"
            value={stats.recentTransactions}
            icon={Activity}
            color="#ed8936"
            bgColor="rgba(237, 137, 54, 0.1)"
          />
          <StatsCard
            title="완성재고"
            value={stats.finishedItems}
            icon={Package}
            color="#9f7aea"
            bgColor="rgba(159, 122, 234, 0.1)"
          />
          <StatsCard
            title="부자재"
            value={stats.materialItems}
            icon={Package}
            color="#38b2ac"
            bgColor="rgba(56, 178, 172, 0.1)"
          />
          <StatsCard
            title="대기 주문"
            value={stats.pendingOrders}
            icon={ShoppingCart}
            color="#f6ad55"
            bgColor="rgba(246, 173, 85, 0.1)"
          />
        </div>

        {/* 데스크톱 탭 네비게이션 */}
        <TabNavigation
          tabs={isAdmin ? [
            { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={18} /> },
            { id: 'finished', label: '완성재고', icon: <Box size={18} /> },
            { id: 'material', label: '부자재 재고', icon: <Wrench size={18} /> },
            { id: 'material-orders', label: '부자재 발주 내역', icon: <FileText size={18} /> },
            { id: 'orders', label: '지점 발주 내역', icon: <FileText size={18} /> },
            { id: 'branches', label: '지점 관리', icon: <MapPin size={18} /> },
          ] : [
            { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={18} /> },
            { id: 'finished', label: '완성재고', icon: <Box size={18} /> },
            { id: 'orders', label: '지점 발주 내역', icon: <FileText size={18} /> },
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => {
            setActiveTab(tabId);
            setSelectedItemForDetail(undefined);
          }}
        />

        {/* 모바일 하단 네비게이션 */}
        <div className="mobile-bottom-nav">
          {(isAdmin ? [
            { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={20} /> },
            { id: 'finished', label: '완성재고', icon: <Box size={20} /> },
            { id: 'material', label: '부자재', icon: <Wrench size={20} /> },
            { id: 'material-orders', label: '부자재 발주', icon: <FileText size={20} /> },
            { id: 'orders', label: '발주', icon: <FileText size={20} /> },
            { id: 'branches', label: '지점', icon: <MapPin size={20} /> },
          ] : [
            { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={20} /> },
            { id: 'finished', label: '완성재고', icon: <Box size={20} /> },
            { id: 'orders', label: '발주', icon: <FileText size={20} /> },
          ]).map(tab => (
            <button
              key={tab.id}
              className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedItemForDetail(undefined);
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'dashboard' && (
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
          )}

          {activeTab === 'finished' && (
            <div className="main-content">
              <div className="section-header">
                <h2>완성재고</h2>
                {isAdmin && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingItem(undefined);
                      setShowItemForm(true);
                    }}
                  >
                    <Plus size={18} />
                    완성재고 추가
                  </button>
                )}
              </div>
              <div className="search-box" style={{ marginBottom: '20px' }}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="품목명, 카테고리로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <InventoryTable
                items={finishedItems.filter(item =>
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.category.toLowerCase().includes(searchTerm.toLowerCase())
                )}
                onEdit={isAdmin ? handleEditItem : undefined}
                onDelete={isAdmin ? deleteItem : undefined}
                onTransaction={handleTransaction}
                onBOMSettings={isAdmin ? handleBOMSettings : undefined}
                onViewDetail={(item) => setSelectedItemForDetail(item)}
                searchTerm=""
              />
              {/* 모든 완성재고의 BOM 표시 */}
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ marginBottom: '16px', color: '#1a73e8' }}>BOM 설정 현황</h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {finishedItems.map(item => {
                    const itemBOM = getBOMByFinishedItem(item.id);
                    console.log(`BOM 조회 - ${item.name}:`, { itemId: item.id, bomCount: itemBOM.length, bomItems: itemBOM });
                    return (
                      <div key={item.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, color: '#202124', fontSize: '18px', fontWeight: 600 }}>
                            {item.name}
                            {itemBOM.length > 0 && (
                              <span style={{ marginLeft: '8px', fontSize: '14px', color: '#1a73e8', fontWeight: 400 }}>
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
                          <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                            <p style={{ color: '#9aa0a6', margin: 0, fontSize: '14px' }}>
                              ⚠️ BOM이 설정되지 않았습니다. 완성재고 출고 시 부자재 소모량이 계산되지 않습니다.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {selectedItemForDetail && (
                <div style={{ marginTop: '24px' }}>
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

          {activeTab === 'material' && (
            <div className="main-content">
              <div className="section-header">
                <h2>부자재</h2>
                {isAdmin && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingItem(undefined);
                      setShowItemForm(true);
                    }}
                  >
                    <Plus size={18} />
                    부자재 추가
                  </button>
                )}
              </div>
              <div className="search-box" style={{ marginBottom: '20px' }}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="품목명, 카테고리로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <InventoryTable
                items={materialItems.filter(item =>
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.category.toLowerCase().includes(searchTerm.toLowerCase())
                )}
                onEdit={isAdmin ? handleEditItem : undefined}
                onDelete={isAdmin ? deleteItem : undefined}
                onTransaction={handleTransaction}
                onViewDetail={(item) => setSelectedItemForDetail(item)}
                searchTerm=""
              />
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="main-content">
              <div className="section-header">
                <h2>지점 발주 내역</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {isAdmin && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowReportGenerator(true)}
                    >
                      <FileText size={18} />
                      보고서 생성
                    </button>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowOrderForm(true)}
                  >
                    <ShoppingCart size={18} />
                    지점 주문 입력
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowProcessingModal(true)}
                >
                  <Package size={18} />
                  발주 처리
                </button>
              </div>
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
            </div>
          )}

          {activeTab === 'branches' && (
            <div className="main-content">
              <BranchManagement
                branchShortages={branchShortages}
                orders={orders}
                items={items}
                onBranchClick={setSelectedBranchShortage}
                onBranchDetail={setSelectedBranchForDetail}
              />
            </div>
          )}

          {activeTab === 'material-orders' && isAdmin && (
            <div className="main-content">
              <div className="section-header">
                <h2>부자재 발주 내역</h2>
              </div>
              <MaterialOrderManagement
                materialOrders={materialOrders}
                materialItems={materialItems}
                onAddOrder={handleAddMaterialOrder}
                onUpdateOrder={handleUpdateMaterialOrder}
              />
            </div>
          )}
        </div>
      </main>

      {showItemForm && (
        <ItemForm
          item={editingItem}
          defaultType={activeTab === 'finished' ? 'finished' : activeTab === 'material' ? 'material' : undefined}
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
          finishedItems={finishedItems}
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
