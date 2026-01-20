import { useMemo } from 'react';
import { MaterialOrder, InventoryItem } from '../types';

interface MaterialOrderGanttProps {
  materialOrders: MaterialOrder[];
  materialItems: InventoryItem[];
}

const statusColors: Record<MaterialOrder['status'], string> = {
  planned: '#94a3b8',      // 회색 - 계획
  ordered: '#3b82f6',       // 파란색 - 발주
  partial: '#f59e0b',      // 주황색 - 부분입고
  received: '#10b981',     // 초록색 - 입고완료
  cancelled: '#ef4444',    // 빨간색 - 취소
};

const statusLabels: Record<MaterialOrder['status'], string> = {
  planned: '계획',
  ordered: '발주',
  partial: '부분입고',
  received: '입고완료',
  cancelled: '취소',
};

export const MaterialOrderGantt = ({ materialOrders, materialItems }: MaterialOrderGanttProps) => {
  const getMaterialName = (id: string) => {
    return materialItems.find(item => item.id === id)?.name || '알 수 없음';
  };

  // 날짜 범위 계산
  const dateRange = useMemo(() => {
    if (materialOrders.length === 0) return { start: new Date(), end: new Date() };
    
    const dates: Date[] = [];
    materialOrders.forEach(order => {
      if (order.orderDate) dates.push(new Date(order.orderDate));
      if (order.expectedDate) dates.push(new Date(order.expectedDate));
    });
    
    if (dates.length === 0) return { start: new Date(), end: new Date() };
    
    const start = new Date(Math.min(...dates.map(d => d.getTime())));
    const end = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // 시작일을 일주일 전으로, 종료일을 일주일 후로 확장
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);
    
    return { start, end };
  }, [materialOrders]);

  // 날짜 목록 생성 (일별)
  const dates = useMemo(() => {
    const dates: Date[] = [];
    const current = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, [dateRange]);

  // 카테고리별로 그룹화
  const ordersByCategory = useMemo(() => {
    const map = new Map<string, MaterialOrder[]>();
    materialOrders.forEach(order => {
      const category = order.category || '미분류';
      const existing = map.get(category) || [];
      existing.push(order);
      map.set(category, existing);
    });
    
    // 카테고리별로 정렬 (발주일 기준)
    map.forEach((orders, category) => {
      orders.sort((a, b) => {
        const dateA = new Date(a.orderDate).getTime();
        const dateB = new Date(b.orderDate).getTime();
        return dateA - dateB;
      });
    });
    
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [materialOrders]);

  // 날짜를 픽셀 위치로 변환
  const getDatePosition = (date: Date): number => {
    const daysDiff = Math.floor((date.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.floor((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    return (daysDiff / totalDays) * 100;
  };

  // 막대의 시작 위치와 너비 계산
  const getBarStyle = (order: MaterialOrder) => {
    const orderDate = new Date(order.orderDate);
    const expectedDate = order.expectedDate ? new Date(order.expectedDate) : new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 기본 7일
    
    const startPos = getDatePosition(orderDate);
    const endPos = getDatePosition(expectedDate);
    const width = Math.max(2, endPos - startPos); // 최소 2% 너비
    
    return {
      left: `${startPos}%`,
      width: `${width}%`,
      backgroundColor: statusColors[order.status],
    };
  };

  const today = new Date();
  const todayPosition = getDatePosition(today);

  if (materialOrders.length === 0) {
    return (
      <div className="gantt-empty">
        <p>발주 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="material-order-gantt">
      <div className="gantt-header">
        <div className="gantt-category-column">카테고리 / 발주</div>
        <div className="gantt-timeline">
          <div className="gantt-timeline-header">
            {dates.map((date, index) => {
              // 월의 첫날, 매주 월요일, 또는 5일 간격으로 표시
              const isFirstOfMonth = date.getDate() === 1;
              const isMonday = date.getDay() === 1;
              const isEvery5Days = index % 5 === 0;
              const shouldShow = isFirstOfMonth || isMonday || isEvery5Days;
              
              if (!shouldShow) return null;
              
              return (
                <div
                  key={index}
                  className={`gantt-date-header ${isFirstOfMonth ? 'month-start' : ''} ${isMonday ? 'week-start' : ''}`}
                  style={{ left: `${(index / dates.length) * 100}%` }}
                >
                  <div className="gantt-date-label">
                    {isFirstOfMonth ? `${date.getMonth() + 1}월 ${date.getDate()}일` : `${date.getMonth() + 1}/${date.getDate()}`}
                  </div>
                </div>
              );
            })}
          </div>
          {/* 오늘 표시선 */}
          <div
            className="gantt-today-line"
            style={{ left: `${todayPosition}%` }}
          >
            <div className="gantt-today-marker">오늘</div>
          </div>
        </div>
      </div>

      <div className="gantt-body">
        {ordersByCategory.map(([category, orders]) => (
          <div key={category} className="gantt-category-group">
            <div className="gantt-category-header">
              <div className="gantt-category-name">{category}</div>
              <div className="gantt-category-count">{orders.length}건</div>
            </div>
            <div className="gantt-category-content">
              <div className="gantt-category-label-column">
                {orders.map(order => (
                  <div key={order.id} className="gantt-row-label">
                    <div className="gantt-row-name">{getMaterialName(order.materialItemId)}</div>
                    <div className="gantt-row-meta">
                      <span className="gantt-row-quantity">{order.quantity.toLocaleString()}개</span>
                      <span className={`gantt-row-status status-${order.status}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="gantt-timeline-area">
                {orders.map(order => {
                  const barStyle = getBarStyle(order);
                  const orderDate = new Date(order.orderDate);
                  const expectedDate = order.expectedDate ? new Date(order.expectedDate) : new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                  const isOverdue = expectedDate < today && order.status !== 'received' && order.status !== 'cancelled';
                  
                  return (
                    <div key={order.id} className="gantt-row">
                      <div
                        className={`gantt-bar ${isOverdue ? 'overdue' : ''}`}
                        style={barStyle}
                        title={`${getMaterialName(order.materialItemId)}: ${orderDate.toLocaleDateString('ko-KR')} ~ ${expectedDate.toLocaleDateString('ko-KR')}`}
                      >
                        <div className="gantt-bar-label">
                          {orderDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          {order.expectedDate && (
                            <>
                              {' → '}
                              {expectedDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="gantt-legend">
        <div className="gantt-legend-title">상태 범례</div>
        <div className="gantt-legend-items">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="gantt-legend-item">
              <div
                className="gantt-legend-color"
                style={{ backgroundColor: statusColors[status as MaterialOrder['status']] }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
