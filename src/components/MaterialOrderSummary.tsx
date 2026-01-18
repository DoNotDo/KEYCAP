import { useMemo } from 'react';
import { InventoryItem, MaterialOrder } from '../types';
import { AlertTriangle, CalendarClock, PackageCheck } from 'lucide-react';

interface MaterialOrderSummaryProps {
  materialOrders: MaterialOrder[];
  materialItems: InventoryItem[];
}

const inProgressStatuses = new Set(['planned', 'ordered', 'partial']);

export const MaterialOrderSummary = ({ materialOrders, materialItems }: MaterialOrderSummaryProps) => {
  const today = new Date();

  const getMaterialName = (id: string) => {
    return materialItems.find(item => item.id === id)?.name || '알 수 없음';
  };

  const inProgressOrders = useMemo(() => materialOrders.filter(order => inProgressStatuses.has(order.status)), [materialOrders]);
  const receivedOrders = useMemo(() => materialOrders.filter(order => order.status === 'received'), [materialOrders]);

  const upcomingOrders = useMemo(() => {
    const in7days = new Date();
    in7days.setDate(today.getDate() + 7);
    return inProgressOrders.filter(order => order.expectedDate && new Date(order.expectedDate) <= in7days);
  }, [inProgressOrders, today]);

  const overdueOrders = useMemo(() => {
    return inProgressOrders.filter(order => order.expectedDate && new Date(order.expectedDate) < today);
  }, [inProgressOrders, today]);

  const categorySummary = useMemo(() => {
    const map = new Map<string, { count: number; quantity: number }>();
    materialOrders.forEach(order => {
      const key = order.category || '미분류';
      const existing = map.get(key) || { count: 0, quantity: 0 };
      existing.count += 1;
      existing.quantity += order.quantity;
      map.set(key, existing);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [materialOrders]);

  return (
    <div className="material-order-summary">
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-title">진행중 발주</div>
          <div className="summary-card-value">{inProgressOrders.length}건</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">입고 완료</div>
          <div className="summary-card-value">{receivedOrders.length}건</div>
        </div>
        <div className="summary-card warning">
          <div className="summary-card-title">지연 의심</div>
          <div className="summary-card-value">{overdueOrders.length}건</div>
        </div>
      </div>

      <div className="summary-section">
        <div className="summary-section-header">
          <h3>
            <CalendarClock size={18} />
            7일 내 예상 입고
          </h3>
        </div>
        {upcomingOrders.length === 0 ? (
          <div className="empty-state">예정된 입고가 없습니다.</div>
        ) : (
          <div className="summary-list">
            {upcomingOrders.map(order => (
              <div key={order.id} className="summary-list-item">
                <div className="summary-list-title">{getMaterialName(order.materialItemId)}</div>
                <div className="summary-list-meta">
                  <span>{order.category}</span>
                  <span>{order.quantity.toLocaleString()}개</span>
                  <span>{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString('ko-KR') : '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="summary-section">
        <div className="summary-section-header">
          <h3>
            <PackageCheck size={18} />
            카테고리별 발주 요약
          </h3>
        </div>
        {categorySummary.length === 0 ? (
          <div className="empty-state">발주 데이터가 없습니다.</div>
        ) : (
          <div className="summary-table">
            {categorySummary.map(([category, data]) => (
              <div key={category} className="summary-table-row">
                <span>{category}</span>
                <span>{data.count}건</span>
                <span>{data.quantity.toLocaleString()}개</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {overdueOrders.length > 0 && (
        <div className="summary-section warning">
          <div className="summary-section-header">
            <h3>
              <AlertTriangle size={18} />
              지연 의심 발주
            </h3>
          </div>
          <div className="summary-list">
            {overdueOrders.map(order => (
              <div key={order.id} className="summary-list-item">
                <div className="summary-list-title">{getMaterialName(order.materialItemId)}</div>
                <div className="summary-list-meta">
                  <span>{order.category}</span>
                  <span>{order.quantity.toLocaleString()}개</span>
                  <span>{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString('ko-KR') : '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
