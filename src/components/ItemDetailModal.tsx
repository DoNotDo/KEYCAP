import { InventoryItem, BOMItem, ConsumptionRecord, Order } from '../types';
import { X, Package, Receipt } from 'lucide-react';
import { BOMReceipt } from './BOMReceipt';
import { ConsumptionHistory } from './ConsumptionHistory';

interface ItemDetailModalProps {
  item: InventoryItem;
  bomItems: BOMItem[];
  materialItems: InventoryItem[];
  consumptions: ConsumptionRecord[];
  orders?: Order[];
  onClose: () => void;
}

export const ItemDetailModal = ({ item, bomItems, materialItems, consumptions, orders, onClose }: ItemDetailModalProps) => {
  const itemBOM = bomItems.filter(bom => bom.finishedItemId === item.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <h2>{item.name} 상세 정보</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="item-detail-content">
          <div className="item-detail-section">
            <h3>기본 정보</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">품목명:</span>
                <span className="detail-value">{item.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">카테고리:</span>
                <span className="detail-value">{item.category}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">타입:</span>
                <span className={`detail-value type-badge ${item.type}`}>
                  {item.type === 'finished' ? '완성재고' : '부자재'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">현재 재고:</span>
                <span className="detail-value">{item.quantity} {item.unit}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">최소 수량:</span>
                <span className="detail-value">{item.minQuantity} {item.unit}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">최대 수량:</span>
                <span className="detail-value">{item.maxQuantity} {item.unit}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">단가:</span>
                <span className="detail-value">{item.price.toLocaleString()}원</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">총 가치:</span>
                <span className="detail-value">{(item.quantity * item.price).toLocaleString()}원</span>
              </div>
              {item.location && (
                <div className="detail-item">
                  <span className="detail-label">보관 위치:</span>
                  <span className="detail-value">{item.location}</span>
                </div>
              )}
            </div>
          </div>

          {item.type === 'finished' && itemBOM.length > 0 && (
            <div className="item-detail-section">
              <BOMReceipt
                finishedItem={item}
                bomItems={itemBOM}
                materialItems={materialItems}
              />
            </div>
          )}

          <div className="item-detail-section">
            <ConsumptionHistory
              consumptions={consumptions}
              items={[item]}
              orders={orders}
              itemId={item.id}
              itemType={item.type}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
