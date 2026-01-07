import { Order, InventoryItem, MaterialConsumption } from '../types';
import { X, Package, AlertTriangle } from 'lucide-react';

interface OrderDetailModalProps {
  order: Order;
  items: InventoryItem[];
  consumptions?: MaterialConsumption[];
  onClose: () => void;
}

export const OrderDetailModal = ({ order, items, consumptions, onClose }: OrderDetailModalProps) => {
  const getItemName = (itemId: string) => {
    return items.find(item => item.id === itemId)?.name || '알 수 없음';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const hasShortage = consumptions?.some(c => c.isShortage) || false;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>발주 상세 정보</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="order-detail-content">
          <div className="order-detail-section">
            <h3>발주 정보</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">지점명:</span>
                <span className="detail-value">{order.branchName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">품목:</span>
                <span className="detail-value">{getItemName(order.finishedItemId)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">수량:</span>
                <span className="detail-value">{order.quantity.toLocaleString()}개</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">주문일:</span>
                <span className="detail-value">{formatDate(order.orderDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">상태:</span>
                <span className={`detail-value status-${order.status}`}>
                  {order.status === 'pending' ? '대기' :
                   order.status === 'processing' ? '처리중' :
                   order.status === 'completed' ? '완료' : '거절'}
                </span>
              </div>
              {order.processedAt && (
                <div className="detail-item">
                  <span className="detail-label">처리일:</span>
                  <span className="detail-value">{formatDate(order.processedAt)}</span>
                </div>
              )}
              {order.processedBy && (
                <div className="detail-item">
                  <span className="detail-label">처리자:</span>
                  <span className="detail-value">{order.processedBy}</span>
                </div>
              )}
              {order.notes && (
                <div className="detail-item full-width">
                  <span className="detail-label">메모:</span>
                  <span className="detail-value">{order.notes}</span>
                </div>
              )}
            </div>
          </div>

          {consumptions && consumptions.length > 0 && (
            <div className="order-detail-section">
              <h3>필요한 부자재</h3>
              {hasShortage && (
                <div className="shortage-alert">
                  <AlertTriangle size={20} />
                  <span>일부 부자재가 부족합니다!</span>
                </div>
              )}
              <div className="consumption-table-container">
                <table className="consumption-table">
                  <thead>
                    <tr>
                      <th>부자재</th>
                      <th>필요 수량</th>
                      <th>현재 재고</th>
                      <th>부족량</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumptions.map(consumption => (
                      <tr key={consumption.materialItemId} className={consumption.isShortage ? 'shortage-row' : ''}>
                        <td>{consumption.materialName}</td>
                        <td>{consumption.requiredQuantity.toLocaleString()}</td>
                        <td>{consumption.availableQuantity.toLocaleString()}</td>
                        <td className={consumption.isShortage ? 'shortage-amount' : ''}>
                          {consumption.shortage > 0 ? consumption.shortage.toLocaleString() : '-'}
                        </td>
                        <td>
                          {consumption.isShortage ? (
                            <span className="status-badge warning">부족</span>
                          ) : (
                            <span className="status-badge success">충분</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button onClick={onClose} className="btn btn-primary">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
