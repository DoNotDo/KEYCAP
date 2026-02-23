import { useState, useMemo } from 'react';
import { Order, InventoryItem, User } from '../types';
import { Package, CheckCircle, XCircle, Clock, Eye, Truck, PackageCheck } from 'lucide-react';
import { TabNavigation } from './TabNavigation';

interface OrderListWithTabsProps {
  orders: Order[];
  items: InventoryItem[];
  currentUser: User | null;
  onStatusUpdate?: (orderId: string, status: Order['status'], notes?: string) => void;
  onViewDetail?: (order: Order) => void;
  onProcess?: (order: Order) => void;
  onReceive?: (orderId: string) => void;
}

export const OrderListWithTabs = ({ 
  orders, 
  items, 
  currentUser, 
  onStatusUpdate, 
  onViewDetail, 
  onProcess, 
  onReceive, 
}: OrderListWithTabsProps) => {
  const [activeStatusTab, setActiveStatusTab] = useState<string>('all');
  const isAdmin = currentUser?.role === 'admin';
  
  const filteredOrders = useMemo(() => {
    const baseFiltered = isAdmin 
      ? orders 
      : orders.filter(order => order.branchName === currentUser?.branchName);
    
    if (activeStatusTab === 'all') {
      return baseFiltered;
    }
    
    if (activeStatusTab === 'completed') {
      const completed = baseFiltered.filter(order => order.status === 'completed');
      return completed.sort((a, b) => {
        const dateA = new Date(a.processedAt || a.orderDate);
        const dateB = new Date(b.processedAt || b.orderDate);
        return dateB.getTime() - dateA.getTime();
      });
    }
    
    return baseFiltered.filter(order => order.status === activeStatusTab);
  }, [orders, isAdmin, currentUser?.branchName, activeStatusTab]);

  const getItemName = (itemId: string) => {
    return items.find(item => item.id === itemId)?.name || '알 수 없음';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock size={18} />;
      case 'processing': return <Package size={18} />;
      case 'shipping': return <Truck size={18} />;
      case 'received': return <PackageCheck size={18} />;
      case 'completed': return <CheckCircle size={18} />;
      case 'rejected': return <XCircle size={18} />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#ed8936';
      case 'processing': return '#4299e1';
      case 'shipping': return '#9f7aea';
      case 'received': return '#38b2ac';
      case 'completed': return '#48bb78';
      case 'rejected': return '#f56565';
    }
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    if (onStatusUpdate) {
      const notes = newStatus === 'rejected' ? prompt('거절 사유를 입력하세요:') : undefined;
      onStatusUpdate(orderId, newStatus, notes || undefined);
    }
  };

  const getCompletionRate = (order: Order) => {
    if (order.shippedQuantity && order.quantity > 0) {
      return Math.round((order.shippedQuantity / order.quantity) * 100);
    }
    return null;
  };

  const statusTabs = useMemo(() => {
    const baseFiltered = isAdmin 
      ? orders 
      : orders.filter(order => order.branchName === currentUser?.branchName);
    
    return [
      { id: 'all', label: '전체', count: baseFiltered.length },
      { id: 'pending', label: '대기', count: baseFiltered.filter(o => o.status === 'pending').length },
      { id: 'processing', label: '처리중', count: baseFiltered.filter(o => o.status === 'processing').length },
      { id: 'shipping', label: '출고', count: baseFiltered.filter(o => o.status === 'shipping').length },
      { id: 'received', label: '입고', count: baseFiltered.filter(o => o.status === 'received').length },
      { id: 'completed', label: '완료', count: baseFiltered.filter(o => o.status === 'completed').length },
      { id: 'rejected', label: '거절', count: baseFiltered.filter(o => o.status === 'rejected').length },
    ];
  }, [orders, isAdmin, currentUser?.branchName]);

  if (filteredOrders.length === 0 && activeStatusTab !== 'all') {
    return (
      <div className="order-list-container">
        <TabNavigation
          tabs={statusTabs.map(tab => ({ id: tab.id, label: `${tab.label}${tab.count > 0 ? ` (${tab.count})` : ''}` }))}
          activeTab={activeStatusTab}
          onTabChange={setActiveStatusTab}
        />
        <p className="empty-state">해당 상태의 지점 발주 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="order-list-container">
      <TabNavigation
        tabs={statusTabs.map(tab => ({ id: tab.id, label: `${tab.label}${tab.count > 0 ? ` (${tab.count})` : ''}` }))}
        activeTab={activeStatusTab}
        onTabChange={setActiveStatusTab}
      />
      {activeStatusTab === 'completed' && filteredOrders.length > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#5f6368' }}>
            완료된 주문은 처리일 기준으로 정렬됩니다. (총 {filteredOrders.length}건)
          </p>
        </div>
      )}
      <div className="order-list">
        {activeStatusTab === 'completed' ? (
          (() => {
            const groupedByMonth: { [key: string]: Order[] } = {};
            filteredOrders.forEach(order => {
              const date = new Date(order.processedAt || order.orderDate);
              const monthKey = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
              if (!groupedByMonth[monthKey]) {
                groupedByMonth[monthKey] = [];
              }
              groupedByMonth[monthKey].push(order);
            });
            
            const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
              const parseMonthKey = (key: string) => {
                const match = key.match(/(\d{4})년 (\d{1,2})월/);
                return match ? new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1) : new Date(0);
              };
              return parseMonthKey(b).getTime() - parseMonthKey(a).getTime();
            });
            
            return sortedMonths.map(month => (
              <div key={month} style={{ marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: '#e8f0fe', borderRadius: '6px', color: '#1a73e8', fontSize: '16px', fontWeight: 600 }}>
                  {month} ({groupedByMonth[month].length}건)
                </h4>
                {groupedByMonth[month].map(order => {
                  const completionRate = getCompletionRate(order);
                  return (
                    <div key={order.id} className={`order-card ${order.status}`} style={{ marginBottom: '12px' }}>
                      <div className="order-card-header">
                        <div className="order-info">
                          <div className="order-item-name">
                            <Package size={20} />
                            <strong>{getItemName(order.finishedItemId)}</strong>
                          </div>
                          {isAdmin && <span className="order-branch">{order.branchName}</span>}
                        </div>
                        <div className="order-status-badge" style={{ color: getStatusColor(order.status) }}>
                          {getStatusIcon(order.status)}
                          <span>완료</span>
                        </div>
                      </div>

                      <div className="order-details">
                        <div className="order-detail-row"><span className="label">요청 수량:</span><span className="value">{order.quantity.toLocaleString()}개</span></div>
                        {order.shippedQuantity && <div className="order-detail-row"><span className="label">출고 수량:</span><span className="value" style={{ color: '#1a73e8', fontWeight: 600 }}>{order.shippedQuantity.toLocaleString()}개{completionRate !== null && <span style={{ marginLeft: '8px', fontSize: '14px', color: completionRate >= 100 ? '#48bb78' : '#ed8936' }}>({completionRate}%)</span>}</span></div>}
                        <div className="order-detail-row"><span className="label">주문일:</span><span className="value">{formatDate(order.orderDate)}</span></div>
                        {order.processedAt && <div className="order-detail-row"><span className="label">처리일:</span><span className="value">{formatDate(order.processedAt)}</span></div>}
                        {order.processedBy && <div className="order-detail-row"><span className="label">처리자:</span><span className="value">{order.processedBy}</span></div>}
                        {order.notes && <div className="order-detail-row"><span className="label">메모:</span><span className="value">{order.notes}</span></div>}
                      </div>

                      <div className="order-actions">
                        {onViewDetail && <button className="btn btn-secondary btn-small" onClick={() => onViewDetail(order)}><Eye size={16} />상세보기</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ));
          })()
        ) : (
          filteredOrders.map(order => {
            const completionRate = getCompletionRate(order);
            return (
              <div key={order.id} className={`order-card ${order.status}`}>
                <div className="order-card-header">
                  <div className="order-info">
                    <div className="order-item-name">
                      <Package size={20} />
                      <strong>{getItemName(order.finishedItemId)}</strong>
                    </div>
                    {isAdmin && <span className="order-branch">{order.branchName}</span>}
                  </div>
                  <div className="order-status-badge" style={{ color: getStatusColor(order.status) }}>
                    {getStatusIcon(order.status)}
                    <span>{order.status === 'pending' ? '대기' : order.status === 'processing' ? '처리중' : order.status === 'shipping' ? '출고' : order.status === 'received' ? '입고' : order.status === 'completed' ? '완료' : '거절'}</span>
                  </div>
                </div>

                <div className="order-details">
                  <div className="order-detail-row"><span className="label">요청 수량:</span><span className="value">{order.quantity.toLocaleString()}개</span></div>
                  {order.shippedQuantity && <div className="order-detail-row"><span className="label">출고 수량:</span><span className="value" style={{ color: '#1a73e8', fontWeight: 600 }}>{order.shippedQuantity.toLocaleString()}개{completionRate !== null && <span style={{ marginLeft: '8px', fontSize: '14px', color: completionRate >= 100 ? '#48bb78' : '#ed8936' }}>({completionRate}%)</span>}</span></div>}
                  <div className="order-detail-row"><span className="label">주문일:</span><span className="value">{formatDate(order.orderDate)}</span></div>
                  {order.processedAt && <div className="order-detail-row"><span className="label">처리일:</span><span className="value">{formatDate(order.processedAt)}</span></div>}
                  {order.processedBy && <div className="order-detail-row"><span className="label">처리자:</span><span className="value">{order.processedBy}</span></div>}
                  {order.notes && <div className="order-detail-row"><span className="label">메모:</span><span className="value">{order.notes}</span></div>}
                </div>

                <div className="order-actions">
                  {onViewDetail && <button className="btn btn-secondary btn-small" onClick={() => onViewDetail(order)}><Eye size={16} />상세보기</button>}
                  {isAdmin && order.status === 'pending' && onStatusUpdate && <><button className="btn btn-primary btn-small" onClick={() => { if (onProcess) { onProcess(order); } else { handleStatusChange(order.id, 'processing'); }}}>처리 시작</button><button className="btn btn-secondary btn-small" onClick={() => handleStatusChange(order.id, 'rejected')}>거절</button></>}
                  {order.status === 'shipping' && onReceive && <button className="btn btn-primary btn-small" onClick={() => onReceive(order.id)}><PackageCheck size={16} />입고 처리</button>}
                  {order.status === 'received' && isAdmin && onStatusUpdate && <button className="btn btn-primary btn-small" onClick={() => handleStatusChange(order.id, 'completed')}>완료 처리</button>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
