import { useMemo, useState, FormEvent } from 'react';
import { InventoryItem, MaterialOrder, MaterialOrderStatus } from '../types';
import { Calendar, CheckCircle, Package, PlusCircle, RefreshCw } from 'lucide-react';

interface MaterialOrderManagementProps {
  materialOrders: MaterialOrder[];
  materialItems: InventoryItem[];
  onAddOrder: (order: Omit<MaterialOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateOrder: (orderId: string, updates: Partial<MaterialOrder>) => void;
  onDeleteOrder: (orderId: string) => void;
  onSyncCatalog?: () => void;
}

const statusLabels: Record<MaterialOrderStatus, string> = {
  planned: '계획',
  ordered: '발주',
  partial: '부분입고',
  received: '입고완료',
  cancelled: '취소',
};

const statusOptions: MaterialOrderStatus[] = ['planned', 'ordered', 'partial', 'received', 'cancelled'];
const createStatusOptions: MaterialOrderStatus[] = ['planned', 'ordered', 'partial', 'received'];
const inProgressStatuses: MaterialOrderStatus[] = ['planned', 'ordered', 'partial'];

export const MaterialOrderManagement = ({
  materialOrders,
  materialItems,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  onSyncCatalog,
}: MaterialOrderManagementProps) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<MaterialOrderStatus | 'all' | 'in-progress'>('in-progress');
  const [searchTerm, setSearchTerm] = useState('');

  const [formValues, setFormValues] = useState({
    materialItemId: '',
    quantity: 0,
    status: 'ordered' as MaterialOrderStatus,
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDate: '',
    nextOrderDate: '',
    supplier: '',
    notes: '',
  });

  const categories = useMemo(() => {
    const set = new Set(materialItems.map(item => item.category).filter(Boolean));
    return Array.from(set).sort();
  }, [materialItems]);

  const getMaterialName = (id: string) => {
    return materialItems.find(item => item.id === id)?.name || '알 수 없음';
  };

  const getMaterialCategory = (id: string) => {
    return materialItems.find(item => item.id === id)?.category || '미분류';
  };

  const filteredOrders = useMemo(() => {
    return materialOrders
      .filter(order => (categoryFilter === 'all' ? true : order.category === categoryFilter))
      .filter(order => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'in-progress') {
          return inProgressStatuses.includes(order.status);
        }
        return order.status === statusFilter;
      })
      .filter(order => {
        if (!searchTerm) return true;
        const name = getMaterialName(order.materialItemId);
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [materialOrders, categoryFilter, statusFilter, searchTerm, materialItems]);

  const groupedOrders = useMemo(() => {
    const map = new Map<string, MaterialOrder[]>();
    filteredOrders.forEach(order => {
      const category = order.category || '미분류';
      if (!map.has(category)) {
        map.set(category, []);
      }
      map.get(category)!.push(order);
    });
    return Array.from(map.entries());
  }, [filteredOrders]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formValues.materialItemId || formValues.quantity <= 0) {
      alert('부자재와 수량을 올바르게 입력해주세요.');
      return;
    }
    const category = getMaterialCategory(formValues.materialItemId);
    onAddOrder({
      materialItemId: formValues.materialItemId,
      category,
      quantity: formValues.quantity,
      status: formValues.status,
      orderDate: new Date(formValues.orderDate).toISOString(),
      expectedDate: formValues.expectedDate ? new Date(formValues.expectedDate).toISOString() : undefined,
      nextOrderDate: formValues.nextOrderDate ? new Date(formValues.nextOrderDate).toISOString() : undefined,
      supplier: formValues.supplier || undefined,
      notes: formValues.notes || undefined,
    });
    setFormValues({
      materialItemId: '',
      quantity: 0,
      status: 'ordered',
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDate: '',
      nextOrderDate: '',
      supplier: '',
      notes: '',
    });
  };

