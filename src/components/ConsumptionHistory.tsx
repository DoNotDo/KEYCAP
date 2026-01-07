import { ConsumptionRecord, InventoryItem, Order } from '../types';
import { Calendar, Package, Wrench } from 'lucide-react';

interface ConsumptionHistoryProps {
  consumptions: ConsumptionRecord[];
  items: InventoryItem[];
  orders?: Order[]; // 주문 정보 (부자재인 경우 어떤 완성재고에 쓰였는지 확인용)
  itemId: string;
  itemType: 'finished' | 'material';
}

export const ConsumptionHistory = ({ consumptions, items, orders, itemId, itemType }: ConsumptionHistoryProps) => {
  const filteredConsumptions = consumptions.filter(c => 
    c.itemId === itemId && c.itemType === itemType
  ).sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());

  const getItemName = (id: string) => {
    return items.find(item => item.id === id)?.name || '알 수 없음';
  };

  const getFinishedItemName = (consumption: ConsumptionRecord) => {
    if (consumption.finishedItemId) {
      return getItemName(consumption.finishedItemId);
    }
    // orderId로 Order를 찾아서 finishedItemId 확인
    if (orders) {
      const order = orders.find(o => o.id === consumption.orderId);
      if (order) {
        return getItemName(order.finishedItemId);
      }
    }
    return '알 수 없음';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (filteredConsumptions.length === 0) {
    return (
      <div className="consumption-history-empty">
        <p>소모 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="consumption-history">
      <div className="consumption-history-header">
        {itemType === 'finished' ? <Package size={20} /> : <Wrench size={20} />}
        <h3>소모 내역</h3>
      </div>
      <div className="consumption-list">
        {filteredConsumptions.map(consumption => (
          <div key={consumption.id} className="consumption-item">
            <div className="consumption-item-header">
              <div>
                <strong>{consumption.branchName}</strong>
                <span className="consumption-quantity">-{consumption.quantity}개</span>
              </div>
              <span className="consumption-date">
                <Calendar size={14} />
                {formatDate(consumption.processedAt)}
              </span>
            </div>
            <div className="consumption-item-details">
              {itemType === 'material' && (
                <span style={{ color: '#1a73e8', fontWeight: 600 }}>
                  사용된 완성재고: {getFinishedItemName(consumption)}
                </span>
              )}
              <span>처리자: {consumption.processedBy}</span>
              <span>주문일: {formatDate(consumption.orderDate)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
