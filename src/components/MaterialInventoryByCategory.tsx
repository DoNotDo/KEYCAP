import { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { Edit, Trash2, Package, AlertTriangle, ChevronDown, ChevronRight, Eye } from 'lucide-react';

interface MaterialInventoryByCategoryProps {
  items: InventoryItem[];
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
  onTransaction: (item: InventoryItem) => void;
  onViewDetail?: (item: InventoryItem) => void;
}

export function MaterialInventoryByCategory({
  items,
  onEdit,
  onDelete,
  onTransaction,
  onViewDetail,
}: MaterialInventoryByCategoryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const byCategory = useMemo(() => {
    const map = new Map<string, InventoryItem[]>();
    items.forEach((item) => {
      const cat = item.category || '미분류';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    map.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const isLowStock = (item: InventoryItem) => item.quantity <= item.minQuantity;

  if (items.length === 0) {
    return <div className="empty-state">부자재 재고가 없습니다.</div>;
  }

  return (
    <div className="material-by-category">
      {byCategory.map(([category, list]) => {
        const isExpanded = expandedCategories.size === 0 || expandedCategories.has(category);
        return (
          <div key={category} className="material-category-block">
            <button
              type="button"
              className="material-category-header"
              onClick={() => toggleCategory(category)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              <span className="material-category-name">{category}</span>
              <span className="material-category-count">({list.length}건)</span>
            </button>
            {isExpanded && (
              <div className="material-category-body">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>품목명</th>
                      <th>재고</th>
                      <th>상태</th>
                      <th>위치</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((item) => (
                      <tr key={item.id} className={isLowStock(item) ? 'low-stock' : ''}>
                        <td>
                          <div className="item-name">
                            {item.name}
                            {isLowStock(item) && <AlertTriangle size={16} className="warning-icon" />}
                          </div>
                        </td>
                        <td>
                          <span className={isLowStock(item) ? 'low-quantity' : ''}>
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td>
                          {isLowStock(item) ? (
                            <span className="status-badge low">부족</span>
                          ) : (
                            <span className="status-badge ok">양호</span>
                          )}
                        </td>
                        <td>{item.location || '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button type="button" className="btn-icon" onClick={() => onTransaction(item)} title="입출고">
                              <Package size={18} />
                            </button>
                            {onViewDetail && (
                              <button type="button" className="btn-icon" onClick={() => onViewDetail(item)} title="상세">
                                <Eye size={18} />
                              </button>
                            )}
                            {onEdit && (
                              <button type="button" className="btn-icon" onClick={() => onEdit(item)} title="수정">
                                <Edit size={18} />
                              </button>
                            )}
                            {onDelete && (
                              <button type="button" className="btn-icon danger" onClick={() => onDelete(item.id)} title="삭제">
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