  const handleStatusChange = (orderId: string, status: MaterialOrderStatus) => {
    if (status === 'cancelled') {
      const ok = confirm('발주 내역을 취소하면 삭제됩니다. 진행할까요?');
      if (ok) {
        onDeleteOrder(orderId);
      }
      return;
    }
    onUpdateOrder(orderId, {
      status,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleOrderUpdate = (orderId: string, updates: Partial<MaterialOrder>) => {
    onUpdateOrder(orderId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="material-order-page">
      <div className="material-order-toolbar">
        <div className="material-order-filters">
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">전체 카테고리</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MaterialOrderStatus | 'all' | 'in-progress')}
          >
            <option value="in-progress">진행중</option>
            <option value="received">입고완료</option>
            <option value="all">전체</option>
          </select>
          <div className="search-box material-order-search">
            <input
              type="text"
              placeholder="부자재명 또는 카테고리 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {onSyncCatalog && (
            <button className="btn btn-secondary btn-small" onClick={onSyncCatalog}>
              카탈로그 동기화
            </button>
          )}
        </div>
      </div>

      <div className="material-order-form">
        <h3>
          <PlusCircle size={18} />
          부자재 발주 등록
        </h3>
        <form onSubmit={handleSubmit} className="material-order-form-grid">
          <div className="form-group">
            <label>부자재 *</label>
            <select
              className="form-select"
              value={formValues.materialItemId}
              onChange={(e) => setFormValues({ ...formValues, materialItemId: e.target.value })}
              required
            >
              <option value="">부자재 선택</option>
              {materialItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (재고: {item.quantity.toLocaleString()} {item.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>발주 수량 *</label>
            <input
              type="number"
              min="1"
              value={formValues.quantity || ''}
              onChange={(e) => setFormValues({ ...formValues, quantity: Number(e.target.value) })}
              required
            />
          </div>
          <div className="form-group">
            <label>상태</label>
            <select
              className="form-select"
              value={formValues.status}
              onChange={(e) => setFormValues({ ...formValues, status: e.target.value as MaterialOrderStatus })}
            >
              {createStatusOptions.map(status => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>발주일</label>
            <input
              type="date"
              value={formValues.orderDate}
              onChange={(e) => setFormValues({ ...formValues, orderDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>예상 입고일</label>
            <input
              type="date"
              value={formValues.expectedDate}
              onChange={(e) => setFormValues({ ...formValues, expectedDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>다음 발주 예정일</label>
            <input
              type="date"
              value={formValues.nextOrderDate}
              onChange={(e) => setFormValues({ ...formValues, nextOrderDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>공급처</label>
            <input
              type="text"
              value={formValues.supplier}
              onChange={(e) => setFormValues({ ...formValues, supplier: e.target.value })}
              placeholder="예: A공업"
            />
          </div>
          <div className="form-group">
            <label>메모</label>
            <input
              type="text"
              value={formValues.notes}
              onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
              placeholder="발주 참고사항"
            />
          </div>
          <div className="form-actions material-order-actions">
            <button type="submit" className="btn btn-primary">
              등록
            </button>
          </div>
        </form>
      </div>

      {groupedOrders.length === 0 ? (
        <div className="empty-state">부자재 발주 내역이 없습니다.</div>
      ) : (
        groupedOrders.map(([category, orders]) => (
          <div key={category} className="material-order-group">
            <div className="material-order-group-header">
              <h4>{category}</h4>
              <span>{orders.length}건</span>
            </div>
            <div className="material-order-list">
              {orders.map(order => {
                const receivedQuantity = order.receivedQuantity || 0;
                const progress = order.quantity > 0
                  ? Math.min(100, Math.round((receivedQuantity / order.quantity) * 100))
                  : 0;
                return (
                  <div key={order.id} className="material-order-card">
                    <div className="material-order-card-header">
                      <div className="material-order-info">
                        <strong>{getMaterialName(order.materialItemId)}</strong>
                        <span className="material-order-meta">
                          <Package size={16} />
                          발주 수량: {order.quantity.toLocaleString()}
                        </span>
                      </div>
                      <div className="material-order-status">
                        <select
                          className="form-select"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as MaterialOrderStatus)}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{statusLabels[status]}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="material-order-progress">
                      <div className="progress-header">
                        <span>입고 진행률</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div className="material-order-details">
                      <div className="detail-row">
                        <span className="label">입고 수량</span>
                        <input
                          type="number"
                          min="0"
                          className="form-input-small"
                          value={receivedQuantity}
                          onChange={(e) => handleOrderUpdate(order.id, { receivedQuantity: Number(e.target.value) })}
                        />
                      </div>
                      <div className="detail-row">
                        <span className="label">발주일</span>
                        <span className="value">
                          <Calendar size={14} />
                          {new Date(order.orderDate).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">예상 입고일</span>
                        <input
                          type="date"
                          className="form-input-small"
                          value={order.expectedDate ? order.expectedDate.slice(0, 10) : ''}
                          onChange={(e) => handleOrderUpdate(order.id, { expectedDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                        />
                      </div>
                      <div className="detail-row">
                        <span className="label">다음 발주 예정일</span>
                        <input
                          type="date"
                          className="form-input-small"
                          value={order.nextOrderDate ? order.nextOrderDate.slice(0, 10) : ''}
                          onChange={(e) => handleOrderUpdate(order.id, { nextOrderDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                        />
                      </div>
                      {order.supplier && (
                        <div className="detail-row">
                          <span className="label">공급처</span>
                          <span className="value">{order.supplier}</span>
                        </div>
                      )}
                      {order.notes && (
                        <div className="detail-row">
                          <span className="label">메모</span>
                          <span className="value">{order.notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="material-order-footer">
                      <span className="updated-at">
                        <RefreshCw size={14} />
                        {new Date(order.updatedAt).toLocaleString('ko-KR')}
                      </span>
                      {order.status === 'received' && (
                        <span className="status-chip success">
                          <CheckCircle size={14} />
                          입고 완료
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
