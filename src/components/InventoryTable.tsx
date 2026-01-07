import { useState } from 'react';
import { InventoryItem } from '../types';
import { Edit, Trash2, Package, ArrowDown, ArrowUp, AlertTriangle, Settings, Eye } from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
  onTransaction: (item: InventoryItem) => void;
  onBOMSettings?: (item: InventoryItem) => void;
  onViewDetail?: (item: InventoryItem) => void;
  searchTerm: string;
}

export const InventoryTable = ({
  items,
  onEdit,
  onDelete,
  onTransaction,
  onBOMSettings,
  onViewDetail,
  searchTerm,
}: InventoryTableProps) => {
  const [sortField, setSortField] = useState<keyof InventoryItem>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const isLowStock = (item: InventoryItem) => item.quantity <= item.minQuantity;

  return (
    <>
      {/* 데스크톱 테이블 */}
      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                품목명 {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('category')} className="sortable">
                카테고리 {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('type')} className="sortable">
                타입 {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('quantity')} className="sortable">
                재고 {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>상태</th>
              <th onClick={() => handleSort('location')} className="sortable">
                위치 {sortField === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>총 가치</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  재고 항목이 없습니다.
                </td>
              </tr>
            ) : (
              sortedItems.map(item => (
                <tr key={item.id} className={isLowStock(item) ? 'low-stock' : ''}>
                  <td>
                    <div className="item-name">
                      {item.name}
                      {isLowStock(item) && (
                        <AlertTriangle size={16} className="warning-icon" />
                      )}
                    </div>
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <span className={`type-badge ${item.type}`}>
                      {item.type === 'finished' ? '완성재고' : '부자재'}
                    </span>
                  </td>
                  <td>
                    <div className="quantity-cell">
                      <span className={isLowStock(item) ? 'low-quantity' : ''}>
                        {item.quantity} {item.unit}
                      </span>
                      <div className="quantity-range">
                        (최소: {item.minQuantity}, 최대: {item.maxQuantity})
                      </div>
                    </div>
                  </td>
                  <td>
                    {isLowStock(item) ? (
                      <span className="status-badge warning">재고 부족</span>
                    ) : item.quantity >= item.maxQuantity ? (
                      <span className="status-badge success">충분</span>
                    ) : (
                      <span className="status-badge normal">정상</span>
                    )}
                  </td>
                  <td>{item.location || '-'}</td>
                  <td>{(item.quantity * item.price).toLocaleString()}원</td>
                  <td>
                    <div className="action-buttons">
                      {onViewDetail && (
                        <button
                          onClick={() => onViewDetail(item)}
                          className="icon-btn"
                          title="상세보기"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => onTransaction(item)}
                        className="icon-btn"
                        title="입출고"
                      >
                        <Package size={18} />
                      </button>
                      {item.type === 'finished' && onBOMSettings && (
                        <button
                          onClick={() => onBOMSettings(item)}
                          className="icon-btn"
                          title="BOM 설정"
                        >
                          <Settings size={18} />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="icon-btn"
                          title="수정"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (confirm(`⚠️ 경고: ${item.name}을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 데이터(거래 내역, BOM 설정 등)가 영향을 받을 수 있습니다.`)) {
                              onDelete(item.id);
                            }
                          }}
                          className="icon-btn danger"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 뷰 */}
      <div className="inventory-table-mobile">
        {sortedItems.length === 0 ? (
          <div className="empty-state">
            재고 항목이 없습니다.
          </div>
        ) : (
          sortedItems.map(item => (
            <div key={item.id} className={`inventory-card ${isLowStock(item) ? 'low-stock' : ''}`}>
              <div className="inventory-card-header">
                <div className="inventory-card-name">
                  {item.name}
                  {isLowStock(item) && (
                    <AlertTriangle size={18} className="warning-icon" />
                  )}
                </div>
                <div className="inventory-card-actions">
                  {onViewDetail && (
                    <button
                      onClick={() => onViewDetail(item)}
                      className="icon-btn"
                      title="상세보기"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => onTransaction(item)}
                    className="icon-btn"
                    title="입출고"
                  >
                    <Package size={18} />
                  </button>
                  {item.type === 'finished' && onBOMSettings && (
                    <button
                      onClick={() => onBOMSettings(item)}
                      className="icon-btn"
                      title="BOM 설정"
                    >
                      <Settings size={18} />
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="icon-btn"
                      title="수정"
                    >
                      <Edit size={18} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (confirm(`⚠️ 경고: ${item.name}을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 데이터(거래 내역, BOM 설정 등)가 영향을 받을 수 있습니다.`)) {
                          onDelete(item.id);
                        }
                      }}
                      className="icon-btn danger"
                      title="삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
              <div className="inventory-card-body">
                <div className="inventory-card-row">
                  <span className="inventory-card-label">카테고리</span>
                  <span className="inventory-card-value">{item.category}</span>
                </div>
                <div className="inventory-card-row">
                  <span className="inventory-card-label">타입</span>
                  <span className={`type-badge ${item.type}`}>
                    {item.type === 'finished' ? '완성재고' : '부자재'}
                  </span>
                </div>
                <div className="inventory-card-row">
                  <span className="inventory-card-label">재고</span>
                  <span className={isLowStock(item) ? 'low-quantity' : 'inventory-card-value'}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="inventory-card-row">
                  <span className="inventory-card-label">최소/최대</span>
                  <span className="inventory-card-value">
                    {item.minQuantity} / {item.maxQuantity}
                  </span>
                </div>
                <div className="inventory-card-row">
                  <span className="inventory-card-label">상태</span>
                  {isLowStock(item) ? (
                    <span className="status-badge warning">재고 부족</span>
                  ) : item.quantity >= item.maxQuantity ? (
                    <span className="status-badge success">충분</span>
                  ) : (
                    <span className="status-badge normal">정상</span>
                  )}
                </div>
                {item.location && (
                  <div className="inventory-card-row">
                    <span className="inventory-card-label">위치</span>
                    <span className="inventory-card-value">{item.location}</span>
                  </div>
                )}
                <div className="inventory-card-row">
                  <span className="inventory-card-label">총 가치</span>
                  <span className="inventory-card-value">
                    {(item.quantity * item.price).toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};
