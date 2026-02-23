import { InventoryItem, InventoryStats } from '../types';
import { X } from 'lucide-react';

interface StatsDetailModalProps {
  type: 'totalItems' | 'lowStock' | 'totalValue';
  stats: InventoryStats;
  items: InventoryItem[];
  onClose: () => void;
}

export const StatsDetailModal = ({ type, stats, items, onClose }: StatsDetailModalProps) => {
  const getTitle = () => {
    switch (type) {
      case 'totalItems': return '전체 품목 상세';
      case 'lowStock': return '재고 부족 품목';
      case 'totalValue': return '재고 가치 상세';
    }
  };

  const getFilteredItems = () => {
    switch (type) {
      case 'totalItems': return items;
      case 'lowStock': return items.filter(item => item.quantity <= item.minQuantity);
      case 'totalValue': return items.sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price));
    }
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <h2>{getTitle()}</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="stats-detail-content">
          {type === 'totalValue' && (
            <div className="value-summary">
              <div className="value-summary-item"><span className="label">총 재고 가치:</span><span className="value">{stats.totalValue.toLocaleString()}원</span></div>
            </div>
          )}

          <div className="stats-detail-table-container">
            <table className="stats-detail-table">
              <thead>
                <tr>
                  <th>품목명</th>
                  <th>타입</th>
                  <th>재고</th>
                  {type === 'totalValue' && <><th>단가</th><th>총 가치</th></>} 
                  {type === 'lowStock' && <><th>최소 수량</th><th>부족량</th></>}
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={type === 'totalValue' ? 5 : type === 'lowStock' ? 5 : 3} className="empty-state">항목이 없습니다.</td></tr>
                ) : (
                  filteredItems.map(item => {
                    const shortage = type === 'lowStock' ? item.minQuantity - item.quantity : 0;
                    return (
                      <tr key={item.id} className={type === 'lowStock' ? 'low-stock-row' : ''}>
                        <td>{item.name}</td>
                        <td><span className={`type-badge ${item.type}`}>{item.type === 'finished' ? '완성재고' : '부자재'}</span></td>
                        <td>{item.quantity} {item.unit}</td>
                        {type === 'totalValue' && <><td>{item.price.toLocaleString()}원</td><td className="value-cell">{(item.quantity * item.price).toLocaleString()}원</td></>} 
                        {type === 'lowStock' && <><td>{item.minQuantity} {item.unit}</td><td className="shortage-cell">{shortage} {item.unit}</td></>}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
