import { BranchShortage, InventoryItem } from '../types';
import { X, AlertTriangle, Package } from 'lucide-react';

interface BranchShortageDetailProps {
  branchShortage: BranchShortage;
  items: InventoryItem[];
  onClose: () => void;
}

export const BranchShortageDetail = ({ branchShortage, items, onClose }: BranchShortageDetailProps) => {
  const getItemName = (itemId: string) => {
    return items.find(item => item.id === itemId)?.name || '알 수 없음';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <h2>{branchShortage.branchName} - 재고 부족 상세</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="branch-shortage-content">
          <div className="shortage-summary-box">
            <AlertTriangle size={32} />
            <div>
              <h3>부족한 부자재: {branchShortage.totalShortageCount}개</h3>
              <p>대기 중인 주문: {branchShortage.orders.length}건</p>
            </div>
          </div>

          <div className="shortage-section">
            <h3>부족한 부자재 목록</h3>
            <div className="shortage-table-container">
              <table className="shortage-table">
                <thead>
                  <tr>
                    <th>부자재명</th>
                    <th>필요 수량</th>
                    <th>현재 재고</th>
                    <th>부족량</th>
                  </tr>
                </thead>
                <tbody>
                  {branchShortage.shortages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-state">부족한 부자재가 없습니다.</td>
                    </tr>
                  ) : (
                    branchShortage.shortages.map(shortage => (
                      <tr key={shortage.materialItemId} className="shortage-row">
                        <td>{shortage.materialName}</td>
                        <td>{shortage.requiredQuantity.toLocaleString()}</td>
                        <td>{shortage.availableQuantity.toLocaleString()}</td>
                        <td className="shortage-amount">{shortage.shortage.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="orders-section">
            <h3>관련 주문 내역</h3>
            <div className="orders-list">
              {branchShortage.orders.length === 0 ? (
                <p className="empty-state">주문 내역이 없습니다.</p>
              ) : (
                branchShortage.orders.map(order => (
                  <div key={order.id} className="order-detail-item">
                    <div className="order-header">
                      <Package size={20} />
                      <div>
                        <strong>{getItemName(order.finishedItemId)}</strong>
                        <span className="order-quantity">수량: {order.quantity}개</span>
                      </div>
                    </div>
                    <div className="order-meta">
                      <span>주문일: {formatDate(order.orderDate)}</span>
                      <span className={`order-status ${order.status}`}>
                        {order.status === 'pending' ? '대기' : order.status === 'processing' ? '처리중' : '완료'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

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
