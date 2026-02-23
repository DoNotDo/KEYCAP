import React, { useState } from 'react';
import { InventoryItem, User } from '../types';

interface StockCountProps {
  items: InventoryItem[];
  user: User;
  onSubmit: (counts: Map<string, number>) => void;
}

export const StockCount: React.FC<StockCountProps> = ({ items, user, onSubmit }) => {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  const handleCountChange = (itemId: string, quantity: string) => {
    const newCounts = new Map(counts);
    const numericQuantity = parseInt(quantity, 10);
    if (!isNaN(numericQuantity)) {
      newCounts.set(itemId, numericQuantity);
    } else {
      newCounts.delete(itemId);
    }
    setCounts(newCounts);
  };

  const handleSubmit = () => {
    if (window.confirm('재고 실사 결과를 제출하시겠습니까? 기존 재고가 변경됩니다.')) {
      onSubmit(counts);
    }
  };

  const branchItems = items.filter(item => item.branchName === user.branchName);

  return (
    <div className="stock-count-container">
      <h2>{user.branchName} 재고 실사</h2>
      <p>현재 재고를 확인하고, 실제 수량을 입력해주세요.</p>
      
      <div className="stock-count-list">
        {branchItems.map(item => (
          <div key={item.id} className="stock-count-item">
            <span className="item-name">{item.name} ({item.category})</span>
            <span className="system-quantity">시스템 재고: {item.quantity}</span>
            <input 
              type="number"
              placeholder="실제 수량"
              onChange={(e) => handleCountChange(item.id, e.target.value)}
              className="quantity-input"
            />
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} className="btn btn-primary">
        재고 실사 완료 및 제출
      </button>
    </div>
  );
};
