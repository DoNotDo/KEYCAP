import { Order, InventoryItem, BranchShortage } from '../types';
import { X, MapPin, Package, Clock, CheckCircle, AlertTriangle, ShoppingCart, Truck, PackageCheck } from 'lucide-react';

interface BranchDetailModalProps {
  branchName: string;
  orders: Order[];
  items: InventoryItem[];
  branchShortage?: BranchShortage;
  onClose: () => void;
}

export const BranchDetailModal = ({ branchName, orders, items, branchShortage, onClose }: BranchDetailModalProps) => {
  const branchOrders = orders.filter(order => order.branchName === branchName);
  
  const getItemName = (itemId: string) => {
    return items.find(item => item.id === itemId)?.name || '알 수 없음';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={18} />;
      case 'processing':
        return <Package size={18} />;
      case 'shipping':
        return <Truck size={18} />;
      case 'received':
        return <PackageCheck size={18} />;
      case 'completed':
        return <CheckCircle size={18} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return '#ed8936';
      case 'processing':
        return '#4299e1';
      case 'shipping':
        return '#9f7aea';
      case 'received':
        return '#38b2ac';
      case 'completed':
        return '#48bb78';
      default:
        return '#5f6368';
    }
  };

  const stats = {
    total: branchOrders.length,
    pending: branchOrders.filter(o => o.status === 'pending').length,
    processing: branchOrders.filter(o => o.status === 'processing').length,
    shipping: branchOrders.filter(o => o.status === 'shipping').length,
    received: branchOrders.filter(o => o.status === 'received').length,
    completed: branchOrders.filter(o => o.status === 'completed').length,
  };

  const getCompletionRate = (order: Order) => {
    if (order.shippedQuantity && order.quantity > 0) {
      return Math.round((order.shippedQuantity / order.quantity) * 100);
    }
    return null;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h2>{branchName} 상세 정보</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="branch-detail-content">
          {/* 통계 */}
          <div className="branch-stats-section" style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '16px', color: '#1a73e8' }}>발주 통계</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fff', borderRadius: '4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a73e8' }}>{stats.total}</div>
                <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>전체</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fff', borderRadius: '4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#ed8936' }}>{stats.pending}</div>
                <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>대기</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fff', borderRadius: '4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#4299e1' }}>{stats.processing}</div>
                <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>처리중</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fff', borderRadius: '4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#9f7aea' }}>{stats.shipping}</div>
                <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>출고</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fff', borderRadius: '4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#38b2ac' }}>{stats.received}</div>
                <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>입고</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fff', borderRadius: '4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#48bb78' }}>{stats.completed}</div>
                <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>완료</div>
              </div>
            </div>
          </div>

          {/* 부자재 부족 정보 */}
          {branchShortage && branchShortage.totalShortageCount > 0 && (
            <div className="branch-shortage-section" style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <AlertTriangle size={20} color="#ff9800" />
                <h3 style={{ margin: '0 0 0 8px', color: '#ff9800' }}>부자재 부족 알림</h3>
              </div>
              <div style={{ fontSize: '14px', color: '#5f6368' }}>
                {branchShortage.shortages.map((shortage, idx) => (
                  <div key={idx} style={{ marginBottom: '8px' }}>
                    <strong>{shortage.materialName}</strong>: 필요 {shortage.requiredQuantity}개, 현재 {shortage.availableQuantity}개 (부족: {shortage.shortage}개)
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 발주 내역 */}
          <div className="branch-orders-section">
            <h3 style={{ marginBottom: '16px', color: '#1a73e8' }}>지점 발주 내역</h3>
            {branchOrders.length === 0 ? (
              <p className="empty-state">발주 내역이 없습니다.</p>
            ) : (
              <div className="order-list">
                {branchOrders.map(order => {
                  const completionRate = getCompletionRate(order);
                  return (
                    <div key={order.id} className={`order-card ${order.status}`} style={{ marginBottom: '12px' }}>
                      <div className="order-card-header">
                        <div className="order-info">
                          <div className="order-item-name">
                            <Package size={20} />
                            <strong>{getItemName(order.finishedItemId)}</strong>
                          </div>
                        </div>
                        <div className="order-status-badge" style={{ color: getStatusColor(order.status) }}>
                          {getStatusIcon(order.status)}
                          <span>
                            {order.status === 'pending' ? '대기' :
                             order.status === 'processing' ? '처리중' :
                             order.status === 'shipping' ? '출고' :
                             order.status === 'received' ? '입고' :
                             order.status === 'completed' ? '완료' : order.status}
                          </span>
                        </div>
                      </div>

                      <div className="order-details">
                        <div className="order-detail-row">
                          <span className="label">요청 수량:</span>
                          <span className="value">{order.quantity.toLocaleString()}개</span>
                        </div>
                        {order.shippedQuantity && (
                          <div className="order-detail-row">
                            <span className="label">출고 수량:</span>
                            <span className="value" style={{ color: '#1a73e8', fontWeight: 600 }}>
                              {order.shippedQuantity.toLocaleString()}개
                              {completionRate !== null && (
                                <span style={{ marginLeft: '8px', fontSize: '14px', color: completionRate >= 100 ? '#48bb78' : '#ed8936' }}>
                                  ({completionRate}%)
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        <div className="order-detail-row">
                          <span className="label">주문일:</span>
                          <span className="value">{formatDate(order.orderDate)}</span>
                        </div>
                        {order.processedAt && (
                          <div className="order-detail-row">
                            <span className="label">처리일:</span>
                            <span className="value">{formatDate(order.processedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
