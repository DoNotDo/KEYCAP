import { Order, InventoryItem, User } from '../types';
import { Package, CheckCircle, XCircle, Clock, Eye, Truck, PackageCheck } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  items: InventoryItem[];
  currentUser: User | null;
  onStatusUpdate?: (orderId: string, status: Order['status'], notes?: string) => void;
  onViewDetail?: (order: Order) => void;
  onProcess?: (order: Order) => void;
  onShip?: (orderId: string, shippedQuantity: number) => void;
  onReceive?: (orderId: string) => void;
  calculateConsumption?: (finishedItemId: string, quantity: number) => Array<{ materialName: string; quantity: number }>;
}

export const OrderList = ({ orders, items, currentUser, onStatusUpdate, onViewDetail, onProcess, onShip, onReceive, calculateConsumption }: OrderListProps) => {
  const isAdmin = currentUser?.role === 'admin';
  const filteredOrders = isAdmin 
    ? orders 
    : orders.filter(order => order.branchName === currentUser?.branchName);

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
      case 'rejected':
        return <XCircle size={18} />;
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
      case 'rejected':
        return '#f56565';
    }
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    if (onStatusUpdate) {
      const notes = newStatus === 'rejected' ? prompt('거절 사유를 입력하세요:') : undefined;
      onStatusUpdate(orderId, newStatus, notes);
    }
  };

  if (filteredOrders.length === 0) {
    return (
      <div className="order-list-container">
        <h3>지점 발주 내역</h3>
        <p className="empty-state">발주 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="order-list-container">
      <div className="order-list-header">
        <h3>지점 발주 내역</h3>
        {!isAdmin && (
          <span className="order-count">총 {filteredOrders.length}건</span>
        )}
      </div>
      <div className="order-list">
        {filteredOrders.map(order => (
          <div key={order.id} className={`order-card ${order.status}`}>
            <div className="order-card-header">
              <div className="order-info">
                <div className="order-item-name">
                  <Package size={20} />
                  <strong>{getItemName(order.finishedItemId)}</strong>
                </div>
                {isAdmin && (
                  <span className="order-branch">{order.branchName}</span>
                )}
              </div>
              <div className="order-status-badge" style={{ color: getStatusColor(order.status) }}>
                {getStatusIcon(order.status)}
                <span>
                  {order.status === 'pending' ? '대기' :
                   order.status === 'processing' ? '처리중' :
                   order.status === 'shipping' ? '출고' :
                   order.status === 'received' ? '입고' :
                   order.status === 'completed' ? '완료' : '거절'}
                </span>
              </div>
            </div>

            <div className="order-details">
              <div className="order-detail-row">
                <span className="label">수량:</span>
                <span className="value">{order.quantity.toLocaleString()}개</span>
              </div>
              {calculateConsumption && order.status === 'pending' && (
                <div className="order-detail-row">
                  <span className="label">예상 소모량:</span>
                  <span className="value" style={{ color: '#1a73e8', fontWeight: 700 }}>
                    {(() => {
                      const consumptions = calculateConsumption(order.finishedItemId, order.quantity);
                      if (consumptions.length === 0) return 'BOM 미설정';
                      return `${consumptions.length}개 부자재 필요`;
                    })()}
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
              {order.processedBy && (
                <div className="order-detail-row">
                  <span className="label">처리자:</span>
                  <span className="value">{order.processedBy}</span>
                </div>
              )}
              {order.notes && (
                <div className="order-detail-row">
                  <span className="label">메모:</span>
                  <span className="value">{order.notes}</span>
                </div>
              )}
            </div>

            <div className="order-actions">
              {onViewDetail && (
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => onViewDetail(order)}
                >
                  <Eye size={16} />
                  상세보기
                </button>
              )}
              {isAdmin && order.status === 'pending' && onStatusUpdate && (
                <>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => {
                      if (onProcess) {
                        onProcess(order);
                      } else {
                        handleStatusChange(order.id, 'processing');
                      }
                    }}
                  >
                    처리 시작
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => handleStatusChange(order.id, 'rejected')}
                  >
                    거절
                  </button>
                </>
              )}
              {order.status === 'shipping' && onReceive && (
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => onReceive(order.id)}
                >
                  <PackageCheck size={16} />
                  입고 처리
                </button>
              )}
              {order.status === 'received' && isAdmin && onStatusUpdate && (
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => handleStatusChange(order.id, 'completed')}
                >
                  완료 처리
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
