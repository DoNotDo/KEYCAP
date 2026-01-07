import { useState, FormEvent } from 'react';
import { InventoryItem } from '../types';
import { X } from 'lucide-react';

interface TransactionModalProps {
  item: InventoryItem;
  onProcess: (type: 'in' | 'out', quantity: number, reason: string) => void;
  onCancel: () => void;
}

export const TransactionModal = ({ item, onProcess, onCancel }: TransactionModalProps) => {
  const [type, setType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      alert('수량은 0보다 커야 합니다.');
      return;
    }
    if (type === 'out' && quantity > item.quantity) {
      alert('출고 수량이 현재 재고보다 많습니다.');
      return;
    }
    onProcess(type, quantity, reason);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>입출고 처리</h2>
          <button className="close-btn" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>
        <div className="transaction-info">
          <p><strong>품목:</strong> {item.name}</p>
          <p><strong>현재 재고:</strong> {item.quantity} {item.unit}</p>
        </div>
        <form onSubmit={handleSubmit} className="item-form">
          <div className="form-group">
            <label>유형 *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="in"
                  checked={type === 'in'}
                  onChange={(e) => setType(e.target.value as 'in' | 'out')}
                />
                입고
              </label>
              {item.type === 'finished' && (
                <label className="radio-label">
                  <input
                    type="radio"
                    value="out"
                    checked={type === 'out'}
                    onChange={(e) => setType(e.target.value as 'in' | 'out')}
                  />
                  출고
                </label>
              )}
            </div>
            {item.type === 'material' && (
              <p className="form-hint" style={{ marginTop: '8px', color: '#5f6368', fontSize: '13px' }}>
                부자재는 입고만 가능합니다. 출고는 완성재고 출고 시 자동으로 계산됩니다.
              </p>
            )}
          </div>

          <div className="form-group">
            <label>수량 *</label>
            <input
              type="number"
              value={quantity || ''}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              max={type === 'out' ? item.quantity : undefined}
              required
            />
          </div>

          <div className="form-group">
            <label>사유 *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 신규 입고, 판매 출고 등"
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              처리
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
