import { InventoryItem, BOMItem, ConsumptionRecord, Order } from '../types';
import { X } from 'lucide-react';
import { BOMReceipt } from './BOMReceipt';

interface OrderDetailModalProps {
  order: Order;
  items: InventoryItem[];
  consumptions: ConsumptionRecord[];
  onClose: () => void;
}

export const OrderDetailModal = ({ order, items, consumptions, onClose }: OrderDetailModalProps) => {
  const finishedItem = items.find(item => item.id === order.finishedItemId);

  const getMaterialName = (id: string) => {
    return items.find(item => item.id === id)?.name || '알 수 없음';
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>발주 상세 - {finishedItem?.name || ''}</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        <div className="order-detail-content">
          <div className="order-summary">
            <div><strong>지점:</strong> {order.branchName}</div>
            <div><strong>주문일:</strong> {new Date(order.orderDate).toLocaleDateString('ko-KR')}</div>
            <div><strong>상태:</strong> {order.status}</div>
            <div><strong>요청 수량:</strong> {order.quantity}</div>
            {order.shippedQuantity && <div><strong>출고 수량:</strong> {order.shippedQuantity}</div>}
          </div>
          
          {consumptions.length > 0 && (
            <div className="bom-receipt-container">
              <h4>예상 부자재 소모량</h4>
              <BOMReceipt 
                finishedItem={finishedItem!} 
                bomItems={consumptions.map(c => ({ id: c.itemId, finishedItemId: order.finishedItemId, materialItemId: c.itemId, quantity: c.quantity/order.quantity })) as BOMItem[]}
                materialItems={items}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
